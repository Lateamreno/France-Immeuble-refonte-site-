import { configSitePublique } from "./supabase-site";

/** Les ventes d'immeubles entiers de DVF, telles que la tâche mensuelle les a rangées (lot 100). */
export type ImmeublesCommune = { annee: number; nbVentes: number; prixM2Median: number | null };

export async function immeublesDesCommunes(codes: string[]): Promise<Map<string, ImmeublesCommune>> {
  const out = new Map<string, ImmeublesCommune>();
  const cfg = configSitePublique();
  if (!cfg) return out;
  try {
    const r = await fetch(
      `${cfg.url}/rest/v1/marche_immeubles?select=code_insee,annee,nb_ventes,prix_m2_median&code_insee=in.(${codes.join(",")})&order=annee.desc`,
      { headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` }, next: { revalidate: 86400, tags: ["marche"] } },
    );
    if (!r.ok) return out;
    const lignes = (await r.json()) as { code_insee: string; annee: number; nb_ventes: number; prix_m2_median: number | string | null }[];
    for (const l of lignes) {
      if (out.has(l.code_insee)) continue; // la plus récente d'abord
      out.set(l.code_insee, { annee: l.annee, nbVentes: l.nb_ventes, prixM2Median: l.prix_m2_median != null ? Number(l.prix_m2_median) : null });
    }
  } catch { /* la page s'affiche sans ces chiffres */ }
  return out;
}
