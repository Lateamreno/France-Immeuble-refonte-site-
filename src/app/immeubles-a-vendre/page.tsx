import type { Metadata } from "next";
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
import { biensAVendre, offMarket } from "@/lib/biens";
import { CarteOffMarket } from "@/components/biens/CarteOffMarket";
import { filtrer, horsRecherche, lienRecherche, lireCriteres, puces, TRIS, versParams, versRechercheCompte } from "@/lib/recherche-biens";
import { RechercheBiens, TriMobile } from "@/components/biens/RechercheBiens";
import Link from "next/link";

/**
 * /immeubles-a-vendre/ — les immeubles que l'agence diffuse.
 *
 * Tout part du BO : le même envoi que celui qui alimente PleinBail dépose ces
 * biens dans la base du site, que cette page lit. Rien n'est saisi ici.
 * Jeu d'informations de PleinBail, sans l'adresse (§2).
 *
 * Recherche comme Plein Bail (MAV, 31/10/2026, spec du 30/10) : les critères
 * sont dans l'adresse (`?ou=r:11&ou=d:78&pmax=3000000&rdt=5&tri=rendement`), le
 * filtre se fait côté serveur. Une page filtrée n'est pas indexée ; la page nue reste la
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
  const [biens, communesOff] = await Promise.all([biensAVendre(), offMarket()]);
  const nbOffMarket = communesOff.reduce((s, c) => s + c.nombre, 0);
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
  const prixEnLigne = biens.map((b) => b.prixHai);
  const bornesPrix = prixEnLigne.length ? { min: Math.min(...prixEnLigne), max: Math.max(...prixEnLigne) } : null;
  const ailleurs = horsRecherche(biens, criteres, resultats);
  const tris = TRIS.map(([k, nom]) => ({ cle: k, nom, lien: lienRecherche({ ...criteres, tri: k }) }));

  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Biens à vendre", url: "/immeubles-a-vendre/" },
        ])}
      />

      {/* Pas de grand hero ici (MAV, 02/11/2026) : le titre sur l'image de fond, puis la recherche. */}
      <HeroMedia image={VISUELS.toitsAeriens.src} alt={VISUELS.toitsAeriens.alt} compact>
        <h1>
          Les immeubles que nous <span className="accent">commercialisons</span>
        </h1>
      </HeroMedia>

      <section id="resultats" className="section section--creme biens-recherche">
        <div className="container">
          {biens.length > 0 ? (
            <>
              <RechercheBiens key={versParams(criteres)} criteres={criteres} villes={[...parVille.values()]}
                departementsPresents={parDept} bornesPrix={bornesPrix}
                pourCompte={versRechercheCompte(criteres, biens)} />

              {actives.length > 0 && (
                <div className="puces-filtres">
                  {actives.map((p) => (
                    <Link key={p.libelle} href={p.sans} scroll={false} className={`puce-filtre${p.lieu ? " puce-filtre--lieu" : ""}`}
                      aria-label={`Retirer le filtre ${p.libelle}`}>
                      {p.libelle} <span aria-hidden="true">×</span>
                    </Link>
                  ))}
                  <Link href="/immeubles-a-vendre/#resultats" scroll={false} className="lien-discret">Tout effacer</Link>
                </div>
              )}

              <div className="resultats-tete">
                <p className="resultats-tete__nb" aria-live="polite">
                  <strong>{resultats.length}</strong> immeuble{resultats.length > 1 ? "s" : ""} de rapport {actives.length ? (resultats.length > 1 ? "correspondent" : "correspond") : "à vendre"}
                </p>
                <nav className="tris" aria-label="Trier les résultats">
                  {tris.map((t) => (
                    <Link key={t.cle} href={t.lien} scroll={false}
                      className={`tri${criteres.tri === t.cle ? " est-actif" : ""}`} aria-current={criteres.tri === t.cle ? "true" : undefined}>
                      {t.nom}
                    </Link>
                  ))}
                </nav>
                <TriMobile options={tris} actif={criteres.tri} />
              </div>

              {/* La vignette off-market reste la première, quels que soient les critères et le tri (MAV, 02/11/2026). */}
              <ul className="biens-liste biens-liste--resultats">
                <li><CarteOffMarket nombre={nbOffMarket} /></li>
                {resultats.map((b, i) => (
                  <li key={b.id}>
                    <CarteBien b={b} rang={i} />
                  </li>
                ))}
              </ul>
              {resultats.length === 0 && (
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

              {ailleurs && (
                <div className="hors-recherche">
                  <p className="hors-recherche__titre"><span>En dehors de votre recherche</span></p>
                  <ul className="biens-liste biens-liste--resultats">
                    {ailleurs.biens.map((b) => (
                      <li key={b.id}><CarteBien b={b} rang={9} /></li>
                    ))}
                  </ul>
                  {ailleurs.lien && (
                    <div className="btn-row" style={{ marginTop: "var(--space-m)", justifyContent: "center" }}>
                      <Button href={ailleurs.lien} variant="ghost-dark">Voir toutes ces annonces</Button>
                    </div>
                  )}
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
