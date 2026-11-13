import { imagesPartage } from "@/lib/partage";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { LigneDefilante } from "@/components/LigneDefilante";
import { EstimationForm } from "@/components/EstimationForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { SectionFaq, insecable, type QR } from "@/components/SectionFaq";
import { FondPhoto } from "@/components/FondPhoto";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { JsonLd } from "@/components/JsonLd";
import { filAriane, organisation, service } from "@/lib/schema";
import { marchesDesCommunes } from "@/lib/marche";
import { immeublesDesCommunes, SEUILS_FIABILITE, type NoteFiabilite } from "@/lib/immeubles-dvf-lecture";
import { PRIX_M2_MAX, PRIX_M2_MIN, VENTES_MIN_APPARTEMENTS } from "@/lib/dvf-immeubles";
import { chiffres } from "@/lib/chiffres";
import { ventes as lesVentes } from "@/lib/biens";
import { CarteVente } from "@/components/CarteVente";
import { Avis } from "@/components/Avis";
import { PARIS } from "@/lib/paris";
import { VISUELS } from "@/lib/visuels";
import { PREUVES, SITE, nombre } from "@/lib/site";

/**
 * /vendre-un-immeuble/paris/ — vendre et faire estimer un immeuble de rapport à Paris.
 *
 * Refaite au lot 108 (MAV, 12/11/2026 : « Quand ils lisent ils doivent se dire France Immeuble
 * c'est vraiment la boîte avec qui travailler »), puis reprise au lot 110 (MAV, 13/11/2026,
 * retours #297 à #300 et #313 à #357, et son message : « une nouvelle façon d'afficher le tableau
 * des prix qui sera plus simple », « inclure la décote en pourcentage par rapport aux ventes
 * d'appartements »).
 *
 * La page suit les questions d'un propriétaire parisien, dans l'ordre où il se les pose : suis-je
 * au bon endroit, savent-ils estimer mon immeuble, combien vaut-il dans mon arrondissement,
 * comment et à qui le vendent-ils, que se passe-t-il après l'offre, combien cela coûte, en bloc
 * ou à la découpe, l'ont-ils déjà fait, que faire maintenant. Chaque section répond par un fait
 * du site.
 *
 * Lot 110, ce qui a changé :
 * - hero (#297, #298, #299, #313) : le grand titre est le H1, « au meilleur prix » ; le surtitre dit
 *   le métier ; le chapeau parle de l'agence depuis 2018 et de son réseau d'acheteurs ;
 * - acheteurs (#299, #300, #331) : ceux d'immeubles parisiens dès que le BO dépose
 *   `acheteurs_paris` (src/lib/chiffres.ts), le chiffre global avec son vrai libellé d'ici là ;
 * - tableau (#321 à #325) : cinq colonnes, le prix médian au m² des immeubles vendus en bloc, la
 *   décote face aux appartements vendus seuls, une note de fiabilité de 1 à 5 et le rendement
 *   théorique. La fourchette n'est plus une colonne : la note s'en sert ;
 * - toutes les rangées « picto, titre, texte » alignées d'une carte à l'autre (#338, #339) ;
 * - après l'offre (#332 à #336) : quatre cartes, plus rien sur la préemption, les droits des
 *   locataires ni l'espace client ;
 * - découpe (#340) : une option, avec un bouton vers sa page dans un nouvel onglet ;
 * - ventes (#341, #342) : toutes nos ventes d'immeubles à Paris, une ligne qui glisse dès la quatrième.
 *
 * À respecter : 100 % off-market, aucun délai de vente affiché, ne pas écrire qu'on estime
 * seulement au rendement, chiffres DVF en agrégats seulement, aucun lien dans les textes hors FAQ.
 * La page des annonces Google est /estimation-immeuble-paris/, hors index.
 */
const URL_PAGE = "/vendre-un-immeuble/paris/";
const TITRE = "Estimation gratuite et vente d’immeuble en bloc à Paris";

export async function generateMetadata(): Promise<Metadata> {
  const ch = await chiffres();
  // Le chiffre des acheteurs suit celui de la page : ceux d'immeubles parisiens quand le BO les a déposés.
  const description = `Vendre un immeuble de rapport à Paris : estimation gratuite, vente 100 % off-market auprès de ${nombre(ch.acheteursParis ?? ch.investisseurs)} acheteurs, prix au m² par arrondissement.`;
  return {
    title: { absolute: TITRE },
    description,
    alternates: { canonical: `${SITE.url}${URL_PAGE}` },
    openGraph: { images: imagesPartage(URL_PAGE), type: "website", title: TITRE, description, url: URL_PAGE },
  };
}

const pc = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** « 1er », « 18e ». */
const rang = (n: number) => `${n}${n === 1 ? "er" : "e"}`;
/** « −35 % », « +4 % » : un vrai signe moins et une espace insécable avant le signe pour cent. */
const ecartPct = (n: number) => `${n < 0 ? "−" : n > 0 ? "+" : ""}${Math.abs(n)} %`;
/** « 2020 », « 2020 et 2021 », « 2019, 2020 et 2021 ». */
const enumeration = (mots: (string | number)[]) => mots.join(", ").replace(/, ([^,]*)$/, " et $1");

/**
 * Un bouton d'estimation en fin de section sur ordinateur (« des boutons réguliers »). Au téléphone,
 * la pilule fixe le remplace (`double-fixe`) : avec `.porte-action` sur chaque section, elle ne
 * s'affichait plus nulle part.
 */
function Relance({ libelle = "Estimer mon immeuble", court }: { libelle?: string; court?: string }) {
  return (
    <div className="btn-row paris-relance">
      <Button href="#estimer" court={court}>{libelle}</Button>
    </div>
  );
}

/** Une phrase d'un avis Google, reprise au mot près de `AVIS` (src/lib/accueil.ts) ; « … » marque la coupe. */
function Citation({ texte, auteur }: { texte: string; auteur: string }) {
  return (
    <figure className="paris-citation">
      <blockquote>«&nbsp;{texte}&nbsp;»</blockquote>
      <figcaption>{auteur}, avis Google</figcaption>
    </figure>
  );
}

type Carte = { picto: NomPicto; titre: string; texte: string; citation?: { texte: string; auteur: string } };

/**
 * Une carte d'argument : picto, titre, texte. Toujours trois éléments, dans cet ordre : la rangée
 * les aligne d'une carte à l'autre (retours #338 et #339, sous-grille dans globals.css). Une
 * citation partage la case du texte et se cale en bas de la carte.
 */
function CarteArgument({ picto, titre, texte, citation }: Carte) {
  return (
    <article className="paris-carte">
      <Picto nom={picto} taille={30} />
      <h3>{titre}</h3>
      {citation ? (
        <div className="paris-carte__corps">
          <p>{insecable(texte)}</p>
          <Citation {...citation} />
        </div>
      ) : (
        <p>{insecable(texte)}</p>
      )}
    </article>
  );
}

/**
 * La note de fiabilité d'un prix médian (retour #325) : cinq petites barres, pleines jusqu'à la
 * note, vides ensuite ; « 4 sur 5 » pour les lecteurs d'écran.
 */
function Fiabilite({ note }: { note: NoteFiabilite }) {
  return (
    <>
      <span className="paris-fiab" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={i <= note ? "est-pleine" : undefined} />
        ))}
      </span>
      <span className="sr-only">{note} sur 5</span>
    </>
  );
}

/**
 * Ce que demande l'estimation d'un immeuble parisien (retours #314 à #320) : quatre titres courts
 * et parallèles, le marché, le locatif, le bâti, la cible. La cible se définit dès l'estimation ;
 * la section Vendre dit ensuite à qui l'immeuble part.
 */
const ESTIMATION: Carte[] = [
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
const VENTE: Carte[] = [
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
const APRES: Carte[] = [
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
const CONDITIONS: Carte[] = [
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
      "Pour une vente en bloc, nos honoraires ne sont dus qu’à la signature de l’acte définitif chez le notaire. Notre barème est public : 5 % TTC jusqu’à 5 M€, 4 % TTC de 5 à 10 M€, 3 % TTC au-delà.",
  },
  {
    picto: "poignee",
    titre: "Pas de mandat exclusif imposé",
    texte:
      "Vous n’êtes pas obligé de signer un mandat exclusif. Pour que la vente reste off-market, nous travaillons souvent en semi-exclusivité, c’est-à-dire avec une exclusivité temporaire.",
  },
];

/** La découpe est une option (retour #340) : chiffrée si le vendeur le souhaite, pilotée par nous, réversible jusqu'au premier lot vendu. */
const DECOUPE: Carte[] = [
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

export default async function VendreUnImmeubleParis() {
  const codes = Array.from({ length: 20 }, (_, i) => `751${String(i + 1).padStart(2, "0")}`);
  const [ch, marches, immeubles, toutes] = await Promise.all([
    chiffres(),
    marchesDesCommunes(codes),
    immeublesDesCommunes(codes),
    lesVentes(),
  ]);
  const { questions } = PARIS;
  // Tant que le contenu relu n'est pas déposé dans content/paris.json, la page n'existe pas.
  if (!questions.length) notFound();

  // Retours #299 et #300 : les acheteurs d'immeubles parisiens, comptés par le BO (le site ne lit
  // rien du CRM). Tant que la clé n'est pas déposée, le chiffre global avec son vrai libellé.
  const acheteursParisiens = ch.acheteursParis != null;
  const acheteurs = nombre(ch.acheteursParis ?? ch.investisseurs);
  const etudiesParis = ch.traitesPar["75"] ?? null;

  // Retour #342 : toutes nos ventes d'immeubles à Paris, de la plus récente à la plus ancienne ;
  // une nouvelle vente publiée arrive ici seule. Les murs d'une boutique n'y ont pas leur place
  // (MAV, 10/11/2026). Une vente sans type ni nombre de lots (fichier de repli quand la base ne
  // répond pas) ne s'affiche pas : on ne saurait pas dire si c'est un immeuble.
  const ventesParis = toutes
    .filter((v) => v.dept === "75" && (v.lots != null || v.type != null) && (v.lots ?? 2) > 1 && (!v.type || /immeuble/i.test(v.type)))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);
  // Ventes d'avant 2022, donc d'avant la hausse des taux (MAV, 10/11/2026) : on le dit dès qu'une carte en est.
  const avantHausse = ventesParis.filter((v) => v.annee < 2022);
  const anneesAvantHausse = enumeration([...new Set(avantHausse.map((v) => v.annee))].sort((a, b) => a - b));
  const noteAvantHausse =
    avantHausse.length === 0
      ? null
      : avantHausse.length === 1
        ? `La vente de ${anneesAvantHausse} date d’avant la hausse des taux : cet immeuble ne se vendrait sans doute plus à ce prix.`
        : `Les ventes de ${anneesAvantHausse} datent d’avant la hausse des taux : ces immeubles ne se vendraient sans doute plus à ces prix.`;

  // Le tableau : pour chaque arrondissement, le prix médian au m² des immeubles vendus en bloc
  // (DVF, à partir de trois ventes), sa décote face aux appartements vendus seuls la même année,
  // la note de fiabilité de ce prix et le rendement théorique : le loyer de marché du secteur sur
  // un an, rapporté au prix médian.
  const annee = immeubles.size ? Math.max(...[...immeubles.values()].map((x) => x.annee)) : null;
  const lignes = codes.map((code, i) => {
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
      // Sans ligne pour l'année, on ne sait pas : on ne l'écrit pas « moins de trois ventes ».
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
  const millesime = [...marches.values()].find((m) => m.millesimeLoyers)?.millesimeLoyers ?? null;
  // La licence de DVF demande la source et la date de mise à jour : le mois du dernier relevé.
  const dernierReleve = [...immeubles.values()].flatMap((x) => (x.annee === annee && x.majLe ? [x.majLe] : [])).sort().pop();
  const releveEn = dernierReleve
    ? new Date(dernierReleve).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" })
    : null;
  const tableau = annee != null && chiffrees.length > 0;
  // Une ligne sans prix s'étend sur toutes les colonnes de chiffres.
  const colonnesChiffres = 2 + (avecDecote ? 1 : 0) + (avecRdt ? 1 : 0);

  const preuves: { picto: NomPicto; valeur: string; libelle: string }[] = [
    {
      picto: "reseau",
      valeur: acheteurs,
      libelle: acheteursParisiens ? "acheteurs d’immeubles parisiens dans notre base" : "acheteurs d’immeubles dans notre base",
    },
    etudiesParis
      ? { picto: "immeubles", valeur: nombre(etudiesParis), libelle: "immeubles parisiens étudiés par nos agents depuis 2018" }
      : { picto: "immeubles", valeur: nombre(ch.immeublesTraites), libelle: "immeubles étudiés par nos agents depuis 2018" },
    {
      picto: "best",
      valeur: `${PREUVES.noteGoogle}/5`,
      libelle: `note moyenne sur Google, sur ${PREUVES.nbAvis} avis de vendeurs et d’acquéreurs`,
    },
  ];

  // Retour #331 : les trois profils d'acquéreurs, ce que chacun cherche et un chiffre. Le nombre
  // d'acquéreurs pour Paris quand le BO l'a déposé ; d'ici là, les recherches de notre base avec
  // leur vrai périmètre (libellés de l'accueil).
  const profil = (parisiens: number | null, recherches: number, perimetre: string) =>
    parisiens != null
      ? { valeur: nombre(parisiens), libelle: "acheteurs pour Paris" }
      : { valeur: nombre(recherches), libelle: `recherches en cours${perimetre}` };
  const profils: { picto: NomPicto; nom: string; cherche: string; valeur: string; libelle: string }[] = [
    {
      picto: "financier",
      nom: "Investisseurs",
      cherche: "ils cherchent du rendement.",
      ...profil(ch.acheteursParisPar.investisseur, ch.recherchesInvestisseur, ", partout en France"),
    },
    {
      picto: "business",
      nom: "Marchands de biens",
      cherche: "ils cherchent une plus-value à la revente.",
      ...profil(ch.acheteursParisPar.marchand, ch.recherchesMarchand, " en Île-de-France"),
    },
    {
      picto: "immeubles",
      nom: "Acheteurs patrimoniaux",
      cherche: "ils cherchent de beaux immeubles et de belles adresses.",
      ...profil(ch.acheteursParisPar.patrimonial, ch.recherchesPatrimonial, " à Paris et dans les Hauts-de-Seine"),
    },
  ];

  // FAQ : trente questions en cinq groupes. Les accolades des réponses sont des chiffres vivants ;
  // une question dont un chiffre manque ne s'affiche pas. `acheteurs` y reste le chiffre global :
  // la réponse dit « notre base compte … acheteurs d'immeubles ».
  const vivants: Record<string, string | null> = {
    annee: tableau ? String(annee) : null,
    ventesImmeubles: tableau && totalImmeubles ? nombre(totalImmeubles) : null,
    // Sans les prix des appartements en base, la phrase d'avant le lot 110 : la question reste affichée.
    phraseDecote:
      tableau && etendueDecote
        ? `Par rapport au prix médian des appartements vendus seuls la même année, la décote mesurée va de ${etendueDecote.min.pct} % à ${etendueDecote.max.pct} % selon l’arrondissement. D’après notre expérience, comptez plutôt 15 % pour un immeuble en bon état, loué au prix du marché.`
        : "Entre un immeuble vendu en bloc et le prix des appartements, la décote est en général d’environ 15 %.",
    immeublesEtudies: nombre(ch.immeublesTraites),
    acheteurs: nombre(ch.investisseurs),
  };
  const faq = questions.flatMap((q): (QR & { groupe: string })[] => {
    let manque = false;
    const texte = q.reponse.replace(/\{(\w+)\}/g, (_, cle: string) => {
      const v = vivants[cle];
      if (v == null) manque = true;
      return v ?? "";
    });
    if (manque) return [];
    const [avant, ...suite] = q.lien ? texte.split(q.lien.texte) : [texte];
    return [
      {
        groupe: q.groupe,
        question: q.question,
        texte,
        reponse:
          q.lien && suite.length ? (
            <p>
              {insecable(avant)}
              <Link href={q.lien.href} className="lien-texte" {...(q.lien.href === "/vendre-un-immeuble-a-la-decoupe/" ? { target: "_blank", rel: "noopener" } : {})}>{q.lien.texte}</Link>
              {insecable(suite.join(q.lien.texte))}
            </p>
          ) : undefined,
      },
    ];
  });
  const groupes = [...new Set(faq.map((q) => q.groupe))].map((titre) => ({
    titre,
    items: faq.filter((q) => q.groupe === titre),
  }));

  return (
    <>
      <JsonLd
        data={[
          organisation(),
          filAriane([
            { nom: "Accueil", url: "/" },
            { nom: "Vendre un immeuble", url: "/vendre-un-immeuble/" },
            { nom: "Paris", url: URL_PAGE },
          ]),
          service(
            "Vente et estimation d’immeuble de rapport à Paris",
            "Estimation gratuite, commercialisation 100 % off-market et vente en bloc ou à la découpe d’immeubles de rapport dans les vingt arrondissements de Paris.",
            URL_PAGE,
            "Paris",
          ),
        ]}
      />

      <HeroMedia className="hero-paris" image={VISUELS.toitsAeriens.src} alt={VISUELS.toitsAeriens.alt}>
        <>
          {/* Retours #297, #298 et #313 : le grand titre est le H1 et promet le meilleur prix ; le
              surtitre dit le métier, l'immeuble de rapport, sans répéter « à Paris ». */}
          <Eyebrow>Estimation et vente d’immeubles de&nbsp;rapport</Eyebrow>
          <h1 className="hero-titre">
            Vendre votre immeuble à Paris au <span className="accent">meilleur&nbsp;prix</span>
          </h1>
          <p className="lead">
            Forts de notre expérience de la vente d’immeubles à Paris depuis 2018 et d’un réseau de{" "}
            {acheteurs} acheteurs {acheteursParisiens ? "d’immeubles parisiens" : "d’immeubles"}, nous
            estimons le vôtre et le vendons au meilleur prix, dans les meilleures conditions.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>Estimer mon immeuble</Button>
          </div>
        </>
      </HeroMedia>

      {/* Suis-je au bon endroit ? Trois preuves, sous un titre de section à la taille d'un surtitre. */}
      <section className="section section--noir-2 paris-reperes-sec">
        <div className="container">
          <h2 className="eyebrow">Une agence parisienne spécialisée dans la vente d’immeubles de rapport</h2>
          <ul className="paris-reperes paris-reperes--seul">
            {preuves.map((r) => (
              <li key={r.libelle}>
                <Picto nom={r.picto} taille={30} />
                <span className="paris-reperes__val">{r.valeur}</span>{" "}
                <span className="paris-reperes__lib">{r.libelle}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Savent-ils estimer mon immeuble ? */}
      <section className="section section--noir paris-estimation-sec">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>Estimation gratuite</Eyebrow>
            <h2>
              Estimer votre <span className="accent">immeuble à Paris</span>&nbsp;: faites appel au{" "}
              <span className="accent">spécialiste</span> des immeubles parisiens
            </h2>
            <p className="lead">
              Un immeuble ne s’estime pas comme un appartement. Le prix au&nbsp;m² du quartier ne suffit
              pas&nbsp;: il faut bien connaître le marché et avoir de solides compétences techniques et
              locatives. C’est le métier de nos agents, qui ont étudié {nombre(ch.immeublesTraites)}{" "}
              immeubles depuis 2018.
            </p>
          </Reveal>
          <LigneDefilante className="paris-ligne">
            {ESTIMATION.map((x) => (
              <CarteArgument key={x.titre} {...x} />
            ))}
          </LigneDefilante>
          <Citation
            texte="… leur estimation, qui n’était pas la plus haute, mais la plus convaincante."
            auteur="Romain VZ"
          />
          <Relance libelle="Faire estimer mon immeuble" />
        </div>
      </section>

      {/* Combien vaut-il à peu près dans mon arrondissement ? Un seul tableau, cinq colonnes. */}
      {tableau && (
        <section className="section section--creme paris-prix-sec" id="prix-par-arrondissement">
          <div className="container paris-prix">
            <Reveal className="section__head paris-prix__tete">
              <Eyebrow>Notre étude des ventes d’immeubles de rapport</Eyebrow>
              <h2>
                Prix au&nbsp;m² des <span className="accent">immeubles à Paris</span>, par arrondissement
              </h2>
              {/* Retour #322 : nous avons étudié ces ventes nous-mêmes ; les deux prix suivent le tableau. */}
              <p className="lead">
                Pour affiner nos estimations et informer nos clients, nous avons étudié nous-mêmes les
                ventes d’immeubles en bloc enregistrées dans DVF, la base publique des ventes
                immobilières.
                {moinsCher && plusCher && moinsCher.n !== plusCher.n ? (
                  <>
                    {" "}À Paris en {annee}, le prix médian va de {nombre(moinsCher.prix)}&nbsp;€/m² dans le{" "}
                    {rang(moinsCher.n)} à {nombre(plusCher.prix)}&nbsp;€/m² dans le {rang(plusCher.n)}.
                  </>
                ) : null}
              </p>
            </Reveal>

            <div className="paris-prix__tableau">
              <table>
                {/* Retour #324 : un titre d'une ligne ; au téléphone, « par arrondissement » n'est que lu. */}
                <caption>
                  Prix au&nbsp;m² des immeubles à Paris en {annee}
                  <span className="paris-prix__long">, par arrondissement</span>
                </caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="paris-prix__long">Arrondissement</span>{" "}
                      <span className="paris-prix__court" aria-hidden="true">Arr.</span>
                    </th>
                    <th scope="col" className="paris-prix__tete-med">
                      <span className="paris-prix__long">Prix médian au&nbsp;m²</span>{" "}
                      <span className="paris-prix__court" aria-hidden="true">Prix médian</span>
                    </th>
                    {avecDecote && (
                      <th scope="col">
                        <span className="paris-prix__long">Décote&nbsp;/ appartements</span>{" "}
                        <span className="paris-prix__court" aria-hidden="true">Décote</span>
                      </th>
                    )}
                    <th scope="col">Fiabilité</th>
                    {/* « Théorique » reste écrit au téléphone aussi : on ne le prend pas pour un rendement réel. */}
                    {avecRdt && <th scope="col">Rendement <br className="paris-prix__rupture" />théorique</th>}
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((l) => (
                    <tr key={l.n} id={`arr-${l.n}`} className={l.prix == null ? "paris-prix__peu" : undefined}>
                      <th scope="row">
                        {rang(l.n)}
                        <span className="paris-prix__long"> arrondissement</span>
                      </th>
                      {l.prix != null ? (
                        <>
                          <td className="paris-prix__med">{nombre(l.prix)}&nbsp;€</td>
                          {avecDecote && <td className="paris-prix__dec">{l.decote != null ? ecartPct(l.decote) : "–"}</td>}
                          <td className="paris-prix__fiab">{l.fiabilite != null ? <Fiabilite note={l.fiabilite} /> : "–"}</td>
                          {avecRdt && <td className="paris-prix__rdt">{l.rdt != null ? `${pc(l.rdt)} %` : "–"}</td>}
                        </>
                      ) : (
                        <td colSpan={colonnesChiffres}>
                          {l.connu ? `Moins de trois ventes en ${annee}` : `Chiffres de ${annee} non disponibles`}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Retour #304 : le calcul et les sources repliés, sans dire que les chiffres se mettent à jour seuls. */}
              <details className="paris-prix__calcul">
                <summary>Le détail du calcul et nos sources</summary>
                <p>
                  Ventes retenues dans DVF&nbsp;: plus de cinq logements, un seul prix, au moins 65&nbsp;% de
                  logements parmi les lots, caves et parkings non comptés ({nombre(totalImmeubles)} ventes à
                  Paris en {annee}). Sont écartés les échanges, les ventes sur plan, les adjudications, les
                  expropriations et les ventes de terrain à bâtir, les mêmes logements présents dans plusieurs
                  actes la même année, les ventes à cheval sur plusieurs communes et les prix au&nbsp;m²
                  inférieurs à {nombre(PRIX_M2_MIN)}&nbsp;€ ou supérieurs à {nombre(PRIX_M2_MAX)}&nbsp;€. Prix publié à partir de
                  trois ventes, commerces compris dans la surface.
                </p>
                {avecDecote && (
                  <p>
                    Décote&nbsp;: le prix médian au&nbsp;m² des immeubles rapporté à celui des appartements
                    vendus seuls dans le même arrondissement, la même année, d’après DVF. Une vente
                    d’appartement est retenue quand elle porte sur un seul appartement, avec ou sans
                    dépendances, à un seul prix, entre {nombre(PRIX_M2_MIN)}&nbsp;€ et {nombre(PRIX_M2_MAX)}&nbsp;€ le&nbsp;m². Prix
                    médian des appartements publié à partir de {VENTES_MIN_APPARTEMENTS} ventes.
                  </p>
                )}
                <p>
                  Fiabilité&nbsp;: l’écart entre les prix au&nbsp;m², une fois écartés le quart des ventes le
                  moins cher et le quart le plus cher, rapporté au prix médian puis divisé par la racine
                  carrée du nombre de ventes.{" "}
                  {SEUILS_FIABILITE.map(
                    ([seuil, note], i) =>
                      `${i ? "jusqu’à" : "Jusqu’à"} ${seuil.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} : ${note}`,
                  ).join(" ; ")}
                  &nbsp;; au-delà, ou avec moins de cinq ventes&nbsp;: 1.
                </p>
                {avecRdt && (
                  <p>
                    Loyers de marché&nbsp;: loyers des appartements, carte des loyers de l’ANIL
                    {millesime ? ` ${millesime}` : ""}, charges comprises.
                  </p>
                )}
                <p>
                  Source&nbsp;: Demandes de valeurs foncières (DVF), direction générale des Finances
                  publiques, data.gouv.fr. Ventes de {annee}{releveEn ? `, relevées en ${releveEn}` : ""}.
                </p>
              </details>
            </div>

            <div className="paris-prix__notes">
              {avecDecote ? (
                <p>
                  <strong>Décote.</strong> L’écart entre le prix médian au&nbsp;m² des immeubles vendus en
                  bloc et celui des appartements vendus seuls, dans le même arrondissement, la même année.
                  {etendueDecote && (
                    <>
                      {" "}En {annee}, elle va de {etendueDecote.min.pct}&nbsp;% dans le{" "}
                      {rang(etendueDecote.min.n)} à {etendueDecote.max.pct}&nbsp;% dans le{" "}
                      {rang(etendueDecote.max.n)}.
                    </>
                  )}{" "}
                  D’après notre expérience, comptez plutôt 15&nbsp;% pour un immeuble en bon état, loué au
                  prix du marché.
                </p>
              ) : (
                /* Sans les prix des appartements en base : la note d'avant le lot 110, sans colonne à expliquer. */
                <p>
                  <strong>Environ 15&nbsp;% de décote.</strong> Entre un immeuble vendu en bloc et le prix des
                  appartements, la décote est en général d’environ 15&nbsp;%. Elle varie selon
                  l’arrondissement, le type d’immeuble et les loyers réellement pratiqués.
                </p>
              )}
              <p>
                <strong>Fiabilité.</strong> De 1 à 5&nbsp;: la note est haute quand les ventes de
                l’arrondissement sont nombreuses et leurs prix proches les uns des autres. À 1 ou 2, le
                prix est à lire avec prudence.
              </p>
              <p>
                <strong>Un rendement de 3 à 6&nbsp;%.</strong> À Paris, un immeuble de rapport se vend
                aujourd’hui sur un rendement de 3 à 6&nbsp;% selon les arrondissements.
                {avecRdt && (
                  <>
                    {" "}Celui du tableau est théorique&nbsp;: le loyer de marché des appartements du secteur sur
                    un an, charges comprises, rapporté au prix médian.
                  </>
                )}
              </p>
            </div>

            <p className="paris-prix__mention">
              Chiffres DVF non vérifiés&nbsp;: nous ne connaissons ni l’état ni le niveau des loyers des
              immeubles vendus. Un prix très bas signale souvent un immeuble occupé, mal loué ou à gros
              travaux. Pour le vôtre, nous lisons chaque bail et chiffrons les travaux.
            </p>

            <Relance />
          </div>
        </section>
      )}

      {/* Comment et à qui le vendent-ils ? */}
      <section className="section section--noir-2 paris-vente-sec">
        <FondPhoto image="/media/atouts/commercialisation-dossier.webp" cote="droite" position="center 30%" />
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>Vente en bloc, sans annonce</Eyebrow>
            <h2>
              Vendre un immeuble en bloc à Paris, <span className="accent">100&nbsp;% off-market</span>
            </h2>
            <p className="lead">
              Votre immeuble est commercialisé uniquement en off-market, auprès de nos {acheteurs}{" "}
              acheteurs{acheteursParisiens ? " d’immeubles parisiens" : ""}, pour préserver sa valeur et son
              exclusivité. Vos locataires et vos voisins ne l’apprennent pas par une annonce.
            </p>
          </Reveal>
          <LigneDefilante className="paris-ligne">
            {VENTE.map((x) => (
              <CarteArgument key={x.titre} {...x} />
            ))}
          </LigneDefilante>
          <ul className="paris-profils" aria-label="Les trois profils d’acquéreurs de notre base">
            {profils.map((p) => (
              <li key={p.nom}>
                <Picto nom={p.picto} taille={22} />
                <p className="paris-profils__qui">
                  <strong>{p.nom}</strong>&nbsp;: {p.cherche}
                </p>
                <p className="paris-profils__combien">
                  <span className="paris-profils__val">{p.valeur}</span> {p.libelle}
                </p>
              </li>
            ))}
          </ul>
          <Relance />
        </div>
      </section>

      {/* Serai-je seul une fois l'offre reçue ? Retours #312 et #333 : l'après-offre est la partie la
          plus difficile, et c'est un travail documentaire. */}
      <section className="section section--creme paris-apres-sec">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>De l’offre à l’acte</Eyebrow>
            <h2>
              Après l’offre commence <span className="accent">le plus difficile</span>
            </h2>
            <p className="lead">
              C’est là que travailler avec un professionnel prend tout son sens. Dossier locatif,
              diagnostics, pièces techniques, demandes du notaire et de l’acquéreur&nbsp;: nous réunissons
              tout, et nous vous accompagnons jusqu’à l’acte.
            </p>
          </Reveal>
          <LigneDefilante className="paris-ligne">
            {APRES.map((x) => (
              <CarteArgument key={x.titre} {...x} />
            ))}
          </LigneDefilante>
          <Citation texte="Excellent suivi auprès de l’ensemble des intervenants…" auteur="Violaine Tureau" />
          <Relance />
        </div>
      </section>

      {/* Combien cela coûte-t-il, et à quoi je m'engage ? */}
      <section className="section section--noir paris-conditions-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Honoraires et mandat</Eyebrow>
            <h2>
              Honoraires&nbsp;: <span className="accent">rien à payer</span> tant que la vente n’est pas signée
            </h2>
          </Reveal>
          <LigneDefilante className="paris-ligne paris-ligne--3">
            {CONDITIONS.map((x) => (
              <CarteArgument key={x.titre} {...x} />
            ))}
          </LigneDefilante>
          <Relance />
        </div>
      </section>

      {/* Et si je le vendais par appartements ? Retour #340 : une option, pas une promesse. */}
      <section className="section section--noir-3 paris-decoupe-sec">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>En bloc ou à la découpe</Eyebrow>
            <h2>
              Vous envisagez la <span className="accent">vente à la découpe</span> pour vendre plus cher&nbsp;?
            </h2>
            <p className="lead">
              La plupart du temps, la découpe rapporte davantage. Parfois elle ne vaut pas le coup&nbsp;:
              immeuble déjà rénové, loyers déjà au niveau du marché, logements tous loués. Nous analysons
              votre immeuble et vous conseillons selon l’écart de prix entre les deux options.
            </p>
          </Reveal>
          <LigneDefilante className="paris-ligne paris-ligne--3">
            {DECOUPE.map((x) => (
              <CarteArgument key={x.titre} {...x} />
            ))}
          </LigneDefilante>
          {/* Le second bouton ouvre la page de la découpe dans un nouvel onglet : le visiteur ne quitte
              pas celle-ci. `porte-action` : au téléphone, les deux boutons restent visibles et la
              pilule fixe s'efface (sans cela, seul le bouton vers la Découpe restait dans la section). */}
          <div className="btn-row paris-relance porte-action">
            <Button href="#estimer" court="Chiffrer les deux">Chiffrer les deux options</Button>
            <Button href="/vendre-un-immeuble-a-la-decoupe/" variant="outline" nouvelOnglet>
              Voir la vente à la découpe
            </Button>
          </div>
        </div>
      </section>

      {/* L'ont-ils déjà fait ? */}
      {ventesParis.length > 0 && (
        <section className="section section--creme paris-ventes-sec">
          <div className="container">
            <Reveal className="section__head">
              <Eyebrow>Exemples de ventes à Paris</Eyebrow>
              <h2>
                Des <span className="accent">immeubles parisiens</span> vendus par France Immeuble
              </h2>
            </Reveal>
            {/* Trois cartes de front sur ordinateur ; à partir de la quatrième vente, la ligne glisse. */}
            <LigneDefilante
              className={`paris-ventes-ligne${ventesParis.length > 3 ? " paris-ventes-ligne--glisse" : ""}`}
            >
              {ventesParis.map((v) => (
                <article key={v.id} className="vente">
                  <CarteVente v={v} sansDelai libelleLoyer="Loyer" avecType prixAuM2 />
                </article>
              ))}
            </LigneDefilante>
            {noteAvantHausse && <p className="paris-ventes__note">{insecable(noteAvantHausse)}</p>}
            <Citation
              texte="… je recommande sans réserve France Immeuble, qui n’a à mon avis pas beaucoup d’équivalent sur son marché."
              auteur="Romain VZ"
            />
            <Relance />
          </div>
        </section>
      )}

      {/* Trois vendeurs que la page n'a pas encore cités ouvrent la ligne ; sans section de ventes, le
          fond change pour ne pas répéter celui de la Découpe. */}
      <Avis
        titre="Ce qu’en disent nos clients"
        fond={ventesParis.length > 0 ? "noir-3" : "noir-2"}
        dabord={["Mariane Suzanne", "Thierry Depois", "Luis Ramos"]}
      />

      {/* Que dois-je faire maintenant ? Le seul formulaire de la page, avant la FAQ (lot 94). */}
      <section id="estimer" className="section section--noir section--ecran sec-formulaire paris-form-sec">
        <FondPhoto image="/media/atouts/signature-dossier.webp" position="40% center" clair />
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Première étape</Eyebrow>
            {/* Au téléphone, le site cache le chapeau de cette section : ce qui rassure est dans le titre. */}
            <h2>
              Une estimation confidentielle, <span className="accent">sans engagement de&nbsp;vente</span>
            </h2>
            <p className="lead">
              Quelques questions sur votre immeuble parisien suffisent pour lancer son estimation. Elle
              est gratuite.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href={SITE.telHref} variant="outline">Préférer le téléphone · {SITE.tel}</Button>
            </div>
          </Reveal>
          <EstimationForm formulaire="vendre" libelleEnvoi="Estimer mon immeuble" />
        </div>
      </section>

      <SectionFaq
        items={faq}
        groupes={groupes}
        surtitre="Les questions des propriétaires parisiens"
        titre={<>Vendre ou faire estimer un immeuble à Paris&nbsp;: <span className="accent">vos&nbsp;questions</span></>}
        className="section--noir-2 paris-faq-sec"
      >
        <Relance />
      </SectionFaq>

      <BoutonFixeMobile href="#estimer" cible="estimer" libelle="Estimer mon immeuble" />
    </>
  );
}
