import ventesJson from "../../content/ventes.json";

/**
 * Nos biens — ventes réalisées, biens à vendre, off-market.
 *
 * ⚠️ FRONTIÈRE SITE ↔ BO (CLAUDE.md §2 et §16). Le site ne lit JAMAIS le CRM.
 * Le BO dépose une copie appauvrie, le site lit cette copie. Ici, la copie est
 * un fichier du repo : je l'ai déposée à la main, une fois, à partir de données
 * déjà publiques — l'iframe Bubble affichait ces mêmes ventes. Aucune clé du BO
 * n'existe dans l'environnement du site, et aucun chemin réseau n'y mène.
 *
 * Quand le projet Supabase du site existera, `content/ventes.json` sera remplacé
 * par la projection `web.ventes` et seule la fonction de lecture changera : la
 * forme des données ci-dessous est déjà celle du contrat.
 *
 * Ce qui traverse la frontière, et rien d'autre :
 *   commune, département, prix, date, photo.
 * Jamais la rue, jamais le numéro, jamais un nom. Les fichiers photo d'origine
 * portaient parfois l'adresse dans leur nom (« Immeuble 47 rue des bas
 * Fossés… ») : `scripts/import-ventes.mjs` les renomme sur un identifiant neutre.
 */

export type Vente = {
  id: string;
  ville: string;
  /** Département sur deux caractères — « 75 », « 06 ». */
  dept: string;
  /** Prix honoraires acquéreur inclus, en euros. */
  prix: number;
  /** Date de l'acte, ISO court. */
  date: string;
  annee: number;
  region: "idf" | "sud-ouest" | "autre";
  /** Chemin servi depuis notre domaine, ou null si la photo n'a pas pu être reprise. */
  image: string | null;
};

export const VENTES: Vente[] = (ventesJson as Vente[])
  .slice()
  .sort((a, b) => b.date.localeCompare(a.date));

/**
 * Les chiffres de preuve se CALCULENT, ils ne se saisissent pas.
 *
 * Le site annonçait « 365 immeubles » : aucune table du CRM ne produit ce
 * nombre — 274 mandats, 211 commercialisations, 875 estimations, 44 ventes.
 * MAV a tranché le 21/10 : on aligne le discours sur ce que la base prouve.
 * Dériver ces valeurs des données plutôt que de les écrire en dur garantit que
 * l'écart ne peut pas revenir.
 */
export const VENTES_STATS = {
  total: VENTES.length,
  villes: new Set(VENTES.map((v) => v.ville)).size,
  departements: new Set(VENTES.map((v) => v.dept)).size,
  premiereAnnee: Math.min(...VENTES.map((v) => v.annee)),
  derniereAnnee: Math.max(...VENTES.map((v) => v.annee)),
  volume: VENTES.reduce((s, v) => s + v.prix, 0),
  partIdf: Math.round(
    (VENTES.filter((v) => v.region === "idf").length / VENTES.length) * 100,
  ),
} as const;

/** Les communes les plus représentées, pour le bloc de couverture. */
export function villesFrequentes(n = 8): { ville: string; n: number }[] {
  const compte = new Map<string, number>();
  for (const v of VENTES) compte.set(v.ville, (compte.get(v.ville) ?? 0) + 1);
  return [...compte.entries()]
    .map(([ville, n]) => ({ ville, n }))
    .sort((a, b) => b.n - a.n || a.ville.localeCompare(b.ville, "fr"))
    .slice(0, n);
}

/**
 * Biens actuellement à vendre.
 *
 * Alimenté par la projection `web.biens_a_vendre`, que le BO dépose pour les
 * seules annonces dont la diffusion « France Immeuble » est cochée. Tant que
 * le projet Supabase du site n'existe pas, la liste est vide et la page affiche
 * son état vide — c'est aussi l'état réel aujourd'hui : sur 30 immeubles en
 * commercialisation, aucun n'a d'annonce diffusée sur le site.
 *
 * Le jeu d'informations est celui de PleinBail, à une exception près : pas
 * d'adresse. Commune et département suffisent à situer, la rue identifie le
 * vendeur.
 */
export type BienAVendre = {
  id: string;
  slug: string;
  titre: string;
  ville: string;
  dept: string;
  /** « Immeuble de rapport », « Immeuble mixte »… */
  type: string;
  surfaceCarrez: number;
  lots: number;
  /** Loyer hors charges annuel constaté, en euros. */
  loyerHcAn: number | null;
  prixHai: number;
  /** Rendement brut affiché, en %. */
  rendement: number | null;
  /** Taux d'occupation en % de la surface Carrez, ou null si libre. */
  occupation: number | null;
  prixM2: number | null;
  travaux: boolean;
  images: string[];
};

export const BIENS_A_VENDRE: BienAVendre[] = [];

/** Formate un prix : 1830000 → « 1 830 000 € ». */
export function prix(n: number): string {
  return `${n.toLocaleString("fr-FR").replace(/ | |\s/g, " ")} €`;
}

/** Arrondi lisible pour un volume cumulé : 48 920 000 → « 48,9 M€ ». */
export function volume(n: number): string {
  return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M€`;
}
