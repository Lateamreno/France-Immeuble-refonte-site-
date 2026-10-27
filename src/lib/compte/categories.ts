/**
 * Les catégories de pièces du §10.2, dans l'ordre où le compte les présente.
 * Sans dépendance serveur : le formulaire d'estimation les liste aussi, pour
 * dire au vendeur ce qu'il peut préparer avant notre appel.
 */
export const CATEGORIES = [
  { cle: "titre", titre: "Titre de propriété", aide: "L’acte notarié d’acquisition." },
  { cle: "baux", titre: "Baux en cours", aide: "Un fichier par bail, ou un seul pour tous." },
  { cle: "diagnostics", titre: "Diagnostics", aide: "DPE, amiante, plomb, électricité, gaz, même anciens." },
  { cle: "taxe", titre: "Taxe foncière", aide: "Le dernier avis." },
  { cle: "charges", titre: "Charges et travaux", aide: "Appels de charges, devis, factures récentes." },
  { cle: "autre", titre: "Autre pièce", aide: "Tout document utile à la vente." },
] as const;

export type CleCategorie = (typeof CATEGORIES)[number]["cle"];
export const estCategorie = (c: string): c is CleCategorie => CATEGORIES.some((x) => x.cle === c);
