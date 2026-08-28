import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { SITE } from "@/lib/site";
import {
  articleParSlug,
  dateFr,
  dureeLecture,
  slugsArticles,
  tousLesArticles,
  type Article,
} from "@/lib/contenu";

/**
 * Les articles du blog, servis À LA RACINE du site.
 *
 * ⚠️ Ils ne sont PAS sous /blog/ — /blog/ n'est que la page de listing.
 * Toute règle de routage par préfixe serait fausse (CLAUDE.md §10).
 *
 * Cette route dynamique ne capte que les slugs d'articles : les pages
 * statiques (/vendre-un-immeuble/, /estimer-un-immeuble/…) ont priorité dans
 * l'App Router, et `dynamicParams = false` ferme la porte au reste.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return slugsArticles().map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = articleParSlug(slug);
  if (!a) return {};

  // `absolute` : le title repris doit sortir intact, sans le template du layout.
  return {
    title: { absolute: a.seoTitle },
    description: a.seoDesc ?? undefined,
    alternates: { canonical: a.chemin },
    robots: a.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      title: a.seoTitle,
      description: a.seoDesc ?? undefined,
      url: a.chemin,
      publishedTime: a.publishedAt,
      modifiedTime: a.updatedAt,
      images: a.ogImage ? [a.ogImage] : undefined,
    },
  };
}

function schemaArticle(a: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.h1,
    description: a.seoDesc ?? undefined,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt,
    image: a.ogImage ? `${SITE.url}${a.ogImage}` : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE.url}${a.chemin}` },
    author: { "@type": "Organization", name: SITE.nom, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.nom, url: SITE.url },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const a = articleParSlug(slug);
  if (!a) notFound();

  // Trois autres articles, en repartant du début une fois la fin atteinte.
  const tous = tousLesArticles();
  const i = tous.findIndex((x) => x.slug === a.slug);
  const suite = [...tous.slice(i + 1), ...tous.slice(0, i)].slice(0, 3);

  return (
    <>
      <JsonLd data={schemaArticle(a)} />
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Blog", url: "/blog/" },
          { nom: a.h1, url: a.chemin },
        ])}
      />

      <article className="article">
        <header className="article__tete section section--noir">
          <div className="container container--narrow">
            <Eyebrow>
              <Link href="/blog/">Blog</Link>
            </Eyebrow>
            <h1>{a.h1}</h1>
            <p className="article__meta">
              <time dateTime={a.publishedAt}>{dateFr(a.publishedAt)}</time>
              <span aria-hidden="true"> · </span>
              {dureeLecture(a.contenuHtml)} min de lecture
            </p>
          </div>
        </header>

        {/*
          Corps sur fond crème, à rebours du reste du site : un texte long se
          lit mal en clair sur sombre. Le rythme hero sombre → corps clair →
          CTA sombre garde l'identité sans sacrifier le confort de lecture.
        */}
        <div className="section--creme">
          <div className="container container--narrow">
            {/*
              Contenu repris du WordPress : markup Gutenberg nettoyé (images
              rapatriées en local, liens internes relatifs, classes retirées).
              La source est notre propre export, pas une saisie utilisateur.
            */}
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: a.contenuHtml }}
            />
          </div>
        </div>

        <section className="section section--noir">
          <div className="container container--narrow article__cta">
            <h2>Vous avez un immeuble à vendre&nbsp;?</h2>
            <p className="lead">
              Estimation confidentielle sous 48&nbsp;h. Nous présentons votre bien à notre
              fichier d’investisseurs sans jamais le diffuser publiquement.
            </p>
            <div className="btn-row">
              <Button href="/estimer-un-immeuble/">Estimer mon immeuble</Button>
              <Button href={SITE.telHref} variant="outline">
                {SITE.tel}
              </Button>
            </div>
          </div>
        </section>

        {suite.length > 0 && (
          <section className="section">
            <div className="container container--narrow">
              <Eyebrow>À lire aussi</Eyebrow>
              <ul className="liste-articles liste-articles--compacte">
                {suite.map((s) => (
                  <li key={s.slug}>
                    <Link href={s.chemin}>
                      <span className="liste-articles__titre">{s.h1}</span>
                      <span className="liste-articles__date">{dateFr(s.publishedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </article>
    </>
  );
}
