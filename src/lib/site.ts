/**
 * Constantes de marque — CLAUDE.md §10.
 * Source unique : ne jamais réécrire un de ces chiffres en dur dans une page.
 */
export const SITE = {
  nom: "France Immeuble",
  url: "https://www.france-immeuble.fr",
  tel: "01 72 87 52 22",
  telHref: "tel:+33172875222",
  /** Repris des mentions légales et de la page Contact du site d'origine. */
  email: "contact@france-immeuble.fr",
  adresse: "66 avenue des Champs-Élysées",
  codePostalVille: "75008 Paris",
  gtmId: "GTM-5KF68JV",
  pleinbail: "https://www.pleinbail.fr",
} as const;

/**
 * `investisseurs` : le nombre d'acheteurs du fichier, le même partout. Le BO
 * le dépose dans la table `chiffres` (clé `investisseurs`) ; la valeur
 * ci-dessous ne sert que tant que rien n'est déposé ou si la base ne répond
 * pas.
 *
 * 1 500 par décision de MAV (26/10/2026), cohérent avec les « 1 500+ » de la
 * meta d'accueil, gelée. Relevé du BO le même jour : 1 487 contacts cochés
 * « acquéreur », dont 1 480 non archivés et 1 203 avec au moins une recherche.
 *
 * Deux articles de 2021 et 2022 citent « 1 500 acheteurs » : ils gardent leur
 * chiffre d'époque, et une note de datation en pied d'article le situe.
 */
export const PREUVES = {
  /**
   * ⚠️ Ne plus écrire de chiffre de ventes ici. Le nombre d'immeubles vendus,
   * les communes couvertes et les années se CALCULENT dans `lib/biens.ts` à
   * partir des ventes déposées par le BO (`ventesEtStats()`).
   *
   * Le site annonçait « 365 immeubles » : aucune table du CRM ne produit ce
   * nombre — 274 mandats, 211 commercialisations, 875 estimations, 44 ventes.
   * MAV a tranché le 21/10 : on aligne le discours sur ce que la base prouve.
   * Un chiffre dérivé des données ne peut plus diverger de la réalité.
   */
  investisseurs: 1500,
  noteGoogle: "4,9",
  nbAvis: 28,
  /** La fiche Google de l'agence, ouverte sur ses avis (lien de l'ancien site). */
  avisGoogle: "https://www.google.com/search?q=France+Immeuble#lrd=0x47e66f1063ba55b7:0xe7d484f6c7bed1cf,1,,,",
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

export type LienNav = {
  href: string;
  label: string;
  /** Le libellé du parent est un lien vers `href` ; la flèche seule déroule. */
  lien?: boolean;
  enfants?: readonly { readonly href: string; readonly label: string; readonly badge?: string }[];
};

/**
 * `/immeubles-vendus/` garde son URL : c'est une des 22 URLs existantes, et on
 * n'en change aucune (§16). Les deux autres sont neuves, donc libres.
 */
export const NAV: readonly LienNav[] = [
  /* « Vendre » mène toujours à sa page ; la flèche ouvre les deux façons de
     vendre (MAV, 22/10/2026). La découpe reste sous Vendre (§6). */
  {
    href: "/vendre-un-immeuble/",
    label: "Vendre",
    lien: true,
    enfants: [
      { href: "/vendre-un-immeuble/", label: "Vendre en bloc" },
      { href: "/vendre-a-la-decoupe/", label: "Vendre à la découpe", badge: "nouveau" },
    ],
  },
  { href: "/estimer-un-immeuble/", label: "Estimer" },
  { href: "/acheter-un-immeuble/", label: "Acheter" },
  {
    href: "/immeubles-vendus/",
    label: "Nos biens",
    enfants: [
      { href: "/immeubles-vendus/", label: "Biens vendus" },
      { href: "/immeubles-a-vendre/", label: "Biens à vendre" },
      { href: "/immeubles-off-market/", label: "Biens off-market" },
    ],
  },
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
