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
import { filtrer, lireCriteres, puces, TRIS, versParams, versRechercheCompte } from "@/lib/recherche-biens";
import { RechercheBiens } from "@/components/biens/RechercheBiens";
import Link from "next/link";

/**
 * /immeubles-a-vendre/ — les immeubles que l'agence diffuse.
 *
 * Tout part du BO : le même envoi que celui qui alimente PleinBail dépose ces
 * biens dans la base du site, que cette page lit. Rien n'est saisi ici.
 * Jeu d'informations de PleinBail, sans l'adresse (§2).
 *
 * Recherche comme Plein Bail (MAV, 31/10/2026) : les critères sont dans
 * l'adresse (`?dep=92&pmax=3000000&rdt=5&tri=rendement`), le filtre se fait
 * côté serveur. Une page filtrée n'est pas indexée ; la page nue reste la
 * seule adresse canonique. Favoris et offres passent par le compte.
 */
const metadata: Metadata = {
  title: { absolute: "Immeubles de rapport à vendre | France Immeuble" },
  description:
    "Les immeubles de rapport que nous commercialisons : surface, lots, loyers, rendement et prix. D’autres mandats partent sans annonce, à notre fichier d’acquéreurs.",
  alternates: { canonical: `${SITE.url}/immeubles-a-vendre/` },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filtree = Object.keys(await searchParams).length > 0;
  return filtree ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

export default async function ImmeublesAVendre({ searchParams }: Props) {
  const biens = await biensAVendre();
  const enVente = biens.filter((b) => b.statut === "en_vente").length;
  const criteres = lireCriteres(await searchParams);
  const resultats = filtrer(biens, criteres);
  const actives = puces(criteres);
  const parVille = new Map<string, { nom: string; dept: string; n: number }>();
  for (const b of biens) {
    const v = parVille.get(b.ville) ?? { nom: b.ville, dept: b.dept, n: 0 };
    v.n++;
    parVille.set(b.ville, v);
  }
  const parDept: Record<string, number> = {};
  for (const b of biens) parDept[b.dept] = (parDept[b.dept] ?? 0) + 1;
  const types = [...new Set(biens.map((b) => b.type))].sort();

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

      <section id="resultats" className="section section--creme biens-recherche">
        <div className="container">
          {biens.length > 0 ? (
            <>
              <RechercheBiens criteres={criteres} villes={[...parVille.values()]} types={types}
                departementsPresents={parDept} pourCompte={versRechercheCompte(criteres, biens)} />

              {actives.length > 0 && (
                <div className="puces-filtres">
                  {actives.map((p) => (
                    <Link key={p.libelle} href={p.sans} scroll={false} className="puce-filtre" aria-label={`Retirer le filtre ${p.libelle}`}>
                      {p.libelle} <span aria-hidden="true">×</span>
                    </Link>
                  ))}
                  <Link href="/immeubles-a-vendre/#resultats" scroll={false} className="lien-discret">Tout effacer</Link>
                </div>
              )}

              <div className="resultats-tete">
                <p className="resultats-tete__nb" aria-live="polite">
                  <strong>{resultats.length}</strong> immeuble{resultats.length > 1 ? "s" : ""} {actives.length ? "correspondant à votre recherche" : "à vendre"}
                </p>
                <nav className="tris" aria-label="Trier les résultats">
                  <span>Trier :</span>
                  {TRIS.map(([k, nom]) => (
                    <Link key={k} href={`/immeubles-a-vendre/${versParams({ ...criteres, tri: k })}#resultats`} scroll={false}
                      className={`tri${criteres.tri === k ? " est-actif" : ""}`} aria-current={criteres.tri === k ? "true" : undefined}>
                      {nom}
                    </Link>
                  ))}
                </nav>
              </div>

              {resultats.length > 0 ? (
                <ul className="biens-liste">
                  {resultats.map((b, i) => (
                    <li key={b.id}>
                      <CarteBien b={b} rang={i} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="vide vide--recherche">
                  <span className="vide__picto" aria-hidden="true"><Picto nom="loupe" taille={40} /></span>
                  <h2>Aucun immeuble en ligne ne correspond</h2>
                  <p className="lead">
                    Enregistrez cette recherche : votre agent vous propose les immeubles qui y
                    correspondent, y compris ceux qui ne passent jamais en annonce.
                  </p>
                  <div className="btn-row" style={{ marginTop: "var(--space-m)", justifyContent: "center" }}>
                    <Button href="/immeubles-a-vendre/#resultats" variant="ghost-dark">Voir tous les immeubles</Button>
                  </div>
                </div>
              )}
            </>
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
