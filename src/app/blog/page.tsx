import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Eyebrow } from "@/components/Eyebrow";
import { HeroMedia } from "@/components/HeroMedia";
import { VISUELS } from "@/lib/visuels";
import { Button } from "@/components/Button";
import { LigneDefilante } from "@/components/LigneDefilante";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { PREUVES, SITE } from "@/lib/site";
import { dateFr, dureeLecture, tousLesArticles } from "@/lib/contenu";

/**
 * /blog/ — page de listing, et rien d'autre.
 *
 * Les articles eux-mêmes vivent à la racine du site : /comment-vendre-un-
 * immeuble-de-rapport/ et non /blog/comment-… (CLAUDE.md §10). Cette page ne
 * porte donc aucun trafic propre ; c'est un point de passage.
 *
 * Title et meta repris à l'identique de l'ancien site.
 */
export const metadata: Metadata = {
  title: { absolute: "Blog - France Immeuble" },
  description:
    "Retrouvez nos articles sur l'achat et la vente d'immeubles. Pourquoi acheter un immeuble plutôt qu'un appartement, quel immeuble acheter, etc.",
  alternates: { canonical: "/blog/" },
};

export default async function BlogPage() {
  const articles = tousLesArticles();

  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Blog", url: "/blog/" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Blog France Immeuble",
          url: `${SITE.url}/blog/`,
          blogPost: articles.map((a) => ({
            "@type": "BlogPosting",
            headline: a.h1,
            datePublished: a.publishedAt,
            url: `${SITE.url}${a.chemin}`,
          })),
        }}
      />

      <HeroMedia image={VISUELS.interieurToits.src} alt={VISUELS.interieurToits.alt}>
        <>
          <Eyebrow>Blog</Eyebrow>
          <h1>
            Vendre, estimer, arbitrer&nbsp;: <span className="accent">ce qu’il faut savoir</span>
          </h1>
          <p className="lead">
            Ce que nous observons en vendant des immeubles de rapport, en bloc et à la découpe&nbsp;:
            droit de préemption, DPE, promoteurs, marché parisien. Écrit pour des propriétaires
            d’immeubles, pas pour des primo-accédants.
          </p>
        </>
      </HeroMedia>

      {/* Les articles sur une ligne qui défile : la liste tient sur un écran
          (MAV, 27/10/2026). Chaque carte porte son visuel, son titre, son
          résumé et sa date ; tous les liens restent dans la page. */}
      <section className="section articles-sec">
        <div className="container">
          <div className="section__head">
            <Eyebrow>Les articles</Eyebrow>
            <h2>{articles.length} articles sur la vente d’immeubles de rapport</h2>
          </div>
          <LigneDefilante className="articles-ligne" marches>
            {articles.map((a, i) => (
              <article key={a.slug} className="article-carte">
                <Link href={a.chemin} className="article-carte__lien">
                  {a.imageUne && (
                    <span className="article-carte__visuel">
                      <Image
                        src={a.imageUne}
                        alt={a.imageUneAlt ?? ""}
                        width={380}
                        height={254}
                        sizes="(max-width: 760px) 85vw, 380px"
                        priority={i < 3}
                      />
                    </span>
                  )}
                  <span className="article-carte__corps">
                    <span className="article-carte__titre">{a.h1}</span>
                    {a.seoDesc && <span className="article-carte__resume">{a.seoDesc}</span>}
                    <span className="article-carte__date">
                      <time dateTime={a.publishedAt}>{dateFr(a.publishedAt)}</time>
                      <span aria-hidden="true"> · </span>
                      {dureeLecture(a.contenuHtml)} min
                    </span>
                  </span>
                </Link>
              </article>
            ))}
          </LigneDefilante>
        </div>
      </section>

      <section className="section section--creme">
        <div className="container container--narrow article__cta">
          <h2>Une question sur votre immeuble&nbsp;?</h2>
          <p className="lead">
            Un échange de quinze minutes vaut mieux qu’un article. Estimation confidentielle
            sous 48&nbsp;h, et votre immeuble présenté d’abord à notre fichier d’investisseurs.
          </p>
          <div className="btn-row">
            <Button href="/estimer-un-immeuble/">Estimer mon immeuble</Button>
            <Button href={SITE.telHref} variant="ghost-dark">
              {SITE.tel}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
