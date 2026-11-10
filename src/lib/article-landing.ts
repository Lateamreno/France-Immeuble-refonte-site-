/**
 * Les articles du blog en landing (lot 97, MAV, 10/11/2026 : « les transformer en landing
 * visuellement parlant du moins et en mettant le formulaire direct à l'intérieur »).
 * Le texte, le titre, la description et l'adresse restent ceux de l'article : seule la
 * présentation change.
 */

/** Articles lus par des acheteurs : le dépôt de recherche à la place de l'estimation. */
const ARTICLES_ACHETEUR = new Set([
  "pourquoi-acheter-un-immeuble-en-bloc",
  "immobilier-off-market-tout-ce-quil-faut-savoir",
]);

export type Cible = "vendeur" | "acheteur";
export const cibleArticle = (slug: string): Cible => (ARTICLES_ACHETEUR.has(slug) ? "acheteur" : "vendeur");

/**
 * Coupe le texte avant son troisième intertitre (le deuxième s'il n'y en a que deux) pour y
 * glisser l'encart qui mène au formulaire. Sans intertitre, tout reste d'un bloc.
 */
export function couperTexte(html: string): [string, string] {
  const positions = [...html.matchAll(/<h2[\s>]/g)].map((m) => m.index ?? 0);
  const rang = positions.length >= 3 ? 2 : positions.length - 1;
  if (rang < 1) return [html, ""];
  return [html.slice(0, positions[rang]), html.slice(positions[rang])];
}

/**
 * Les boutons d'estimation repris du WordPress mènent au formulaire de la page, sans la
 * quitter. Les autres liens (Vendre, Contact) ne changent pas.
 */
export function ctaVersFormulaire(html: string): string {
  return html.replace(
    /(<p class="prose-cta"><a class="btn btn--primary" href=")\/estimer-un-immeuble\/(")/g,
    "$1#estimer$2",
  );
}
