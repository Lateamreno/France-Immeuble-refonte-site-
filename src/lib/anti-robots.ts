import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Formulaires publics et robots (MAV, 23/11/2026 : « je reçois des faux formulaires que j'avais pas
 * avant, c'est des attaques ? »). Des envois au contenu aléatoire (« gKcjbFFDRNjWkMzgCNW »), avec des
 * adresses Gmail truffées de points, arrivaient comme de vrais messages de contact.
 *
 * Trois couches, sans service extérieur (aucune adresse IP de visiteur envoyée à un tiers) :
 * 1. un champ piège (`site`), invisible et hors du clavier : un humain le laisse vide ;
 * 2. un jeton signé par le serveur, que le formulaire demande en s'ouvrant (`/api/lead/jeton/`) :
 *    un robot qui poste directement sur `/api/lead/` n'en a pas ; un envoi moins de 3 secondes
 *    après l'ouverture n'est pas humain ;
 * 3. le charabia : des mots de lettres prises au hasard, majuscules au milieu.
 *
 * Un envoi douteux n'est **jamais jeté** (« on ne perd jamais un lead », §2) : il est gardé à part
 * (`leads_suspects`, sans e-mail à l'agence ni dépôt au BO) et compté dans le rapport du lundi.
 */

const DELAI_MIN_MS = 3_000;
const DUREE_MAX_MS = 24 * 3600_000;

function secret(): string | null {
  return process.env.STATS_SECRET || process.env.SITE_SUPABASE_SECRET_KEY || null;
}

function signer(horodatage: string, s: string): string {
  return createHmac("sha256", s).update(`jeton-formulaire|${horodatage}`).digest("base64url").slice(0, 32);
}

/** Un jeton « horodatage.signature », valable 24 heures. */
export function jetonFormulaire(maintenant = Date.now()): string | null {
  const s = secret();
  if (!s) return null;
  const t = String(maintenant);
  return `${t}.${signer(t, s)}`;
}

export type Motif = "piege" | "sans-jeton" | "jeton-faux" | "trop-rapide" | "jeton-perime" | "charabia";

/** Le jeton est-il bon ? `null` s'il l'est, sinon la raison. */
export function verifierJeton(jeton: unknown, maintenant = Date.now()): Motif | null {
  const s = secret();
  if (!s) return null; // sans secret, on ne bloque personne
  if (typeof jeton !== "string" || !jeton.includes(".")) return "sans-jeton";
  const [t, sig] = jeton.split(".", 2);
  const attendu = signer(t, s);
  const a = Buffer.from(sig ?? ""), b = Buffer.from(attendu);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "jeton-faux";
  const age = maintenant - Number(t);
  if (!Number.isFinite(age) || age < DELAI_MIN_MS) return "trop-rapide";
  if (age > DUREE_MAX_MS) return "jeton-perime";
  return null;
}

/**
 * Un mot en charabia : au moins huit lettres, des minuscules, et au moins trois majuscules après la
 * première lettre (« gKcjbFFDRNjWkMzgCNW », « OuZtdZggiaclmzqSLcUBmXDY »). « McDonald », « DUPONT »
 * ou « Jean-Baptiste » ne le sont pas.
 */
export function motCharabia(mot: string): boolean {
  if (!/^[A-Za-z]{8,}$/.test(mot)) return false;
  if (!/[a-z]/.test(mot)) return false;
  return (mot.slice(1).match(/[A-Z]/g) ?? []).length >= 3;
}

export function texteCharabia(texte: unknown): boolean {
  if (typeof texte !== "string") return false;
  return texte.split(/\s+/).some(motCharabia);
}

/** Une adresse Gmail truffée de points (« cari.c.uf.i.0.3.3@gmail.com ») : Gmail les ignore. */
export function gmailAPoints(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const m = email.trim().toLowerCase().match(/^([^@]+)@(gmail|googlemail)\.com$/);
  return !!m && (m[1].match(/\./g) ?? []).length >= 4;
}

/**
 * Le verdict sur un envoi : `null` s'il passe, sinon le motif. Le champ piège et le jeton suffisent
 * seuls ; le charabia demande deux indices (deux champs, ou un champ et une adresse à points), pour
 * ne jamais écarter un vrai visiteur sur un seul mot étrange.
 */
export function envoiSuspect(body: Record<string, unknown>, maintenant = Date.now()): Motif | null {
  if (typeof body.site === "string" && body.site.trim() !== "") return "piege";
  const jeton = verifierJeton(body.jeton, maintenant);
  if (jeton) return jeton;
  const champs = [body.prenom, body.nom, body.message, body.description, body.precisions, body.societe];
  const indices = champs.filter(texteCharabia).length + (gmailAPoints(body.email) ? 1 : 0);
  return indices >= 2 ? "charabia" : null;
}

/** Efface les envois gardés à part depuis plus de 30 jours (tâche quotidienne /api/lead/relance/). */
export async function purgerSuspects(): Promise<number> {
  const { configSite } = await import("@/lib/supabase-site");
  const cfg = configSite();
  if (!cfg) return 0;
  const limite = new Date(Date.now() - 30 * 86400_000).toISOString();
  const r = await fetch(`${cfg.url}/rest/v1/leads_suspects?recu_le=lt.${encodeURIComponent(limite)}`, {
    method: "DELETE",
    headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}`, Prefer: "return=representation" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) return 0;
  return ((await r.json()) as unknown[]).length;
}
