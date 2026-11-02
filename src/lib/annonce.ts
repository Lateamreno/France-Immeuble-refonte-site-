import type { BienAVendre } from "./biens";

/**
 * Les calculs et libellés d'une annonce, partagés par la carte, la rangée
 * mobile, la fiche et le panneau d'offre (spec Plein Bail §12, MAV 31/10/2026).
 * Une seule fonction par règle : la carte et la fiche ne peuvent pas diverger.
 */

const ESP = " "; // espace fine insécable avant les unités

export const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/\s/g, ESP)}${ESP}€`;
export const pct = (n: number, d = 2) =>
  `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: d })}${ESP}%`;
export const m2 = (n: number) =>
  `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/\s/g, ESP)}${ESP}m²`;

export type TypeDominant = "habitation" | "commercial" | "bureau" | "mixte";
export const TYPES_DOMINANTS: [TypeDominant, string][] = [
  ["habitation", "Habitation"],
  ["commercial", "Commerces"],
  ["bureau", "Bureaux"],
  ["mixte", "Mixtes"],
];

/** La dominante déposée par le BO, sinon celle qu'on lit dans le type. */
export function dominanteDe(b: BienAVendre): Exclude<TypeDominant, "mixte"> {
  if (b.typeDominant) return b.typeDominant;
  if (/bureau/i.test(b.type)) return "bureau";
  if (/commerc/i.test(b.type)) return "commercial";
  return "habitation";
}
export const estMixte = (b: BienAVendre) => b.mixte ?? /mixte/i.test(b.type);

/** Le rendement affiché, filtré et trié partout : le brut potentiel s'il est connu. */
export const rendementAffiche = (b: BienAVendre) => b.rendementPotentiel ?? b.rendement;
export const loyerAffiche = (b: BienAVendre) => b.loyerPotentielAn ?? b.loyerHcAn;

/** « Occupé 85 % », « Occupé 100 % », « Libre ». Par surface, sinon par lots. */
export function libelleOccupation(b: BienAVendre): string | null {
  const o = b.occupation ?? b.occupationLots;
  if (o == null) return null;
  if (o < 0.5) return "Libre";
  if (o >= 99.5) return `Occupé 100${ESP}%`;
  return `Occupé ${Math.round(o)}${ESP}%`;
}

/** « C », « C → E » quand les lots diffèrent, « DPE n.c. » sans diagnostic. */
export function etiquetteDpe(min: string | null, max: string | null): string {
  if (min && max && min !== max) return `${min} → ${max}`;
  return max ?? min ?? "DPE n.c.";
}
export const classeDpe = (b: BienAVendre) => b.dpe ?? b.dpeMin;

/** Nouveau : publié il y a moins de 7 jours (la remontée ne compte pas). */
export const estNouveau = (b: BienAVendre, maintenant = Date.now()) =>
  maintenant - new Date(b.publieLe).getTime() < 7 * 86_400_000;

/** Prix baissé dans les 30 derniers jours. */
export const prixBaisse = (b: BienAVendre, maintenant = Date.now()) =>
  !!(b.prixPrecedent && b.prixPrecedent > b.prixHai && b.prixBaisseLe &&
    maintenant - new Date(b.prixBaisseLe).getTime() < 30 * 86_400_000);

/** La date de tri : publication, ou remontée décidée dans le BO. */
export const dateTri = (b: BienAVendre) =>
  b.remonteLe && b.remonteLe > b.publieLe ? b.remonteLe : b.publieLe;

/** Prix net vendeur et honoraires, à la charge de l'acquéreur. À défaut, 5 % du net. */
export function decomposition(b: BienAVendre) {
  const net = b.prixNetVendeur ?? (b.honoraires != null ? b.prixHai - b.honoraires : b.prixHai / 1.05);
  return { net, honoraires: b.prixHai - net, part: net / b.prixHai };
}

/**
 * Frais de notaire réels d'un immeuble ancien (barème 2026) : droits de
 * mutation 6,32 %, émoluments dégressifs + TVA, contribution de sécurité
 * immobilière 0,10 % (15 € au moins), débours forfaitaires. L'assiette est le
 * net vendeur : les honoraires sont à la charge de l'acquéreur.
 */
export const DMTO = 0.0632;
const TRANCHES: [number, number][] = [[6_500, 0.0387], [17_000, 0.01596], [60_000, 0.01064], [Infinity, 0.00799]];
export const DEBOURS = 1_000;

export function fraisNotaire(assiette: number) {
  const droits = assiette * DMTO;
  let reste = assiette, bas = 0, emolHt = 0;
  for (const [haut, taux] of TRANCHES) {
    const part = Math.max(0, Math.min(reste, haut - bas));
    emolHt += part * taux;
    reste -= part;
    bas = haut;
    if (reste <= 0) break;
  }
  const emoluments = emolHt * 1.2;
  const csi = Math.max(15, assiette * 0.001);
  const total = droits + emoluments + csi + DEBOURS;
  return { droits, emoluments, csi, debours: DEBOURS, total };
}

/** Les frais de notaire pour un prix HAI donné (l'offre), au prorata du net. */
export const notairePour = (b: BienAVendre, prixHai: number) =>
  fraisNotaire(prixHai * decomposition(b).part).total;

/** Charges annuelles : totales, récupérables, non récupérables. Null sans donnée. */
export function charges(b: BienAVendre) {
  if (b.taxeFonciere == null && b.chargesCopro == null) return null;
  const tf = b.taxeFonciere ?? 0, tfr = Math.min(tf, b.taxeFonciereRecup ?? 0);
  const cc = b.chargesCopro ?? 0, ccr = Math.min(cc, b.chargesCoproRecup ?? 0);
  return {
    taxeFonciere: b.taxeFonciere, taxeFonciereRecup: tfr,
    copro: b.chargesCopro, coproRecup: ccr,
    totales: tf + cc, recuperables: tfr + ccr, nonRecuperables: tf - tfr + (cc - ccr),
  };
}

/**
 * Les rendements, au prix demandé ou au prix de l'offre :
 * brut = loyers / prix ; net = (loyers − charges non récupérables) / prix ;
 * acte en main = (loyers − charges non récupérables) / (prix + travaux + notaire).
 * « Potentiel » ajoute les loyers de marché des lots vides et les travaux au prix.
 */
export function rendements(b: BienAVendre, prix = b.prixHai) {
  const nr = charges(b)?.nonRecuperables ?? 0;
  const travaux = b.travauxTotal ?? 0;
  const notaire = notairePour(b, prix);
  const calc = (loyer: number | null, base: number) =>
    loyer == null ? null : {
      brut: (loyer / base) * 100,
      net: ((loyer - nr) / base) * 100,
      aem: ((loyer - nr) / (prix + travaux + notaire)) * 100,
    };
  const actuel = calc(b.loyerHcAn, prix);
  const potentiel = b.loyerPotentielAn != null ? calc(b.loyerPotentielAn, prix + travaux) : null;
  // Une seule colonne quand le potentiel ne dit rien de plus.
  const memes = !potentiel || (b.loyerPotentielAn === b.loyerHcAn && travaux === 0);
  return { actuel, potentiel: memes ? null : potentiel, notaire, travaux };
}

/** Mensualité d'un prêt amortissable. */
export function mensualite(montant: number, tauxAnnuelPct: number, annees: number) {
  if (montant <= 0) return 0;
  const r = tauxAnnuelPct / 100 / 12, n = annees * 12;
  return r === 0 ? montant / n : (montant * r) / (1 - (1 + r) ** -n);
}

/** Le lien Google Maps de la commune : code postal et ville, jamais l'adresse. */
export const lienCarte = (b: BienAVendre) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.codePostal ?? ""} ${b.ville} France`.trim())}`;

/**
 * Les destinations des recherches du BO (contrat §6) : la barre de recherche
 * du site parle la même langue, pour que toute recherche s'enregistre telle
 * quelle (MAV, 02/11/2026).
 */
export type Destination = "Logement" | "Commerce" | "Bureau" | "Logistique" | "Hôtel" | "Parking";
export const DESTINATIONS: Destination[] = ["Logement", "Commerce", "Bureau", "Logistique", "Hôtel", "Parking"];
const DESTINATION_DU_LOT: Record<string, Destination> = {
  habitation: "Logement", commerce: "Commerce", bureau: "Bureau", activite: "Logistique", parking: "Parking",
};

/** Les destinations d'un bien : celles de ses lots, sinon celles qu'on lit dans son type. */
export function destinationsDe(b: BienAVendre): Destination[] {
  const d = new Set<Destination>();
  for (const t of b.typesLots ?? []) if (DESTINATION_DU_LOT[t]) d.add(DESTINATION_DU_LOT[t]);
  if (d.size === 0) {
    const dom = dominanteDe(b);
    d.add(dom === "bureau" ? "Bureau" : dom === "commercial" ? "Commerce" : "Logement");
    if (estMixte(b)) { d.add("Logement"); d.add("Commerce"); }
    if (/h[oô]tel/i.test(b.type)) d.add("Hôtel");
  }
  return DESTINATIONS.filter((x) => d.has(x));
}
