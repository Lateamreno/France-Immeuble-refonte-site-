/**
 * Le lexique de l'immeuble de rapport (lot 142, MAV, 19/11/2026 : « il faut qu'on créé une page lexique.
 * D'ailleurs j'avais déjà un lexique mais tu peux rajouter toi même »).
 *
 * `origine` : « mav » pour les mots du lexique de MAV, réécrits (fautes, style du site, chiffres datés mis à
 * jour : trêve hivernale, taxe sur les bureaux, logements vacants, délai de rétractation) ; « ajout » pour les
 * mots ajoutés, tirés de ce que le site dit déjà et que MAV a validé (FAQ Paris, barème, baromètre).
 *
 * Les définitions sont lues par Google (texte de la page et données DefinedTermSet) : pas de chiffre propre à
 * une vente, pas de promesse de délai.
 */
export type Terme = {
  /** Ancre de la définition : /lexique/#{id}. */
  id: string;
  terme: string;
  /** Autre nom, cherché par le filtre et affiché sous le terme. */
  aussi?: string;
  texte: string[];
  formule?: string;
  /** Encadré « Bon à savoir » ou « À ne pas confondre ». */
  note?: { titre: string; texte: string };
  voir?: string[];
  lire?: { href: string; titre: string };
  origine: "mav" | "ajout";
};

const BAROMETRE = { href: "/prix-immeuble-de-rapport-paris/", titre: "Prix des immeubles de rapport à Paris, année par année" };

export const LEXIQUE: Terme[] = [
  {
    id: "acte-authentique",
    terme: "Acte authentique",
    aussi: "acte de vente, acte définitif",
    texte: [
      "Acte de vente signé chez le notaire, qui transfère la propriété de l’immeuble à l’acheteur. Le prix est payé ce jour-là, et les honoraires de l’agence deviennent dus. Il suit l’avant-contrat, une fois les conditions suspensives levées.",
    ],
    voir: ["avant-contrat", "honoraires", "frais-de-notaire"],
    origine: "ajout",
  },
  {
    id: "article-606",
    terme: "Article 606 du Code civil",
    aussi: "grosses réparations",
    texte: [
      "Article qui définit les grosses réparations d’un immeuble : celles des gros murs et des voûtes, le rétablissement des poutres et des couvertures entières, celui des digues et des murs de soutènement et de clôture, aussi en entier. Toutes les autres réparations sont d’entretien.",
      "Dans un bail commercial signé ou renouvelé depuis novembre 2014, ces grosses réparations restent à la charge du bailleur : la loi Pinel interdit de les refacturer au locataire. En cas de démembrement, elles reviennent au nu-propriétaire, l’usufruitier gardant l’entretien.",
    ],
    voir: ["bail-commercial", "provision-sur-charges", "nue-propriete"],
    origine: "mav",
  },
  {
    id: "assurance-loyers-impayes",
    terme: "Assurance loyers impayés (GLI)",
    aussi: "garantie loyers impayés",
    texte: [
      "Assurance prise par le bailleur, qui le couvre si le locataire ne paie plus son loyer, en général jusqu’à son départ ou son expulsion, et souvent pour les frais de procédure. L’assureur fixe les revenus et les pièces exigés pour accepter un locataire.",
    ],
    voir: ["bail", "treve-hivernale"],
    origine: "mav",
  },
  {
    id: "audit-energetique",
    terme: "Audit énergétique",
    texte: [
      "Étude obligatoire pour vendre un logement individuel ou un immeuble d’un seul propriétaire classé E, F ou G au DPE. Elle propose des travaux par étapes pour améliorer la classe du bâtiment et en donne le coût. Elle est remise à l’acheteur dès la première visite.",
    ],
    voir: ["dpe", "monopropriete"],
    origine: "ajout",
  },
  {
    id: "autofinancement",
    terme: "Autofinancement",
    texte: [
      "Un immeuble s’autofinance quand ses loyers nets couvrent les mensualités du crédit, les charges et les taxes. L’investisseur n’a alors rien à ajouter de sa poche chaque mois.",
    ],
    voir: ["cash-flow", "rentabilite-nette"],
    origine: "mav",
  },
  {
    id: "avant-contrat",
    terme: "Avant-contrat",
    texte: [
      "Contrat signé après une offre acceptée, chez le notaire ou en agence, qui fixe l’accord du vendeur et de l’acheteur avant l’acte authentique : le prix, les conditions suspensives, la date de signature de l’acte. Il prend la forme d’un compromis ou d’une promesse de vente.",
    ],
    voir: ["compromis-de-vente", "promesse-de-vente", "condition-suspensive", "acte-authentique"],
    origine: "mav",
  },
  {
    id: "bail",
    terme: "Bail",
    texte: [
      "Contrat de location qui lie un propriétaire, le bailleur, à son locataire. Sa durée et ses règles dépendent du local : un logement loué vide l’est pour trois ans au moins si le bailleur est un particulier, six ans si c’est une société ; un logement meublé pour un an ; un local commercial pour neuf ans.",
    ],
    voir: ["bailleur", "bail-commercial", "etat-locatif"],
    origine: "mav",
  },
  {
    id: "bail-commercial",
    terme: "Bail commercial",
    aussi: "bail 3-6-9",
    texte: [
      "Bail d’un local où le locataire exploite un commerce, un artisanat ou une industrie. Il dure neuf ans au moins, d’où son nom de bail 3-6-9 : le locataire peut partir à la fin de chaque période de trois ans. À la fin du bail, il a droit au renouvellement ; le bailleur qui le refuse lui doit en général une indemnité d’éviction.",
    ],
    voir: ["ilc", "article-606", "emplacement-numero-1"],
    origine: "ajout",
  },
  {
    id: "bailleur",
    terme: "Bailleur",
    aussi: "propriétaire bailleur",
    texte: ["Propriétaire qui loue son bien à un locataire par un bail."],
    voir: ["bail"],
    origine: "mav",
  },
  {
    id: "bon-de-visite",
    terme: "Bon de visite",
    texte: [
      "Document signé par le visiteur, qui atteste qu’il a visité tel immeuble, avec tel intermédiaire, à telle date. Il permet à l’agence de prouver qu’elle a présenté l’acheteur si la vente se fait ensuite sans elle.",
    ],
    voir: ["mandat"],
    origine: "mav",
  },
  {
    id: "cash-flow",
    terme: "Cash-flow",
    texte: [
      "Ce qui reste à l’investisseur une fois payés les mensualités du crédit, les charges et les taxes. C’est l’argent que l’immeuble lui rapporte vraiment, chaque mois ou chaque année. Positif, l’immeuble s’autofinance ; négatif, l’investisseur complète de sa poche.",
    ],
    voir: ["autofinancement"],
    origine: "mav",
  },
  {
    id: "charges-non-recuperables",
    terme: "Charges non récupérables",
    aussi: "charges non déductibles",
    texte: [
      "Charges payées par le propriétaire qu’il ne peut pas refacturer à son locataire : grosses réparations, assurance du propriétaire, frais de gestion, taxe foncière d’un logement. Ce sont elles qu’on retire des loyers pour calculer la rentabilité nette.",
    ],
    voir: ["provision-sur-charges", "rentabilite-nette"],
    origine: "mav",
  },
  {
    id: "compromis-de-vente",
    terme: "Compromis de vente",
    aussi: "promesse synallagmatique",
    texte: [
      "Avant-contrat par lequel le vendeur s’engage à vendre et l’acheteur à acheter, à un prix fixé, sous réserve des conditions suspensives. L’acheteur verse en général un dépôt de garantie, gardé par le notaire.",
    ],
    voir: ["avant-contrat", "promesse-de-vente", "delai-de-retractation"],
    origine: "ajout",
  },
  {
    id: "condition-suspensive",
    terme: "Condition suspensive",
    texte: [
      "Clause d’une offre ou d’un avant-contrat qui fait tomber la vente si un événement prévu ne se produit pas avant l’acte. Chacun reprend alors sa liberté, et l’acheteur récupère les sommes versées.",
      "Les plus courantes : l’obtention du prêt de l’acheteur, l’absence de préemption, un état hypothécaire qui ne dépasse pas le prix, et pour un promoteur ou un marchand de biens, l’obtention d’un permis de construire. La condition de prêt est imposée par la loi quand un acquéreur non professionnel emprunte pour acheter un immeuble d’habitation ou mixte.",
    ],
    voir: ["avant-contrat", "offre-d-achat", "preemption"],
    origine: "mav",
  },
  {
    id: "conge-pour-vendre",
    terme: "Congé pour vendre",
    texte: [
      "Congé que le bailleur d’un logement loué vide donne à son locataire pour vendre le logement libre, au moins six mois avant la fin du bail. Il vaut offre de vente au locataire, qui a deux mois pour l’accepter.",
      "Il est encadré : un locataire de plus de 65 ans aux ressources modestes doit se voir proposer un relogement, et celui qui achète un logement déjà loué doit parfois attendre la fin du bail suivant pour le donner.",
    ],
    voir: ["preemption", "bail"],
    origine: "ajout",
  },
  {
    id: "copropriete",
    terme: "Copropriété",
    texte: [
      "Immeuble divisé en lots, chacun appartenant à un propriétaire, avec une part des parties communes. Elle est régie par un règlement de copropriété et un état descriptif de division, et gérée par un syndic. Un immeuble de rapport vendu à la découpe devient une copropriété.",
    ],
    voir: ["etat-descriptif-de-division", "vente-a-la-decoupe", "monopropriete"],
    origine: "ajout",
  },
  {
    id: "core",
    terme: "Core et core plus",
    texte: [
      "Mots des fonds d’investissement, qui classent les immeubles selon le risque accepté. Core : un immeuble très bien situé, en bon état et entièrement loué au prix du marché ; l’acheteur accepte un rendement plus faible en échange de revenus sûrs. Core plus : un immeuble proche du core, avec un peu de valeur à créer, par exemple quelques travaux ou des logements à relouer.",
    ],
    voir: ["value-add", "locataire-aaa"],
    origine: "ajout",
  },
  {
    id: "decote",
    terme: "Décote",
    texte: [
      "Écart entre le prix au m² d’un immeuble vendu en bloc et celui des appartements vendus un à un dans le même secteur. L’acheteur d’un immeuble entier paie moins cher au m² : il achète des logements loués, prend en charge la gestion et les travaux, et paiera des frais pour revendre au détail. À Paris, elle est le plus souvent de 10 à 30 %.",
    ],
    voir: ["prix-au-m2", "vente-en-bloc", "dvf"],
    lire: BAROMETRE,
    origine: "ajout",
  },
  {
    id: "declaration-d-intention-d-aliener",
    terme: "Déclaration d’intention d’aliéner (DIA)",
    texte: [
      "Déclaration que le notaire envoie avant la vente à la commune, ou à la collectivité qui détient le droit de préemption, pour qu’elle puisse acheter à la place de l’acquéreur, au prix et aux conditions de la vente. Elle a deux mois pour répondre ; sans réponse, elle renonce. À Paris, c’est la Ville qui la reçoit.",
    ],
    voir: ["preemption", "condition-suspensive"],
    origine: "mav",
  },
  {
    id: "delai-de-retractation",
    terme: "Délai de rétractation",
    texte: [
      "Délai de dix jours pendant lequel un acquéreur non professionnel peut renoncer à acheter un bien à usage d’habitation, sans motif ni pénalité (article L271-1 du Code de la construction et de l’habitation). Il court à partir du lendemain de la remise ou de la notification de l’avant-contrat, et les sommes versées lui sont rendues.",
      "Un acheteur professionnel, comme un marchand de biens, n’en bénéficie pas, ni l’acheteur de murs commerciaux.",
    ],
    voir: ["avant-contrat", "indemnite-d-immobilisation"],
    origine: "mav",
  },
  {
    id: "delegation-de-mandat",
    terme: "Délégation de mandat",
    texte: [
      "Accord par lequel l’agence qui a reçu le mandat de vente confie à une autre agence la recherche d’un acquéreur, quand le mandat le permet. Les deux agences se partagent les honoraires : le vendeur ne paie pas plus.",
    ],
    voir: ["mandat", "honoraires"],
    lire: { href: "/delegation-de-mandat-pourquoi-y-recourir/", titre: "Délégation de mandat : pourquoi y recourir ?" },
    origine: "mav",
  },
  {
    id: "demembrement",
    terme: "Démembrement de propriété",
    texte: [
      "Partage de la pleine propriété d’un bien en deux droits détenus par des personnes différentes : la nue-propriété et l’usufruit. Il naît le plus souvent d’une donation ou d’une succession, et prend fin au décès de l’usufruitier ou au terme fixé. Le nu-propriétaire devient alors plein propriétaire.",
    ],
    voir: ["nue-propriete", "usufruit", "pleine-propriete"],
    origine: "mav",
  },
  {
    id: "dpe",
    terme: "DPE",
    aussi: "diagnostic de performance énergétique",
    texte: [
      "Diagnostic de performance énergétique. Il classe un logement de A à G selon sa consommation d’énergie et ses émissions de gaz à effet de serre. Depuis 2025, un logement classé G ne peut plus faire l’objet d’un nouveau bail ; les logements classés F suivront en 2028 et E en 2034. Un DPE fait depuis juillet 2021 est valable dix ans.",
    ],
    voir: ["audit-energetique", "revision-de-loyer"],
    lire: { href: "/vendre-un-immeuble-avec-un-mauvais-dpe/", titre: "Vendre un immeuble avec un mauvais DPE" },
    origine: "ajout",
  },
  {
    id: "dvf",
    terme: "DVF",
    aussi: "demandes de valeurs foncières",
    texte: [
      "Demandes de valeurs foncières : les ventes immobilières enregistrées par l’administration fiscale, publiées en données ouvertes. On y trouve pour chaque vente la date, le prix, la commune, la nature et la surface des locaux, mais ni le nom des parties ni le loyer. Nos prix des immeubles à Paris en sont tirés.",
    ],
    voir: ["prix-au-m2", "decote", "rendement-theorique"],
    lire: BAROMETRE,
    origine: "ajout",
  },
  {
    id: "emplacement-numero-1",
    terme: "Emplacement n° 1",
    aussi: "numéro 1",
    texte: [
      "Le meilleur emplacement commercial d’une ville ou d’un quartier : la rue la plus passante, l’axe principal, la sortie d’une gare. Les loyers des commerces y sont les plus élevés, et les locaux s’y relouent le plus vite.",
    ],
    voir: ["bail-commercial"],
    origine: "mav",
  },
  {
    id: "encadrement-des-loyers",
    terme: "Encadrement des loyers",
    texte: [
      "À Paris, pour un logement loué vide ou meublé dont le bail est signé ou renouvelé depuis le 1er juillet 2019, le loyer hors charges ne peut pas dépasser un loyer de référence majoré, fixé chaque année par arrêté préfectoral selon le quartier, le nombre de pièces, l’époque de construction et le type de location. D’autres villes l’appliquent aussi.",
    ],
    voir: ["loyer-hors-charges", "loi-de-1948"],
    origine: "ajout",
  },
  {
    id: "etat-descriptif-de-division",
    terme: "État descriptif de division",
    texte: [
      "Document qui découpe un immeuble en lots numérotés, avec pour chacun ses parties privatives et sa part des parties communes. Établi par un géomètre et publié avec le règlement de copropriété, il est la première étape d’une vente à la découpe.",
    ],
    voir: ["copropriete", "vente-a-la-decoupe"],
    origine: "ajout",
  },
  {
    id: "etat-locatif",
    terme: "État locatif",
    texte: [
      "Tableau qui décrit chaque lot d’un immeuble loué : type, surface, loyer, charges, date et nature du bail, échéance, dépôt de garantie. C’est la première pièce que demande un acheteur, avec les baux : la valeur d’un immeuble de rapport dépend d’abord de ses loyers.",
    ],
    voir: ["bail", "loyer-hors-charges", "rentabilite"],
    origine: "ajout",
  },
  {
    id: "forfait-de-charges",
    terme: "Forfait de charges",
    texte: [
      "Somme fixe payée chaque mois par le locataire pour les charges, à la place d’une provision. La loi ne l’autorise que pour une location meublée ou une colocation. Il n’y a pas de régularisation : si le locataire consomme plus que prévu, le bailleur paie la différence.",
      "Le forfait est donc fixé un peu au-dessus des charges attendues, sans pouvoir être disproportionné, et il se révise comme le loyer si le bail le prévoit.",
    ],
    voir: ["provision-sur-charges", "regularisation-de-charges"],
    origine: "mav",
  },
  {
    id: "frais-de-notaire",
    terme: "Frais de notaire",
    texte: [
      "Sommes payées par l’acheteur en plus du prix, à la signature de l’acte. Dans l’ancien, elles font environ 7 à 8 % du prix, dont l’essentiel en droits de mutation reversés aux collectivités et à l’État ; la rémunération du notaire n’en est qu’une petite part. Un marchand de biens qui s’engage à revendre dans les cinq ans paie des droits réduits.",
    ],
    voir: ["prix-aem", "marchand-de-biens"],
    origine: "ajout",
  },
  {
    id: "honoraires",
    terme: "Honoraires",
    texte: [
      "Rémunération de l’agent immobilier pour la vente, fixée dans le mandat. Elle n’est due qu’à la signature de l’acte authentique chez le notaire : tant que la vente n’est pas signée, rien n’est dû. Le mandat dit qui la paie, le vendeur ou l’acquéreur.",
    ],
    voir: ["mandat", "prix-hai", "acte-authentique"],
    lire: { href: "/nos-honoraires/", titre: "Le barème de nos honoraires" },
    origine: "mav",
  },
  {
    id: "ilat",
    terme: "ILAT",
    aussi: "indice des loyers des activités tertiaires",
    texte: [
      "Indice des loyers des activités tertiaires, publié chaque trimestre par l’Insee. Il sert à réviser le loyer des bureaux, des locaux d’activité et des entrepôts.",
    ],
    voir: ["indice-de-revision", "revision-de-loyer"],
    origine: "mav",
  },
  {
    id: "ilc",
    terme: "ILC",
    aussi: "indice des loyers commerciaux",
    texte: [
      "Indice des loyers commerciaux, publié chaque trimestre par l’Insee. Il sert à réviser le loyer des commerces, y compris ceux des artisans.",
    ],
    voir: ["indice-de-revision", "bail-commercial"],
    origine: "mav",
  },
  {
    id: "immeuble-de-rapport",
    terme: "Immeuble de rapport",
    texte: [
      "Immeuble entier qui appartient à un seul propriétaire et lui rapporte des loyers : en général plusieurs logements, parfois avec des commerces ou des bureaux. Il se vend en bloc, à un investisseur ou à un marchand de biens, ou à la découpe, lot par lot.",
    ],
    voir: ["vente-en-bloc", "vente-a-la-decoupe", "monopropriete"],
    lire: { href: "/comment-vendre-un-immeuble-de-rapport/", titre: "Comment vendre un immeuble de rapport ?" },
    origine: "ajout",
  },
  {
    id: "indemnite-d-immobilisation",
    terme: "Indemnité d’immobilisation",
    texte: [
      "Somme prévue par la promesse de vente, que le vendeur garde si l’acquéreur renonce à acheter sans raison prévue par la loi ou par la promesse : elle le protège contre un changement d’avis. Elle est en général de 10 % du prix, et l’acquéreur en verse souvent la moitié à la signature. Le notaire la conserve.",
      "Si la vente se fait, elle est déduite du prix. Si une condition suspensive ne se réalise pas, ou si l’acquéreur non professionnel se rétracte dans ses dix jours, elle lui est rendue.",
    ],
    note: { titre: "Bon à savoir", texte: "Son montant se négocie, parfois jusqu’à zéro." },
    voir: ["promesse-de-vente", "condition-suspensive", "delai-de-retractation"],
    origine: "mav",
  },
  {
    id: "indice-de-revision",
    terme: "Indice de révision",
    texte: [
      "Indice publié chaque trimestre par l’Insee, qui sert à réviser les loyers. Le bail dit lequel s’applique : l’IRL pour un logement, l’ILC pour un commerce, l’ILAT pour des bureaux.",
    ],
    voir: ["irl", "ilc", "ilat", "revision-de-loyer"],
    origine: "mav",
  },
  {
    id: "indivisaire",
    terme: "Indivisaire",
    texte: ["Chacun des propriétaires d’un bien en indivision. Il détient une part du bien entier, et non une partie précise de l’immeuble."],
    voir: ["indivision"],
    origine: "mav",
  },
  {
    id: "indivision",
    terme: "Indivision",
    texte: [
      "Situation de plusieurs personnes propriétaires ensemble d’un même bien, chacune pour une part, égale ou non. Elle naît souvent d’une succession ou d’une donation, mais aussi d’un achat à plusieurs sans société. Chaque indivisaire peut détenir sa part en pleine propriété, en nue-propriété ou en usufruit.",
      "Pour vendre l’immeuble, il faut en principe l’accord de tous. Des indivisaires qui détiennent ensemble au moins les deux tiers peuvent toutefois demander au tribunal d’autoriser la vente aux enchères (article 815-5-1 du Code civil) : nul n’est obligé de rester en indivision.",
    ],
    note: { titre: "À ne pas confondre", texte: "Avec la copropriété, où chacun possède un lot distinct dans le même immeuble." },
    voir: ["indivisaire", "sci", "copropriete"],
    origine: "mav",
  },
  {
    id: "irl",
    terme: "IRL",
    aussi: "indice de référence des loyers",
    texte: [
      "Indice de référence des loyers, publié chaque trimestre par l’Insee. Il sert à réviser le loyer des logements loués vides ou meublés : sa hausse sur un an fixe la hausse maximale du loyer à la révision.",
    ],
    voir: ["indice-de-revision", "revision-de-loyer"],
    origine: "mav",
  },
  {
    id: "locataire-aaa",
    terme: "Locataire AAA",
    texte: [
      "Locataire à la solidité financière reconnue : grande banque, assureur, enseigne nationale, administration. Un bail signé avec lui rend les revenus de l’immeuble plus sûrs, et les acheteurs acceptent pour cela un rendement plus faible.",
    ],
    voir: ["core", "bail-commercial"],
    origine: "mav",
  },
  {
    id: "loi-aurillac",
    terme: "Loi Aurillac",
    texte: [
      "Loi du 13 juin 2006 qui protège les locataires quand un immeuble de plus de cinq logements, d’habitation ou mixte, est vendu en totalité et en une seule fois. Chaque locataire a alors un droit de préemption sur son logement, sauf si l’acheteur s’engage dans l’acte à proroger les baux en cours pendant six ans à compter de la vente. C’est la solution courante dans une vente en bloc à un investisseur.",
    ],
    voir: ["preemption", "vente-en-bloc"],
    lire: { href: "/droit-de-preemption-lors-de-la-vente-dun-immeuble-en-bloc/", titre: "Droit de préemption lors de la vente d’un immeuble en bloc" },
    origine: "ajout",
  },
  {
    id: "loi-de-1948",
    terme: "Loi de 1948",
    texte: [
      "Quelques logements d’immeubles anciens restent soumis à la loi du 1er septembre 1948, pour des baux signés avant 1987. Le loyer y est réglementé et souvent très inférieur au marché, et le locataire a un droit au maintien dans les lieux. Un acheteur valorise donc ce logement sur son loyer actuel, ce qui pèse sur le prix de l’immeuble.",
    ],
    voir: ["etat-locatif", "encadrement-des-loyers"],
    origine: "ajout",
  },
  {
    id: "loyer-hors-charges",
    terme: "Loyer hors charges",
    aussi: "loyer HC",
    texte: [
      "Somme que le locataire paie au bailleur pour occuper le local, sans les charges ni les taxes qu’il rembourse à côté. C’est le loyer qui sert à calculer la rentabilité d’un immeuble.",
    ],
    voir: ["rentabilite-brute", "provision-sur-charges"],
    origine: "mav",
  },
  {
    id: "mandant",
    terme: "Mandant",
    texte: ["Le propriétaire, particulier ou société, qui confie la vente de son bien à un intermédiaire par un mandat."],
    voir: ["mandat", "mandataire"],
    origine: "mav",
  },
  {
    id: "mandat",
    terme: "Mandat",
    texte: [
      "Contrat par lequel un propriétaire, le mandant, charge un intermédiaire, le mandataire, de vendre son bien. Pour un agent immobilier, il est obligatoirement écrit (loi Hoguet). Il fixe le prix, la durée, les honoraires et qui les paie. Il peut être simple, semi-exclusif ou exclusif.",
    ],
    voir: ["mandat-simple", "mandat-semi-exclusif", "mandat-exclusif", "honoraires"],
    origine: "mav",
  },
  {
    id: "mandat-exclusif",
    terme: "Mandat exclusif",
    texte: [
      "Une seule agence est chargée de la vente pendant la durée du mandat, et le propriétaire ne peut pas vendre sans elle. Après trois mois, il peut y mettre fin à tout moment avec un préavis de quinze jours.",
    ],
    voir: ["mandat", "mandat-semi-exclusif"],
    origine: "ajout",
  },
  {
    id: "mandat-semi-exclusif",
    terme: "Mandat semi-exclusif",
    texte: [
      "Une seule agence est chargée de la vente, mais le propriétaire garde le droit de vendre lui-même à un acheteur qu’il trouve sans intermédiaire.",
    ],
    voir: ["mandat", "mandat-exclusif", "mandat-simple"],
    origine: "ajout",
  },
  {
    id: "mandat-simple",
    terme: "Mandat simple",
    texte: [
      "Le propriétaire peut confier la vente à plusieurs agences en même temps et vendre lui-même. Seule l’agence qui trouve l’acquéreur est payée.",
    ],
    voir: ["mandat", "delegation-de-mandat"],
    origine: "ajout",
  },
  {
    id: "mandataire",
    terme: "Mandataire",
    texte: ["L’intermédiaire, en général une agence immobilière, chargé par le mandant de vendre son bien."],
    voir: ["mandat", "mandant"],
    origine: "mav",
  },
  {
    id: "marchand-de-biens",
    terme: "Marchand de biens",
    texte: [
      "Professionnel qui achète des biens pour les revendre, souvent après travaux ou découpe en lots. Il paie des frais d’acquisition réduits s’il s’engage à revendre dans les cinq ans. Il s’intéresse surtout aux immeubles mal loués ou à gros travaux : pour un immeuble loué au prix du marché, c’est en général un investisseur qui fait la meilleure offre.",
    ],
    voir: ["portage", "vente-a-la-decoupe", "value-add"],
    origine: "ajout",
  },
  {
    id: "moins-value",
    terme: "Moins-value",
    texte: [
      "Perte réalisée quand un bien se vend moins cher qu’il n’a été acheté. Elle peut venir d’une dégradation du bien, d’une baisse de la demande, ou d’une hausse des taux qui fait monter le rendement attendu par les acheteurs.",
    ],
    voir: ["plus-value"],
    origine: "mav",
  },
  {
    id: "monopropriete",
    terme: "Monopropriété",
    texte: [
      "Immeuble qui appartient à un seul propriétaire, une personne, une indivision ou une société, sans être divisé en lots de copropriété. C’est le cas de la plupart des immeubles de rapport.",
    ],
    voir: ["immeuble-de-rapport", "copropriete"],
    origine: "ajout",
  },
  {
    id: "nu-proprietaire",
    terme: "Nu-propriétaire",
    texte: ["Celui qui détient la nue-propriété d’un bien."],
    voir: ["nue-propriete", "usufruitier"],
    origine: "mav",
  },
  {
    id: "nue-propriete",
    terme: "Nue-propriété",
    texte: [
      "Droit de propriété sur un bien, sans le droit de l’habiter ni d’en toucher les loyers, qui reviennent à l’usufruitier. Le nu-propriétaire paie les grosses réparations de l’article 606 du Code civil. À la fin de l’usufruit, il devient plein propriétaire.",
    ],
    voir: ["demembrement", "usufruit", "article-606"],
    origine: "mav",
  },
  {
    id: "off-market",
    terme: "Off-market",
    texte: [
      "Vente sans annonce publique : l’immeuble est présenté directement aux acheteurs dont la recherche correspond. Le vendeur garde la discrétion vis-à-vis de ses locataires et du marché, et l’immeuble ne s’use pas sur les sites d’annonces. Chez France Immeuble, 100 % des immeubles sont d’abord proposés en off-market.",
    ],
    voir: ["vente-en-bloc", "mandat"],
    lire: { href: "/immobilier-off-market-tout-ce-quil-faut-savoir/", titre: "Immobilier off market : tout ce qu’il faut savoir" },
    origine: "ajout",
  },
  {
    id: "offre-d-achat",
    terme: "Offre d’achat",
    texte: [
      "Proposition écrite d’un acheteur au vendeur : prix, conditions suspensives, financement, durée de validité. Acceptée, elle mène à l’avant-contrat. Une offre sans condition de financement est plus solide, mais elle ne veut pas dire que l’acheteur paie comptant.",
    ],
    voir: ["avant-contrat", "condition-suspensive"],
    origine: "ajout",
  },
  {
    id: "pleine-propriete",
    terme: "Pleine propriété",
    texte: [
      "Propriété complète d’un bien, qui réunit la nue-propriété et l’usufruit : le droit d’en disposer, de l’utiliser et d’en toucher les loyers.",
    ],
    voir: ["demembrement"],
    origine: "mav",
  },
  {
    id: "plus-value",
    terme: "Plus-value",
    texte: [
      "Gain réalisé quand un bien se vend plus cher qu’il n’a été acheté. Pour un particulier, la plus-value sur un immeuble de rapport est imposée, avec un abattement qui grandit avec les années de détention : elle est exonérée d’impôt sur le revenu après 22 ans et de prélèvements sociaux après 30 ans.",
    ],
    voir: ["moins-value", "sci"],
    origine: "mav",
  },
  {
    id: "portage",
    terme: "Portage",
    texte: [
      "Temps qui sépare l’achat d’un bien de sa revente par un marchand de biens. Il y fait les travaux, obtient le départ des locataires quand la loi le permet et vend les lots. Plus il dure, plus l’opération coûte : intérêts, taxes, charges.",
    ],
    voir: ["marchand-de-biens"],
    origine: "mav",
  },
  {
    id: "preemption",
    terme: "Préemption",
    aussi: "droit de préemption",
    texte: [
      "Droit d’acheter en priorité, au prix et aux conditions d’une vente, que la loi donne à certaines collectivités et, dans certains cas, aux locataires. La commune l’exerce par le droit de préemption urbain, après la déclaration d’intention d’aliéner.",
      "Un locataire l’a sur son logement en cas de congé pour vendre, lors de la première vente d’un logement après la mise en copropriété, et lors de la vente en bloc d’un immeuble de plus de cinq logements si l’acheteur ne s’engage pas à proroger les baux.",
    ],
    voir: ["declaration-d-intention-d-aliener", "loi-aurillac", "conge-pour-vendre"],
    lire: { href: "/droit-de-preemption-lors-de-la-vente-dun-immeuble-en-bloc/", titre: "Droit de préemption lors de la vente d’un immeuble en bloc" },
    origine: "mav",
  },
  {
    id: "prix-aem",
    terme: "Prix AEM (acte en main)",
    texte: [
      "Ce que l’acheteur paie en tout : le prix, les honoraires de l’agence et les frais de notaire.",
    ],
    formule: "Prix AEM = prix HAI + frais de notaire",
    voir: ["prix-hai", "frais-de-notaire", "rentabilite-nette-acte-en-main"],
    origine: "mav",
  },
  {
    id: "prix-au-m2",
    terme: "Prix au m²",
    texte: [
      "Prix d’un bien divisé par sa surface. Pour un immeuble de rapport, il compte moins que le rendement : deux immeubles de même surface peuvent valoir des prix très différents selon leurs loyers, leurs baux et leurs travaux. Il sert surtout à comparer avec les ventes voisines.",
    ],
    voir: ["decote", "rentabilite", "dvf"],
    lire: BAROMETRE,
    origine: "ajout",
  },
  {
    id: "prix-hai",
    terme: "Prix HAI (honoraires d’agence inclus)",
    texte: [
      "Prix affiché quand les honoraires sont à la charge de l’acquéreur. Il comprend les honoraires de l’agence, mais pas les frais de notaire.",
    ],
    formule: "Prix HAI = prix net vendeur + honoraires d’agence",
    voir: ["prix-net-vendeur", "prix-aem", "honoraires"],
    origine: "mav",
  },
  {
    id: "prix-net-vendeur",
    terme: "Prix net vendeur (NV)",
    texte: ["Ce que touche le vendeur, sans les honoraires de l’agence ni les frais de notaire."],
    voir: ["prix-hai", "prix-aem"],
    origine: "mav",
  },
  {
    id: "promesse-de-vente",
    terme: "Promesse de vente",
    aussi: "promesse unilatérale de vente",
    texte: [
      "Avant-contrat par lequel le vendeur s’engage à vendre à un prix fixé, pendant un délai donné, à un acheteur qui reste libre de confirmer son achat. En contrepartie de cette exclusivité, l’acheteur doit une indemnité d’immobilisation s’il renonce sans raison prévue.",
    ],
    voir: ["avant-contrat", "compromis-de-vente", "indemnite-d-immobilisation"],
    origine: "ajout",
  },
  {
    id: "provision-sur-charges",
    terme: "Provision sur charges et taxes",
    texte: [
      "Avance que le locataire verse chaque mois, avec son loyer, sur les charges et taxes que le propriétaire lui refacture. Elle se calcule en général sur les dépenses de l’année précédente et se régularise au moins une fois par an.",
      "Pour un logement, la liste des charges récupérables est fixée par décret (n° 87-713 du 26 août 1987). Pour un bail commercial, c’est le bail qui la fixe, dans les limites de la loi Pinel : les grosses réparations de l’article 606 du Code civil, par exemple, restent au bailleur.",
    ],
    voir: ["regularisation-de-charges", "forfait-de-charges", "charges-non-recuperables"],
    origine: "mav",
  },
  {
    id: "regularisation-de-charges",
    terme: "Régularisation de charges et taxes",
    texte: [
      "Comparaison, faite une fois par an, entre les provisions versées par le locataire et les charges réellement payées par le propriétaire. Si les provisions ne suffisent pas, le bailleur demande la différence ; si elles dépassent, il la rembourse. Les provisions sont ensuite ajustées pour que l’écart soit faible l’année suivante.",
    ],
    voir: ["provision-sur-charges"],
    origine: "mav",
  },
  {
    id: "rendement-theorique",
    terme: "Rendement théorique",
    texte: [
      "Rendement qu’aurait un immeuble si tous ses logements étaient loués au loyer de marché de l’année. Nos tableaux de prix à Paris l’utilisent pour comparer les arrondissements. Le rendement réel se calcule avec les baux de l’immeuble.",
    ],
    formule: "Loyer de marché au m² × surface × 12 ÷ prix",
    voir: ["rentabilite-brute", "dvf"],
    lire: BAROMETRE,
    origine: "ajout",
  },
  {
    id: "rentabilite",
    terme: "Rentabilité",
    aussi: "rendement",
    texte: [
      "Rapport entre les loyers d’un immeuble et son prix, en pourcentage. On dit aussi rendement. On distingue la rentabilité brute, la rentabilité nette et la rentabilité nette acte en main. Un immeuble vendu en bloc se valorise d’abord au rendement attendu par les acheteurs de son secteur.",
    ],
    voir: ["rentabilite-brute", "rentabilite-nette", "rentabilite-nette-acte-en-main"],
    lire: { href: "/comment-estimer-un-immeuble-de-rapport/", titre: "Comment estimer un immeuble de rapport ?" },
    origine: "mav",
  },
  {
    id: "rentabilite-brute",
    terme: "Rentabilité brute",
    texte: ["Exemple : 60 000 € de loyers par an pour un immeuble à 1 200 000 € donnent une rentabilité brute de 5 %."],
    formule: "Loyers HC annuels ÷ prix HAI × 100",
    voir: ["rentabilite-nette", "loyer-hors-charges"],
    origine: "mav",
  },
  {
    id: "rentabilite-nette",
    terme: "Rentabilité nette",
    texte: [
      "Elle retire des loyers ce que le propriétaire paie sans pouvoir le refacturer : taxe foncière d’un logement, assurance, gestion, entretien.",
    ],
    formule: "(Loyers HC − charges non récupérables) ÷ prix HAI × 100",
    voir: ["charges-non-recuperables", "rentabilite-nette-acte-en-main"],
    origine: "mav",
  },
  {
    id: "rentabilite-nette-acte-en-main",
    terme: "Rentabilité nette acte en main (NAEM)",
    texte: [
      "La plus juste pour un acheteur : elle rapporte le revenu net à ce qu’il paie vraiment, frais de notaire compris.",
    ],
    formule: "(Loyers HC − charges non récupérables) ÷ prix AEM × 100",
    voir: ["prix-aem", "rentabilite-nette"],
    origine: "mav",
  },
  {
    id: "revision-de-loyer",
    terme: "Révision de loyer",
    texte: [
      "Hausse du loyer hors charges selon la variation de l’indice prévu par le bail : IRL pour un logement, ILC pour un commerce, ILAT pour des bureaux. Pour un logement, elle n’a lieu que si le bail la prévoit, une fois par an. Pour un commerce, le bail prévoit en général une indexation chaque année ; à défaut, la loi permet une révision tous les trois ans.",
      "Depuis le 24 août 2022, le loyer d’un logement classé F ou G au DPE ne peut plus être révisé ni augmenté.",
    ],
    voir: ["indice-de-revision", "irl", "dpe"],
    origine: "mav",
  },
  {
    id: "sci",
    terme: "SCI",
    aussi: "société civile immobilière",
    texte: [
      "Société civile immobilière : une société qui achète et gère un ou plusieurs biens pour ses associés. Elle est soumise à l’impôt sur le revenu de chaque associé, ou à l’impôt sur les sociétés si elle le choisit. Elle évite l’indivision et facilite la transmission, par exemple par donation de parts.",
    ],
    voir: ["indivision", "plus-value"],
    origine: "mav",
  },
  {
    id: "surface-carrez",
    terme: "Surface Carrez",
    texte: [
      "Surface privative d’un lot de copropriété, mesurée sans les murs, cloisons, escaliers, ni les parties de moins de 1,80 m de hauteur, caves et parkings. Elle doit figurer dans l’avant-contrat et l’acte de vente d’un lot : si la surface réelle est inférieure de plus de 5 %, l’acheteur peut obtenir une baisse du prix dans l’année.",
      "Elle ne s’impose pas pour un immeuble entier vendu en bloc, mais les acheteurs la demandent pour chaque logement.",
    ],
    voir: ["copropriete", "etat-locatif"],
    origine: "ajout",
  },
  {
    id: "taxe-fonciere",
    terme: "Taxe foncière",
    texte: [
      "Impôt local payé chaque année par celui qui est propriétaire du bien au 1er janvier, bâti ou non. Son montant dépend de la valeur locative du bien et des taux votés par la commune. En cas de démembrement, l’usufruitier la paie. Lors d’une vente, l’acte prévoit en général que l’acheteur rembourse au vendeur la part de l’année qui suit la vente.",
      "Elle peut être refacturée au locataire d’un bail commercial si le bail le prévoit. Pour un logement, seule la taxe d’enlèvement des ordures ménagères, qui figure sur le même avis, est refacturable.",
    ],
    voir: ["charges-non-recuperables", "usufruitier"],
    origine: "mav",
  },
  {
    id: "thlv",
    terme: "Taxe d’habitation sur les logements vacants (THLV)",
    texte: [
      "Taxe que peuvent voter les communes hors zone tendue, sur un logement inoccupé depuis au moins deux ans au 1er janvier. Elle n’est pas due si la vacance ne dépend pas de la volonté du propriétaire, par exemple pour un logement mis en vente ou en location au prix du marché sans trouver preneur. En démembrement, l’usufruitier la paie.",
    ],
    note: { titre: "À partir de 2027", texte: "La THLV et la TLV sont remplacées par une taxe unique, la taxe sur la vacance des locaux d’habitation." },
    voir: ["tlv", "tvlh", "vacance-locative"],
    origine: "mav",
  },
  {
    id: "taxe-sur-les-bureaux",
    terme: "Taxe sur les bureaux (TSB)",
    aussi: "TB",
    texte: [
      "Taxe annuelle due en Île-de-France par le propriétaire, ou l’usufruitier, au 1er janvier, de bureaux, de locaux commerciaux et de locaux de stockage. Les petites surfaces en sont exonérées : moins de 100 m² de bureaux, de 2 500 m² de commerces, de 5 000 m² de stockage. Les parkings de 500 m² et plus paient une taxe additionnelle, déclarée à part.",
      "Le propriétaire la déclare lui-même avant le 1er mars de chaque année (formulaire 6705-B). Son tarif au m² dépend de la commune et du type de local. Un bail commercial peut la mettre à la charge du locataire.",
    ],
    note: {
      titre: "À ne pas confondre",
      texte: "Avec la redevance pour création de bureaux ou de commerces en Île-de-France, payée une seule fois lors de la construction ou de l’aménagement des locaux.",
    },
    voir: ["bail-commercial", "ilat"],
    lire: { href: "/immeuble-dhabitation-ou-immeuble-de-bureaux/", titre: "Immeuble d’habitation ou immeuble de bureaux ?" },
    origine: "mav",
  },
  {
    id: "tlv",
    terme: "Taxe sur les logements vacants (TLV)",
    texte: [
      "Taxe appliquée d’office dans les communes en zone tendue, comme Paris, à un logement inoccupé depuis au moins un an au 1er janvier : 17 % de la valeur locative la première année, puis 34 %. Mêmes exonérations que la THLV ; en démembrement, l’usufruitier la paie.",
    ],
    note: { titre: "À partir de 2027", texte: "Elle est remplacée, avec la THLV, par la taxe sur la vacance des locaux d’habitation." },
    voir: ["thlv", "tvlh", "vacance-locative"],
    origine: "mav",
  },
  {
    id: "tvlh",
    terme: "Taxe sur la vacance des locaux d’habitation",
    texte: [
      "Taxe unique qui remplace la TLV et la THLV à partir du 1er janvier 2027 (loi de finances pour 2026). Elle s’applique d’office en zone tendue, à 17 % de la valeur locative la première année puis 34 %, et hors zone tendue là où la commune l’a votée. La vacance d’avant 2027 compte dans sa durée.",
    ],
    voir: ["tlv", "thlv"],
    origine: "ajout",
  },
  {
    id: "treve-hivernale",
    terme: "Trêve hivernale",
    texte: [
      "Période du 1er novembre au 31 mars pendant laquelle un locataire ne peut pas être expulsé de son logement, même si le juge l’a ordonné : l’expulsion est reportée à la fin de la trêve. La procédure, elle, peut avancer pendant ce temps.",
      "La trêve ne protège pas les squatteurs, ni l’époux violent dont le juge a ordonné le départ du domicile.",
    ],
    voir: ["assurance-loyers-impayes", "bail"],
    origine: "mav",
  },
  {
    id: "usufruit",
    terme: "Usufruit",
    texte: [
      "Droit d’utiliser un bien ou d’en toucher les loyers, avec l’obligation de l’entretenir et d’en payer les charges courantes et les taxes. Il prend fin au décès de l’usufruitier ou au terme fixé par l’acte ; le nu-propriétaire devient alors plein propriétaire.",
    ],
    voir: ["usufruitier", "nue-propriete", "demembrement"],
    origine: "mav",
  },
  {
    id: "usufruitier",
    terme: "Usufruitier",
    texte: ["Celui qui détient l’usufruit d’un bien."],
    voir: ["usufruit", "nu-proprietaire"],
    origine: "mav",
  },
  {
    id: "vacance-locative",
    terme: "Vacance locative",
    texte: [
      "Période pendant laquelle un lot n’a pas de locataire : il ne rapporte rien, mais ses charges et ses taxes restent à payer. Les acheteurs en tiennent compte dans leur calcul de rentabilité.",
    ],
    voir: ["rentabilite-nette", "tlv"],
    origine: "mav",
  },
  {
    id: "value-add",
    terme: "Value-add",
    texte: [
      "Opération sur un immeuble dont on peut augmenter la valeur par des travaux, une meilleure location ou la relocation de lots vides. L’acheteur prend plus de risque et vise un gain plus élevé.",
    ],
    voir: ["core", "marchand-de-biens"],
    origine: "mav",
  },
  {
    id: "vente-a-la-decoupe",
    terme: "Vente à la découpe",
    texte: [
      "Vente d’un immeuble lot par lot, après sa mise en copropriété, plutôt qu’en une fois. Elle rapporte en général plus qu’une vente en bloc, mais prend plus de temps et doit respecter les droits des locataires, qui peuvent acheter leur logement en priorité.",
    ],
    voir: ["etat-descriptif-de-division", "copropriete", "vente-en-bloc"],
    lire: { href: "/vendre-un-immeuble-a-la-decoupe/", titre: "Vendre un immeuble à la découpe" },
    origine: "ajout",
  },
  {
    id: "vente-en-bloc",
    terme: "Vente en bloc",
    texte: [
      "Vente d’un immeuble entier, en une seule fois, à un seul acheteur. C’est la vente la plus simple et la plus rapide pour un immeuble de rapport. Son prix se fixe d’abord sur le rendement attendu par les acheteurs du secteur.",
    ],
    voir: ["immeuble-de-rapport", "vente-a-la-decoupe", "loi-aurillac"],
    lire: { href: "/vendre-un-immeuble/", titre: "Vendre votre immeuble" },
    origine: "ajout",
  },
];

/** La lettre d'un terme, sans accent (« É » range « État » sous E). */
export function lettreDe(terme: string) {
  return terme.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
}

/** Les termes dans l'ordre alphabétique français, groupés par lettre. */
export function lexiqueParLettre() {
  const tries = [...LEXIQUE].sort((a, b) => a.terme.localeCompare(b.terme, "fr", { sensitivity: "base" }));
  const groupes = new Map<string, Terme[]>();
  for (const t of tries) {
    const l = lettreDe(t.terme);
    if (!groupes.has(l)) groupes.set(l, []);
    groupes.get(l)!.push(t);
  }
  return [...groupes.entries()].map(([lettre, termes]) => ({ lettre, termes }));
}

export const TERMES_PAR_ID = new Map(LEXIQUE.map((t) => [t.id, t]));
