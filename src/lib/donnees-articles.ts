import type { Vente } from "./biens";
import type { Chiffres } from "./chiffres";
import type { Historique } from "./barometre";
import { CODE_PARIS } from "./dvf-immeubles";
import { nombre } from "./site";

/**
 * Nos chiffres dans les articles (MAV, 23/11/2026 : « oui tu peux me préparer cela »). Depuis mars 2026,
 * les articles perdent leurs clics alors que leurs positions tiennent : Google et les assistants
 * répondent à la place de la page. Ce qu'ils ne peuvent pas inventer, ce sont nos chiffres. Chaque
 * article de la liste reçoit, avant son dernier intertitre, une section de chiffres tirés de nos ventes
 * publiées, des recherches du BO et de DVF (baromètre), avec leur source et leur date, en phrases
 * qu'un assistant peut citer telles quelles. Les chiffres se recalculent seuls à chaque vente publiée.
 *
 * Règles : pas de nombre de ventes (MAV, 09/11/2026 : « moins de 50, pas exceptionnel ») ; une ligne
 * de tableau seulement à partir de cinq ventes ; les murs commerciaux sont écartés.
 */

const NBSP = " ";
const MIN_VENTES = 5;
const ARTICLES: Record<string, "estimer" | "vendre"> = {
  "comment-estimer-un-immeuble-de-rapport": "estimer",
  "comment-vendre-un-immeuble-de-rapport": "vendre",
};
export const articleAvecDonnees = (slug: string) => slug in ARTICLES;

const pct = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}${NBSP}%`;
const euros = (n: number) => `${nombre(Math.round(n))}${NBSP}€`;
const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function mediane(xs: number[]): number | null {
  if (!xs.length) return null;
  const t = [...xs].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
}
const estMurs = (v: Vente) => /murs|local d.activit|local commercial|entrep/i.test(`${v.type ?? ""} ${v.titre ?? ""}`);
const IDF_HORS_PARIS = new Set(["77", "78", "91", "92", "93", "94", "95"]);
const PARIS_PC = new Set(["75", "92", "93", "94"]);

/** Une ligne par zone : médianes à partir de cinq ventes, sinon rien. */
function zone(vs: Vente[]) {
  const rdt = vs.map((v) => Number(v.rendement)).filter((x) => x > 0);
  const m2 = vs.filter((v) => (v.surface ?? 0) > 0).map((v) => v.prix / (v.surface as number));
  const delais = vs.map((v) => v.delaiOffreJours ?? 0).filter((x) => x > 0);
  return {
    rdt: rdt.length >= MIN_VENTES ? mediane(rdt) : null,
    rdtMin: rdt.length >= MIN_VENTES ? Math.min(...rdt) : null,
    rdtMax: rdt.length >= MIN_VENTES ? Math.max(...rdt) : null,
    m2: m2.length >= MIN_VENTES ? mediane(m2) : null,
    delai: delais.length >= MIN_VENTES ? mediane(delais) : null,
  };
}

const ligne = (titre: string, sous: string, cellules: (string | null)[]) =>
  `<tr><th scope="row">${titre}<span class="barometre__sous">${sous}</span></th>${cellules.map((c) => `<td>${c ?? "–"}</td>`).join("")}</tr>`;
const tableau = (caption: string, entetes: string[], corps: string) =>
  `<div class="barometre barometre--donnees"><table><caption>${caption}</caption><thead><tr>${entetes.map((e) => `<th scope="col">${e}</th>`).join("")}</tr></thead><tbody>${corps}</tbody></table></div>`;

function blocEstimer(ventes: Vente[], h: Historique, maj: string): string | null {
  const paris = (h.get(CODE_PARIS) ?? []).filter((a) => a.prixM2Median);
  const d = paris[paris.length - 1];
  const idf = zone(ventes.filter((v) => IDF_HORS_PARIS.has(v.dept)));
  const reg = zone(ventes.filter((v) => !IDF_HORS_PARIS.has(v.dept) && v.dept !== "75"));
  const ecarts = ventes.map((v) => v.ecartEstimation).filter((x): x is number => x != null && Number.isFinite(x));
  const ecart = ecarts.length >= MIN_VENTES ? mediane(ecarts) : null;
  const lignes = [
    d ? ligne(`Paris, en bloc, ${d.annee}`, "Données publiques DVF, notre calcul", [euros(d.prixM2Median as number), d.rendement ? `${pct(d.rendement)}<span class="barometre__sous">théorique</span>` : null]) : "",
    idf.m2 || idf.rdt ? ligne("Île-de-France hors Paris", "Nos ventes", [idf.m2 ? euros(idf.m2) : null, idf.rdt ? pct(idf.rdt) : null]) : "",
    reg.m2 || reg.rdt ? ligne("Région", "Nos ventes", [reg.m2 ? euros(reg.m2) : null, reg.rdt ? pct(reg.rdt) : null]) : "",
  ].join("");
  if (!lignes) return null;
  const phrases = [
    d && d.decote != null && d.decote < 0
      ? `À Paris en ${d.annee}, un immeuble entier vendu en bloc s’est vendu ${euros(d.prixM2Median as number)} le m² en médiane, soit ${pct(Math.abs(d.decote))} de moins qu’un appartement vendu seul la même année. Un immeuble entier s’achète sur son rendement, pas au prix d’un appartement.`
      : null,
    idf.rdt && reg.rdt
      ? `Hors de Paris, les immeubles de rapport que nous avons vendus l’ont été sur un rendement brut médian de ${pct(idf.rdt)} en Île-de-France et de ${pct(reg.rdt)} en région${reg.rdtMin && reg.rdtMax ? `, de ${pct(reg.rdtMin)} à ${pct(reg.rdtMax)} selon la ville, l’état et l’occupation` : ""}.`
      : null,
    ecart != null && ecart > 0
      ? `Sur nos ventes, la meilleure offre reçue dépasse notre estimation de ${pct(ecart)} en médiane.`
      : null,
  ].filter(Boolean);
  return (
    `<h2 id="nos-chiffres">Ce que montrent les ventes réelles</h2>` +
    `<p>Pour situer le prix d’un immeuble de rapport, voici les prix au m² et les rendements constatés sur des ventes réelles : les immeubles entiers vendus à Paris, d’après les actes publiés par l’État, et les immeubles que France Immeuble a vendus lui-même en Île-de-France et en région.</p>` +
    tableau("Prix et rendements des immeubles vendus", ["Immeubles vendus", "Prix médian au m²", "Rendement brut médian"], lignes) +
    phrases.map((p) => `<p>${p}</p>`).join("") +
    `<p class="article-source">Sources : DVF (direction générale des Finances publiques), immeubles de plus de cinq logements vendus en un seul acte, calcul France Immeuble, détaillé dans notre <a href="/prix-immeuble-de-rapport-paris/">baromètre des prix à Paris</a> ; ventes réalisées par France Immeuble, publiées dans <a href="/immeubles-vendus/">nos immeubles vendus</a>. Rendement brut : loyer annuel hors charges divisé par le prix. Chiffres mis à jour le ${echapper(maj)}.</p>`
  );
}

function blocVendre(ventes: Vente[], ch: Chiffres, maj: string): string | null {
  const proche = zone(ventes.filter((v) => PARIS_PC.has(v.dept)));
  const loin = zone(ventes.filter((v) => !PARIS_PC.has(v.dept)));
  const tout = zone(ventes);
  const profils = [
    ["Investisseurs", "Un loyer sûr, au rendement du secteur", ch.recherchesInvestisseur],
    ["Marchands de biens", "Un immeuble à améliorer ou à découper", ch.recherchesMarchand],
    ["Investisseurs patrimoniaux", "Un placement familial, sur le long terme", ch.recherchesPatrimonial],
  ] as const;
  const lignesDelai = [
    proche.delai ? ligne("Paris et petite couronne", "Nos ventes", [`${Math.round(proche.delai)}${NBSP}jours`]) : "",
    loin.delai ? ligne("Grande couronne et région", "Nos ventes", [`${Math.round(loin.delai)}${NBSP}jours`]) : "",
  ].join("");
  const phrases = [
    tout.delai
      ? `Sur les immeubles de rapport vendus par France Immeuble, la première offre est arrivée ${Math.round(tout.delai)} jours après le début de la commercialisation, en médiane${proche.delai && loin.delai ? ` : ${Math.round(proche.delai)} jours à Paris et en petite couronne, ${Math.round(loin.delai)} jours en grande couronne et en région` : ""}. Il faut ensuite compter le compromis, puis l’acte chez le notaire.`
      : null,
    `Notre base compte ${nombre(ch.investisseurs)} acheteurs d’immeubles. Un immeuble loué au prix du marché trouve le plus souvent son meilleur acheteur chez un investisseur ; un immeuble mal loué ou à gros travaux intéresse d’abord les marchands de biens.`,
  ].filter(Boolean);
  return (
    `<h2 id="nos-chiffres">Combien de temps pour vendre, et à qui</h2>` +
    phrases.map((p) => `<p>${p}</p>`).join("") +
    (lignesDelai ? tableau("Délai avant la première offre", ["Où", "Délai médian"], lignesDelai) : "") +
    tableau(
      "Les recherches d’immeubles dans notre base",
      ["Profil d’acheteur", "Recherches enregistrées"],
      profils.map(([t, s, n]) => ligne(t, s, [nombre(n)])).join(""),
    ) +
    `<p class="article-source">Sources : ventes réalisées par France Immeuble et publiées dans <a href="/immeubles-vendus/">nos immeubles vendus</a> ; recherches d’acheteurs enregistrées dans notre base, mises à jour deux fois par jour. Chiffres mis à jour le ${echapper(maj)}.</p>`
  );
}

/** Insère la section avant le dernier intertitre de l'article (souvent son appel à l'action). */
export function avecDonnees(html: string, slug: string, ventes: Vente[], ch: Chiffres, h: Historique, maj: string): string {
  const type = ARTICLES[slug];
  if (!type) return html;
  const vs = ventes.filter((v) => !estMurs(v));
  const bloc = type === "estimer" ? blocEstimer(vs, h, maj) : blocVendre(vs, ch, maj);
  if (!bloc) return html;
  const i = html.lastIndexOf("<h2");
  return i > 0 ? html.slice(0, i) + bloc + html.slice(i) : html + bloc;
}
