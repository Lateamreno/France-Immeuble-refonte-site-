import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { configSite } from "@/lib/supabase-site";
import { COMMUNES_SUIVIES, derniereAnneeDvf, detailVentesImmeubles, lireCsv, urlDvf } from "@/lib/dvf-immeubles";
import { chercherPhoto, rueLisible, rueOfficielle } from "@/lib/panoramax";

/**
 * Recalcul mensuel des ventes d'immeubles de Paris une par une (lot 125), pour la page
 * /ventes-immeubles-paris/. Même sélection que les médianes (`detailVentesImmeubles` repart des mêmes
 * règles que `ventesImmeubles`). Tâche planifiée de Vercel, protégée par CRON_SECRET ; n'écrit que
 * dans la table publique `ventes_immeubles_dvf` de la base du site.
 *
 * Pour chaque vente nouvelle, la tâche cherche le nom officiel de la rue (Base Adresse Nationale) et
 * une photo de façade libre (Panoramax). Ce qu'elle n'a pas le temps de chercher le sera le mois
 * suivant (`enrichi`). Une année recalculée remplace ses ventes ; les autres années restent.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ANNEES_GARDEES = 3;
const LIMITE_MS = 270_000;
const DELAI_MS = 20_000;
const PAGE = "/ventes-immeubles-paris/";

type Ligne = Record<string, unknown>;

async function ventesDeLAnnee(annee: number, echeance: number): Promise<Ligne[] | null> {
  const fichiers = new Map<string, Record<string, string>[]>();
  for (const c of COMMUNES_SUIVIES) {
    try {
      const delai = Math.min(DELAI_MS, Math.max(1_000, echeance - Date.now()));
      const r = await fetch(urlDvf(annee, c.code), { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(delai) });
      if (!r.ok) return null;
      fichiers.set(c.code, lireCsv(await r.text()));
    } catch {
      return null;
    }
  }
  // Les ventes à cheval sur plusieurs communes suivies ne comptent nulle part (même règle que les médianes).
  const premiere = new Map<string, string>();
  const ailleurs = new Set<string>();
  for (const [code, rows] of fichiers) {
    for (const l of rows) {
      const vu = premiere.get(l.id_mutation);
      if (vu === undefined) premiere.set(l.id_mutation, code);
      else if (vu !== code) ailleurs.add(l.id_mutation);
    }
  }
  const lignes: Ligne[] = [];
  for (const [code, rows] of fichiers) {
    if (!code.startsWith("751")) continue;
    for (const v of detailVentesImmeubles(rows, ailleurs)) {
      lignes.push({
        id: v.id, code_insee: code, annee, date_vente: v.date, rue_dvf: v.rue, code_postal: v.codePostal,
        prix: v.prix, surface: v.surface, prix_m2: v.prixM2, logements: v.logements, mixte: v.mixte, lots: v.lots,
        lat: v.lat, lon: v.lon,
      });
    }
  }
  return lignes;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const cfg = configSite();
  if (!cfg) return NextResponse.json({ ok: false, erreur: "base du site non configurée" }, { status: 500 });
  const depart = Date.now();
  const echeance = depart + LIMITE_MS;
  const annee = await derniereAnneeDvf();
  if (!annee) return NextResponse.json({ ok: false, erreur: "DVF injoignable" }, { status: 502 });
  const entetes = { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}`, "content-type": "application/json" };

  // Ce qui est déjà cherché (rue officielle, photo) n'est pas recherché.
  const deja = new Map<string, { rue: string | null; photo: unknown }>();
  try {
    const r = await fetch(`${cfg.url}/rest/v1/ventes_immeubles_dvf?select=id,rue,photo&enrichi=eq.true`, { headers: entetes, signal: AbortSignal.timeout(DELAI_MS) });
    if (r.ok) for (const l of (await r.json()) as { id: string; rue: string | null; photo: unknown }[]) deja.set(l.id, l);
  } catch {
    /* table vide ou injoignable : tout sera cherché */
  }

  const faites: number[] = [];
  const passees: number[] = [];
  for (let a = annee; a > annee - ANNEES_GARDEES; a--) {
    if (Date.now() > echeance - 60_000) { passees.push(a); continue; }
    const lignes = await ventesDeLAnnee(a, echeance);
    // Aucune vente : on n'écrit ni n'efface rien (un fichier vide ne doit pas vider l'année).
    if (!lignes?.length) { passees.push(a); continue; }
    // Rue officielle et photo, six à la fois, tant qu'il reste du temps.
    const file = [...lignes];
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        for (let l = file.shift(); l; l = file.shift()) {
          const vu = deja.get(String(l.id));
          const brute = typeof l.rue_dvf === "string" ? l.rue_dvf : null;
          if (vu) { l.rue = vu.rue; l.photo = vu.photo; l.enrichi = true; continue; }
          l.rue = brute ? rueLisible(brute) : null;
          l.photo = null;
          l.enrichi = false;
          if (Date.now() > echeance - 30_000) continue;
          try {
            const signal = AbortSignal.timeout(10_000);
            const [rue, photo] = await Promise.all([
              brute && l.code_postal ? rueOfficielle(brute, String(l.code_postal), signal) : null,
              typeof l.lat === "number" && typeof l.lon === "number" ? chercherPhoto(l.lat, l.lon, signal) : null,
            ]);
            if (rue) l.rue = rue;
            l.photo = photo;
            l.enrichi = true;
          } catch {
            /* le mois suivant */
          }
        }
      }),
    );
    const corps = lignes.map((l) => {
      const { rue_dvf: _brute, ...reste } = l;
      return { ...reste, maj_le: new Date().toISOString() } as Ligne;
    });
    // L'année recalculée remplace ses ventes : celles que DVF a retirées disparaissent.
    const ids = corps.map((l) => `"${String(l.id)}"`).join(",");
    const ecrite = await fetch(`${cfg.url}/rest/v1/ventes_immeubles_dvf?on_conflict=id`, {
      method: "POST",
      headers: { ...entetes, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(corps),
      signal: AbortSignal.timeout(DELAI_MS),
    });
    if (!ecrite.ok) { passees.push(a); continue; }
    await fetch(`${cfg.url}/rest/v1/ventes_immeubles_dvf?annee=eq.${a}&id=not.in.(${ids})`, { method: "DELETE", headers: entetes, signal: AbortSignal.timeout(DELAI_MS) });
    faites.push(a);
  }
  if (faites.length) revalidatePath(PAGE);
  return NextResponse.json({ ok: true, faites, passees });
}
