import type { Metadata } from "next";
import { Chiffre } from "@/components/Chiffre";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { Picto } from "@/components/Picto";
import { CarteBien } from "@/components/CarteBien";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { VISUELS } from "@/lib/visuels";
import { SITE } from "@/lib/site";
import { biensAVendre } from "@/lib/biens";

/**
 * /immeubles-a-vendre/ — les immeubles que l'agence diffuse.
 *
 * Tout part du BO : le même envoi que celui qui alimente PleinBail dépose ces
 * biens dans la base du site, que cette page lit. Rien n'est saisi ici.
 * Jeu d'informations de PleinBail, sans l'adresse (§2).
 */
export const metadata: Metadata = {
  title: { absolute: "Immeubles de rapport à vendre | France Immeuble" },
  description:
    "Les immeubles de rapport que nous commercialisons : surface, lots, loyers, rendement et prix. D’autres mandats partent sans annonce, à notre fichier d’acquéreurs.",
  alternates: { canonical: `${SITE.url}/immeubles-a-vendre/` },
};

/** La liste change quand le BO dépose : revalidée toutes les 10 minutes. */
export const revalidate = 600;

export default async function ImmeublesAVendre() {
  const biens = await biensAVendre();
  const enVente = biens.filter((b) => b.statut === "en_vente").length;

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
          <h1>
            Les immeubles que nous <span className="accent">commercialisons</span>
          </h1>
          <p className="lead">
            Immeubles de rapport à vendre : surface, lots, loyers, rendement et prix. Tout ce qu’il
            faut pour décider s’il vaut le déplacement. L’adresse est communiquée à la demande.
          </p>
          {biens.length > 0 && (
            <div className="hero-proof">
              <Chiffre picto="immeubles" valeur={enVente} libelle={`immeuble${enVente > 1 ? "s" : ""} en vente`} />
            </div>
          )}
        </>
      </HeroMedia>

      <section className="section section--creme">
        <div className="container">
          {biens.length > 0 ? (
            <ul className="biens-liste biens-liste--ligne-mob">
              {biens.map((b, i) => (
                <Reveal key={b.id} as="li" delayIndex={i % 6}>
                  <CarteBien b={b} rang={i} />
                </Reveal>
              ))}
            </ul>
          ) : (
            /* N'apparaît que si la base est vide ou injoignable. Le texte ne
               prétend rien sur les raisons : il dit ce qui est vrai à tout
               moment, et ouvre les deux portes utiles. */
            <Reveal className="vide">
              <span className="vide__picto" aria-hidden="true">
                <Picto nom="immeubles" taille={44} />
              </span>
              <h2>Aucun immeuble affiché pour le moment</h2>
              <p className="lead">
                Nos annonces se mettent à jour plusieurs fois par jour. Une partie de nos mandats
                part par ailleurs <strong>sans annonce</strong>, directement aux acquéreurs dont
                la recherche correspond.
              </p>
              <div
                className="btn-row"
                style={{ marginTop: "var(--space-m)", justifyContent: "center" }}
              >
                <Button href="/immeubles-off-market/" icone>
                  Déposer ma recherche
                </Button>
                <Button href="/immeubles-vendus/" variant="ghost-dark">
                  Voir nos dernières ventes
                </Button>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Et ce qui n’est pas en ligne</Eyebrow>
            <h2>Une partie de nos mandats ne sont jamais diffusés</h2>
            <p className="lead">
              Certains propriétaires préfèrent que leurs locataires, leurs voisins et le marché
              n’apprennent pas la vente par une annonce. Ces immeubles partent directement aux
              acquéreurs inscrits dont la recherche correspond.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="/immeubles-off-market/">
                Accéder à l’off-market
              </Button>
              <Button href={SITE.telHref} variant="outline">
                Être rappelé.e
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
