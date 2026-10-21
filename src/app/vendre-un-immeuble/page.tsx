import type { Metadata } from "next";
import { HeroMedia } from "@/components/HeroMedia";
import { BandeMedia } from "@/components/BandeMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Avis } from "@/components/Avis";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import { ContactForm } from "@/components/ContactForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { metadonneesWP } from "@/components/ContenuWP";
import { VISUELS } from "@/lib/visuels";
import { SITE } from "@/lib/site";

/**
 * /vendre-un-immeuble/ — page reprise du WordPress, RECOMPOSÉE.
 *
 * Texte repris mot pour mot de `content/pages-wp.json`.
 *
 * Un bug de la version précédente disparaît ici : l'ancien thème superposait
 * en absolu, sur l'image de chaque étape, un calque portant le titre et le
 * numéro. Sans ce CSS, les calques revenaient dans le flux et CHAQUE ÉTAPE
 * affichait son titre deux fois (« Parlons-nous » puis « Parlons-nous »,
 * « 1/4 » puis « 1 »). La recomposition ne garde qu'une occurrence.
 */
export const metadata: Metadata = metadonneesWP("/vendre-un-immeuble/");

const ETAPES = [
  {
    num: "1/4",
    titre: "Parlons-nous",
    texte: "Faites-nous part de votre projet en ligne, par mail ou par téléphone",
  },
  {
    num: "2/4",
    titre: "Estimation",
    texte:
      "Nous déterminons le prix de vente maximum de votre immeuble selon ses atouts et le type d’acheteurs ciblé",
  },
  {
    num: "3/4",
    titre: "Commercialisation",
    texte:
      "Grâce à nos outils spécifiques et à notre réseau, nous trouvons le meilleur acheteur pour votre immeuble",
  },
  {
    num: "4/4",
    titre: "Finalisation de la vente",
    texte:
      "Nous vous accompagnons dans les négociations puis nous occupons de toutes les démarches jusqu’à la vente",
  },
];

const ATOUTS: { picto: NomPicto; titre: string; texte: string }[] = [
  {
    picto: "constructibilite",
    titre: "Etude de constructibilité offerte",
    texte:
      "Nous calculons avec précision la surface constructible sur votre terrain et à quel prix un promoteur peut l’acheter.",
  },
  {
    picto: "stats",
    titre: "Commercialisation optimisée",
    texte:
      "Nos dossiers sont conçus pour les immeubles et adaptés au type d’acheteur ciblé pour faciliter leur prise de décision.",
  },
  {
    picto: "poignee",
    titre: "Conseils et un suivi complet",
    texte:
      "Nos conseillers sont à votre disposition pour tout conseil sur les sujets propres aux immeubles avant, pendant et après la vente.",
  },
  {
    picto: "best",
    titre: "Le meilleur prix pour votre immeuble",
    texte:
      "Nous trouvons parmi notre réseau d’investisseurs privés, de foncières, de family offices, de marchands de biens et d’institutionnels le meilleur acheteur pour votre immeuble.",
  },
  {
    picto: "business",
    titre: "Agents spécialisés",
    texte:
      "Nos agents basés à Paris et Bordeaux sont formés pour répondre aux exigences des acheteurs d’immeubles et défendre au mieux vos intérêts.",
  },
  {
    picto: "reseau",
    titre: "Un réseau en recherche constante",
    texte:
      "Plus de 1 500 acheteurs en recherche active d’immeubles : investisseurs privés, foncières, family offices, institutionnels, marchands de biens, promoteurs immobiliers…",
  },
];

export default function VendreUnImmeuble() {
  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Vendre un immeuble", url: "/vendre-un-immeuble/" },
        ])}
      />

      <HeroMedia image={VISUELS.facadeCoucher.src} alt={VISUELS.facadeCoucher.alt}>
        <>
          <Eyebrow>Vendre un immeuble &middot; Valorisation</Eyebrow>
          <h1>Vendez votre immeuble au meilleur prix</h1>
          <p className="lead">
            France Immeuble estime, valorise et trouve le meilleur acheteur pour votre immeuble.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>Vendre mon immeuble</Button>
            <Button href={SITE.telHref} variant="outline">Être rappelé.e</Button>
          </div>
        </>
      </HeroMedia>

      {/* Les deux portes d'entrée : estimer, ou chercher un acquéreur. */}
      <section className="section section--creme">
        <div className="container">
          <div className="grid grid--2">
            <Reveal as="article" className="card card--medaillon">
              <span className="card__fond" aria-hidden="true">
                <Picto nom="calculatrice" taille={190} />
              </span>
              <span className="card__picto" aria-hidden="true">
                <Picto nom="calculatrice" taille={30} />
              </span>
              <h2>Vous souhaitez connaître la valeur de votre immeuble&nbsp;?</h2>
              <p>
                Obtenez une estimation gratuite et sans engagement basée sur l’aspect général,
                géographique et locatif de votre immeuble ainsi que sur son caractère
                constructible pour une valorisation optimale.
              </p>
            </Reveal>
            <Reveal as="article" className="card card--medaillon" delayIndex={1}>
              <span className="card__fond" aria-hidden="true">
                <Picto nom="poignee" taille={190} />
              </span>
              <span className="card__picto" aria-hidden="true">
                <Picto nom="poignee" taille={30} />
              </span>
              <h2>Vous cherchez un acquéreur pour votre immeuble&nbsp;?</h2>
              <p>
                Nous trouvons parmi notre réseau d’investisseurs privés, de foncières, de family
                offices, de marchands de biens et d’institutionnels le meilleur acheteur pour
                votre immeuble.
              </p>
            </Reveal>
          </div>
          <div className="btn-row" style={{ marginTop: "var(--space-l)" }}>
            <Button href="#estimer" icone>Vendre mon immeuble</Button>
          </div>
        </div>
      </section>

      <section className="section section--noir-2">
        <div className="container split split--sticky">
          <Reveal className="split__aside">
            <Eyebrow>La méthode</Eyebrow>
            <h2>Comment ça fonctionne&nbsp;?</h2>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="#estimer" icone>Vendre mon immeuble</Button>
            </div>
          </Reveal>

          <div className="steps">
            {ETAPES.map((e, i) => (
              <Reveal key={e.num} as="article" className="step" delayIndex={i}>
                <span className="step__dot" aria-hidden="true" />
                <span className="step__num">{e.num}</span>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <BandeMedia image={VISUELS.toitsAeriens.src} alt={VISUELS.toitsAeriens.alt}>
        <h2>Pourquoi vendre avec France Immeuble&nbsp;?</h2>
      </BandeMedia>

      <section className="section section--creme">
        <div className="container">
          <div className="grid grid--3">
            {ATOUTS.map((a, i) => (
              <Reveal key={a.titre} as="article" className="card card--medaillon" delayIndex={i}>
                <span className="card__fond" aria-hidden="true">
                  <Picto nom={a.picto} taille={190} />
                </span>
                <span className="card__picto" aria-hidden="true">
                  <Picto nom={a.picto} taille={30} />
                </span>
                <h3>{a.titre}</h3>
                <p>{a.texte}</p>
              </Reveal>
            ))}
          </div>
          <div className="btn-row" style={{ marginTop: "var(--space-l)" }}>
            <Button href="#estimer" icone>Vendre mon immeuble</Button>
          </div>
        </div>
      </section>

      {/* Les avis arrivent juste avant le formulaire : c'est le moment ou le
          vendeur hesite, pas en bas de page une fois decide. Trois suffisent,
          la page d'accueil porte les douze. */}
      <Avis
        titre="Ce qu'en disent les vendeurs"
        compact
        fond="noir-2"
        intro="28 avis Google, 4,9/5 de moyenne. Des propriétaires qui nous ont confié un immeuble entier."
      />

      <section id="estimer" className="section section--noir">
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Première étape</Eyebrow>
            <h2>Obtenez votre estimation gratuite</h2>
            <p className="lead">
              Quelques informations sur le bien, et nous revenons vers vous sous 48&nbsp;h avec une
              fourchette argumentée.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href={SITE.telHref} variant="outline">
                Préférer le téléphone · {SITE.tel}
              </Button>
            </div>
          </Reveal>
          <EstimationForm />
        </div>
      </section>

      <section className="section section--noir-3">
        <div className="container split">
          <Reveal>
            <Eyebrow>Contact</Eyebrow>
            <h2>Besoin d’un conseil&nbsp;?</h2>
            <p className="lead">
              Un immeuble à vendre ou à acheter&nbsp;? Nous répondons à toutes vos questions.
            </p>
            <ul className="fiche-contact">
              <li>
                <Picto nom="telephone" taille={20} />
                <span>
                  <span className="fiche-contact__lbl">Téléphone</span>
                  <a href={SITE.telHref}>{SITE.tel}</a>
                </span>
              </li>
              <li>
                <Picto nom="mail" taille={20} />
                <span>
                  <span className="fiche-contact__lbl">Email</span>
                  <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                </span>
              </li>
            </ul>
          </Reveal>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
