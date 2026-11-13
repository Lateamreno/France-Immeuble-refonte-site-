import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { configSite } from "@/lib/supabase-site";
import { COMMUNES_SUIVIES, derniereAnneeDvf, lireCsv, urlDvf, ventesAppartements, ventesImmeubles } from "@/lib/dvf-immeubles";

/**
 * Recalcul mensuel des ventes d'immeubles entiers repérées dans DVF (lot 100), pour les pages
 * Paris et communes. Tâche planifiée de Vercel (vercel.json), protégée par CRON_SECRET comme
 * /api/lead/relance/. N'écrit que dans la table publique `marche_immeubles` de la base du site.
 * Lot 110 : elle range aussi, sur la même ligne, les appartements vendus seuls des mêmes fichiers
 * (nombre de ventes et prix médian au m²), d'où la page tire la décote des immeubles.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const cfg = configSite();
  if (!cfg) return NextResponse.json({ ok: false, erreur: "base du site non configurée" }, { status: 500 });
  const annee = await derniereAnneeDvf();
  if (!annee) return NextResponse.json({ ok: false, erreur: "DVF injoignable" }, { status: 502 });

  // Premier passage : lire tous les fichiers, et repérer les ventes à cheval sur plusieurs communes
  // suivies (leur prix couvre des locaux d'une autre commune : on ne les compte nulle part).
  const fichiers = new Map<string, Record<string, string>[]>();
  const echecs: string[] = [];
  for (const c of COMMUNES_SUIVIES) {
    try {
      const r = await fetch(urlDvf(annee, c.code), { cache: "no-store", redirect: "follow" });
      if (!r.ok) { echecs.push(c.code); continue; }
      fichiers.set(c.code, lireCsv(await r.text()));
    } catch {
      echecs.push(c.code);
    }
  }
  // Un fichier manquant fausserait le repérage des ventes à cheval sur plusieurs communes : on
  // n'écrit rien ce mois-là, la table garde ses chiffres.
  if (echecs.length) return NextResponse.json({ ok: false, erreur: "fichiers DVF manquants", echecs }, { status: 502 });
  const premiere = new Map<string, string>();
  const ailleurs = new Set<string>();
  for (const [code, rows] of fichiers) {
    for (const l of rows) {
      const vu = premiere.get(l.id_mutation);
      if (vu === undefined) premiere.set(l.id_mutation, code);
      else if (vu !== code) ailleurs.add(l.id_mutation);
    }
  }

  const lignes: Record<string, unknown>[] = [];
  for (const [code, rows] of fichiers) {
    const s = ventesImmeubles(rows, ailleurs);
    const a = ventesAppartements(rows, ailleurs);
    lignes.push({ code_insee: code, annee, nb_ventes: s.nbVentes, prix_m2_median: s.prixM2Median, prix_m2_bas: s.prixM2Bas, prix_m2_haut: s.prixM2Haut, prix_m2_min: s.prixM2Min, prix_m2_max: s.prixM2Max, prix_median: s.prixMedian, surface_mediane: s.surfaceMediane, appart_nb_ventes: a.nbVentes, appart_prix_m2_median: a.prixM2Median, maj_le: new Date().toISOString() });
  }
  if (lignes.length) {
    const ecrire = (corps: Record<string, unknown>[]) =>
      fetch(`${cfg.url}/rest/v1/marche_immeubles?on_conflict=code_insee,annee`, {
        method: "POST",
        headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}`, "content-type": "application/json", Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(corps),
      });
    let r = await ecrire(lignes);
    // Une base d'avant la migration 0022 refuse les colonnes des appartements : on écrit au moins les immeubles.
    if (r.status === 400) {
      r = await ecrire(lignes.map((l) => Object.fromEntries(Object.entries(l).filter(([cle]) => !cle.startsWith("appart_")))));
    }
    if (!r.ok) return NextResponse.json({ ok: false, erreur: `écriture ${r.status}` }, { status: 502 });
    revalidatePath("/vendre-un-immeuble/paris/");
  }
  return NextResponse.json({ ok: true, annee, communes: lignes.length, echecs });
}
