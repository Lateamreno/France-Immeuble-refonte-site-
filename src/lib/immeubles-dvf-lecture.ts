import { VENTES_MIN_FOURCHETTE } from "./dvf-immeubles";
import { configSitePublique, type ConfigSite } from "./supabase-site";

/** Note de fiabilité du prix médian d'une commune, de 1 (fragile) à 5 (solide). */
export type NoteFiabilite = 1 | 2 | 3 | 4 | 5;

/** Les ventes d'immeubles entiers de DVF, telles que la tâche mensuelle les a rangées (lot 100). */
export type ImmeublesCommune = {
  annee: number;
  nbVentes: number;
  prixM2Median: number | null;
  /** La fourchette : sans le quart des ventes le moins cher ni le quart le plus cher (lot 109). */
  prixM2Bas: number | null;
  prixM2Haut: number | null;
  /** Les appartements vendus seuls, même fichier DVF, même année (lot 110). Médiane dès 30 ventes. */
  appartNbVentes: number | null;
  appartPrixM2Median: number | null;
  /** Décote des immeubles vendus en bloc face aux appartements, en % entier signé : −35, +4. */
  decotePct: number | null;
  /** `null` sans prix médian. Voir `noteFiabilite`. */
  fiabilite: NoteFiabilite | null;
  /** Date du dernier relevé de DVF par la tâche mensuelle (ISO), pour la mention de source. */
  majLe: string | null;
};

/**
 * La décote d'un immeuble vendu en bloc (lot 110, MAV, 13/11/2026) : prix médian au m² des
 * immeubles ÷ prix médian au m² des appartements vendus seuls − 1, en pourcentage entier. Négative
 * quand l'immeuble est moins cher au m², positive quand il est plus cher. `null` si l'un des deux
 * prix manque.
 */
export function decotePct(prixM2Immeubles: number | null, prixM2Appartements: number | null): number | null {
  if (prixM2Immeubles == null || prixM2Appartements == null || !(prixM2Appartements > 0)) return null;
  return Math.round((prixM2Immeubles / prixM2Appartements - 1) * 100) || 0; // jamais « −0 »
}

/** Incertitude maximale de chaque note, de la meilleure à la moins bonne. Au-delà : 1. */
export const SEUILS_FIABILITE: readonly (readonly [number, NoteFiabilite])[] = [[0.04, 5], [0.07, 4], [0.10, 3], [0.15, 2]];

/**
 * La note de fiabilité du prix médian (lot 110, MAV, 13/11/2026, retour #325 : « on note fiable
 * quand ya peu d'écart entre le moins cher et le plus cher »). Elle est haute quand les ventes sont
 * nombreuses et leurs prix proches les uns des autres :
 *  - largeur = (prix haut − prix bas) ÷ prix médian, sur la fourchette sans le quart des ventes le
 *    moins cher ni le quart le plus cher (lot 109) ;
 *  - incertitude = largeur ÷ √(nombre de ventes) ;
 *  - jusqu'à 0,04 : 5 ; jusqu'à 0,07 : 4 ; jusqu'à 0,10 : 3 ; jusqu'à 0,15 : 2 ; au-delà : 1 ;
 *  - moins de cinq ventes (pas de fourchette) : 1 ; pas de prix médian : pas de note.
 */
export function noteFiabilite(s: Pick<ImmeublesCommune, "nbVentes" | "prixM2Median" | "prixM2Bas" | "prixM2Haut">): NoteFiabilite | null {
  if (s.prixM2Median == null || !(s.prixM2Median > 0)) return null;
  if (s.nbVentes < VENTES_MIN_FOURCHETTE || s.prixM2Bas == null || s.prixM2Haut == null) return 1;
  const incertitude = (s.prixM2Haut - s.prixM2Bas) / s.prixM2Median / Math.sqrt(s.nbVentes);
  return SEUILS_FIABILITE.find(([seuil]) => incertitude <= seuil)?.[1] ?? 1;
}

const COLONNES = "code_insee,annee,nb_ventes,prix_m2_median,prix_m2_bas,prix_m2_haut,maj_le";
const COLONNES_APPARTEMENTS = "appart_nb_ventes,appart_prix_m2_median";

type LigneTable = {
  code_insee: string;
  annee: number;
  nb_ventes: number;
  prix_m2_median: number | string | null;
  prix_m2_bas: number | string | null;
  prix_m2_haut: number | string | null;
  maj_le?: string | null;
  appart_nb_ventes?: number | string | null;
  appart_prix_m2_median?: number | string | null;
};

const num = (v: number | string | null | undefined) => (v != null ? Number(v) : null);

/**
 * « refus » quand la base refuse la requête (une colonne qu'elle n'a pas encore : 400), `null`
 * quand elle ne répond pas. Quatre secondes au plus, comme la lecture de Plein Bail.
 */
async function lire(cfg: ConfigSite, codes: string[], colonnes: string): Promise<LigneTable[] | "refus" | null> {
  try {
    const r = await fetch(
      `${cfg.url}/rest/v1/marche_immeubles?select=${colonnes}&code_insee=in.(${codes.join(",")})&order=annee.desc`,
      { headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` }, next: { revalidate: 86400, tags: ["marche"] }, signal: AbortSignal.timeout(4000) },
    );
    if (r.ok) return (await r.json()) as LigneTable[];
    return r.status === 400 ? "refus" : null;
  } catch {
    return null;
  }
}

export async function immeublesDesCommunes(codes: string[]): Promise<Map<string, ImmeublesCommune>> {
  const out = new Map<string, ImmeublesCommune>();
  const cfg = configSitePublique();
  if (!cfg) return out;
  // Tant que la migration 0022 n'est pas passée, la base refuse les colonnes des appartements : on
  // relit avec la sélection d'avant, et la page garde son tableau, sans décote. Sans aucune
  // réponse, la page s'affiche sans ces chiffres.
  let lu = await lire(cfg, codes, `${COLONNES},${COLONNES_APPARTEMENTS}`);
  if (lu === "refus") lu = await lire(cfg, codes, COLONNES);
  const lignes = Array.isArray(lu) ? lu : [];
  for (const l of lignes) {
    if (out.has(l.code_insee)) continue; // la plus récente d'abord
    const immeubles = { nbVentes: l.nb_ventes, prixM2Median: num(l.prix_m2_median), prixM2Bas: num(l.prix_m2_bas), prixM2Haut: num(l.prix_m2_haut) };
    const appartPrixM2Median = num(l.appart_prix_m2_median);
    out.set(l.code_insee, {
      annee: l.annee,
      ...immeubles,
      appartNbVentes: num(l.appart_nb_ventes),
      appartPrixM2Median,
      decotePct: decotePct(immeubles.prixM2Median, appartPrixM2Median),
      fiabilite: noteFiabilite(immeubles),
      majLe: l.maj_le ?? null,
    });
  }
  return out;
}
