import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { LigneDefilante } from "@/components/LigneDefilante";
import { FondPhoto } from "@/components/FondPhoto";
import { Picto, type NomPicto } from "@/components/Picto";
import { SectionFaq } from "@/components/SectionFaq";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { HeroAnnonce } from "@/components/annonces/HeroAnnonce";
import { CarteArgument, Citation, Relance } from "@/components/annonces/arguments";
import { APRES, CONDITIONS, VENTE_ANNONCES } from "@/lib/arguments-paris";
import { donneesPrixParis } from "@/lib/prix-paris";
import { faqParis, vivantsParis } from "@/lib/faq-paris";
import { chiffres } from "@/lib/chiffres";
import { imagesPartage } from "@/lib/partage";
import { VISUELS } from "@/lib/visuels";
import { PREUVES, SITE, nombre } from "@/lib/site";

/**
 * /vendre-immeuble-paris/ : la page des annonces Google pour « vendre immeuble Paris » (lot 140,
 * MAV, 17/11/2026 : « Montre-moi quatre pages que tu utiliserais pour les ads »).
 *
 * Son rôle : le propriétaire a décidé de vendre et compare les intermédiaires. C'est le clic le plus
 * proche d'un mandat. La page est la version « annonces » de la page Paris : mêmes sections validées
 * (vente off-market, après l'offre, honoraires), dans l'ordre des objections d'un vendeur, avec le
 * formulaire dans le premier écran. « Sans annonce, donc moins d'acheteurs ? » vient en premier.
 *
 * Hors index, hors sitemap, hors menus. Aucun délai, aucun lien de sortie hors FAQ (nouvel onglet),
 * pas de cartes de ventes (MAV les a retirées de la page des annonces au lot 100).
 */
const URL_PAGE = "/vendre-immeuble-paris/";
const TITRE = "Vendre un immeuble à Paris | France Immeuble";
const DESCRIPTION =
  "Vendez votre immeuble parisien sans annonce : il est présenté aux acheteurs de notre base dont la recherche correspond. Honoraires dus seulement à l’acte.";

export const metadata: Metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}${URL_PAGE}` },
  robots: { index: false, follow: true },
  openGraph: { type: "website", title: TITRE, description: DESCRIPTION, url: URL_PAGE, images: imagesPartage(URL_PAGE) },
};

/** Les trois profils d'acquéreurs de la page Paris, sans compteur (le BO n'a pas encore déposé les acheteurs pour Paris). */
const PROFILS: { picto: NomPicto; nom: string; cherche: string }[] = [
  { picto: "financier", nom: "Investisseurs", cherche: "ils cherchent du rendement." },
  { picto: "business", nom: "Marchands de biens", cherche: "ils cherchent une plus-value à la revente." },
  { picto: "immeubles", nom: "Acheteurs patrimoniaux", cherche: "ils cherchent de beaux immeubles et de belles adresses." },
];

/** Trois vendeurs, au mot près de leur avis Google (`AVIS`, src/lib/accueil.ts) ; « … » marque la coupe. */
const VENDEURS = [
  { auteur: "Luis Ramos", texte: "J’ai confié la vente d’un immeuble à France Immeuble qui a su parfaitement gérer l’affaire." },
  { auteur: "Thierry Depois", texte: "… à un prix proche de l’estimation initiale et avec un accompagnement permanent tout au long de l’opération." },
  { auteur: "Abdelkrim Karim Sekouri", texte: "… nous a permis de vendre notre bien dans de très bonnes conditions" },
];

export default async function VendreImmeubleParis() {
  const [ch, prixParis] = await Promise.all([chiffres(), donneesPrixParis()]);
  // « D'immeubles parisiens » seulement quand le BO a déposé ce chiffre (lot 110) ; sinon le chiffre global.
  const acheteursParisiens = ch.acheteursParis != null;
  const acheteurs = nombre(ch.acheteursParis ?? ch.investisseurs);
  const faq = faqParis(vivantsParis(prixParis, ch), [
    "Qu’est-ce qu’une vente off-market, et pourquoi vendre ainsi un immeuble à Paris ?",
    "Mes locataires et mes voisins sauront-ils que mon immeuble est à vendre ?",
    "Combien coûte la vente d’un immeuble à Paris avec France Immeuble ?",
    "Faut-il signer un mandat exclusif pour vendre un immeuble ?",
    "Peut-on recevoir une offre sans condition suspensive de financement ?",
    "Combien de temps faut-il pour vendre un immeuble à Paris ?",
    "Faut-il vider l’immeuble avant de le vendre ?",
  ]);

  return (
    <>
      <HeroAnnonce
        image={VISUELS.facadeCoucher.src}
        alt={VISUELS.facadeCoucher.alt}
        formulaire="vendre"
        surtitre="Vendre un immeuble à Paris"
        titre={<>Vendre votre immeuble à Paris, <span className="accent">sans&nbsp;annonce</span></>}
        accroche={
          <>
            Nous le présentons aux acheteurs de notre base dont la recherche correspond, pour vous
            obtenir la meilleure offre.
            <span className="lp-long"> Vos locataires et vos voisins ne l’apprennent pas par une annonce.</span>
          </>
        }
        preuves={[
          {
            picto: "reseau",
            titre: `${acheteurs} acheteurs ${acheteursParisiens ? "d’immeubles parisiens" : "d’immeubles"}`,
            texte: "investisseurs, marchands de biens, acheteurs patrimoniaux",
          },
          { picto: "poignee", titre: "Des offres solides", texte: "souvent sans condition de financement" },
          { picto: "euro", titre: "Honoraires dus à l’acte", texte: "barème public" },
        ]}
        // Sans libellé « parisiens » sur cette ligne courte : le chiffre global, celui de la FAQ et de la page D.
        preuveMobile={`${nombre(ch.investisseurs)} acheteurs, ${PREUVES.noteGoogle}/5 sur Google`}
      />

      {/* Sans annonce, donc moins d'acheteurs ? L'objection que le titre fait naître, en premier. */}
      <section className="section section--noir lp-bande lp-acheteurs-sec" data-lp="acheteurs">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>À qui nous vendons</Eyebrow>
            <h2>
              Des acheteurs <span className="accent">identifiés</span>, dont nous connaissons le sérieux
            </h2>
            <p className="lead">
              Notre base compte {acheteurs} acheteurs {acheteursParisiens ? "d’immeubles parisiens" : "d’immeubles"}.
              Votre dossier n’est envoyé qu’à ceux dont la recherche correspond.
            </p>
          </Reveal>
          <ul className="paris-profils lp-profils" aria-label="Les trois profils d’acquéreurs de notre base">
            {PROFILS.map((p) => (
              <li key={p.nom}>
                <Picto nom={p.picto} taille={22} />
                <p className="paris-profils__qui">
                  <strong>{p.nom}</strong>&nbsp;: {p.cherche}
                </p>
              </li>
            ))}
          </ul>
          <Citation
            texte="… l’agence s’est présentée dès la première visite avec un acheteur potentiel…"
            auteur="Romain VZ"
          />
        </div>
      </section>

      {/* Pourquoi sans annonce ? La section de la page Paris, la meilleure offre en tête. */}
      <section className="section section--noir-2 paris-vente-sec" data-lp="vente">
        <FondPhoto image="/media/atouts/commercialisation-dossier.webp" cote="droite" position="center 30%" />
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>Vente en bloc, sans annonce</Eyebrow>
            <h2>
              Vendre un immeuble en bloc à Paris, <span className="accent">100&nbsp;% off-market</span>
            </h2>
            <p className="lead">
              Votre immeuble est commercialisé uniquement en off-market, pour préserver sa valeur et
              son exclusivité.
            </p>
          </Reveal>
          <LigneDefilante marches className="paris-ligne">
            {VENTE_ANNONCES.map((x) => (
              <CarteArgument key={x.titre} {...x} />
            ))}
          </LigneDefilante>
          <Relance />
        </div>
      </section>

      {/* Une offre n'est pas une vente : la section de la page Paris, à l'identique. */}
      <section className="section section--creme paris-apres-sec lp-methode-sec" data-lp="apres">
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

      {/* Combien, et suis-je lié ? La section de la page Paris, à l'identique. */}
      <section className="section section--noir paris-conditions-sec" data-lp="conditions">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Honoraires et mandat</Eyebrow>
            <h2>
              Honoraires <span className="accent">à la charge de l’acquéreur</span>, dus à la signature
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

      {/* D'autres vendeurs l'ont-ils fait ? Trois phrases d'avis, sans lien de sortie. */}
      <section className="section section--noir-3 lp-bande lp-avis-sec" data-lp="avis">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Ils nous font confiance</Eyebrow>
            <h2>
              Ce qu’en disent <span className="accent">nos vendeurs</span>
            </h2>
          </Reveal>
          <ul className="grid grid--3 lp-avis">
            {VENDEURS.map((v) => (
              <li key={v.auteur} className="card">
                <Citation {...v} />
              </li>
            ))}
          </ul>
          <Relance />
        </div>
      </section>

      <SectionFaq
        items={faq}
        className="section--noir-2 lp-faq-sec"
        titre={<>Vendre un immeuble à Paris&nbsp;: <span className="accent">vos&nbsp;questions</span></>}
      />

      <BoutonFixeMobile href="#estimer" cible="estimer" libelle="Estimer mon immeuble" />
    </>
  );
}
