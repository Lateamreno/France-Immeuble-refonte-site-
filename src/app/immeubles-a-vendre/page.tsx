import type { Metadata } from "next";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { Picto } from "@/components/Picto";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { VISUELS } from "@/lib/visuels";
import { SITE } from "@/lib/site";
import { BIENS_A_VENDRE, VENTES_STATS, prix } from "@/lib/biens";

/**
 * /immeubles-a-vendre/ — les immeubles effectivement diffusés par l'agence.
 *
 * La liste vient de la projection déposée par le BO, pour les seules annonces
 * dont la diffusion « France Immeuble » est cochée. Rien ne s'affiche tant que
 * cette case n'est pas cochée : le site ne décide pas de ce qui est public, le
 * BO le décide, annonce par annonce.
 *
 * Jeu d'informations calqué sur PleinBail, à une exception près : pas
 * d'adresse. Commune et département situent, la rue identifie le vendeur (§2).
 */
export const metadata: Metadata = {
  title: "Immeubles de rapport à vendre | France Immeuble",
  description:
    "Les immeubles de rapport que nous diffusons publiquement : surface, lots, loyers, rendement et prix. Le reste de nos mandats part sans annonce, à notre fichier d’acquéreurs.",
  alternates: { canonical: `${SITE.url}/immeubles-a-vendre/` },
};

export default function ImmeublesAVendre() {
  const biens = BIENS_A_VENDRE;

  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Biens à vendre", url: "/immeubles-a-vendre/" },
        ])}
      />

      <HeroMedia image={VISUELS.toitsAeriens.src} alt={VISUELS.toitsAeriens.alt}>
        <>
          <Eyebrow>Nos biens · à vendre</Eyebrow>
          <h1>Les immeubles que nous diffusons</h1>
          <p className="lead">
            Surface, lots, loyers, rendement et prix. Tout ce qu’il faut pour décider s’il vaut
            le déplacement&nbsp;— sauf l’adresse, qui appartient au vendeur jusqu’à la visite.
          </p>
          <div className="btn-row">
            <Button href="/immeubles-off-market/" icone>
              Accéder aussi à l’off-market
            </Button>
            <Button href={SITE.telHref} variant="outline">
              Être rappelé.e
            </Button>
          </div>
        </>
      </HeroMedia>

      <section className="section section--creme">
        <div className="container">
          {biens.length > 0 ? (
            <>
              <Reveal className="section__head">
                <Eyebrow>En diffusion</Eyebrow>
                <h2>
                  {biens.length} immeuble{biens.length > 1 ? "s" : ""} actuellement en ligne
                </h2>
              </Reveal>
              <ul className="annonces">
                {biens.map((b, i) => (
                  <Reveal key={b.id} as="li" className="annonce" delayIndex={i % 6}>
                    <h3>{b.titre}</h3>
                    <p className="annonce__ou">
                      {b.ville} <span>({b.dept})</span>
                    </p>
                    <p className="annonce__faits">
                      {b.type} · {b.surfaceCarrez} m² · {b.lots} lots
                    </p>
                    <p className="annonce__prix">{prix(b.prixHai)}</p>
                    {b.rendement !== null && (
                      <p className="annonce__rdt">{b.rendement} % brut</p>
                    )}
                  </Reveal>
                ))}
              </ul>
            </>
          ) : (
            /* État vide ASSUMÉ, et non un accident. Sur 30 immeubles en
               commercialisation aujourd'hui, aucun n'a d'annonce diffusée sur
               le site : c'est le modèle de l'agence, pas une page en panne. On
               le dit, et on envoie vers la seule porte qui ouvre vraiment. */
            <Reveal className="vide">
              <span className="vide__picto" aria-hidden="true">
                <Picto nom="immeubles" taille={44} />
              </span>
              <h2>Aucun immeuble en diffusion publique en ce moment</h2>
              <p className="lead">
                Ce n’est pas une page en construction. Nous commercialisons la quasi-totalité de
                nos mandats <strong>sans annonce</strong>, directement auprès des acquéreurs dont
                la recherche correspond. Un immeuble n’apparaît ici que si son propriétaire
                accepte qu’il soit diffusé publiquement&nbsp;— et c’est rare.
              </p>
              <p className="lead">
                Pour voir ce qui circule réellement, il faut être dans le fichier.
              </p>
              <div
                className="btn-row"
                style={{ marginTop: "var(--space-m)", justifyContent: "center" }}
              >
                <Button href="/immeubles-off-market/" icone>
                  Déposer ma recherche
                </Button>
                <Button href="/immeubles-vendus/" variant="ghost-dark">
                  Voir les {VENTES_STATS.total} immeubles vendus
                </Button>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Pourquoi si peu</Eyebrow>
            <h2>Diffuser publiquement est l’exception, pas la règle</h2>
            <p className="lead">
              Un immeuble mis en ligne, ce sont des locataires qui l’apprennent par une annonce,
              un voisinage et des confrères qui le savent, et un bien qui s’use en vitrine. La
              plupart de nos vendeurs refusent&nbsp;— et nous vendons quand même.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="/immeubles-off-market/" variant="outline">
                Comment marche l’off-market
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
