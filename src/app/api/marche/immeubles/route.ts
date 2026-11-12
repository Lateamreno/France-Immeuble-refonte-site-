import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { configSite } from "@/lib/supabase-site";
import { COMMUNES_SUIVIES, derniereAnneeDvf, lireCsv, urlDvf, ventesImmeubles } from "@/lib/dvf-immeubles";

/**
 * Recalcul mensuel des ventes d'immeubles entiers repérées dans DVF (lot 100), pour les pages
 * Paris et communes. Tâche planifiée de Vercel (vercel.json), protégée par CRON_SECRET comme
 * /api/lead/relance/. N'écrit que dans la table publique `marche_immeubles` de la base du site.
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

  const lignes: Record<string, unknown>[] = [];
  const echecs: string[] = [];
  for (const c of COMMUNES_SUIVIES) {
    try {
      const r = await fetch(urlDvf(annee, c.code), { cache: "no-store", redirect: "follow" });
      if (!r.ok) { echecs.push(c.code); continue; }
      const s = ventesImmeubles(lireCsv(await r.text()));
      lignes.push({ code_insee: c.code, annee, nb_ventes: s.nbVentes, prix_m2_median: s.prixM2Median, prix_m2_min: s.prixM2Min, prix_m2_max: s.prixM2Max, prix_median: s.prixMedian, surface_mediane: s.surfaceMediane, maj_le: new Date().toISOString() });
    } catch {
      echecs.push(c.code);
    }
  }
  if (lignes.length) {
    const r = await fetch(`${cfg.url}/rest/v1/marche_immeubles?on_conflict=code_insee,annee`, {
      method: "POST",
      headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}`, "content-type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(lignes),
    });
    if (!r.ok) return NextResponse.json({ ok: false, erreur: `écriture ${r.status}` }, { status: 502 });
    revalidatePath("/vendre-un-immeuble/paris/");
  }
  return NextResponse.json({ ok: true, annee, communes: lignes.length, echecs });
}
