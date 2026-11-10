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
export type QuestionParis = { question: string; reponse: string; sources: string[] };
/** Un bloc de texte de fond (MAV, 10/11/2026 : « ça manque peut-être un peu de texte »). */
export type BlocParis = { surtitre: string; titre: string; paragraphes: string[]; sources: string[] };

export const PARIS = contenu as {
  arrondissements: Arrondissement[];
  sourcePrix: { libelle: string; url: string };
  architectures: Architecture[];
  questions: QuestionParis[];
  blocs?: { marche?: BlocParis; etapes?: BlocParis; fiscalite?: BlocParis };
};
