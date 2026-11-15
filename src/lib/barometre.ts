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
  /** Loyer de marché des appartements de la même année (ANIL), €/m² par mois (lot 114). */
  loyerM2: number | null;
  /** Rendement théorique de l'année, en % : loyer de l'année × 12 ÷ prix médian au m² des immeubles. */
  rendement: number | null;
  majLe: string | null;
};

/** Par code INSEE, les années de la plus ancienne à la plus récente. */
export type Historique = Map<string, AnneeMarche[]>;

const COLONNES = "code_insee,annee,nb_ventes,prix_m2_median,prix_median,surface_mediane,appart_prix_m2_median,maj_le";
/** Lot 114 : le loyer de l'année. Une base d'avant la migration 0024 refuse la colonne : on relit sans. */
const COLONNES_LOYER = `${COLONNES},loyer_m2`;
const num = (v: unknown) => (v == null || v === "" ? null : Number(v));

export const CODES_ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => `751${String(i + 1).padStart(2, "0")}`);

/** Toutes les années en base pour tout Paris et ses vingt arrondissements. Vide si la base ne répond pas. */
export async function historiqueParis(): Promise<Historique> {
  const out: Historique = new Map();
  const cfg = configSitePublique();
  if (!cfg) return out;
  const codes = [CODE_PARIS, ...CODES_ARRONDISSEMENTS];
  try {
    const lire = (colonnes: string) =>
      fetch(
        `${cfg.url}/rest/v1/marche_immeubles?select=${colonnes}&code_insee=in.(${codes.join(",")})&order=annee.asc`,
        { headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` }, next: { revalidate: 86400, tags: ["marche"] }, signal: AbortSignal.timeout(4000) },
      );
    let r = await lire(COLONNES_LOYER);
    if (r.status === 400) r = await lire(COLONNES);
    if (!r.ok) return out;
    const lignes = (await r.json()) as Record<string, unknown>[];
    for (const l of lignes) {
      const code = String(l.code_insee);
      const prixM2Median = num(l.prix_m2_median);
      const appartPrixM2Median = num(l.appart_prix_m2_median);
      const loyerM2 = num(l.loyer_m2);
      const a: AnneeMarche = {
        annee: Number(l.annee),
        nbVentes: Number(l.nb_ventes) || 0,
        prixM2Median,
        prixMedian: num(l.prix_median),
        surfaceMediane: num(l.surface_mediane),
        appartPrixM2Median,
        decote: decotePct(prixM2Median, appartPrixM2Median),
        loyerM2,
        rendement: loyerM2 && prixM2Median ? (loyerM2 * 12 * 100) / prixM2Median : null,
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

const unChiffre = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** Un écart en points de pourcentage : « +0,5 pt ». */
const points = (n: number) => `${n < 0 ? MOINS : n > 0 ? "+" : ""}${unChiffre(Math.abs(n))}${NBSP}pt`;
const sous = (texte: string) => `<span class="barometre__sous">${texte}</span>`;
const surUnAn = (avant: number | null | undefined, apres: number | null | undefined) =>
  avant && apres ? sous(`${pct(variation(avant, apres))} sur un an`) : "";
const NOTE_PRUDENCE = "Un chiffre n’est donné qu’à partir de trois ventes dans l’année. * De trois à quatre ventes : à lire avec prudence.";

/**
 * Lot 114 (MAV, 15/11/2026 : « il manque les rendements […] pour les différentes années, l'évolution vs
 * les années précédentes, la décote vs le prix des apparts de l'époque. Faudra donc afficher
 * différemment ou mettre plusieurs tableaux qui expliquent différentes choses ») : six tableaux, chacun
 * sous son intertitre. Pour tout Paris, les prix (immeubles, appartements, décote) puis les loyers et le
 * rendement. Par arrondissement, une colonne par année : le prix, son évolution, la décote face aux
 * appartements de la même année, le rendement avec les loyers de la même année.
 */
function tableauParis(annees: AnneeMarche[]): string {
  const lignes = annees
    .map((a, i) => {
      const avant = annees[i - 1];
      return (
        `<tr><th scope="row">${a.annee}</th>` +
        `<td>${nombre(a.nbVentes)}</td>` +
        `<td><strong>${a.prixM2Median ? euros(a.prixM2Median) : "–"}</strong>${surUnAn(avant?.prixM2Median, a.prixM2Median)}</td>` +
        `<td>${a.appartPrixM2Median ? euros(a.appartPrixM2Median) : "–"}${surUnAn(avant?.appartPrixM2Median, a.appartPrixM2Median)}</td>` +
        `<td>${a.decote != null ? pct(a.decote) : "–"}</td></tr>`
      );
    })
    .join("");
  return (
    `<div class="barometre"><table>` +
    `<caption>Prix des immeubles de rapport vendus en bloc à Paris, d’après DVF</caption>` +
    `<thead><tr><th scope="col">Année</th>` +
    `<th scope="col">${tete("Ventes d’immeubles", "Ventes")}</th>` +
    `<th scope="col">${tete("Immeubles au m²", "Immeubles")}</th>` +
    `<th scope="col">${tete("Appartements au m²", "Appart.")}</th>` +
    `<th scope="col">Décote</th></tr></thead>` +
    `<tbody>${lignes}</tbody></table></div>` +
    `<p class="barometre__note">Prix médian au m² des immeubles vendus en bloc, puis des appartements vendus seuls à Paris la même année. La décote est l’écart entre les deux.</p>`
  );
}

function tableauParisRendement(annees: AnneeMarche[]): string {
  const avecLoyer = annees.filter((a) => a.loyerM2 != null);
  if (!avecLoyer.length) return "";
  const lignes = avecLoyer
    .map((a) => {
      const avant = annees.find((x) => x.annee === a.annee - 1);
      const rendementAvant = avant?.rendement;
      return (
        `<tr><th scope="row">${a.annee}</th>` +
        `<td>${unChiffre(a.loyerM2!)}${NBSP}€${surUnAn(avant?.loyerM2, a.loyerM2)}</td>` +
        `<td>${a.prixM2Median ? euros(a.prixM2Median) : "–"}${surUnAn(avant?.prixM2Median, a.prixM2Median)}</td>` +
        `<td><strong>${a.rendement != null ? `${unChiffre(a.rendement)}${NBSP}%` : "–"}</strong>` +
        `${rendementAvant != null && a.rendement != null ? sous(`${points(a.rendement - rendementAvant)} sur un an`) : ""}</td></tr>`
      );
    })
    .join("");
  return (
    `<div class="barometre"><table>` +
    `<caption>Loyers et rendement théorique des immeubles à Paris</caption>` +
    `<thead><tr><th scope="col">Année</th>` +
    `<th scope="col">${tete("Loyer au m² par mois", "Loyer")}</th>` +
    `<th scope="col">${tete("Prix des immeubles au m²", "Prix")}</th>` +
    `<th scope="col">${tete("Rendement théorique", "Rendement")}</th></tr></thead>` +
    `<tbody>${lignes}</tbody></table></div>` +
    `<p class="barometre__note">Loyer de marché des appartements de l’année, charges comprises (carte des loyers de l’État), moyenne des vingt arrondissements. Rendement théorique : ce loyer sur douze mois, rapporté au prix médian au m² des immeubles vendus la même année.</p>`
  );
}

type Colonne = { tete: string; valeur: (code: string) => { texte: string; prudence: boolean; sous?: string } | null };

/** Un tableau par arrondissement (et Paris en dernière ligne), une colonne par année ou par période. */
function tableauArr(caption: string, colonnes: Colonne[], note: string): string {
  if (!colonnes.length) return "";
  const cellule = (c: Colonne, code: string) => {
    const v = c.valeur(code);
    if (!v) return `<td class="barometre__vide">–</td>`;
    return `<td${v.prudence ? ' class="barometre__prudence"' : ""}><span class="barometre__val">${v.texte}${v.prudence ? "*" : ""}</span>${v.sous ? sous(v.sous) : ""}</td>`;
  };
  const ligne = (code: string, libelle: string, classe = "") =>
    `<tr${classe ? ` class="${classe}"` : ""}><th scope="row">${libelle}</th>${colonnes.map((c) => cellule(c, code)).join("")}</tr>`;
  const corps = CODES_ARRONDISSEMENTS.map((c) => ligne(c, arrondissement(c))).join("") + ligne(CODE_PARIS, "Paris", "barometre__total");
  return (
    `<div class="barometre barometre--arr"><table>` +
    `<caption>${caption}</caption>` +
    `<thead><tr><th scope="col">${tete("Arrondissement", "Arr.")}</th>${colonnes.map((c) => `<th scope="col">${c.tete}</th>`).join("")}</tr></thead>` +
    `<tbody>${corps}</tbody></table></div>` +
    `<p class="barometre__note">${note}</p>`
  );
}

/** L'année d'un code, si elle a un prix publiable (trois ventes au moins). */
const publiable = (h: Historique, code: string, annee: number) => {
  const a = (h.get(code) ?? []).find((x) => x.annee === annee);
  return a && a.nbVentes >= VENTES_MIN_PRIX && a.prixM2Median ? a : null;
};

/**
 * Lot 115 (MAV, 15/11/2026 : « sur chaque cellule l'évolution en % par rapport à l'an passé. Ça nous
 * fait un seul tableau pour deux données ») : le prix et son évolution dans la même case. L'évolution
 * n'est donnée que si l'année d'avant a aussi un prix publiable ; la dernière colonne donne l'évolution
 * sur toute la période, comme le tableau des évolutions qu'elle remplace.
 */
function tableauArrondissements(h: Historique, annees: number[]): string {
  // Lot 116 (MAV, 15/11/2026 : « Pas besoin de 2023 à 2025 et pas besoin non plus du nombre de
  // ventes ») : le prix et, dessous, son évolution sur un an, rien d'autre.
  return tableauArr(
    "Prix médian au m² des immeubles vendus en bloc et son évolution, par arrondissement",
    annees.map((y, i) => ({
      tete: String(y),
      valeur: (code) => {
        const a = publiable(h, code, y);
        if (!a) return null;
        const avant = i > 0 ? publiable(h, code, annees[i - 1]) : null;
        return {
          texte: euros(a.prixM2Median!),
          prudence: a.nbVentes < VENTES_PRUDENCE,
          sous: avant ? `${pct(variation(avant.prixM2Median!, a.prixM2Median!))} sur un an` : undefined,
        };
      },
    })),
    `Sous chaque prix, son évolution par rapport à l’année précédente, quand elle compte aussi trois ventes au moins. Dans un arrondissement, ce ne sont pas les mêmes immeubles d’une année à l’autre : lisez ces écarts comme des ordres de grandeur. ${NOTE_PRUDENCE}`,
  );
}

function tableauDecotes(h: Historique, annees: number[]): string {
  return tableauArr(
    "Décote des immeubles face aux appartements de la même année, par arrondissement",
    annees.map((y) => ({
      tete: String(y),
      valeur: (code) => {
        const a = publiable(h, code, y);
        return a && a.decote != null ? { texte: pct(a.decote), prudence: a.nbVentes < VENTES_PRUDENCE } : null;
      },
    })),
    `Écart entre le prix médian au m² des immeubles vendus en bloc et celui des appartements vendus seuls dans l’arrondissement, la même année. ${NOTE_PRUDENCE}`,
  );
}

/**
 * Lot 114 (MAV, 15/11/2026 : « pour le calcul du rendement 2023 et 2024 il faudra prendre en base les
 * loyers moyens de l'époque ») : le rendement théorique, année par année, chaque année avec ses loyers.
 */
function tableauRendements(h: Historique, annees: number[]): string {
  const avecLoyer = annees.filter((y) => [...h.values()].some((xs) => xs.some((a) => a.annee === y && a.loyerM2 != null)));
  return tableauArr(
    "Rendement théorique des immeubles, par arrondissement",
    avecLoyer.map((y) => ({
      tete: String(y),
      valeur: (code) => {
        const a = publiable(h, code, y);
        return a && a.rendement != null ? { texte: `${unChiffre(a.rendement)}${NBSP}%`, prudence: a.nbVentes < VENTES_PRUDENCE } : null;
      },
    })),
    `Loyer de marché des appartements de l’arrondissement et de l’année sur douze mois, charges comprises, rapporté au prix médian au m² des immeubles vendus la même année. Pour Paris, loyer moyen des vingt arrondissements. ${NOTE_PRUDENCE}`,
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
  if (premiere.rendement != null && derniere.rendement != null) {
    phrases.push(
      `Avec les loyers de marché de chaque année, le rendement théorique d’un immeuble est passé de ${unChiffre(premiere.rendement)}${NBSP}% en ${premiere.annee} à ${unChiffre(derniere.rendement)}${NBSP}% en ${derniere.annee}.`,
    );
  }
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
    .replace('<div data-barometre="arrondissements"></div>', annees.length ? tableauArrondissements(h, annees) : "")
    .replace('<div data-barometre="paris-rendement"></div>', paris.length ? tableauParisRendement(paris) : "")
    .replace('<div data-barometre="decotes"></div>', annees.length ? tableauDecotes(h, annees) : "")
    .replace('<div data-barometre="rendements"></div>', annees.length ? tableauRendements(h, annees) : "");
}
