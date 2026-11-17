import type { Metadata } from "next";
import Image from "next/image";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/Faq";
import { FondPhoto } from "@/components/FondPhoto";
import { EstimationForm } from "@/components/EstimationForm";
import { SectionFaq, insecable } from "@/components/SectionFaq";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { Citation, Relance } from "@/components/annonces/arguments";
import { donneesPrixParis } from "@/lib/prix-paris";
import { faqParis, vivantsParis } from "@/lib/faq-paris";
import { chiffres } from "@/lib/chiffres";
import { imagesPartage } from "@/lib/partage";
import { VISUELS } from "@/lib/visuels";
import { PREUVES, SITE, nombre } from "@/lib/site";
import "@/app/annonces.css";

/**
 * /confier-son-immeuble-paris/ : la page de la décision (lot 140, MAV, 17/11/2026 : « entre
 * conversion et ux/ui faut quand même réussir à les convaincre »).
 *
 * Son rôle parmi les quatre pages des annonces : le propriétaire compare, revient, ou ne décide
 * pas seul. La page lui donne les questions à poser à tout intermédiaire, et nos réponses : ce sont
 * nos points vérifiables, sans un mot sur les concurrents. Elle ne reçoit pas de mot-clé : c'est le
 * lien annexe des annonces (« Cinq questions à poser ») et le lien que l'agent envoie après un
 * premier appel. Le visiteur a cliqué pour lire : le formulaire est en fin de page, la pilule fixe
 * au téléphone.
 *
 * Hors index, hors sitemap, hors menus. Seul lien de sortie : les avis Google, pour vérifier.
 */
const URL_PAGE = "/confier-son-immeuble-paris/";
const TITRE = "À qui confier la vente de son immeuble à Paris | France Immeuble";
const DESCRIPTION =
  "Cinq questions à poser avant de confier la vente de votre immeuble parisien, nos réponses et les avis de nos clients. Estimation gratuite.";

export const metadata: Metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}${URL_PAGE}` },
  robots: { index: false, follow: true },
  openGraph: { type: "website", title: TITRE, description: DESCRIPTION, url: URL_PAGE, images: imagesPartage(URL_PAGE) },
};

export default async function ConfierSonImmeubleParis() {
  const [ch, prixParis] = await Promise.all([chiffres(), donneesPrixParis()]);
  const acheteurs = nombre(ch.investisseurs);
  const faq = faqParis(vivantsParis(prixParis, ch), [
    "Pourquoi vendre votre immeuble à Paris avec France Immeuble, agence spécialisée ?",
    "À qui vendre un immeuble à Paris : investisseur ou marchand de biens ?",
    "Faut-il signer un mandat exclusif pour vendre un immeuble ?",
    "Combien d’impôt sur la plus-value en vendant un immeuble à Paris ?",
  ]);

  /** Les cinq questions à poser à tout intermédiaire, et nos réponses : des faits déjà écrits sur la page Paris. */
  const questions = [
    {
      question: "Comment arrivez-vous à votre prix ?",
      reponse: "Quatre lectures : le marché, le locatif, le bâti, la cible. Chaque bail est lu, les travaux sont chiffrés.",
    },
    {
      question: "À qui présentez-vous mon immeuble ?",
      reponse: `Sans annonce. Notre base compte ${acheteurs} acheteurs d’immeubles. Votre dossier part à ceux dont la recherche correspond.`,
    },
    {
      question: "Que vaut votre dossier de vente ?",
      reponse: "État locatif, baux, surfaces, diagnostics : tout ce qu’il faut à un acquéreur pour faire une offre.",
    },
    {
      question: "À quoi est-ce que je m’engage ?",
      reponse: "L’estimation ne vous engage pas à vendre. Pas de mandat exclusif imposé. Pour une vente en bloc, nos honoraires ne sont dus qu’à l’acte.",
    },
    {
      question: "Que faites-vous après l’offre ?",
      reponse: "Dossier locatif, diagnostics, dossier technique, pièces demandées par le notaire : nous réunissons tout, jusqu’à l’acte.",
    },
  ];

  /** La note Google et le lien pour vérifier : le seul lien de sortie de ces pages. */
  const avis = (
    <p className="lp-avis-ligne">
      <span className="stat-number">{PREUVES.noteGoogle}/5</span>
      <span>sur {PREUVES.nbAvis} avis Google de clients</span>
      <a className="lien-texte" href={PREUVES.avisGoogle} target="_blank" rel="noopener">
        Lire les {PREUVES.nbAvis} avis sur Google
      </a>
    </p>
  );
  /** Le seul client qui dit avoir comparé : au mot près de son avis Google. */
  const compare = (
    <Citation
      texte="… leur dossier était de loin le plus détaillé et surtout le plus adapté à la vente d’un immeuble entier."
      auteur="Danièle M."
    />
  );

  return (
    <>
      <HeroMedia image={VISUELS.fenetresHeureBleue.src} alt={VISUELS.fenetresHeureBleue.alt} className="lp-hero-decision">
        <>
          <Eyebrow>Vente d’immeubles de&nbsp;rapport à Paris</Eyebrow>
          <h1 className="hero-titre">
            À qui <span className="accent">confier votre immeuble</span>&nbsp;?
          </h1>
          <p className="lead">
            Vous comparez plusieurs intermédiaires pour vendre un immeuble à Paris&nbsp;? Voici cinq
            questions à leur poser, et nos réponses.
          </p>
          <div className="btn-row">
            <Button href="#estimer">Estimer mon immeuble</Button>
          </div>
        </>
      </HeroMedia>

      {/* La pièce de la page : cinq questions, nos réponses, et de quoi vérifier. */}
      <section className="section section--noir-2 lp-questions-sec" data-lp="questions">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>Avant de choisir</Eyebrow>
            <h2>
              Cinq questions à poser à <span className="accent">toute agence</span>
            </h2>
            <p className="lead">
              Posez-les à chaque intermédiaire que vous rencontrez. Voici nos réponses.
            </p>
          </Reveal>
          <ul className="lp-questions">
            {questions.map((q) => (
              <li key={q.question} className="lp-question">
                <h3>{insecable(q.question)}</h3>
                <p>{insecable(q.reponse)}</p>
              </li>
            ))}
            <li className="lp-question lp-question--avis">
              {compare}
              {avis}
            </li>
          </ul>
          {/* Au téléphone : les mêmes questions en accordéon, la première réponse ouverte. */}
          <div className="lp-questions-mob">
            <Faq
              ouvertAuDepart={0}
              items={questions.map((q) => ({ question: insecable(q.question), reponse: <p>{insecable(q.reponse)}</p> }))}
            />
            {compare}
            {avis}
          </div>
          <Relance />
        </div>
      </section>

      {/* Qui sont-ils ? Les deux premiers paragraphes de « Notre histoire » de l'accueil, au mot près. */}
      <section className="section section--noir-3 histoire-sec lp-histoire-sec" data-lp="equipe">
        <div className="container split">
          <Reveal>
            <Eyebrow>France Immeuble, Paris 8e</Eyebrow>
            <h2>
              Qui <span className="accent">nous sommes</span>
            </h2>
            <p style={{ marginTop: "var(--space-s)" }}>
              Au cours de ma carrière, j’ai examiné plusieurs centaines d’immeubles. Je me suis
              alors rendu compte qu’il était très compliqué d’obtenir les informations nécessaires
              à la prise de décision, faute d’intermédiaires spécialisés et de dossiers adaptés aux
              immeubles.
            </p>
            <p style={{ marginTop: "var(--space-s)" }}>
              Nous avons donc conçu avec mon associé une méthode et des outils spécifiques à la
              vente d’immeubles pour rendre l’information accessible aux acheteurs et accompagner
              au mieux les vendeurs.
            </p>
            <p className="signature">
              <span className="signature__nom">Marc-Antoine Voci</span>
              <span className="signature__role">Co-fondateur</span>
            </p>
            <p className="lp-adresse">
              {SITE.adresse}, {SITE.codePostalVille}. Téléphone&nbsp;: <a href={SITE.telHref}>{SITE.tel}</a>
            </p>
            <Citation
              texte="… rien à voir avec l’agent immobilier lambda tel qu’on l’imagine."
              auteur="Thibault de la Baronnière"
            />
          </Reveal>
          <Reveal delayIndex={1} className="media-colonne media--fond-mob">
            <Image
              src="/media/FRANCE_IMMEUBLE_210922_12_38_15_WEB-1.webp"
              alt="L’équipe France Immeuble"
              width={700}
              height={760}
              sizes="(max-width: 900px) 100vw, 520px"
            />
          </Reveal>
        </div>
      </section>

      {/* Le seul formulaire de la page : la section de la page Paris. */}
      <section id="estimer" className="section section--noir section--ecran sec-formulaire paris-form-sec" data-lp="formulaire">
        <FondPhoto image="/media/atouts/signature-dossier.webp" position="40% center" clair />
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Première étape</Eyebrow>
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
          <EstimationForm
            formulaire="vendre"
            libelleEnvoi="Estimer mon immeuble"
            chapeau="Confidentiel et sans engagement de vente."
          />
        </div>
      </section>

      <SectionFaq
        items={faq}
        className="section--noir-2 lp-faq-sec"
        titre={<>Confier son immeuble à France Immeuble&nbsp;: <span className="accent">vos&nbsp;questions</span></>}
      />

      <BoutonFixeMobile href="#estimer" cible="estimer" libelle="Estimer mon immeuble" />
    </>
  );
}
