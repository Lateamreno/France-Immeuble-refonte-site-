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
 * `investisseurs` : 1 372, le décompte réel du fichier — pas les « 1 500+ »
 * de la meta d'accueil.
 *
 * Un chiffre exact se défend, un chiffre rond s'invente : devant un
 * propriétaire d'immeuble à plusieurs millions, 1 372 est plus crédible que
 * 1 500+. Et c'est le seul des deux qu'une projection `web.stats` pourra
 * alimenter automatiquement (§2) — un arrondi marketing ne se calcule pas.
 *
 * La meta de la homepage reste gelée à « 1 500+ » : la modifier est interdit
 * (§16), et elle n'apparaît que dans les résultats de recherche, jamais sur
 * la page. L'écart n'est donc jamais visible côté visiteur. À rouvrir au lot
 * Homepage (M7), où le CTR est justement l'enjeu.
 *
 * Deux articles de 2021 et 2022 citent « 1 500 acheteurs » : ils gardent leur
 * chiffre d'époque, et une note de datation en pied d'article le situe.
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
