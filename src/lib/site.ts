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
} as const;

/**
 * Éléments de réassurance (CLAUDE.md §10).
 *
 * ⚠️ `investisseurs` : la meta de la homepage annonce « 1 500+ acheteurs »
 * alors que le §10 retient 1 372. Arbitrage en attente (CLAUDE.md §15) —
 * en attendant, 1 372 fait foi partout sur le site.
 *
 * Ces valeurs deviendront dynamiques en M2, alimentées par la projection
 * `web.stats` déposée par le BO (§2). Elles sont ici en dur à dessein :
 * le contrat de données n'est pas encore défini.
 */
export const PREUVES = {
  immeublesTraites: 365,
  depuis: 2018,
  investisseurs: 1372,
  noteGoogle: "4,9",
  nbAvis: 28,
  honorairesPct: 5,
} as const;

export const NAV = [
  { href: "/vendre-un-immeuble/", label: "Vendre" },
  { href: "/estimer-un-immeuble/", label: "Estimer" },
  { href: "/immeubles-vendus/", label: "Immeubles vendus" },
  { href: "/contactez-nous/", label: "Contact" },
] as const;

/** Formate un entier à la française : 1372 → « 1 372 » (espace insécable). */
export function nombre(n: number): string {
  return n.toLocaleString("fr-FR").replace(/ |\s/g, " ");
}
