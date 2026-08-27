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

export function router(d: Dossier): Verdict {
  const dept = d.codePostal.trim().slice(0, 2);
  const idf = (DEPTS_IDF as readonly string[]).includes(dept);
  const rdt = rentabilite(d.loyerAnnuel, d.valeurEstimee);
  const grosTicket = (d.valeurEstimee ?? 0) >= CALIBRE.ticketMin;

  // Paris/IDF ou gros ticket : c'est le cœur de cible, traitement prioritaire.
  if (idf || grosTicket) return { piste: "prioritaire", rentabilite: rdt, idf };

  // Province : on prend si le rendement justifie le déplacement du fichier.
  if (rdt !== null && rdt >= CALIBRE.rentabiliteProvinceMin) {
    return { piste: "standard", rentabilite: rdt, idf };
  }

  // Le reste part chez PleinBail plutôt que d'être perdu.
  return { piste: "pleinbail", rentabilite: rdt, idf };
}
