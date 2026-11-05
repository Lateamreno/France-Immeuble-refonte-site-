import type { Metadata } from "next";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import type { NomPicto } from "@/components/Picto";
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
    texte: "Possibilités d’opérations marchandes et de promotion, si l’immeuble s’y prête",
  },
  {
    picto: "cible",
    titre: "Cible",
    texte: "Définition de la clientèle cible et de ses critères d’achat pour affiner l’estimation",
  },
  // Retour #165 (MAV, 04/11/2026) : la vente à la découpe, si l'immeuble s'y prête.
  {
    picto: "logement",
    titre: "Découpe",
    texte: "Possibilité de vendre lot par lot, si l’immeuble s’y prête, et ce qu’elle rapporterait",
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
          {/* Retour #168 (MAV, 04/11/2026) : le chapeau des analyses remonte ici. */}
          <p className="lead">
            La seule estimation conçue spécifiquement pour les immeubles. Elle se base sur leur
            aspect général, géographique et locatif, et sur leur caractère constructible, pour une
            valorisation optimale. Quand l’immeuble s’y prête, nous estimons aussi sa vente à la
            découpe.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>Estimer mon immeuble</Button>
            <Button href={SITE.telHref} variant="outline">Nous appeler</Button>
          </div>
        </>
      </HeroMedia>

      {/* Les cinq analyses et le schéma de l'immeuble (dessin A, MAV 03/11/2026) :
          chaque analyse allume sa partie du dessin. Sombre : la section suit le hero
          et précède le formulaire noir. */}
      {/* Sur ordinateur, la section reste à l'écran pendant que les cinq analyses
          défilent, puis la page reprend (retour #127, MAV, 03/11/2026). */}
      <section className="section section--noir-2 sec-analyses sec-analyses--pin">
        <div className="sec-analyses__pin">
        <div className="container">
          <AnalysesSchema
            svg={SCHEMA}
            analyses={ANALYSES}
            entete={
              <>
                <Eyebrow>Estimation</Eyebrow>
                <h2>
                  Analyses comprises dans l’estimation <span className="accent">gratuite</span>
                </h2>
              </>
            }
          />
          <div className="btn-row sec-analyses__cta">
            <Button href="#estimer">Estimer mon immeuble</Button>
          </div>
        </div>
        </div>
      </section>

      <section id="estimer" className="section section--noir section--ecran sec-formulaire">
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Première étape</Eyebrow>
            <h2>Obtenez votre <span className="accent">estimation gratuite</span></h2>
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

      <BoutonFixeMobile href="#estimer" libelle="Estimer mon immeuble" cible="estimer" />
    </>
  );
}
