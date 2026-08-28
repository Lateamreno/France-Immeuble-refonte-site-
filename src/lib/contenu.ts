import articlesJson from "../../content/articles.json";

/**
 * Couche d'accès au contenu éditorial.
 *
 * Aujourd'hui la source est un JSON versionné, produit par la reprise du
 * WordPress. Demain ce sera `content.articles` dans le Supabase SITE, alimenté
 * par Mindstardust (CLAUDE.md §8). Le reste du code ne connaît que les
 * fonctions ci-dessous : la bascule ne touchera pas une seule page.
 *
 * ⚠️ Les métadonnées sont reprises telles quelles depuis l'ancien site.
 * Changer une URL ou un title, c'est perdre le référencement acquis (§10).
 * Toute correction rédactionnelle se fait en connaissance de cause.
 */
export type Article = {
  slug: string;
  /** Chemin absolu servi, barre oblique finale comprise. Ne jamais le dériver du slug. */
  chemin: string;
  /** Identifiant WordPress d'origine — sert à retracer une reprise. */
  wpId: number;
  h1: string;
  seoTitle: string;
  seoDesc: string | null;
  canonical: string | null;
  ogImage: string | null;
  /** Image à la une, reprise de WordPress. Sert d'accroche au listing. */
  imageUne: string | null;
  imageUneAlt: string | null;
  noindex: boolean;
  publishedAt: string;
  updatedAt: string;
  contenuHtml: string;
};

const ARTICLES = articlesJson as Article[];

/** Les articles publiés, du plus récent au plus ancien. */
export function tousLesArticles(): Article[] {
  return ARTICLES;
}

export function articleParSlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/** Les slugs à pré-rendre. Rien en dehors de cette liste ne doit répondre. */
export function slugsArticles(): string[] {
  return ARTICLES.map((a) => a.slug);
}

/**
 * Date en français, sans dépendance : `toLocaleDateString` varie selon
 * l'environnement d'exécution et produit des écarts serveur/client.
 */
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function dateFr(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Durée de lecture, arrondie à la minute supérieure, minimum 1. */
export function dureeLecture(html: string): number {
  const mots = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(mots / 200));
}
