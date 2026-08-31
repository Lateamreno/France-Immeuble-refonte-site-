/**
 * Routage du tunnel d'estimation — le cœur de la qualification.
 *
 * Principe (note d'architecture) : on ne rejette jamais un vendeur, on l'oriente.
 * PleinBail absorbe ce qui sort du calibre France Immeuble, donc un lead hors
 * cible n'est pas un lead perdu — c'est un lead routé.
 */
import { CALIBRE, DEPTS_IDF } from "./site";

export type Piste = "prioritaire" | "standard" | "pleinbail";

export type Dossier = {
  codePostal: string;
  valeurEstimee: number | null;
  loyerAnnuel: number | null;
};

export type Verdict = {
  piste: Piste;
  rentabilite: number | null;
  idf: boolean;
};

export function rentabilite(loyerAnnuel: number | null, valeur: number | null): number | null {
  if (!loyerAnnuel || !valeur || valeur <= 0) return null;
  return (loyerAnnuel / valeur) * 100;
}

/**
 * Valeur implicite : le loyer annuel capitalisé au rendement plancher province.
 *
 * Sert quand le vendeur n'a pas donné de prix — c'est désormais le cas par
 * défaut, la valeur n'étant demandée qu'en complément facultatif. On ne peut
 * pas lui imposer d'estimer lui-même le bien qu'il vient nous faire estimer.
 *
 * Le taux de capitalisation retenu est délibérément le plancher province : il
 * ne sert qu'à trancher le calibre hors Île-de-France, l'IDF étant routée sur
 * le seul code postal avant que ce test ne s'applique.
 */
export function valeurImplicite(loyerAnnuel: number | null): number | null {
  if (!loyerAnnuel || loyerAnnuel <= 0) return null;
  return loyerAnnuel / (CALIBRE.rentabiliteProvinceMin / 100);
}

export function router(d: Dossier): Verdict {
  const dept = d.codePostal.trim().slice(0, 2);
  const idf = (DEPTS_IDF as readonly string[]).includes(dept);

  // `rdt` reste nul tant que le vendeur n'a pas donné de prix : le calculer sur
  // une valeur implicite renverrait mécaniquement le taux de capitalisation, ce
  // qui n'apprendrait rien et serait affiché comme un vrai rendement.
  const rdt = rentabilite(d.loyerAnnuel, d.valeurEstimee);
  const valeur = d.valeurEstimee ?? valeurImplicite(d.loyerAnnuel);
  const grosTicket = (valeur ?? 0) >= CALIBRE.ticketMin;

  // Paris/IDF ou gros ticket : c'est le cœur de cible, traitement prioritaire.
  if (idf || grosTicket) return { piste: "prioritaire", rentabilite: rdt, idf };

  // Province : on prend si le rendement justifie le déplacement du fichier.
  // À défaut de prix annoncé, `valeur` est déjà le loyer capitalisé au plancher
  // — le test de calibre ci-dessus a donc déjà fait office de test de rendement.
  if (rdt !== null && rdt >= CALIBRE.rentabiliteProvinceMin) {
    return { piste: "standard", rentabilite: rdt, idf };
  }

  // Le reste part chez PleinBail plutôt que d'être perdu.
  return { piste: "pleinbail", rentabilite: rdt, idf };
}
