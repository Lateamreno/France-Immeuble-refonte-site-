import type { Metadata } from "next";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import { ContactForm } from "@/components/ContactForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { JsonLd } from "@/components/JsonLd";
import { AnalysesSchema } from "@/components/AnalysesSchema";
import { schemaImmeuble } from "@/lib/schema-immeuble";
import { filAriane } from "@/lib/schema";
import { metadonneesWP } from "@/components/ContenuWP";
import { VISUELS } from "@/lib/visuels";
import { SITE } from "@/lib/site";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";

/**
 * /estimer-un-immeuble/ — page reprise du WordPress, RECOMPOSÉE.
 *
 * Le texte vient mot pour mot de `content/pages-wp.json` : aucune phrase n'est
 * réécrite, rien n'est ajouté. Ce qui change, c'est la mise en page — le
 * markup Gutenberg d'origine avait perdu ses classes à la migration et aucun
 * rattrapage CSS ne pouvait en faire une page tenable. On le recompose donc
 * avec les composants de la charte (§3 à §5).
 *
 * Title, meta et canonical restent repris au caractère près (§10).
 */
export const metadata: Metadata = metadonneesWP("/estimer-un-immeuble/");

/** Les cinq analyses, reprises telles quelles. */
const ANALYSES: { picto: NomPicto; titre: string; texte: string }[] = [
  {
    picto: "secteur",
    titre: "Secteur",
    texte: "Attractivité de l’emplacement, prix, loyers et rendements pratiqués dans la ville",
  },
  {
    picto: "technique",
    titre: "Technique",
    texte: "Qualité du bâti, état des lots, travaux à prévoir",
  },
  {
    picto: "financier",
    titre: "Financier",
    texte: "Revenus, occupation, charges, loyers pratiqués",
  },
  {
    picto: "constructibilite",
    titre: "Constructibilité",
    texte: "Analyse des possibilités d’opérations marchandes et de promotions",
  },
  {
    picto: "cible",
    titre: "Cible",
    texte: "Définition de la clientèle cible et de ses critères d’achat pour affiner l’estimation",
  },
];

/** Le dessin est calculé une fois, au rendu du serveur. */
const SCHEMA = schemaImmeuble();

export default function EstimerUnImmeuble() {
  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Estimer un immeuble", url: "/estimer-un-immeuble/" },
        ])}
      />

      <HeroMedia image={VISUELS.fenetresHeureBleue.src} alt={VISUELS.fenetresHeureBleue.alt}>
        <>
          {/* « Estimer un immeuble » est le H1 d'origine : il reste sur la page,
              en surtitre, et le titre visuel prend la place qui est la sienne. */}
          <Eyebrow>Estimer un immeuble</Eyebrow>
          <h1>
            Découvrez tout le <span className="accent">potentiel</span> de votre immeuble
          </h1>
          {/* Les deux textes d'origine étaient fusionnés ici : sept lignes
              d'accroche dans un hero. Le second descend d'une section, là où
              il a la place d'être lu. Rien n'est retiré. */}
          <p className="lead">
            La seule estimation conçue spécifiquement pour les immeubles.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>Estimer mon immeuble</Button>
            <Button href={SITE.telHref} variant="outline">Être rappelé.e</Button>
          </div>
        </>
      </HeroMedia>

      {/* Les cinq analyses et le schéma de l'immeuble (dessin A, MAV 03/11/2026) :
          chaque analyse allume sa partie du dessin. Sombre : la section suit le hero
          et précède le formulaire noir. */}
      <section className="section section--noir-2 sec-analyses">
        <div className="container">
          <Reveal className="sec-analyses__tete">
            <Eyebrow>Estimation</Eyebrow>
            <h2>
              Analyses comprises dans l’estimation <span className="accent">gratuite</span>
            </h2>
            <p className="lead">
              Bénéficiez d’une estimation se basant sur l’aspect général, géographique et locatif
              de votre immeuble ainsi que sur son caractère constructible pour une valorisation
              optimale.
            </p>
          </Reveal>
          <AnalysesSchema svg={SCHEMA} analyses={ANALYSES} />
          <div className="btn-row sec-analyses__cta">
            <Button href="#estimer">Estimer mon immeuble</Button>
          </div>
        </div>
      </section>

      <section id="estimer" className="section section--noir section--ecran sec-formulaire">
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Première étape</Eyebrow>
            <h2>Obtenez votre estimation gratuite</h2>
            <p className="lead">
              Quelques questions sur votre immeuble suffisent pour lancer son estimation. Elle est
              gratuite et confidentielle.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href={SITE.telHref} variant="outline">
                Préférer le téléphone · {SITE.tel}
              </Button>
            </div>
          </Reveal>

          {/* Hors <Reveal> : le formulaire est le canal d'acquisition n°1, sa
              visibilité ne dépend d'aucun observateur de défilement. */}
          <EstimationForm formulaire="estimer" />
        </div>
      </section>

      <section className="section section--noir-3 contact-sec">
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
      <BoutonFixeMobile href="#estimer" libelle="Estimer mon immeuble" cible="estimer" />
    </>
  );
}
