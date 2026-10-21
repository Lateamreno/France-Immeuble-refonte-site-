import articlesJson from "../../content/articles.json";
import pagesJson from "../../content/pages-wp.json";

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

/* ==========================================================================
   PAGES REPRISES DU WORDPRESS
   ==========================================================================
   Le site d'origine est tombé le 8 octobre 2026 et sa base a été vidée : le
   backup UpdraftPlus ne contient plus que 5 lignes dans `wp_posts` (4
   révisions, 1 brouillon). `content/pages-wp.json` et `content/articles.json`,
   copiés le 26 août, sont désormais la SEULE copie du contenu. Ne jamais les
   écraser sans sauvegarde préalable.
   ========================================================================== */


export type PageWP = {
  slug: string;
  chemin: string;
  wpId: number;
  h1: string;
  seoTitle: string;
  seoDesc: string | null;
  canonical: string | null;
  ogImage: string | null;
  imageUne: string | null;
  imageUneAlt: string | null;
  noindex: boolean;
  publishedAt: string;
  updatedAt: string;
  contenuHtml: string;
};

const PAGES = pagesJson as PageWP[];

export function pageParChemin(chemin: string): PageWP | undefined {
  return PAGES.find((p) => p.chemin === chemin);
}

/**
 * Un morceau de page : soit du HTML repris tel quel, soit un formulaire.
 *
 * Les formulaires WordPress (`form_estimate_1/2/3`, `form_contact_1/2/3`)
 * dépendaient d'un JS de thème qui n'existe plus. On les retire du flux HTML
 * et on monte nos propres composants à leur place — même emplacement dans la
 * page, mêmes champs. Tout le reste du markup est repris au caractère près.
 */
export type Segment =
  | { type: "html"; valeur: string }
  | { type: "estimation" }
  | { type: "contact" };

/** Du `<form ... form_X_1">` jusqu'à la fin du bloc de succès `form_X_3`. */
function bornes(html: string, famille: "estimate" | "contact"): [number, number] | null {
  const ouverture = html.indexOf(`class="form_${famille} form_${famille}_1"`);
  if (ouverture === -1) return null;
  const debut = html.lastIndexOf("<form", ouverture);
  const succes = html.indexOf(`class="form_${famille}_3 form_success_message"`, ouverture);
  if (debut === -1 || succes === -1) return null;
  const fin = html.indexOf("</div>", succes);
  return fin === -1 ? null : [debut, fin + "</div>".length];
}

export function segmenterPage(html: string): Segment[] {
  const blocs: Array<{ debut: number; fin: number; type: "estimation" | "contact" }> = [];
  for (const [famille, type] of [
    ["estimate", "estimation"],
    ["contact", "contact"],
  ] as const) {
    const b = bornes(html, famille);
    if (b) blocs.push({ debut: b[0], fin: b[1], type });
  }
  blocs.sort((a, b) => a.debut - b.debut);

  const segments: Segment[] = [];
  let curseur = 0;
  for (const b of blocs) {
    if (b.debut > curseur) segments.push({ type: "html", valeur: html.slice(curseur, b.debut) });
    segments.push({ type: b.type });
    curseur = b.fin;
  }
  if (curseur < html.length) segments.push({ type: "html", valeur: html.slice(curseur) });
  return segments;
}
