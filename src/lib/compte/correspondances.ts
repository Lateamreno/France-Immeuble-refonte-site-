import type { BienAVendre } from "../biens";
import type { Recherche } from "./donnees";

/**
 * Les biens EN LIGNE qui correspondent aux recherches du compte (§9.2, calcul
 * du site). Un bien correspond à une recherche si son département y figure,
 * si son prix tient dans la fourchette et si son rendement atteint le minimum.
 * Les critères laissés vides ne filtrent rien.
 */
export function biensCorrespondants(biens: BienAVendre[], recherches: Recherche[], max = 6): BienAVendre[] {
  if (recherches.length === 0) return [];
  const ok = (b: BienAVendre, r: Recherche) =>
    (r.departements.length === 0 || r.departements.includes(b.dept)) &&
    (r.villes.length === 0 || r.villes.some((v) => v.toLowerCase() === b.ville.toLowerCase())) &&
    (r.prix_min == null || b.prixHai >= Number(r.prix_min)) &&
    (r.prix_max == null || b.prixHai <= Number(r.prix_max)) &&
    (r.rendement_min == null || (b.rendement != null && b.rendement >= Number(r.rendement_min)));
  return biens.filter((b) => recherches.some((r) => ok(b, r))).slice(0, max);
}
