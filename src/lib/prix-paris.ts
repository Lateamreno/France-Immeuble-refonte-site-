import { marchesDesCommunes } from "@/lib/marche";
import {
  fourchetteRendement,
  immeublesDesCommunes,
  libelleRendement,
  rendementsTheoriques,
  type ImmeublesCommune,
  type NoteFiabilite,
} from "@/lib/immeubles-dvf-lecture";

/**
 * Les prix des immeubles vendus en bloc à Paris, par arrondissement : le calcul du tableau de la
 * page Paris (/vendre-un-immeuble/paris/), sorti de sa page au lot 140 pour servir aussi à la page
 * des annonces sur les prix. Agrégats seulement (DVF), l'année la plus récente, dès trois ventes.
 */

/** Les vingt arrondissements, de 75101 à 75120. Tout Paris : 75056. */
export const CODES_ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => `751${String(i + 1).padStart(2, "0")}`);
const CODE_TOUT_PARIS = "75056";

/** « 1er », « 18e ». */
export const rang = (n: number) => `${n}${n === 1 ? "er" : "e"}`;

export type LignePrix = {
  n: number;
  prix: number | null;
  decote: number | null;
  fiabilite: NoteFiabilite | null;
  rdt: number | null;
  ventes: number;
  /** Sans ligne pour l'année, on ne sait pas : on ne l'écrit pas « moins de trois ventes ». */
  connu: boolean;
};

export type DonneesPrixParis = {
  immeubles: Map<string, ImmeublesCommune>;
  annee: number | null;
  lignes: LignePrix[];
  moinsCher: { n: number; prix: number } | null;
  plusCher: { n: number; prix: number } | null;
  totalImmeubles: number;
  avecRdt: boolean;
  avecDecote: boolean;
  etendueDecote: { min: { n: number; pct: number }; max: { n: number; pct: number } } | null;
  rendementParis: string;
  millesime: number | null;
  releveEn: string | null;
  /** Vrai quand au moins un arrondissement porte un prix pour l'année. */
  tableau: boolean;
  colonnesChiffres: number;
  /** Tout Paris, la même année que le tableau : les ventes des vingt arrondissements réunies. */
  paris: { prix: number; ventes: number; decote: number | null } | null;
};

export async function donneesPrixParis(): Promise<DonneesPrixParis> {
  const codes = CODES_ARRONDISSEMENTS;
  const [marches, immeubles, toutParis] = await Promise.all([
    marchesDesCommunes(codes),
    immeublesDesCommunes(codes),
    immeublesDesCommunes([CODE_TOUT_PARIS]),
  ]);

  // Le tableau : pour chaque arrondissement, le prix médian au m² des immeubles vendus en bloc
  // (DVF, à partir de trois ventes), sa décote face aux appartements vendus seuls la même année,
  // la note de fiabilité de ce prix et le rendement théorique : le loyer de marché du secteur sur
  // un an, rapporté au prix médian.
  const annee = immeubles.size ? Math.max(...[...immeubles.values()].map((x) => x.annee)) : null;
  const lignes = codes.map((code, i): LignePrix => {
    const m = marches.get(code);
    const lu = immeubles.get(code);
    // Une ligne restée sur une année plus ancienne ne se publie pas sous « en {annee} ».
    const imm = lu && lu.annee === annee ? lu : undefined;
    const prix = imm?.prixM2Median ?? null;
    return {
      n: i + 1,
      prix,
      decote: prix != null ? (imm?.decotePct ?? null) : null,
      fiabilite: prix != null ? (imm?.fiabilite ?? null) : null,
      rdt: prix != null && m?.loyerM2 ? (m.loyerM2 * 12 * 100) / prix : null,
      ventes: imm?.nbVentes ?? 0,
      connu: imm != null,
    };
  });
  const chiffrees = lignes.flatMap((l) => (l.prix != null ? [{ n: l.n, prix: l.prix }] : []));
  const parPrix = [...chiffrees].sort((a, b) => a.prix - b.prix);
  const moinsCher = parPrix[0] ?? null;
  const plusCher = parPrix[parPrix.length - 1] ?? null;
  const totalImmeubles = lignes.reduce((s, l) => s + l.ventes, 0);
  // Si les loyers de marché ne répondent pas, la colonne du rendement et ses explications s'effacent.
  const avecRdt = lignes.some((l) => l.rdt != null);
  // De même pour la décote, tant que la base ne porte pas les prix des appartements (migration 0022).
  const avecDecote = lignes.some((l) => l.decote != null);
  // D'où à où va la décote : seuls comptent les arrondissements où l'immeuble est moins cher au m²
  // (un « +4 % » n'est pas une décote), en valeur absolue, sans signe dans une phrase.
  const decotes = lignes
    .flatMap((l) => (l.decote != null && l.decote < 0 ? [{ n: l.n, pct: -l.decote }] : []))
    .sort((a, b) => a.pct - b.pct);
  const etendueDecote =
    decotes.length > 1 && decotes[0].pct !== decotes[decotes.length - 1].pct
      ? { min: decotes[0], max: decotes[decotes.length - 1] }
      : null;
  // La fourchette de rendement « en général » (MAV, 13/11/2026), tirée des rendements du tableau.
  const rendementParis = libelleRendement(fourchetteRendement(rendementsTheoriques(immeubles, marches)));
  const millesime = [...marches.values()].find((m) => m.millesimeLoyers)?.millesimeLoyers ?? null;
  // La licence de DVF demande la source et la date de mise à jour : le mois du dernier relevé.
  const dernierReleve = [...immeubles.values()].flatMap((x) => (x.annee === annee && x.majLe ? [x.majLe] : [])).sort().pop();
  const releveEn = dernierReleve
    ? new Date(dernierReleve).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" })
    : null;
  const tableau = annee != null && chiffrees.length > 0;
  // Une ligne sans prix s'étend sur toutes les colonnes de chiffres.
  const colonnesChiffres = 2 + (avecDecote ? 1 : 0) + (avecRdt ? 1 : 0);

  const tp = toutParis.get(CODE_TOUT_PARIS);
  const paris =
    tp && tp.annee === annee && tp.prixM2Median != null
      ? { prix: tp.prixM2Median, ventes: tp.nbVentes, decote: tp.decotePct }
      : null;

  return {
    immeubles, annee, lignes, moinsCher, plusCher, totalImmeubles, avecRdt, avecDecote, etendueDecote,
    rendementParis, millesime, releveEn, tableau, colonnesChiffres, paris,
  };
}
