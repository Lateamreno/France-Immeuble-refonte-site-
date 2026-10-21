// Serveur uniquement : lit BO_LEAD_TOKEN et la clé secrète du site.
import { createHash } from "node:crypto";
import { configSite } from "./supabase-site";

/**
 * Leads : du site vers le BO, sans jamais en perdre un — CLAUDE.md §2 et §9.
 *
 * Le site parle au BO par UNE adresse (`BO_LEAD_ENDPOINT`) qui ne sait
 * qu'enregistrer. Réponse 200 : enregistré. Tout autre code, ou pas de
 * réponse : le lead part dans `leads_outbox`, la file d'attente de la base DU
 * SITE, et il est réessayé jusqu'à ce que le BO réponde 200, puis effacé.
 * L'adresse du BO est idempotente sur `ref` : un réessai ne crée pas de doublon.
 *
 * ⚠️ §16 : aucune clé du BO dans l'environnement du site. `BO_LEAD_TOKEN` est
 * un jeton propre à cette adresse, qui ne permet que de déposer un lead. Une
 * clé Supabase à cet endroit (secrète, publiable, ou JWT) donnerait accès à la
 * base du BO : `configBO()` la refuse, et le lead attend dans la file plutôt
 * que de partir avec.
 */

type ConfigBO = { endpoint: string; jeton: string };

function configBO(): ConfigBO | null {
  const endpoint = process.env.BO_LEAD_ENDPOINT?.trim();
  const jeton = process.env.BO_LEAD_TOKEN?.trim();
  if (!endpoint || !jeton) return null;

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    console.error("[lead] BO_LEAD_ENDPOINT n'est pas une URL. Envoi suspendu, les leads restent en file.");
    return null;
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !local) {
    console.error("[lead] BO_LEAD_ENDPOINT doit être en https. Envoi suspendu.");
    return null;
  }
  // L'API REST ou le stockage d'un projet Supabase : ce serait écrire
  // directement dans une base, avec une clé de base. Pas une fente.
  if (/\/(rest|storage|auth|graphql)\/v1\//.test(url.pathname)) {
    console.error("[lead] BO_LEAD_ENDPOINT pointe sur l'API d'une base, pas sur l'adresse de dépôt du BO. Refusé (§2).");
    return null;
  }
  if (/^sb_(secret|publishable)_/.test(jeton) || /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(jeton)) {
    console.error("[lead] BO_LEAD_TOKEN ressemble à une clé Supabase. Aucune clé du BO ne doit être dans le site. Refusé (§16).");
    return null;
  }
  return { endpoint, jeton };
}

/** true si et seulement si le BO a répondu 200. */
async function deposerAuBO(cfg: ConfigBO, lead: Record<string, unknown>): Promise<{ ok: boolean; erreur?: string }> {
  try {
    const r = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.jeton}` },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (r.status === 200) return { ok: true };
    return { ok: false, erreur: `BO ${r.status}` };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Clé de la file : un UUID dérivé de (type, ref, etat). L'estimation part deux
 * fois avec le même `ref` (« principal » puis « complement ») : ce sont deux
 * dépôts distincts, qui doivent pouvoir attendre côte à côte. Un même envoi
 * rejoué, lui, retombe sur la même clé et n'est pas mis deux fois en file.
 */
function cleFile(lead: Record<string, unknown>): string {
  const h = createHash("sha1")
    .update(`${lead.type ?? ""}|${lead.ref ?? ""}|${lead.etat ?? ""}`)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Les catégories de la table (contrainte de 0002). */
function categorie(type: unknown): "estimation" | "recherche" | "contact" {
  if (type === "estimation") return "estimation";
  if (typeof type === "string" && type.startsWith("recherche")) return "recherche";
  return "contact";
}

async function sb(chemin: string, init: RequestInit = {}) {
  const cfg = configSite();
  if (!cfg) throw new Error("base du site non configurée (SITE_SUPABASE_SECRET_KEY)");
  const r = await fetch(`${cfg.url}/rest/v1/${chemin}`, {
    ...init,
    headers: {
      apikey: cfg.cle,
      Authorization: `Bearer ${cfg.cle}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r;
}

async function mettreEnFile(lead: Record<string, unknown>, erreur: string): Promise<boolean> {
  try {
    await sb("leads_outbox?on_conflict=ref", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        ref: cleFile(lead),
        type: categorie(lead.type),
        payload: lead,
        derniere_erreur: erreur.slice(0, 500),
        prochain_essai: new Date(Date.now() + 60_000).toISOString(),
      }),
    });
    return true;
  } catch (e) {
    console.error("[lead][ALERTE] lead NI transmis au BO NI mis en file —", e, JSON.stringify({
      type: lead.type, ref: lead.ref, etat: lead.etat,
    }));
    return false;
  }
}

export type Issue = "bo" | "file" | "perdu";

/**
 * Dépose un lead. « bo » : enregistré par le BO. « file » : gardé par le site,
 * réessayé ensuite. « perdu » : ni l'un ni l'autre — le visiteur doit appeler.
 */
export async function deposerLead(lead: Record<string, unknown>): Promise<Issue> {
  const cfg = configBO();
  if (cfg) {
    const r = await deposerAuBO(cfg, lead);
    if (r.ok) return "bo";
    console.error("[lead] BO indisponible, lead mis en file —", r.erreur, JSON.stringify({ type: lead.type, ref: lead.ref }));
    return (await mettreEnFile(lead, r.erreur ?? "échec")) ? "file" : "perdu";
  }
  console.warn("[lead] BO_LEAD_ENDPOINT / BO_LEAD_TOKEN absents ou refusés — lead mis en file.");
  return (await mettreEnFile(lead, "adresse du BO non configurée")) ? "file" : "perdu";
}

type LigneFile = { id: number; payload: Record<string, unknown>; tentatives: number };

/** Délai avant le prochain essai : 2, 4, 8… minutes, plafonné à 6 h. */
const delai = (tentatives: number) => Math.min(2 ** (tentatives + 1), 360) * 60_000;

/**
 * Réessaie les leads en attente dont l'heure est venue. Appelé après chaque
 * nouveau lead, et par la tâche planifiée de Vercel. Ne renvoie que des
 * compteurs — jamais le contenu d'un lead.
 */
export async function relancerFile(limite = 20): Promise<{ transmis: number; restants: number; enAttente: number }> {
  const cfg = configBO();
  if (!cfg || !configSite()) return { transmis: 0, restants: 0, enAttente: -1 };

  const maintenant = new Date().toISOString();
  const r = await sb(
    `leads_outbox?select=id,payload,tentatives&prochain_essai=lte.${encodeURIComponent(maintenant)}&order=id.asc&limit=${limite}`,
  );
  const lignes = (await r.json()) as LigneFile[];

  let transmis = 0;
  for (const l of lignes) {
    const envoi = await deposerAuBO(cfg, l.payload);
    if (envoi.ok) {
      await sb(`leads_outbox?id=eq.${l.id}`, { method: "DELETE" });   // purgé dès transmission
      transmis++;
    } else {
      const n = l.tentatives + 1;
      await sb(`leads_outbox?id=eq.${l.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          tentatives: n,
          derniere_erreur: (envoi.erreur ?? "échec").slice(0, 500),
          prochain_essai: new Date(Date.now() + delai(n)).toISOString(),
        }),
      });
      if (n >= 3) {
        console.error(`[lead][ALERTE] un lead attend depuis ${n} essais — BO : ${envoi.erreur}`);
      }
    }
  }

  const compte = await sb("leads_outbox?select=id", { method: "HEAD", headers: { Prefer: "count=exact" } });
  const enAttente = Number(compte.headers.get("content-range")?.split("/")[1] ?? 0);
  if (enAttente > 0) console.warn(`[lead] ${enAttente} lead(s) en attente de transmission au BO.`);
  return { transmis, restants: lignes.length - transmis, enAttente };
}
