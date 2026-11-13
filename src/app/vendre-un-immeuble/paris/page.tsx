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
import { immeublesDesCommunes } from "@/lib/immeubles-dvf-lecture";
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
 * Refaite au lot 108 (MAV, 12/11/2026 : « Le tableau c'est trop, gardons un seul ou une façon
 * d'afficher mieux. Repense le texte et la page […] pour maximiser SEO et conversion […]. Quand
 * ils lisent ils doivent se dire France Immeuble c'est vraiment la boîte avec qui travailler »).
 *
 * La page suit les questions d'un propriétaire parisien, dans l'ordre où il se les pose : suis-je
 * au bon endroit, savent-ils estimer mon immeuble, combien vaut-il dans mon arrondissement,
 * comment et à qui le vendent-ils, que se passe-t-il après l'offre, combien cela coûte, en bloc
 * ou à la découpe, l'ont-ils déjà fait, que faire maintenant. Chaque section répond par un fait
 * du site. Un seul tableau, de quatre colonnes : le prix médian des immeubles vendus en bloc,
 * la fourchette et le rendement théorique. Les appartements, l'écart et le nombre de ventes par
 * arrondissement en sont sortis.
 *
 * À respecter (retours #301 à #312) : 100 % off-market, aucun délai de vente affiché, ne pas
 * écrire qu'on estime seulement au rendement, chiffres DVF en agrégats seulement.
 * La page des annonces Google est /estimation-immeuble-paris/, hors index.
 */
const URL_PAGE = "/vendre-un-immeuble/paris/";
const TITRE = "Estimation gratuite et vente d’immeuble en bloc à Paris";

export async function generateMetadata(): Promise<Metadata> {
  const ch = await chiffres();
  const description = `Vendre un immeuble de rapport à Paris : estimation gratuite, vente 100 % off-market auprès de ${nombre(ch.investisseurs)} acheteurs, prix au m² par arrondissement.`;
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

type Carte = { picto: NomPicto; titre: string; texte: string };

/**
 * Ce que demande l'estimation d'un immeuble parisien (retours #307 et #308 : « une connaissance
 * approfondie du marché et des compétences solides, en technique ou en locatif »). Le profil de
 * l'acquéreur se décide dès l'estimation ; la section Vendre dit ensuite à qui l'immeuble part.
 */
const ESTIMATION: Carte[] = [
  {
    picto: "secteur",
    titre: "Le marché, rue par rue",
    texte:
      "Nous suivons les ventes d’immeubles de chaque arrondissement et ce que les acheteurs y paient vraiment. Deux immeubles voisins peuvent valoir des prix très différents.",
  },
  {
    picto: "dossier",
    titre: "Le locatif, bail par bail",
    texte:
      "Loi de 1948, locataires protégés, loyers sous le marché, encadrement des loyers, baux commerciaux : nous lisons chaque bail et chiffrons ce qu’il pèse sur le prix.",
  },
  {
    picto: "technique",
    titre: "Le bâti et la rénovation énergétique",
    texte:
      "Structure, toiture, façades, normes, logements classés F ou G : nous chiffrons les travaux à prévoir. En secteur protégé, nous tenons compte de l’avis des Architectes des Bâtiments de France.",
  },
  {
    picto: "loupeCible",
    titre: "L’acquéreur visé",
    texte:
      "Investisseur qui garde l’immeuble pour ses loyers, ou marchand de biens qui le rénove pour le revendre : le profil visé change le prix. Nous le définissons dès l’estimation.",
  },
];

/**
 * Comment et à qui nous vendons (retours #310 à #312) : 100 % off-market, la meilleure offre de
 * notre base, des offres solides, souvent sans condition de financement. Aucun délai.
 */
const VENTE: (Carte & { citation?: { texte: string; auteur: string } })[] = [
  {
    picto: "detective",
    titre: "Votre immeuble ne s’use pas en vitrine",
    texte:
      "Un immeuble resté longtemps en ligne perd de sa valeur perçue et se négocie plus bas. Une annonce attire surtout des particuliers, dont l’achat dépend d’un prêt.",
  },
  {
    picto: "loupeCible",
    titre: "Des acheteurs dont nous connaissons la recherche",
    texte:
      "Nos acheteurs déposent leur recherche : secteur, budget, type d’immeuble, rendement attendu. Nous en rapprochons votre immeuble, et le dossier part à ceux qu’il concerne.",
  },
  {
    picto: "dossier",
    titre: "Un dossier fait pour décider",
    texte: "Un investisseur achète sur un état locatif, des baux et des diagnostics, pas sur des photos et une surface.",
    citation: {
      texte: "… leur dossier était de loin le plus détaillé et surtout le plus adapté à la vente d’un immeuble entier.",
      auteur: "Danièle M.",
    },
  },
  {
    picto: "poignee",
    titre: "La meilleure offre de notre base",
    texte:
      "Nous cherchons l’acheteur qui fera la meilleure offre : en général un investisseur si l’immeuble est loué au prix du marché, un marchand de biens s’il est mal loué ou à gros travaux. Leurs offres sont solides, souvent sans condition de financement.",
  },
];

/** Les trois obstacles parisiens entre l'offre et l'acte (FAQ parisienne relue : préemption, loi Aurillac, diagnostics). */
const OBSTACLES: Carte[] = [
  {
    picto: "immeubles",
    titre: "La préemption de la Ville de Paris",
    texte:
      "Le notaire déclare la vente à la Ville, qui peut acheter à la place de l’acquéreur. La promesse de vente prévoit ce cas dès le départ.",
  },
  {
    picto: "logement",
    titre: "Les droits des locataires",
    texte:
      "Au-delà de cinq logements, chaque locataire peut acheter le sien en priorité, sauf si l’acquéreur s’engage à prolonger les baux de six ans.",
  },
  {
    picto: "dossier",
    titre: "Les baux, les diagnostics et le notaire",
    texte:
      "Baux, DPE du bâtiment, audit énergétique, plomb, amiante, termites : nous vous disons dès le départ quelles pièces réunir. Un dossier complet évite bien des questions.",
  },
];

/** Les étapes de la vente telles que le vendeur les suit dans son espace client (frise du compte). */
const FRISE = ["Estimation", "Mandat", "Commercialisation", "Visites", "Offres", "Compromis", "Acte"];

/** Ce que le vendeur voit dans son espace client (écrans livrés le 30/10/2026). */
const COMPTE: { titre: string; texte: string }[] = [
  { titre: "L’étape en cours", texte: "De l’estimation à l’acte, avec les acquéreurs sollicités, les visites et les offres reçues." },
  { titre: "Chaque offre avec son document", texte: "Prix, somme qui vous revient (net vendeur), honoraires, écart avec notre estimation." },
  { titre: "Votre estimation au curseur", texte: "L’effet du prix sur le rendement et sur votre net vendeur." },
  { titre: "Vos pièces et votre agent", texte: "Dépôt en ligne, messagerie, rendez-vous sur calendrier." },
];

/** Ce que coûte la vente et ce à quoi le vendeur s'engage : chaque phrase est déjà sur la page Vendre ou sur le barème. */
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
      "Pour une vente en bloc, nos honoraires ne sont dus qu’à la signature de l’acte définitif chez le notaire. Notre barème est public : 5 % jusqu’à 5 M€, 4 % de 5 à 10 M€, 3 % au-delà.",
  },
  {
    picto: "poignee",
    titre: "Pas de mandat exclusif imposé",
    texte:
      "Vous n’êtes pas obligé de signer un mandat exclusif. Pour que la vente reste off-market, nous travaillons souvent en semi-exclusivité, c’est-à-dire avec une exclusivité temporaire.",
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

  const acheteurs = nombre(ch.investisseurs);
  const etudiesParis = ch.traitesPar["75"] ?? null;

  // Nos ventes d'immeubles à Paris : les murs d'une boutique n'y ont pas leur place (MAV, 10/11/2026).
  const ventesParis = toutes
    .filter((v) => v.dept === "75" && (v.lots ?? 2) > 1 && (!v.type || /immeuble/i.test(v.type)))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  // Ventes d'avant 2022, donc d'avant la hausse des taux (MAV, 10/11/2026) : on le dit dès qu'une carte en est.
  const anneesAvantHausse = [...new Set(ventesParis.map((v) => v.date.slice(0, 4)))].filter((a) => Number(a) < 2022).sort();

  // Le tableau : pour chaque arrondissement, le prix médian au m² des immeubles vendus en bloc
  // (DVF, à partir de trois ventes), la fourchette, et le rendement théorique : le loyer de marché
  // du secteur sur un an, rapporté au prix médian.
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
      bas: imm?.prixM2Min ?? null,
      haut: imm?.prixM2Max ?? null,
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
  const millesime = [...marches.values()].find((m) => m.millesimeLoyers)?.millesimeLoyers ?? null;
  const tableau = annee != null && chiffrees.length > 0;

  const preuves: { picto: NomPicto; valeur: string; libelle: string }[] = [
    { picto: "reseau", valeur: acheteurs, libelle: "acheteurs d’immeubles dans notre base" },
    etudiesParis
      ? { picto: "immeubles", valeur: nombre(etudiesParis), libelle: "immeubles parisiens étudiés par nos agents depuis 2018" }
      : { picto: "immeubles", valeur: nombre(ch.immeublesTraites), libelle: "immeubles étudiés par nos agents depuis 2018" },
    {
      picto: "best",
      valeur: `${PREUVES.noteGoogle}/5`,
      libelle: `note moyenne sur Google, sur ${PREUVES.nbAvis} avis de vendeurs et d’acquéreurs`,
    },
  ];

  // Les recherches déposées dans notre base, avec leur périmètre (libellés de l'accueil) et Paris en premier.
  const recherches: { picto: NomPicto; valeur: string; libelle: string }[] = [
    { picto: "immeubles", valeur: nombre(ch.recherchesPatrimonial), libelle: "recherches d’immeubles de tous types à Paris et dans les Hauts-de-Seine" },
    { picto: "business", valeur: nombre(ch.recherchesMarchand), libelle: "recherches d’immeubles vides ou à rénover en Île-de-France" },
    { picto: "financier", valeur: nombre(ch.recherchesInvestisseur), libelle: "recherches d’immeubles loués ou non, partout en France" },
  ];

  // FAQ : trente questions en cinq groupes. Les accolades des réponses sont des chiffres vivants ;
  // une question dont un chiffre manque ne s'affiche pas.
  const vivants: Record<string, string | null> = {
    annee: tableau ? String(annee) : null,
    ventesImmeubles: tableau && totalImmeubles ? nombre(totalImmeubles) : null,
    immeublesEtudies: nombre(ch.immeublesTraites),
    acheteurs,
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
              <Link href={q.lien.href} className="lien-texte">{q.lien.texte}</Link>
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
          {/* Comme sur la Découpe (lot 106) : le surtitre porte la requête et devient le H1, à sa
              taille de surtitre ; la phrase forte reste le grand titre visuel, en paragraphe. */}
          <Eyebrow as="h1">Vendre et faire estimer un immeuble de rapport à Paris</Eyebrow>
          <p className="h-display hero-titre">
            Un <span className="accent">immeuble parisien</span> ne se vend pas comme un appartement
          </p>
          <p className="lead">
            Notre spécialité&nbsp;: l’immeuble de rapport. Nos agents, basés à Paris, estiment le vôtre
            gratuitement, puis le vendent sans annonce, 100&nbsp;% en off-market, à celui de nos{" "}
            {acheteurs} acheteurs qui en donnera le meilleur prix.
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
              Estimation de votre immeuble à Paris&nbsp;: des spécialistes,{" "}
              <span className="accent">du bail à la toiture</span>
            </h2>
            <p className="lead">
              Un avis de valeur d’appartement part du prix au&nbsp;m² du quartier. Pour un immeuble, cela ne
              suffit pas&nbsp;: il faut une connaissance fine du marché et de solides compétences techniques
              et locatives. C’est le métier de nos agents, qui ont étudié {nombre(ch.immeublesTraites)}{" "}
              immeubles depuis 2018.
            </p>
          </Reveal>
          <LigneDefilante className="paris-ligne">
            {ESTIMATION.map((x) => (
              <article key={x.titre} className="paris-carte">
                <Picto nom={x.picto} taille={30} />
                <h3>{x.titre}</h3>
                <p>{insecable(x.texte)}</p>
              </article>
            ))}
          </LigneDefilante>
          <Citation
            texte="… leur estimation, qui n’était pas la plus haute, mais la plus convaincante."
            auteur="Romain VZ"
          />
          <Relance libelle="Faire estimer mon immeuble" />
        </div>
      </section>

      {/* Combien vaut-il à peu près dans mon arrondissement ? Un seul tableau, quatre colonnes. */}
      {tableau && (
        <section className="section section--creme paris-prix-sec" id="prix-par-arrondissement">
          <div className="container paris-prix">
            <Reveal className="section__head paris-prix__tete">
              <Eyebrow>Prix des immeubles par arrondissement</Eyebrow>
              <h2>
                Quel est le prix au&nbsp;m² d’un <span className="accent">immeuble de rapport à Paris</span>,
                par arrondissement&nbsp;?
              </h2>
              <p className="lead">
                Les prix publiés par arrondissement sont ceux des appartements. Voici ceux des immeubles
                vendus en bloc à Paris en {annee}, d’après DVF, la base publique des ventes immobilières
                {moinsCher && plusCher && moinsCher.n !== plusCher.n ? (
                  <>
                    &nbsp;: en médiane, de {nombre(moinsCher.prix)}&nbsp;€/m² dans le {rang(moinsCher.n)} à{" "}
                    {nombre(plusCher.prix)}&nbsp;€/m² dans le {rang(plusCher.n)}
                  </>
                ) : null}
                .
              </p>
            </Reveal>

            <div className="paris-prix__tableau">
              <p className="paris-prix__legende">
                <strong>Prix médian</strong>&nbsp;: la moitié des immeubles se sont vendus plus cher au&nbsp;m²,
                l’autre moitié moins cher. C’est une tendance, pas le prix de votre immeuble.
              </p>
              <table>
                <caption>
                  Prix au m² des immeubles vendus en bloc à Paris en {annee}, par arrondissement. Source&nbsp;: DVF.
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
                    <th scope="col">
                      <span className="paris-prix__long">Du moins cher au&nbsp;plus&nbsp;cher</span>{" "}
                      <span className="paris-prix__court" aria-hidden="true">Fourchette</span>
                    </th>
                    {/* « Théorique » reste écrit au téléphone aussi : on ne le prend pas pour un rendement réel. */}
                    {avecRdt && <th scope="col">Rendement théorique</th>}
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
                          <td className="paris-prix__four">
                            {l.bas != null && l.haut != null ? (
                              <>
                                {nombre(l.bas)} à {nombre(l.haut)}
                                <span className="paris-prix__eur">&nbsp;€</span>
                              </>
                            ) : (
                              "–"
                            )}
                          </td>
                          {avecRdt && <td className="paris-prix__rdt">{l.rdt != null ? `${pc(l.rdt)} %` : "–"}</td>}
                        </>
                      ) : (
                        <td colSpan={avecRdt ? 3 : 2}>
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
                  Ventes retenues dans DVF&nbsp;: plus de cinq logements, un seul acte et un seul prix, au moins
                  65&nbsp;% de logements parmi les lots, caves et parkings non comptés ({nombre(totalImmeubles)}{" "}
                  ventes à Paris en {annee}). Sont écartés les immeubles vendus plusieurs fois dans l’année
                  (ventes de parts, démembrements) et les prix au&nbsp;m² inférieurs à 3&nbsp;000&nbsp;€ ou
                  supérieurs à 30&nbsp;000&nbsp;€. Prix publié à partir de trois ventes, commerces compris dans
                  la surface.
                  {avecRdt && (
                    <>
                      {" "}Loyers de marché&nbsp;: loyers des appartements, carte des loyers de l’ANIL
                      {millesime ? ` ${millesime}` : ""}, charges comprises.
                    </>
                  )}
                </p>
              </details>
            </div>

            <div className="paris-prix__notes">
              <p>
                <strong>Environ 15&nbsp;% de décote.</strong> Entre un immeuble vendu en bloc et le prix des
                appartements, la décote est en général d’environ 15&nbsp;%. Elle varie selon
                l’arrondissement, le type d’immeuble et les loyers réellement pratiqués.
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
              acheteurs, pour préserver sa valeur et son exclusivité. Vos locataires et vos voisins ne
              l’apprennent pas par une annonce.
            </p>
          </Reveal>
          <LigneDefilante className="paris-ligne">
            {VENTE.map((x) => (
              <article key={x.titre} className="paris-carte">
                <Picto nom={x.picto} taille={30} />
                <h3>{x.titre}</h3>
                <p>{insecable(x.texte)}</p>
                {x.citation && <Citation {...x.citation} />}
              </article>
            ))}
          </LigneDefilante>
          <ul className="paris-compteurs" aria-label="Les recherches déposées dans notre base">
            {recherches.map((r) => (
              <li key={r.libelle}>
                <Picto nom={r.picto} taille={22} />
                <span className="paris-compteurs__val">{r.valeur}</span>{" "}
                <span className="paris-compteurs__lib">{r.libelle}</span>
              </li>
            ))}
          </ul>
          <Relance />
        </div>
      </section>

      {/* Serai-je seul une fois l'offre reçue ? Retour #312 : l'après-offre est la partie la plus difficile. */}
      <section className="section section--creme paris-apres-sec">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>De l’offre à l’acte</Eyebrow>
            <h2>
              Après l’offre commence <span className="accent">le plus difficile</span>
            </h2>
            <p className="lead">
              C’est là que travailler avec un professionnel prend tout son sens. Préemption de la Ville,
              droits des locataires, questions du notaire&nbsp;: nous vous accompagnons de bout en bout,
              jusqu’à l’acte.
            </p>
          </Reveal>
          <div className="paris-apres">
            {/* Trois lignes l'une sous l'autre sur ordinateur, une ligne qui glisse au téléphone. */}
            <LigneDefilante className="paris-obstacles">
              {OBSTACLES.map((x) => (
                <article key={x.titre} className="paris-obstacle">
                  <Picto nom={x.picto} taille={28} />
                  <div>
                    <h3>{x.titre}</h3>
                    <p>{insecable(x.texte)}</p>
                  </div>
                </article>
              ))}
            </LigneDefilante>
            <div className="paris-apres__compte">
              <h3>Dans votre espace client, vous suivez tout</h3>
              <ol className="paris-frise" aria-label="Les étapes de la vente">
                {FRISE.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ol>
              <ul className="paris-apres__ecrans">
                {COMPTE.map((x) => (
                  <li key={x.titre}>
                    <strong>{x.titre}.</strong> {insecable(x.texte)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* L'avis porte sur le suivi de la vente, pas sur l'espace client : il est hors de son encadré. */}
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
              <article key={x.titre} className="paris-carte">
                <Picto nom={x.picto} taille={30} />
                <h3>{x.titre}</h3>
                <p>{insecable(x.texte)}</p>
              </article>
            ))}
          </LigneDefilante>
          <Relance />
        </div>
      </section>

      {/* Et si je le vendais par appartements ? */}
      <section className="section section--noir-3 paris-decoupe-sec">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>En bloc ou à la découpe</Eyebrow>
            <h2>
              Vendre en bloc ou à la découpe à Paris&nbsp;: <span className="accent">nous chiffrons les deux</span>
            </h2>
            <p className="lead">
              Vendus un par un, les logements d’un immeuble peuvent rapporter davantage. Pas toujours&nbsp;:
              nous faisons le calcul pour le vôtre.
            </p>
          </Reveal>
          <ul className="paris-decoupe">
            <li><strong>Nous faisons les deux.</strong> Quand la découpe ne crée pas de valeur, nous vous le disons et nous vendons en bloc.</li>
            <li><strong>Nous pilotons l’opération.</strong> Mise en copropriété, offres de vente aux locataires en place, départs négociés à l’amiable, baux commerciaux, travaux, vente lot par lot.</li>
            <li><strong>Vous gardez le choix.</strong> Tant que le premier lot n’est pas vendu, l’immeuble reste vendable en bloc.</li>
          </ul>
          <Relance libelle="Chiffrer les deux scénarios" court="Chiffrer les deux" />
        </div>
      </section>

      {/* L'ont-ils déjà fait ? */}
      {ventesParis.length > 0 && (
        <section className="section section--creme paris-ventes-sec">
          <div className="container">
            <Reveal className="section__head tete-2col">
              <Eyebrow>Exemples de ventes à Paris</Eyebrow>
              <h2>
                Des immeubles de rapport vendus à Paris, <span className="accent">prix affichés</span>
              </h2>
              <p className="lead">
                Nous publions nos ventes&nbsp;: rue, surface, loyer, rendement et prix de vente. Voici des
                exemples parisiens.
                {anneesAvantHausse.length > 0
                  ? ` Ceux de ${anneesAvantHausse.join(", ").replace(/, ([^,]*)$/, " et $1")} datent d’avant la hausse des taux.`
                  : ""}
              </p>
            </Reveal>
            {/* Au téléphone, les cartes passent sur une ligne qui glisse (`ventes-flux`). */}
            <div className="ventes-flux">
              <ul className="ventes">
                {ventesParis.map((v, i) => (
                  <Reveal key={v.id} as="li" className="vente" delayIndex={i}>
                    <CarteVente v={v} sansDelai />
                  </Reveal>
                ))}
              </ul>
            </div>
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
        titre={<>Vendre ou faire estimer un immeuble à Paris&nbsp;: <span className="accent">vos questions</span></>}
        className="section--noir-2 paris-faq-sec"
      >
        <Relance />
      </SectionFaq>

      <BoutonFixeMobile href="#estimer" cible="estimer" libelle="Estimer mon immeuble" />
    </>
  );
}
