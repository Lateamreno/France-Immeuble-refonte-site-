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
 * Lot 111 (MAV, 13/11/2026 : « garde peut-être les 3 années pour qu'on puisse publier sur notre site
 * sur une page à part au besoin ou pour faire un dossier presse ») : la tâche range aussi les deux
 * années d'avant. La page Paris ne publie que la plus récente ; les deux autres attendent en base.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Nombre d'années gardées en base : la dernière année entière de DVF et les deux d'avant. */
const ANNEES_GARDEES = 3;
/** La tâche a 300 secondes en tout (`maxDuration`) : on en garde trente pour écrire et répondre. */
const LIMITE_MS = 270_000;
/** Un fichier DVF ou une écriture qui ne répond pas en vingt secondes compte comme un échec. */
const DELAI_MS = 20_000;

type Calcul = { lignes: Record<string, unknown>[] } | { echecs: string[] };

/** Les 25 lignes d'une année, ou la liste des fichiers DVF qui n'ont pas répondu. */
async function calculer(annee: number, echeance: number): Promise<Calcul> {
  // Premier passage : lire tous les fichiers, et repérer les ventes à cheval sur plusieurs communes
  // suivies (leur prix couvre des locaux d'une autre commune : on ne les compte nulle part).
  const fichiers = new Map<string, Record<string, string>[]>();
  const echecs: string[] = [];
  for (const c of COMMUNES_SUIVIES) {
    try {
      const delai = Math.min(DELAI_MS, Math.max(1_000, echeance - Date.now()));
      const r = await fetch(urlDvf(annee, c.code), { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(delai) });
      if (!r.ok) { echecs.push(c.code); continue; }
      fichiers.set(c.code, lireCsv(await r.text()));
    } catch {
      echecs.push(c.code);
    }
  }
  // Un fichier manquant fausserait le repérage des ventes à cheval sur plusieurs communes : on
  // n'écrit rien pour cette année, la table garde ses chiffres.
  if (echecs.length) return { echecs };
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
  return { lignes };
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const cfg = configSite();
  if (!cfg) return NextResponse.json({ ok: false, erreur: "base du site non configurée" }, { status: 500 });
  const depart = Date.now();
  const annee = await derniereAnneeDvf();
  if (!annee) return NextResponse.json({ ok: false, erreur: "DVF injoignable" }, { status: 502 });

  const ecrire = async (lignes: Record<string, unknown>[]) => {
    const envoyer = (corps: Record<string, unknown>[]) =>
      fetch(`${cfg.url}/rest/v1/marche_immeubles?on_conflict=code_insee,annee`, {
        method: "POST",
        headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}`, "content-type": "application/json", Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(corps),
        signal: AbortSignal.timeout(DELAI_MS),
      });
    let r = await envoyer(lignes);
    // Une base d'avant la migration 0022 refuse les colonnes des appartements : on écrit au moins les immeubles.
    if (r.status === 400) {
      r = await envoyer(lignes.map((l) => Object.fromEntries(Object.entries(l).filter(([cle]) => !cle.startsWith("appart_")))));
    }
    return r;
  };

  // L'année publiée d'abord : c'est elle que la page Paris affiche.
  const derniere = await calculer(annee, depart + LIMITE_MS);
  if ("echecs" in derniere) return NextResponse.json({ ok: false, erreur: "fichiers DVF manquants", echecs: derniere.echecs }, { status: 502 });
  if (derniere.lignes.length) {
    const r = await ecrire(derniere.lignes);
    if (!r.ok) return NextResponse.json({ ok: false, erreur: `écriture ${r.status}` }, { status: 502 });
    revalidatePath("/vendre-un-immeuble/paris/");
  }

  // Puis les années d'avant, gardées en base sans être publiées. Un fichier manquant, une écriture
  // refusée, une panne ou le temps qui manque : l'année est passée, la table garde ce qu'elle avait.
  const gardees: number[] = [];
  const passees: { annee: number; raison: string }[] = [];
  // Une année ne commence que si elle a le temps de finir : une fois et demie la plus longue déjà vue.
  let duree = Date.now() - depart;
  for (let a = annee - 1; a > annee - ANNEES_GARDEES; a--) {
    if (Date.now() - depart + duree * 1.5 > LIMITE_MS) { passees.push({ annee: a, raison: "temps" }); continue; }
    const debut = Date.now();
    try {
      const c = await calculer(a, depart + LIMITE_MS);
      if ("echecs" in c) passees.push({ annee: a, raison: `fichiers DVF manquants : ${c.echecs.join(", ")}` });
      else {
        const r = await ecrire(c.lignes);
        if (r.ok) gardees.push(a);
        else passees.push({ annee: a, raison: `écriture ${r.status}` });
      }
    } catch {
      passees.push({ annee: a, raison: "base injoignable" });
    }
    duree = Math.max(duree, Date.now() - debut);
  }
  return NextResponse.json({ ok: true, annee, communes: derniere.lignes.length, gardees, passees });
}
