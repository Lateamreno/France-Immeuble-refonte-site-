import type { Carte } from "@/components/annonces/arguments";

/**
 * Les arguments de la page Paris, validés par MAV (lots 108 à 112). Sortis de la page au lot 140 :
 * les pages des annonces Google reprennent les mêmes cartes, au mot près.
 */

/**
 * Ce que demande l'estimation d'un immeuble parisien (retours #314 à #320) : quatre titres courts
 * et parallèles, le marché, le locatif, le bâti, la cible. La cible se définit dès l'estimation ;
 * la section Vendre dit ensuite à qui l'immeuble part.
 */
export const ESTIMATION: Carte[] = [
  {
    picto: "secteur",
    titre: "Le marché",
    texte:
      "Une analyse fine du marché : nous étudions les prix de vente des appartements et des immeubles selon l’emplacement, le standing et le type d’immeuble. Les ventes d’immeubles sont trop rares pour suffire à la comparaison, et deux immeubles voisins peuvent se vendre à des prix très différents.",
  },
  {
    picto: "dossier",
    titre: "Le locatif",
    texte:
      "Loi de 1948, locataires protégés, loyers sous le marché, encadrement des loyers, baux commerciaux : nous lisons chaque bail et mesurons son impact sur le prix. La qualité des locataires et de leur activité compte aussi : une enseigne nationale ne se valorise pas comme un commerce de restauration rapide.",
  },
  {
    picto: "technique",
    titre: "Le bâti",
    texte:
      "Structure, toiture, façades, normes, logements classés F ou G : nous chiffrons les travaux à prévoir. Quand l’immeuble est en secteur protégé, la rénovation coûte plus cher : nous en tenons compte dans le prix.",
  },
  {
    picto: "loupeCible",
    titre: "La cible",
    texte:
      "Notre but : trouver l’acquéreur qui paiera le meilleur prix. Selon l’état de l’immeuble, ses possibilités de surélévation et son état locatif, un marchand de biens se démarquera d’un investisseur, ou l’inverse. Nous définissons cette cible dès l’estimation, pour valoriser au mieux votre immeuble.",
  },
];

/**
 * Comment nous vendons (retours #326 à #330) : 100 % off-market, des acheteurs identifiés, un
 * dossier fait pour qu'ils fassent une offre, la meilleure offre pour l'immeuble. « En 24 heures »
 * est un délai d'offre, pas un délai de vente : aucun délai de vente n'est affiché.
 */
export const VENTE: Carte[] = [
  {
    picto: "detective",
    titre: "Votre immeuble ne s’use pas en vitrine",
    texte:
      "Un immeuble resté longtemps en ligne perd de sa valeur perçue et se négocie plus bas. De plus, une annonce en ligne attire surtout des particuliers, dont l’achat dépend d’un prêt.",
  },
  {
    picto: "equipe",
    titre: "Des acheteurs connus et reconnus",
    texte:
      "Votre dossier n’est envoyé qu’à des acheteurs identifiés, dont nous connaissons le sérieux. Leurs offres sont solides, souvent sans condition de financement. Vous évitez les curieux et les acheteurs peu fiables.",
  },
  {
    picto: "dossier",
    titre: "Un dossier fait pour décider",
    texte:
      "Nos dossiers sont conçus pour donner aux acquéreurs toutes les informations dont ils ont besoin pour faire une offre : état locatif, baux, surfaces, diagnostics.",
    citation: {
      texte: "… leur dossier était de loin le plus détaillé et surtout le plus adapté à la vente d’un immeuble entier.",
      auteur: "Danièle M.",
    },
  },
  {
    picto: "poignee",
    titre: "La meilleure offre pour votre immeuble",
    texte:
      "Nous ciblons en amont les meilleurs acquéreurs. Avec nous, chacun se sait en concurrence avec d’autres acheteurs sérieux, capables de faire une offre au prix en 24 heures. Les offres arrivent souvent avant la visite, ou juste après. D’où l’importance d’un prix bien fixé : les acheteurs peuvent alors l’offrir d’emblée pour s’assurer l’immeuble.",
  },
];

/**
 * Entre l'offre et l'acte (retours #332 à #335) : le travail documentaire, en quatre parties. La
 * préemption de la Ville et les droits des locataires n'y sont plus : « c'est fait par les
 * notaires et tous les acquéreurs prorogent les baux » (MAV). Droit relu : hors copropriété, ni le
 * mesurage des surfaces ni le DPE de chaque logement ne sont exigés pour la vente.
 */
export const APRES: Carte[] = [
  {
    picto: "dossier",
    titre: "Le dossier locatif",
    texte:
      "Baux, états des lieux, actes de cautionnement, garanties Visale, dépôts de garantie, impayés, procédures en cours : nous recensons tout, bail par bail. C’est la partie la plus importante du dossier de vente.",
  },
  {
    picto: "loupe",
    titre: "Les diagnostics",
    texte:
      "Plomb, amiante, termites, DPE du bâtiment, audit énergétique s’il est dû… Nous dressons la liste selon l’époque, la composition et l’adresse de l’immeuble, et vérifions leur validité. Hors copropriété, la vente n’exige ni le mesurage des surfaces ni le DPE de chaque logement. Nous les recommandons : à Paris, une erreur de surface coûte cher à l’acquéreur, et le DPE dit si un logement peut encore être loué.",
  },
  {
    picto: "technique",
    titre: "Le dossier technique",
    texte:
      "Nous suivons les sinistres en cours ou passés. Pour les travaux encore couverts par la garantie décennale, nous demandons les factures et l’attestation d’assurance de chaque entreprise : elle est annexée à l’acte de vente.",
  },
  {
    picto: "bulles",
    // Titre court : dans la rangée alignée, un titre de trois lignes creusait un vide sous les trois autres.
    titre: "Les pièces complémentaires",
    texte:
      "Nous préparons tout en amont, mais le notaire et l’acquéreur demandent toujours des pièces en plus. Les sociétés de gestion agréées par l’AMF, elles-mêmes contrôlées, vont jusqu’à demander les dossiers de location des locataires. Il nous est arrivé d’aller lire un microfilm aux Archives pour prouver l’usage commercial ancien d’un rez-de-chaussée.",
  },
];

/** Ce que coûte la vente et ce à quoi le vendeur s'engage : chaque phrase est déjà sur la page Vendre ou sur le barème (TTC, retour #337). */
export const CONDITIONS: Carte[] = [
  {
    picto: "valide",
    titre: "Aucun engagement de vente",
    texte:
      "L’estimation est gratuite, confidentielle et ne vous engage pas à vendre. Si vous nous confiez l’immeuble en bloc et qu’il ne se vend pas, vous ne nous devez rien.",
  },
  {
    picto: "euro",
    titre: "Des honoraires dus à l’acte",
    texte:
      "Pour une vente en bloc, nos honoraires sont en général à la charge de l’acquéreur, et ne sont dus qu’à la signature de l’acte définitif chez le notaire. Notre barème est public : 5 % TTC jusqu’à 5 M€, 4 % TTC de 5 à 10 M€, 3 % TTC au-delà.",
  },
  {
    picto: "poignee",
    titre: "Pas de mandat exclusif imposé",
    texte:
      "Vous n’êtes pas obligé de signer un mandat exclusif. Pour que la vente reste off-market, nous travaillons souvent en semi-exclusivité, c’est-à-dire avec une exclusivité temporaire.",
  },
];

/** La découpe est une option (retour #340) : chiffrée si le vendeur le souhaite, pilotée par nous, réversible jusqu'au premier lot vendu. */
export const DECOUPE: Carte[] = [
  {
    picto: "calculatrice",
    titre: "Une option, à votre demande",
    texte:
      "Nous chiffrons la vente en bloc, et la découpe si vous le souhaitez. Quand elle ne crée pas de valeur, nous vous le disons.",
  },
  {
    picto: "reglages",
    titre: "Nous pilotons l’opération",
    texte:
      "Mise en copropriété, offres de vente aux locataires en place, départs négociés à l’amiable, baux commerciaux, travaux, vente lot par lot.",
  },
  {
    picto: "immeubles",
    titre: "Vous gardez le choix",
    texte: "Tant que le premier lot n’est pas vendu, l’immeuble reste vendable en bloc.",
  },
];

/**
 * Les cartes de la vente pour les pages des annonces (lot 140) : la meilleure offre d'abord, et sans
 * « en 24 heures » (aucun délai avant l'écran de fin du formulaire sur une page d'annonces).
 */
export const VENTE_ANNONCES: Carte[] = [VENTE[3], VENTE[1], VENTE[2], VENTE[0]].map((c) =>
  c.titre === "La meilleure offre pour votre immeuble"
    ? { ...c, texte: c.texte.replace(/, capables de faire une offre au prix en 24\s+heures/, "") }
    : c,
);
