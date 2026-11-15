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

/**
 * Un bouton dans le texte de chaque article (MAV, 15/11/2026, sur le baromètre : « J'ai vu qu'il y avait
 * un bouton sur la page, c'est top. On peut pas en mettre un sur tous les articles de blog »). Un article
 * qui en a déjà un (repris du WordPress ou écrit avec lui) ne change pas. Sinon le bouton se place avant
 * le dernier intertitre quand celui-ci vient après l'encart du milieu (quatre intertitres ou plus), avant
 * le deuxième avec trois intertitres, et en fin de texte sinon : jamais collé à l'encart.
 */
export function boutonDansLeTexte(html: string, cible: Cible): string {
  if (html.includes("prose-cta")) return html;
  const bouton = `<p class="prose-cta"><a class="btn btn--primary" href="#estimer">${cible === "acheteur" ? "Déposer ma recherche" : "Estimer mon immeuble"}</a></p>\n\n`;
  const positions = [...html.matchAll(/<h2[\s>]/g)].map((m) => m.index ?? 0);
  const ou = positions.length >= 4 ? positions[positions.length - 1] : positions.length === 3 ? positions[1] : -1;
  return ou < 0 ? `${html}\n\n${bouton.trim()}` : html.slice(0, ou) + bouton + html.slice(ou);
}
