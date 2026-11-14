import { CODE_PARIS } from "./dvf-immeubles";
import { decotePct } from "./immeubles-dvf-lecture";
import { nombre } from "./site";
import { configSitePublique } from "./supabase-site";

/**
 * Le baromètre des prix des immeubles de rapport à Paris (lot 113, MAV, 14/11/2026 : « Go article
 * 3 années et on continuera sur plusieurs années sans effacer les précédentes et on fera des
 * tableaux d'évolution »).
 *
 * L'article est un article du blog comme les autres (`content/articles.json`), à la racine du site.
 * Son texte porte trois emplacements que la page remplit avec les chiffres de la base :
 *   <div data-barometre="paris"></div>           tout Paris, une ligne par année
 *   <p data-barometre="resume"></p>              la première et la dernière année, en phrases
 *   <div data-barometre="arrondissements"></div> les vingt arrondissements, une colonne par année
 * Toutes les années de `marche_immeubles` y sont, de la plus ancienne à la plus récente : la tâche
 * mensuelle n'en efface aucune, et une année nouvelle ajoute une ligne et une colonne d'elle-même.
 * Rien que des agrégats (conditions de réutilisation de DVF) : un nombre de ventes et des médianes.
 */
export const SLUG_BAROMETRE = "prix-immeuble-de-rapport-paris";

/** Un prix n'est publié qu'à partir de trois ventes dans l'année, comme sur la page Paris. */
export const VENTES_MIN_PRIX = 3;
/** De trois à quatre ventes, le prix est marqué « à lire avec prudence ». */
export const VENTES_PRUDENCE = 5;

export type AnneeMarche = {
  annee: number;
  nbVentes: number;
  prixM2Median: number | null;
  prixMedian: number | null;
  surfaceMediane: number | null;
  appartPrixM2Median: number | null;
  /** Décote face aux appartements, en % entier signé (−28). */
  decote: number | null;
  majLe: string | null;
};

/** Par code INSEE, les années de la plus ancienne à la plus récente. */
export type Historique = Map<string, AnneeMarche[]>;

const COLONNES = "code_insee,annee,nb_ventes,prix_m2_median,prix_median,surface_mediane,appart_prix_m2_median,maj_le";
const num = (v: unknown) => (v == null || v === "" ? null : Number(v));

export const CODES_ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => `751${String(i + 1).padStart(2, "0")}`);

/** Toutes les années en base pour tout Paris et ses vingt arrondissements. Vide si la base ne répond pas. */
export async function historiqueParis(): Promise<Historique> {
  const out: Historique = new Map();
  const cfg = configSitePublique();
  if (!cfg) return out;
  const codes = [CODE_PARIS, ...CODES_ARRONDISSEMENTS];
  try {
    const r = await fetch(
      `${cfg.url}/rest/v1/marche_immeubles?select=${COLONNES}&code_insee=in.(${codes.join(",")})&order=annee.asc`,
      { headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` }, next: { revalidate: 86400, tags: ["marche"] }, signal: AbortSignal.timeout(4000) },
    );
    if (!r.ok) return out;
    const lignes = (await r.json()) as Record<string, unknown>[];
    for (const l of lignes) {
      const code = String(l.code_insee);
      const prixM2Median = num(l.prix_m2_median);
      const appartPrixM2Median = num(l.appart_prix_m2_median);
      const a: AnneeMarche = {
        annee: Number(l.annee),
        nbVentes: Number(l.nb_ventes) || 0,
        prixM2Median,
        prixMedian: num(l.prix_median),
        surfaceMediane: num(l.surface_mediane),
        appartPrixM2Median,
        decote: decotePct(prixM2Median, appartPrixM2Median),
        majLe: typeof l.maj_le === "string" ? l.maj_le : null,
      };
      out.set(code, [...(out.get(code) ?? []), a]);
    }
  } catch {
    return new Map();
  }
  return out;
}

// --- Mise en forme ---------------------------------------------------------------------------

const NBSP = " ";
const MOINS = "−";
const euros = (n: number) => `${nombre(Math.round(n))}${NBSP}€`;
const pct = (n: number) => `${n < 0 ? MOINS : n > 0 ? "+" : ""}${Math.abs(n)}${NBSP}%`;
const variation = (de: number, a: number) => Math.round((a / de - 1) * 100);
const millions = (n: number) => `${(n / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}${NBSP}M€`;
const ventes = (n: number) => (n === 0 ? "aucune vente" : `${nombre(n)}${NBSP}vente${n > 1 ? "s" : ""}`);
const arrondissement = (code: string) => {
  const n = Number(code.slice(3));
  return n === 1 ? "1er" : `${n}e`;
};
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « a baissé de 12 % », « a augmenté de 3 % », « est resté stable ». */
function evolue(de: number, a: number, feminin = false): string {
  const v = variation(de, a);
  if (v === 0) return feminin ? "est restée stable" : "est resté stable";
  return v < 0 ? `a baissé de ${Math.abs(v)}${NBSP}%` : `a augmenté de ${v}${NBSP}%`;
}

/** Une double en-tête : le libellé long sur ordinateur, le court au téléphone. */
const tete = (long: string, court: string) =>
  `<span class="barometre__long">${long}</span><span class="barometre__court" aria-hidden="true">${court}</span>`;

function tableauParis(annees: AnneeMarche[]): string {
  const lignes = annees
    .map((a, i) => {
      const avant = annees[i - 1];
      const surUnAn =
        avant?.prixM2Median && a.prixM2Median
          ? `<span class="barometre__sous">${pct(variation(avant.prixM2Median, a.prixM2Median))} sur un an</span>`
          : "";
      return (
        `<tr><th scope="row">${a.annee}</th>` +
        `<td>${nombre(a.nbVentes)}</td>` +
        `<td><strong>${a.prixM2Median ? euros(a.prixM2Median) : "–"}</strong>${surUnAn}</td>` +
        `<td>${a.appartPrixM2Median ? euros(a.appartPrixM2Median) : "–"}</td>` +
        `<td>${a.decote != null ? pct(a.decote) : "–"}</td></tr>`
      );
    })
    .join("");
  return (
    `<div class="barometre"><table>` +
    `<caption>Immeubles de rapport vendus en bloc à Paris, d’après DVF</caption>` +
    `<thead><tr><th scope="col">Année</th>` +
    `<th scope="col">${tete("Immeubles vendus", "Ventes")}</th>` +
    `<th scope="col">${tete("Prix médian au m²", "Immeubles")}</th>` +
    `<th scope="col">${tete("Appartements au m²", "Appart.")}</th>` +
    `<th scope="col">Décote</th></tr></thead>` +
    `<tbody>${lignes}</tbody></table></div>` +
    `<p class="barometre__note">Prix médian au m² des immeubles vendus en bloc, puis des appartements vendus seuls à Paris la même année. La décote est l’écart entre les deux.</p>`
  );
}

function tableauArrondissements(h: Historique, annees: number[]): string {
  const cellule = (a: AnneeMarche | undefined) => {
    // Pas de ligne en base pour cette année : on ne sait pas, on ne dit pas « aucune vente ».
    if (!a) return `<td class="barometre__vide">–</td>`;
    if (a.nbVentes < VENTES_MIN_PRIX || !a.prixM2Median) {
      return `<td class="barometre__vide">–<span class="barometre__sous">${ventes(a.nbVentes)}</span></td>`;
    }
    const prudence = a.nbVentes < VENTES_PRUDENCE;
    return (
      `<td${prudence ? ' class="barometre__prudence"' : ""}>${euros(a.prixM2Median)}${prudence ? "*" : ""}` +
      `<span class="barometre__sous">${ventes(a.nbVentes)}</span></td>`
    );
  };
  const ligne = (code: string, libelle: string, classe = "") => {
    const parAnnee = new Map((h.get(code) ?? []).map((a) => [a.annee, a]));
    return `<tr${classe ? ` class="${classe}"` : ""}><th scope="row">${libelle}</th>${annees.map((y) => cellule(parAnnee.get(y))).join("")}</tr>`;
  };
  const corps = CODES_ARRONDISSEMENTS.map((c) => ligne(c, arrondissement(c))).join("") + ligne(CODE_PARIS, "Paris", "barometre__total");
  return (
    `<div class="barometre barometre--arr"><table>` +
    `<caption>Prix médian au m² des immeubles vendus en bloc, par arrondissement</caption>` +
    `<thead><tr><th scope="col">${tete("Arrondissement", "Arr.")}</th>${annees.map((y) => `<th scope="col">${y}</th>`).join("")}</tr></thead>` +
    `<tbody>${corps}</tbody></table></div>` +
    `<p class="barometre__note">Un prix n’est donné qu’à partir de trois ventes dans l’année. * De trois à quatre ventes : à lire avec prudence.</p>`
  );
}

function resume(paris: AnneeMarche[]): string {
  const premiere = paris[0];
  const derniere = paris[paris.length - 1];
  if (!premiere || !derniere || premiere === derniere || !premiere.prixM2Median || !derniere.prixM2Median) return "";
  const phrases = [
    `De ${premiere.annee} à ${derniere.annee}, le prix médian au m² des immeubles vendus en bloc à Paris ${evolue(premiere.prixM2Median, derniere.prixM2Median)}, de ${euros(premiere.prixM2Median)} à ${euros(derniere.prixM2Median)}.`,
  ];
  if (premiere.appartPrixM2Median && derniere.appartPrixM2Median) {
    phrases.push(
      `Sur la même période, celui des appartements vendus seuls ${evolue(premiere.appartPrixM2Median, derniere.appartPrixM2Median)}, de ${euros(premiere.appartPrixM2Median)} à ${euros(derniere.appartPrixM2Median)}.`,
    );
  }
  if (premiere.decote != null && derniere.decote != null && premiere.decote < 0 && derniere.decote < 0) {
    phrases.push(
      `Un immeuble se vendait ${Math.abs(premiere.decote)}${NBSP}% sous le prix au m² des appartements en ${premiere.annee}, ${Math.abs(derniere.decote)}${NBSP}% en ${derniere.annee}.`,
    );
  }
  phrases.push(`Le nombre de ventes d’immeubles est passé de ${nombre(premiere.nbVentes)} à ${nombre(derniere.nbVentes)}.`);
  if (premiere.prixMedian && derniere.prixMedian && premiere.surfaceMediane && derniere.surfaceMediane) {
    phrases.push(
      `La surface médiane des ventes était de ${nombre(Math.round(derniere.surfaceMediane))}${NBSP}m² et leur prix médian de ${millions(derniere.prixMedian)} en ${derniere.annee}, contre ${nombre(Math.round(premiere.surfaceMediane))}${NBSP}m² et ${millions(premiere.prixMedian)} en ${premiere.annee}.`,
    );
  }
  const maj = derniere.majLe ? new Date(derniere.majLe) : null;
  if (maj && !Number.isNaN(maj.getTime())) {
    phrases.push(`Chiffres relevés dans DVF en ${MOIS[maj.getUTCMonth()]} ${maj.getUTCFullYear()}.`);
  }
  return phrases.join(" ");
}

/** Les trois chiffres en tête de l'article : la dernière année de tout Paris. */
export function reperesBarometre(h: Historique): { valeur: string; libelle: string }[] {
  const paris = h.get(CODE_PARIS) ?? [];
  const d = paris[paris.length - 1];
  if (!d) return [];
  return [
    { valeur: nombre(d.nbVentes), libelle: `immeubles vendus en bloc à Paris en ${d.annee}` },
    ...(d.prixM2Median ? [{ valeur: euros(d.prixM2Median), libelle: `le m², prix médian en ${d.annee}` }] : []),
    ...(d.decote != null && d.decote < 0 ? [{ valeur: `${Math.abs(d.decote)}${NBSP}%`, libelle: "sous le prix des appartements" }] : []),
  ];
}

/**
 * Remplit les trois emplacements du texte. Sans chiffres en base (base injoignable), les tableaux
 * cèdent la place à une phrase qui renvoie à la page Paris : l'article reste lisible.
 */
export function remplirBarometre(html: string, h: Historique): string {
  const paris = h.get(CODE_PARIS) ?? [];
  const annees = [...new Set([...h.values()].flat().map((a) => a.annee))].sort((a, b) => a - b);
  const sansChiffres =
    '<p class="barometre__note">Les chiffres de ce baromètre ne sont pas disponibles pour le moment. Le prix médian des immeubles de la dernière année, par arrondissement, est sur notre page <a href="/vendre-un-immeuble/paris/">Vendre un immeuble à Paris</a>.</p>';
  return html
    .replace('<div data-barometre="paris"></div>', paris.length ? tableauParis(paris) : sansChiffres)
    .replace('<p data-barometre="resume"></p>', paris.length > 1 ? `<p>${resume(paris)}</p>` : "")
    .replace('<div data-barometre="arrondissements"></div>', annees.length ? tableauArrondissements(h, annees) : "");
}
