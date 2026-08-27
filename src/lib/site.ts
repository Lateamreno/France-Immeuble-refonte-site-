/**
 * Constantes de marque — CLAUDE.md §10.
 * Source unique : ne jamais réécrire un de ces chiffres en dur dans une page.
 */
export const SITE = {
  nom: "France Immeuble",
  url: "https://www.france-immeuble.fr",
  tel: "01 72 87 52 22",
  telHref: "tel:+33172875222",
  adresse: "66 avenue des Champs-Élysées",
  codePostalVille: "75008 Paris",
  gtmId: "GTM-5KF68JV",
  pleinbail: "https://www.pleinbail.fr",
} as const;

/**
 * ⚠️ `investisseurs` : la meta de la homepage annonce « 1 500+ acheteurs »
 * alors que le §10 retient 1 372. Arbitrage en attente (CLAUDE.md §15).
 * Ces valeurs deviendront dynamiques via la projection `web.stats` (§2).
 */
export const PREUVES = {
  immeublesTraites: 365,
  depuis: 2018,
  investisseurs: 1372,
  noteGoogle: "4,9",
  nbAvis: 28,
  honorairesPct: 5,
} as const;

/**
 * Le calibre affiché est le premier filtre du site : il rassure le gros
 * propriétaire et décourage le petit d'appeler. C'est délibéré.
 */
export const CALIBRE = {
  ticketMin: 2_000_000,
  ticketMinLabel: "2 M€",
  rentabiliteProvinceMin: 10,
} as const;

export const NAV = [
  { href: "/vendre-un-immeuble/", label: "Vendre" },
  { href: "/estimer-un-immeuble/", label: "Estimer" },
  { href: "/acheter-un-immeuble/", label: "Acheter" },
  { href: "/immeubles-vendus/", label: "Nos biens" },
  { href: "/contactez-nous/", label: "Contact" },
] as const;

/** Départements d'Île-de-France — sert au routage du tunnel d'estimation. */
export const DEPTS_IDF = ["75", "77", "78", "91", "92", "93", "94", "95"] as const;

/** Formate un entier à la française : 1372 → « 1 372 » (espace insécable). */
export function nombre(n: number): string {
  return n.toLocaleString("fr-FR").replace(/ | |\s/g, " ");
}

export function millions(n: number): string {
  return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M€`;
}
