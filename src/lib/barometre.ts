import { CODE_PARIS } from "./dvf-immeubles";
import { decotePct, noteFiabilite } from "./immeubles-dvf-lecture";
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
  /** Premier et troisième quartiles du prix au m² (dès cinq ventes), pour la note de fiabilité (lot 118). */
  prixM2Bas: number | null;
  prixM2Haut: number | null;
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

const COLONNES = "code_insee,annee,nb_ventes,prix_m2_median,prix_m2_bas,prix_m2_haut,prix_median,surface_mediane,appart_prix_m2_median,maj_le";
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
        prixM2Bas: num(l.prix_m2_bas),
        prixM2Haut: num(l.prix_m2_haut),
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

/**
 * Les années encore incomplètes de tout Paris (MAV, 23/11/2026 : « les données du premier semestre 2026 »),
 * tirées du fichier brut de DVF, et la même période de l'année d'avant pour comparer à mois égaux.
 */
export type SemestreParis = { annee: number; mois: number; nbVentes: number; prixM2Median: number | null; appartPrixM2Median: number | null; decote: number | null };

export async function semestresParis(): Promise<SemestreParis[]> {
  const cfg = configSitePublique();
  if (!cfg) return [];
  try {
    const r = await fetch(
      `${cfg.url}/rest/v1/marche_immeubles_semestre?select=annee,mois,nb_ventes,prix_m2_median,appart_prix_m2_median&code_insee=eq.${CODE_PARIS}&order=annee.asc`,
      { headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` }, next: { revalidate: 86400, tags: ["marche"] }, signal: AbortSignal.timeout(4000) },
    );
    if (!r.ok) return [];
    return ((await r.json()) as Record<string, unknown>[]).map((l) => {
      const prixM2Median = num(l.prix_m2_median);
      const appartPrixM2Median = num(l.appart_prix_m2_median);
      return { annee: Number(l.annee), mois: Number(l.mois), nbVentes: Number(l.nb_ventes) || 0, prixM2Median, appartPrixM2Median, decote: decotePct(prixM2Median, appartPrixM2Median) };
    });
  } catch {
    return [];
  }
}

/** L'année incomplète à publier (absente des années entières) et la même période un an plus tôt. */
function semestreAPublier(paris: AnneeMarche[], semestres: SemestreParis[]) {
  const entieres = new Set(paris.map((a) => a.annee));
  const s = semestres.filter((x) => !entieres.has(x.annee) && x.prixM2Median && x.nbVentes >= VENTES_MIN_PRIX).sort((a, b) => b.annee - a.annee)[0];
  if (!s) return null;
  const avant = semestres.find((x) => x.annee === s.annee - 1 && x.mois === s.mois) ?? null;
  return { s, avant };
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
function tableauParis(annees: AnneeMarche[], semestres: SemestreParis[] = []): string {
  const sp = semestreAPublier(annees, semestres);
  const ligneSemestre = sp
    ? `<tr class="barometre__provisoire"><th scope="row">${sp.s.annee}<span class="barometre__sous">provisoire</span></th>` +
      `<td>${nombre(sp.s.nbVentes)}</td>` +
      `<td><strong>${euros(sp.s.prixM2Median as number)}</strong>${sp.avant?.prixM2Median ? sous(`${pct(variation(sp.avant.prixM2Median, sp.s.prixM2Median as number))} sur un an`) : ""}</td>` +
      `<td>${sp.s.appartPrixM2Median ? euros(sp.s.appartPrixM2Median) : "–"}${sp.avant?.appartPrixM2Median && sp.s.appartPrixM2Median ? sous(`${pct(variation(sp.avant.appartPrixM2Median, sp.s.appartPrixM2Median))} sur un an`) : ""}</td>` +
      `<td>${sp.s.decote != null ? pct(sp.s.decote) : "–"}</td></tr>`
    : "";
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
    `<tbody>${lignes}${ligneSemestre}</tbody></table></div>` +
    `<p class="barometre__note">Prix médian au m² des immeubles vendus en bloc, puis des appartements vendus seuls à Paris la même année. La décote est l’écart entre les deux.${
      sp ? ` ${sp.s.annee}&nbsp;: ventes de janvier à ${sp.s.mois === 6 ? "juin" : "la fin du mois " + sp.s.mois}, publiées par l’État en octobre ${sp.s.annee}&nbsp;; l’évolution sur un an les compare aux mêmes mois de ${sp.s.annee - 1}. Un chiffre provisoire.` : ""
    }</p>`
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
function tableauArr(caption: string, colonnes: Colonne[], note: string, apresLibelle: (code: string) => string = () => ""): string {
  if (!colonnes.length) return "";
  const cellule = (c: Colonne, code: string) => {
    const v = c.valeur(code);
    if (!v) return `<td class="barometre__vide">–</td>`;
    return `<td${v.prudence ? ' class="barometre__prudence"' : ""}><span class="barometre__val">${v.texte}${v.prudence ? "*" : ""}</span>${v.sous ? sous(v.sous) : ""}</td>`;
  };
  const ligne = (code: string, libelle: string, classe = "") =>
    `<tr${classe ? ` class="${classe}"` : ""}><th scope="row">${libelle}${apresLibelle(code)}</th>${colonnes.map((c) => cellule(c, code)).join("")}</tr>`;
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
/**
 * La fiabilité d'un arrondissement, une seule note pour toutes les années (lot 119, MAV, 15/11/2026 :
 * « Y a trop d'étoiles, on peut pas les mettre juste à côté de l'arrondissement en moyenne des 3 années
 * et au survol on met juste les ventes pour les 3 années »). Moyenne des notes des années qui ont un prix
 * publié (règle de la page Paris, `noteFiabilite`), arrondie vers le bas à la demie ; le nombre de ventes
 * de chaque année s'affiche au survol ou au toucher. Même dessin d'étoiles que la page Paris.
 */
function etoilesArrondissement(h: Historique, code: string, annees: number[]): string {
  const notes = annees.map((y) => publiable(h, code, y)).filter((a): a is AnneeMarche => a != null).map((a) => noteFiabilite(a)).filter((n): n is NonNullable<typeof n> => n != null);
  if (!notes.length) return "";
  const note = Math.max(1, Math.ceil(notes.reduce((t, n) => t + n, 0) / notes.length - 0.5));
  const ventesAn = annees.map((y) => `${nombre((h.get(code) ?? []).find((a) => a.annee === y)?.nbVentes ?? 0)} en ${y}`);
  const bulle = `Ventes : ${ventesAn.slice(0, -1).join(", ")} et ${ventesAn[ventesAn.length - 1]}`;
  const etoile = (pleine: boolean) =>
    `<svg viewBox="0 0 24 24" width="12" height="12"${pleine ? ' class="est-pleine"' : ""}><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/></svg>`;
  return (
    `<span class="barometre__fiab" tabindex="0" data-ventes="${bulle}" aria-label="Fiabilité ${note} sur 3. ${bulle}">` +
    [1, 2, 3].map((i) => etoile(i <= note)).join("") +
    `</span>`
  );
}

function tableauArrondissements(h: Historique, annees: number[]): string {
  // Lots 116, 118 et 119 (MAV, 15/11/2026) : le prix et son évolution ; la fiabilité à côté de l'arrondissement.
  return tableauArr(
    "Prix médian au m² des immeubles vendus en bloc et son évolution, par arrondissement",
    annees.map((y, i) => ({
      tete: String(y),
      valeur: (code) => {
        const a = publiable(h, code, y);
        if (!a) return null;
        const avant = i > 0 ? publiable(h, code, annees[i - 1]) : null;
        return { texte: euros(a.prixM2Median!), prudence: false, sous: avant ? pct(variation(avant.prixM2Median!, a.prixM2Median!)) : undefined };
      },
    })),
    `Sous chaque prix, son évolution par rapport à l’année précédente, quand celle-ci compte aussi trois ventes au moins. Les étoiles donnent la fiabilité des prix de l’arrondissement, en moyenne sur les années publiées. Il y en a trois quand les ventes sont nombreuses et leurs prix proches, une quand elles sont rares. Le nombre de ventes de chaque année s’affiche au survol des étoiles. Un prix n’est donné qu’à partir de trois ventes dans l’année.`,
    (code) => etoilesArrondissement(h, code, annees),
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

function resume(paris: AnneeMarche[], semestres: SemestreParis[] = []): string {
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
  const sp = semestreAPublier(paris, semestres);
  if (sp) {
    phrases.push(
      `En ${sp.s.annee}, sur les ${nombre(sp.s.nbVentes)} ventes publiées à ce jour, le prix médian était de ${euros(sp.s.prixM2Median as number)} le m²${
        sp.avant?.prixM2Median ? `, contre ${euros(sp.avant.prixM2Median)} sur les mêmes mois de ${sp.s.annee - 1}` : ""
      }. C’est un premier chiffre, à confirmer avec le reste de l’année.`,
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
 * Le chapeau du hero du baromètre (MAV, 15/11/2026 : « fais peut-être en sorte d'avoir un hero plus
 * fourni »). Il dit ce que la page contient ; les chiffres eux-mêmes sont juste dessous.
 */
export function chapeauBarometre(h: Historique): string | null {
  const paris = (h.get(CODE_PARIS) ?? []).filter((a) => a.prixM2Median);
  if (!paris.length) return null;
  return `Le prix au m², les loyers et le rendement des immeubles vendus en bloc, pour tout Paris et pour chaque arrondissement, depuis ${paris[0].annee}. Calculés sur les ventes enregistrées par l’État et mis à jour chaque année.`;
}

/**
 * Remplit les trois emplacements du texte. Sans chiffres en base (base injoignable), les tableaux
 * cèdent la place à une phrase qui renvoie à la page Paris : l'article reste lisible.
 */
type Serie = { cle: string; nom: string; val: (a: AnneeMarche) => number | null };

/**
 * Une courbe année par année, une seule échelle (lot 117, MAV, 15/11/2026 : « on a une courbe
 * normalement sur l'article »). SVG calculé au serveur, couleurs et polices par les classes du site ;
 * le tableau qui suit donne les mêmes chiffres en texte. Chaque nouvelle année ajoute un point. Une
 * série seule n'a pas de légende : la légende de la figure la nomme.
 */
function courbe(paris: AnneeMarche[], titre: string, series: Serie[], pas: number, ecrire: (v: number) => string, axe: (v: number) => string, resume: string): string {
  const annees = paris.filter((a) => series.every((s) => s.val(a) != null));
  if (annees.length < 2) return "";
  const valeurs = annees.flatMap((a) => series.map((s) => s.val(a)!));
  const marge = (Math.max(...valeurs) - Math.min(...valeurs)) * 0.25 || pas;
  const bas = Math.floor((Math.min(...valeurs) - marge) / pas) * pas;
  const haut = Math.ceil((Math.max(...valeurs) + marge) / pas) * pas;
  const [L, R, T, B, W, H] = [46, 30, 22, 30, 400, 240];
  const x = (i: number) => L + ((W - L - R) * i) / (annees.length - 1);
  const y = (v: number) => T + ((H - T - B) * (haut - v)) / (haut - bas);
  let svg = "";
  for (let i = 0, v = bas; v <= haut + pas / 1000; i++, v = bas + i * pas)
    svg += `<line class="courbe__grille" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="courbe__axe" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${axe(v)}</text>`;
  annees.forEach((a, i) => (svg += `<text class="courbe__axe" x="${x(i)}" y="${H - 8}" text-anchor="middle">${a.annee}</text>`));
  for (const s of series) {
    const pts = annees.map((a, i) => [x(i), y(s.val(a)!)] as const);
    svg += `<polyline class="courbe__ligne courbe__ligne--${s.cle}" points="${pts.map((p) => p.join(",")).join(" ")}"/>`;
    annees.forEach((a, i) => {
      const v = s.val(a)!;
      svg += `<circle class="courbe__point courbe__point--${s.cle}" cx="${pts[i][0]}" cy="${pts[i][1]}" r="4"><title>${a.annee} : ${ecrire(v)} (${s.nom.toLowerCase()})</title></circle>`;
      if (i === 0 || i === annees.length - 1) {
        // L'étiquette se met du côté où la ligne ne passe pas : dessous quand la voisine est plus haute.
        const voisine = pts[i === 0 ? 1 : i - 1][1];
        const dy = voisine < pts[i][1] - 4 ? 20 : -10;
        svg += `<text class="courbe__valeur" x="${pts[i][0]}" y="${pts[i][1] + dy}" text-anchor="${i === 0 ? "start" : "end"}">${ecrire(v)}</text>`;
      }
    });
  }
  const legende =
    series.length > 1
      ? `<ul class="courbe__legende">${series.map((s) => `<li><span class="courbe__cle courbe__cle--${s.cle}" aria-hidden="true"></span>${s.nom}</li>`).join("")}</ul>`
      : "";
  return (
    `<figure class="barometre-courbe"><figcaption>${titre}, de ${annees[0].annee} à ${annees[annees.length - 1].annee}</figcaption>` +
    `${legende}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${resume}">${svg}</svg></figure>`
  );
}

function courbeParis(paris: AnneeMarche[]): string {
  const prix = (v: number) => `${nombre(Math.round(v))}${NBSP}€`;
  const avec = paris.filter((a) => a.prixM2Median && a.appartPrixM2Median);
  if (avec.length < 2) return "";
  const [p, d] = [avec[0], avec[avec.length - 1]];
  return courbe(
    paris,
    "Prix médian au m² à Paris",
    [
      { cle: "immeubles", nom: "Immeubles vendus en bloc", val: (a) => a.prixM2Median },
      { cle: "apparts", nom: "Appartements vendus seuls", val: (a) => a.appartPrixM2Median },
    ],
    1000,
    prix,
    (v) => `${nombre(v / 1000)}${NBSP}k€`,
    `Prix médian au m² à Paris : immeubles vendus en bloc de ${prix(p.prixM2Median!)} en ${p.annee} à ${prix(d.prixM2Median!)} en ${d.annee}, appartements de ${prix(p.appartPrixM2Median!)} à ${prix(d.appartPrixM2Median!)}.`,
  );
}

/** Lot 118 (MAV, 15/11/2026 : « deuxième courbe ok ») : le rendement théorique de Paris, avec les loyers de chaque année. */
function courbeRendement(paris: AnneeMarche[]): string {
  const taux = (v: number) => `${unChiffre(v)}${NBSP}%`;
  const avec = paris.filter((a) => a.rendement != null);
  if (avec.length < 2) return "";
  const [p, d] = [avec[0], avec[avec.length - 1]];
  return courbe(
    paris,
    "Rendement théorique des immeubles à Paris",
    [{ cle: "immeubles", nom: "Rendement théorique", val: (a) => a.rendement }],
    0.5,
    taux,
    (v) => `${unChiffre(v)}${NBSP}%`,
    `Rendement théorique des immeubles à Paris : ${taux(p.rendement!)} en ${p.annee}, ${taux(d.rendement!)} en ${d.annee}.`,
  );
}

export function remplirBarometre(html: string, h: Historique, semestres: SemestreParis[] = []): string {
  const paris = h.get(CODE_PARIS) ?? [];
  const annees = [...new Set([...h.values()].flat().map((a) => a.annee))].sort((a, b) => a - b);
  const sansChiffres =
    '<p class="barometre__note">Les chiffres de ce baromètre ne sont pas disponibles pour le moment. Le prix médian des immeubles de la dernière année, par arrondissement, est sur notre page <a href="/vendre-un-immeuble/paris/">Vendre un immeuble à Paris</a>.</p>';
  return html
    .replace('<div data-barometre="courbe"></div>', courbeParis(paris))
    .replace('<div data-barometre="paris"></div>', paris.length ? tableauParis(paris, semestres) : sansChiffres)
    .replace('<p data-barometre="resume"></p>', paris.length > 1 ? `<p>${resume(paris, semestres)}</p>` : "")
    .replace('<div data-barometre="arrondissements"></div>', annees.length ? tableauArrondissements(h, annees) : "")
    .replace('<div data-barometre="courbe-rendement"></div>', courbeRendement(paris))
    .replace('<div data-barometre="paris-rendement"></div>', paris.length ? tableauParisRendement(paris) : "")
    .replace('<div data-barometre="decotes"></div>', annees.length ? tableauDecotes(h, annees) : "")
    .replace('<div data-barometre="rendements"></div>', annees.length ? tableauRendements(h, annees) : "");
}

/**
 * La réponse en bref du baromètre, en tête de l'article (lot 124, MAV, 15/11/2026 : optimiser pour
 * ChatGPT et Claude, « fais tout »). Deux phrases tirées des chiffres de la dernière année, que les
 * moteurs et les assistants peuvent reprendre telles quelles. Vide sans chiffres.
 */
export function enBrefBarometre(h: Historique, semestres: SemestreParis[] = []): string | null {
  const paris = (h.get(CODE_PARIS) ?? []).filter((a) => a.prixM2Median);
  const d = paris[paris.length - 1];
  if (!d?.prixM2Median) return null;
  const p = paris[0];
  let texte = `En ${d.annee}, un immeuble de rapport vendu en bloc à Paris s’est vendu ${euros(d.prixM2Median)} le m² en médiane`;
  texte += d.decote != null && d.decote < 0 ? `, ${Math.abs(d.decote)}${NBSP}% sous le prix au m² des appartements vendus seuls la même année.` : ".";
  if (p !== d && p.prixM2Median) texte += ` Depuis ${p.annee}, ce prix ${evolue(p.prixM2Median, d.prixM2Median)}.`;
  if (d.rendement != null) texte += ` Avec les loyers de marché de ${d.annee}, le rendement théorique d’un immeuble parisien est de ${unChiffre(d.rendement)}${NBSP}%.`;
  const sp = semestreAPublier(h.get(CODE_PARIS) ?? [], semestres);
  if (sp) texte += ` Premier chiffre de ${sp.s.annee} : ${euros(sp.s.prixM2Median as number)} le m², sur ${nombre(sp.s.nbVentes)} ventes.`;
  return texte;
}

/** L'adresse du fichier des chiffres du baromètre. */
export const CSV_BAROMETRE = "/donnees/prix-immeubles-paris.csv";

/**
 * Les chiffres du baromètre en fichier (lot 124) : une ligne par année et par zone, tout Paris puis
 * les vingt arrondissements. Rien que des agrégats, comme l'article (conditions de réutilisation de
 * DVF) ; un prix n'est donné qu'à partir de trois ventes. Séparateur « ; » et virgule décimale,
 * pour qu'un tableur réglé en français l'ouvre tel quel.
 */
export function csvBarometre(h: Historique): string {
  const dec = (n: number | null, chiffres = 0) =>
    n == null ? "" : n.toLocaleString("fr-FR", { minimumFractionDigits: chiffres, maximumFractionDigits: chiffres, useGrouping: false });
  const lignes = [
    "zone;code_insee;annee;ventes_immeubles;prix_m2_median_immeubles;prix_m2_median_appartements;decote_pct;loyer_m2_mois;rendement_theorique_pct",
  ];
  for (const code of [CODE_PARIS, ...CODES_ARRONDISSEMENTS]) {
    for (const a of h.get(code) ?? []) {
      const ok = a.nbVentes >= VENTES_MIN_PRIX && a.prixM2Median;
      const zone = code === CODE_PARIS ? "Paris" : `Paris ${arrondissement(code)} arrondissement`;
      lignes.push(
        [zone, code, a.annee, a.nbVentes, ok ? dec(a.prixM2Median) : "", dec(a.appartPrixM2Median), ok ? dec(a.decote) : "", dec(a.loyerM2, 2), ok ? dec(a.rendement, 1) : ""].join(";"),
      );
    }
  }
  lignes.push("");
  lignes.push("Source : France Immeuble, d'après DVF (DGFiP, licence ouverte) et la carte des loyers de l'ANIL. https://www.france-immeuble.fr/prix-immeuble-de-rapport-paris/");
  return "﻿" + lignes.join("\r\n") + "\r\n";
}

/** Le jeu de données (schema.org Dataset), pour Google et les assistants qui citent leurs sources. */
export function datasetBarometre(h: Historique, url: string): object | null {
  const paris = (h.get(CODE_PARIS) ?? []).filter((a) => a.prixM2Median);
  if (!paris.length) return null;
  const d = paris[paris.length - 1];
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Prix des immeubles de rapport vendus en bloc à Paris, par arrondissement et par année",
    description: `Prix médian au m² des immeubles de rapport vendus en bloc à Paris et dans chacun des vingt arrondissements, de ${paris[0].annee} à ${d.annee}, comparé à celui des appartements vendus seuls, avec le loyer de marché et le rendement théorique de chaque année. Calculé par France Immeuble à partir des ventes enregistrées dans DVF.`,
    url,
    creator: { "@id": "https://www.france-immeuble.fr/#organisation" },
    license: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
    isBasedOn: [
      "https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres-geolocalisees",
      ...paris.map((a) => `https://www.data.gouv.fr/datasets/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-${a.annee}`),
    ],
    temporalCoverage: `${paris[0].annee}/${d.annee}`,
    spatialCoverage: { "@type": "Place", name: "Paris, France" },
    inLanguage: "fr",
    ...(d.majLe ? { dateModified: d.majLe.slice(0, 10) } : {}),
    variableMeasured: ["Prix médian au m² des immeubles", "Prix médian au m² des appartements", "Décote", "Loyer de marché au m²", "Rendement théorique"],
    distribution: { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `https://www.france-immeuble.fr${CSV_BAROMETRE}` },
  };
}
