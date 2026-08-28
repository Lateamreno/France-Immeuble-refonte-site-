import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
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

export default function BlogPage() {
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

      <section className="section section--noir">
        <div className="container container--narrow">
          <Eyebrow>Blog</Eyebrow>
          <h1>Vendre, estimer, arbitrer&nbsp;: ce qu’il faut savoir</h1>
          <p className="lead">
            Ce que nous observons sur {PREUVES.immeublesTraites} immeubles traités depuis{" "}
            {PREUVES.depuis}, en bloc et à la découpe — droit de préemption, DPE, promoteurs,
            marché parisien. Écrit pour des propriétaires d’immeubles, pas pour des
            primo-accédants.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container container--narrow">
          {/*
            Chaque article porte son visuel : on comprend de quoi il parle
            avant de lire le titre. `sizes` reste modeste — la vignette ne
            dépasse jamais 380 px, inutile de servir du 1400.
          */}
          <ul className="liste-articles liste-articles--visuels">
            {articles.map((a, i) => (
              <li key={a.slug}>
                <Link href={a.chemin}>
                  {a.imageUne && (
                    <span className="liste-articles__visuel">
                      <Image
                        src={a.imageUne}
                        alt={a.imageUneAlt ?? ""}
                        width={380}
                        height={254}
                        sizes="(max-width: 720px) 100vw, 220px"
                        priority={i < 2}
                      />
                    </span>
                  )}
                  <span className="liste-articles__texte">
                    <span className="liste-articles__titre">{a.h1}</span>
                    {a.seoDesc && <span className="liste-articles__resume">{a.seoDesc}</span>}
                    <span className="liste-articles__date">
                      <time dateTime={a.publishedAt}>{dateFr(a.publishedAt)}</time>
                      <span aria-hidden="true"> · </span>
                      {dureeLecture(a.contenuHtml)} min
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--creme">
        <div className="container container--narrow article__cta">
          <h2>Une question sur votre immeuble&nbsp;?</h2>
          <p className="lead">
            Un échange de quinze minutes vaut mieux qu’un article. Estimation confidentielle
            sous 48&nbsp;h, sans diffusion publique de votre bien.
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
