import { imagesPartage } from "@/lib/partage";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { LigneDefilante } from "@/components/LigneDefilante";
import { EstimationForm } from "@/components/EstimationForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { CarteArgument, Citation, Relance } from "@/components/annonces/arguments";
import { APRES, CONDITIONS, DECOUPE, ESTIMATION, VENTE } from "@/lib/arguments-paris";
import { SectionFaq, insecable } from "@/components/SectionFaq";
import { FondPhoto } from "@/components/FondPhoto";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { JsonLd } from "@/components/JsonLd";
import { filAriane, organisation, service } from "@/lib/schema";
import { donneesPrixParis } from "@/lib/prix-paris";
import { faqParis, vivantsParis } from "@/lib/faq-paris";
import { TableauPrixParis } from "@/components/annonces/TableauPrixParis";
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
 *   décote face aux appartements vendus seuls, une note de fiabilité (d'une à trois étoiles depuis
 *   le lot 111) et le rendement
 *   théorique. La fourchette n'est plus une colonne : la note s'en sert ;
 * - toutes les rangées « picto, titre, texte » alignées d'une carte à l'autre (#338, #339) ;
 * - après l'offre (#332 à #336) : quatre cartes, plus rien sur la préemption, les droits des
 *   locataires ni l'espace client ;
 * - découpe (#340) : une option, avec un bouton vers sa page dans un nouvel onglet ;
 * - ventes (#341, #342) : toutes nos ventes d'immeubles à Paris, une ligne qui glisse dès la quatrième.
 *
 * Lot 111 (MAV, 13/11/2026, retours #358 à #373 et son message) : fiabilité en étoiles, une à
 * trois ; décote « de 10 à 30 % » ; rendement « en général » tiré du tableau ; cartes sans filet
 * vertical ; citations ouvertes par un grand guillemet or ; lignes qui glissent comme sur le reste
 * du site (`marches`) ; FAQ : un groupe sur les acquéreurs et les offres, deux questions retirées.
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

/** « 2020 », « 2020 et 2021 », « 2019, 2020 et 2021 ». */
const enumeration = (mots: (string | number)[]) => mots.join(", ").replace(/, ([^,]*)$/, " et $1");


export default async function VendreUnImmeubleParis() {
  const [ch, prixParis, toutes] = await Promise.all([chiffres(), donneesPrixParis(), lesVentes()]);
  // Tant que le contenu relu n'est pas déposé dans content/paris.json, la page n'existe pas.
  if (!PARIS.questions.length) notFound();

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


  // Lot 112 (MAV, 14/11/2026 : « enlève les séparateurs or sur les 3 chiffres », « copie le style du
  // reste du site ») : les trois chiffres sont des cartes à chiffre, comme le réseau d'acheteurs de
  // l'accueil. Le libellé court est sous le chiffre, la précision dessous. Mêmes mots qu'avant.
  const preuves: { picto: NomPicto; valeur: string; libelle: string; texte: string }[] = [
    {
      picto: "reseau",
      valeur: acheteurs,
      libelle: acheteursParisiens ? "acheteurs d’immeubles parisiens" : "acheteurs d’immeubles",
      texte: "dans notre base",
    },
    etudiesParis
      ? { picto: "immeubles", valeur: nombre(etudiesParis), libelle: "immeubles parisiens étudiés", texte: "par nos agents depuis 2018" }
      : { picto: "immeubles", valeur: nombre(ch.immeublesTraites), libelle: "immeubles étudiés", texte: "par nos agents depuis 2018" },
    {
      picto: "best",
      valeur: `${PREUVES.noteGoogle}/5`,
      libelle: "note moyenne sur Google",
      texte: `sur ${PREUVES.nbAvis} avis de vendeurs et d’acquéreurs`,
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

  // FAQ en groupes titrés (33 questions en six groupes au lot 111) : src/lib/faq-paris.tsx, partagé
  // avec les pages des annonces.
  const faq = faqParis(vivantsParis(prixParis, ch));
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
          <ul className="grid grid--3 paris-preuves">
            {preuves.map((r) => (
              <li key={r.libelle} className="card card--filigrane">
                <span className="card__fond" aria-hidden="true">
                  <Picto nom={r.picto} taille={96} />
                </span>
                <span className="stat-number">{r.valeur}</span>{" "}
                <span className="stat-label">{r.libelle}</span>{" "}
                <p>{insecable(r.texte)}</p>
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
          <LigneDefilante marches className="paris-ligne">
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
      <TableauPrixParis donnees={prixParis} />

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
          <LigneDefilante marches className="paris-ligne">
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
          <LigneDefilante marches className="paris-ligne">
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
          <LigneDefilante marches className="paris-ligne paris-ligne--3">
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
          <LigneDefilante marches className="paris-ligne paris-ligne--3">
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
              marches
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
