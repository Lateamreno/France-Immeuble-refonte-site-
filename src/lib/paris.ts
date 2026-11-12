import contenu from "../../content/paris.json";

/**
 * Contenu de la page « Vendre un immeuble à Paris » (lot 99, MAV, 10/11/2026 : « toutes les
 * questions que se posent les clients à Paris (Airbnb, DPE, encadrement des loyers…) »,
 * « les arrondissements, le type d'architecture »). Relu avant publication ; chaque réponse
 * garde ses sources dans le fichier.
 */
export type Arrondissement = {
  n: number;
  nom: string;
  prixM2: number | null;
  evolution1an: string | null;
  architecture: string;
  attention: string | null;
};
export type Architecture = { type: string; periode: string; reperes: string; pourLesAcheteurs: string; travaux: string };
/**
 * `groupe` : le titre sous lequel la question se range (lot 108). `lien` : le passage de la réponse
 * qui porte un lien vers une page du site. Les accolades ({annee}, {acheteurs}…) sont des chiffres
 * vivants, remplis par la page ; une question dont un chiffre manque ne s'affiche pas.
 */
export type QuestionParis = {
  groupe: string;
  question: string;
  reponse: string;
  sources: string[];
  lien?: { texte: string; href: string };
};

export const PARIS = contenu as {
  arrondissements: Arrondissement[];
  sourcePrix: { libelle: string; url: string };
  architectures: Architecture[];
  questions: QuestionParis[];
};
