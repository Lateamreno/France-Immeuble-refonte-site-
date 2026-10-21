/**
 * Données de la page d'accueil, reprises du WordPress.
 *
 * Tout le texte vient de `content/pages-wp.json` : rien n'est réécrit. Ce
 * fichier ne fait que le sortir du markup Gutenberg pour qu'il soit composable.
 *
 * ⚠️ Les prix exacts et les communes des références sont repris tels qu'ils
 * étaient publiés. C'est en tension avec la règle d'anonymisation du §2
 * (arrondissement et non rue, fourchettes et non montants exacts) : à trancher.
 * Rien n'a été ajouté, mais rien n'a été masqué non plus.
 */

export type BienVendu = {
  ville: string;
  image: string;
  surface: string;
  destination: string;
  occupation: string;
  prix: string;
};

/**
 * Ordre revu : Paris d'abord. La page affiche « Tous types d'immeubles à
 * Paris et Hauts-de-Seine » et ouvrait sur Melun et Spicheren — un
 * propriétaire du 8e en concluait qu'il n'était pas au bon endroit. Les
 * fiches sont les mêmes, l'ordre seul change.
 */
export const BIENS_VENDUS: BienVendu[] = [
  { ville: "Paris (75005)", image: "/media/8.jpg", surface: "484 m²", destination: "Mixte", occupation: "87 %", prix: "6 400 000 € HAI" },
  { ville: "Paris (75002)", image: "/media/5.jpg", surface: "215 m²", destination: "Mixte", occupation: "100 %", prix: "2 849 700 € HAI" },
  { ville: "Massy (91)", image: "/media/2.jpg", surface: "396 m²", destination: "Habitation", occupation: "100 %", prix: "2 000 000 € HAI" },
  { ville: "Chambly (60)", image: "/media/6.jpg", surface: "399 m²", destination: "Mixte", occupation: "100 %", prix: "1 100 000 € HAI" },
  { ville: "Pontoise (95)", image: "/media/9.jpg", surface: "316 m²", destination: "Habitation", occupation: "83 %", prix: "945 000 € HAI" },
  { ville: "Tourcoing (59)", image: "/media/https___s3.amazonaws.com_appforest_uf_f1597232614110x297444380103170100_IMG_2293.jpg", surface: "735 m²", destination: "Habitation", occupation: "80 %", prix: "900 000 € HAI" },
  { ville: "Bordeaux (33)", image: "/media/10-compressed.jpg", surface: "248 m²", destination: "Mixte", occupation: "58 %", prix: "845 000 € HAI" },
  { ville: "Spicheren (57)", image: "/media/4.jpg", surface: "817 m²", destination: "Habitation", occupation: "100 %", prix: "661 500 € HAI" },
  { ville: "Melun (77)", image: "/media/3.jpg", surface: "176 m²", destination: "Habitation", occupation: "100 %", prix: "565 000 € HAI" },
  { ville: "Laroche-Saint-Cydroine (89)", image: "/media/7.jpg", surface: "403 m²", destination: "Habitation", occupation: "100 %", prix: "365 000 € HAI" },
];

export type Avis = { nom: string; date: string; texte: string };

/**
 * Les douze avis, au mot près. Deux seulement ont changé de rang : ceux qui
 * démontrent le réseau d'acheteurs et la qualité du dossier passent en tête.
 * Une seule correction de caractère : « 06 d?cembre » était un accent corrompu
 * dans l'export.
 */
export const AVIS: Avis[] = [
  { nom: "Romain VZ", date: "26 janvier 2023", texte: "J’ai confié la vente de mon immeuble à France Immeuble après reçu leur estimation, qui n’était pas la plus haute, mais la plus convaincante. Bien m’en a pris, l’agence s’est présentée dès la première visite avec un acheteur potentiel, qui m’a fait une offre quelques jours après. La transaction s’est parfaitement déroulée, je recommande sans réserve France Immeuble, qui n’a à mon avis pas beaucoup d’équivalent sur son marché." },
  { nom: "Danièle M.", date: "30 janvier 2021", texte: "Nous avons fait estimer un immeuble par France Immeuble (entre autres) et leur dossier était de loin le plus détaillé et surtout le plus adapté à la vente d’un immeuble entier. Nous avons donc choisi de poursuivre avec eux pour la vente et nous en sommes très satisfaits. La vente s’est réalisée rapidement dans de très bonnes conditions. M Voci est compétent, professionnel et présent sur la durée. Nous recommandons vivement les services de France Immeuble." },
  { nom: "Pierre-Philippe Caneri", date: "17 mai 2021", texte: "FRANCE IMMEUBLE nous a vendu un immeuble de 820 m² situé à FORBACH en Moselle proche de la frontière Allemande. L’assistance à l’avant vente a été en tous points remarquable. Ils ont même fait chiffrer les travaux à réaliser, se sont occupés de l’assainissement et ont permis, par leur pugnacité et leur opiniâtreté, de finalement conclure la vente, bien que nos acquéreurs aient rencontrés des problèmes de financement… J’ai rarement vu autant d’efficacité et de qualité de suivi." },
  { nom: "Thibault de la Baronnière", date: "06 juin 2021", texte: "Nous avons eu l’occasion d’acheter un immeuble par l’entremise de France Immeuble. Ce fut un plaisir d’être accompagné par eux. Travail très professionnel et sérieux, rien à voir avec l’agent immobilier lambda tel qu’on l’imagine." },
  { nom: "Marlene Guiovanna", date: "08 octobre 2020", texte: "Je recherchais sur le Net des informations sur la vente d’un immeuble. Je suis tombée sur le site France Immeuble : bonne pioche ! En effet, dès le premier contact par téléphone, leur professionnalisme s’est tout de suite ressenti. J’ai envoyé les éléments concernant mon bien par mail et ai reçu rapidement son estimation. S’en est suivi un échange de mails où j’ai reçu conseils et informations réglementaires s’agissant de mon projet. J’apprécie vraiment l’aide apportée, cela me permet de mieux appréhender mon projet. Encore merci à mon interlocuteur et France Immeuble. Je les recommande vivement." },
  { nom: "Mariane Suzanne", date: "23 mai 2020", texte: "C’est après une estimation de qualité et très professionnelle de notre immeuble que nous avons accepté de confier cette vente à France Immeuble. Grace à ce partenariat, nous avons rapidement et bien vendu notre immeuble . Nous avons vraiment très apprécié l’accompagnement que nous avons eu tout au long de cette transaction. Nous ne pouvons que recommander cet organisme pour son sérieux et professionnalisme ." },
  { nom: "Fabrice Amendola", date: "06 décembre 2021", texte: "Nous avons vendu notre immeuble avec France Immeuble. Ils sont professionnels, réactifs, disponibles et surtout très sympathiques. La vente a été longue mais ils sont restés disponibles sur toute la durée du processus. Merci encore pour tout." },
  { nom: "Thierry Depois", date: "16 juin 2021", texte: "Vente rapide à un prix proche de l’estimation initiale et avec un accompagnement permanent tout au long de l’opération." },
  { nom: "Luis Ramos", date: "25 septembre 2019", texte: "J’ai confié la vente d’un immeuble à France Immeuble qui a su parfaitement gérer l’affaire. J’ai apprécié le soutien dans les différentes échanges. Grand professionnalisme. Je suis très satisfait de leur travail et je recommande." },
  { nom: "Abdelkrim Karim Sekouri", date: "24 janvier 2023", texte: "Réactivite et professionnalisme de monsieur Voci qui nous a permis de vendre notre bien dans de très bonnes conditions" },
  { nom: "Violaine Tureau", date: "21 juin 2021", texte: "Excellent suivi auprès de l’ensemble des intervenants Equipe compétente et très bon relationnel" },
  { nom: "Olivier Romano", date: "14 juin 2019", texte: "J’ai fais appel à France Immeuble pour une estimation de bien immobilier dans le Rhône , j’ai obtenu entière satisfaction, travail professionnel , clair, cohérent, rapide . Je recommande vivement ." },
];

/** Ce que le réseau d'acheteurs recherche — les trois compteurs de l'accueil. */
export const RECHERCHES = [
  { val: "365", lbl: "Immeubles patrimoniaux", txt: "Tous types d’immeubles à Paris et Hauts-de-Seine" },
  { val: "1372", lbl: "Investissements", txt: "Immeubles loués ou non, avec ou sans travaux, partout en France" },
  { val: "359", lbl: "Opérations marchandes", txt: "Immeubles vides ou à rénover en Île-de-France" },
] as const;
