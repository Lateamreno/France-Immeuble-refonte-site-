import { imagesPartage } from "@/lib/partage";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/Eyebrow";
import { HeroMedia } from "@/components/HeroMedia";
import { VISUELS } from "@/lib/visuels";
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
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { EstimationForm } from "@/components/EstimationForm";
import { RechercheForm } from "@/components/RechercheForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { ventes as lesVentes } from "@/lib/biens";
import { chiffres as lesChiffres } from "@/lib/chiffres";
import { chiffresFaq } from "@/lib/faq";
import { articleAvecDonnees, avecDonnees } from "@/lib/donnees-articles";
import { nombre } from "@/lib/site";
import { boutonDansLeTexte, cibleArticle, couperTexte, ctaVersFormulaire } from "@/lib/article-landing";
import { SLUG_BAROMETRE, chapeauBarometre, datasetBarometre, enBrefBarometre, historiqueParis, remplirBarometre, reperesBarometre, semestresParis } from "@/lib/barometre";
import { donneesPrixParis } from "@/lib/prix-paris";
import { OutilPrix } from "@/components/annonces/OutilPrix";
import { TableauPrixParis } from "@/components/annonces/TableauPrixParis";

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
      images: a.ogImage ? [a.ogImage] : imagesPartage("/"),
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
    /* Lot 124 : l'auteur est l'agence décrite sur l'accueil (même @id), avec son logo. */
    author: { "@type": "Organization", "@id": `${SITE.url}/#organisation`, name: SITE.nom, url: SITE.url },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE.url}/#organisation`,
      name: SITE.nom,
      url: SITE.url,
      logo: { "@type": "ImageObject", url: `${SITE.url}/logo/logo-france-immeuble-email.png` },
    },
  };
}

/**
 * Les images du corps d'un article ne se chargent qu'à l'approche de l'écran, et se
 * décodent hors du fil principal (lot 77, vitesse) : le haut de l'article s'affiche d'abord.
 */
function imagesDifferees(html: string): string {
  return html.replace(/<img(?![^>]*\bloading=)/g, '<img loading="lazy" decoding="async"');
}

/** Le titre avec ses mots importants en or (`h1Accent`), le texte du H1 restant identique. */
function titreEnOr(titre: string, accent?: string) {
  const i = accent ? titre.indexOf(accent) : -1;
  if (!accent || i < 0) return titre;
  return (
    <>
      {titre.slice(0, i)}
      <span className="accent">{accent}</span>
      {titre.slice(i + accent.length)}
    </>
  );
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const a = articleParSlug(slug);
  if (!a) notFound();

  // Trois autres articles, en repartant du début une fois la fin atteinte.
  const tous = tousLesArticles();
  const i = tous.findIndex((x) => x.slug === a.slug);
  const suite = [...tous.slice(i + 1), ...tous.slice(0, i)].slice(0, 3);

  const acheteur = cibleArticle(a.slug) === "acheteur";
  // Le baromètre des prix à Paris (lot 113) : ses tableaux viennent de la base, toutes années comprises.
  const [ventesPubliees, ch, historique, marcheParis, semestres, prixParis] = await Promise.all([
    lesVentes(),
    lesChiffres(),
    a.slug === SLUG_BAROMETRE ? historiqueParis() : Promise.resolve(null),
    // Nos chiffres dans l'article (MAV, 23/11/2026) : le prix des immeubles à Paris vient du baromètre.
    articleAvecDonnees(a.slug) ? historiqueParis() : Promise.resolve(null),
    // MAV, 23/11/2026 : le premier semestre 2026, l'outil « votre arrondissement » et le tableau de la page Paris.
    a.slug === SLUG_BAROMETRE ? semestresParis() : Promise.resolve([]),
    a.slug === SLUG_BAROMETRE ? donneesPrixParis() : Promise.resolve(null),
  ]);
  const maj = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
  const html = historique
    ? remplirBarometre(a.contenuHtml, historique, semestres)
    : marcheParis
      ? avecDonnees(a.contenuHtml, a.slug, ventesPubliees, ch, marcheParis, maj)
      : a.contenuHtml;
  const barometre = a.slug === SLUG_BAROMETRE;
  const chapeau = (historique ? chapeauBarometre(historique) : null) ?? a.chapeau ?? null;
  /* Lot 124 (MAV, 15/11/2026 : optimiser pour ChatGPT et Claude) : la réponse à la question du titre,
     en tête du texte. Celle du baromètre est tirée de ses chiffres. */
  const enBref = (historique ? enBrefBarometre(historique, semestres) : null) ?? a.enBref ?? null;
  const dataset = historique ? datasetBarometre(historique, `${SITE.url}${a.chemin}`) : null;
  const [avant, apres] = couperTexte(ctaVersFormulaire(boutonDansLeTexte(imagesDifferees(html), cibleArticle(a.slug))));
  const c = chiffresFaq(ventesPubliees);
  const pc = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  /** Trois repères tirés de nos ventes publiées et du BO, en tête de l'article. */
  const reperesDvf = historique ? reperesBarometre(historique) : [];
  const reperes: { picto: NomPicto; valeur: string; libelle: string }[] = (
    reperesDvf.length === 3
      ? [
          { picto: "immeubles" as NomPicto, ...reperesDvf[0] },
          { picto: "stats" as NomPicto, ...reperesDvf[1] },
          { picto: "logement" as NomPicto, ...reperesDvf[2] },
        ]
      : acheteur
      ? [
          { picto: "reseau" as NomPicto, valeur: nombre(ch.investisseurs), libelle: "acheteurs déjà inscrits" },
          c.rdtMin && c.rdtMax
            ? { picto: "stats" as NomPicto, valeur: `${pc(c.rdtMin.val)}–${pc(c.rdtMax.val)}\u00a0%`, libelle: "de rendement sur nos ventes" }
            : null,
          { picto: "detective" as NomPicto, valeur: "100 %", libelle: "de nos immeubles d’abord en off-market" },
        ]
      : [
          c.delaiMedian ? { picto: "agenda" as NomPicto, valeur: `${c.delaiMedian}\u00a0jours`, libelle: "avant la première offre, en médiane" } : null,
          c.ecartMedian != null && c.ecartN >= 5 && c.ecartMedian > 0
            ? { picto: "augmentation" as NomPicto, valeur: `+${pc(c.ecartMedian)}\u00a0%`, libelle: "meilleure offre face à notre estimation" }
            : null,
          { picto: "reseau" as NomPicto, valeur: nombre(ch.investisseurs), libelle: "acheteurs d’immeubles en base" },
        ]
  ).filter((x): x is { picto: NomPicto; valeur: string; libelle: string } => !!x);

  return (
    <>
      <JsonLd data={schemaArticle(a)} />
      {dataset && <JsonLd data={dataset} />}
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Blog", url: "/blog/" },
          { nom: a.h1, url: a.chemin },
        ])}
      />

      <article className="article">
        {/* Le hero de chaque page, articles compris (MAV, 22/10/2026) : l'image
            de l'article en plein écran derrière le titre. */}
        <HeroMedia
          image={a.imageUne ?? VISUELS.interieurToits.src}
          alt={a.imageUne ? (a.imageUneAlt ?? "") : VISUELS.interieurToits.alt}
          className="article__tete"
        >
          <>
            <Eyebrow>
              <Link href="/blog/">Blog</Link>
              {barometre && <> · Baromètre des prix</>}
            </Eyebrow>
            {/* Le hero des pages pour chaque article (MAV, 15/11/2026 : « c'est bien d'avoir des boutons et de
                beaux heros ») : mots en or, une phrase sous le titre. Un seul bouton (MAV : « pas de second bouton »),
                sauf sur le baromètre qui garde « Les prix par arrondissement ». Le texte du H1 ne change pas. */}
            <h1>{titreEnOr(a.h1, a.h1Accent)}</h1>
            {chapeau && <p className="lead">{chapeau}</p>}
            <p className="article__meta">
              <time dateTime={a.publishedAt}>{dateFr(a.publishedAt)}</time>
              <span aria-hidden="true"> · </span>
              {dureeLecture(a.contenuHtml)} min de lecture
            </p>
            <div className="btn-row">
              <Button href="#estimer">{acheteur ? "Déposer ma recherche" : "Estimer mon immeuble"}</Button>
              {barometre ? (
                <Button href={prixParis?.tableau ? "#votre-arrondissement" : "#prix-arrondissements"} variant="outline" court="Par arrondissement">
                  Les prix par arrondissement
                </Button>
              ) : null}
            </div>
          </>
        </HeroMedia>

        {/* MAV, 23/11/2026 : « le prix au m² par arrondissement […] c'est super pratique », et « le résumé de
            l'étude était top » : l'outil de la page des prix et le tableau de la page Paris, avant le texte. */}
        {prixParis?.tableau && prixParis.annee != null && (
          <>
            <section id="votre-arrondissement" className="section section--noir-2 barometre-outil-sec">
              <div className="container barometre-outil">
                <div className="barometre-outil__tete">
                  <Eyebrow bare>Prix par arrondissement</Eyebrow>
                  <h2>
                    Le prix au&nbsp;m² des immeubles <span className="accent">dans votre arrondissement</span>
                  </h2>
                  <p className="lead">
                    Choisissez votre arrondissement&nbsp;: le prix médian des immeubles vendus en bloc en {prixParis.annee},
                    l’écart avec les appartements, la fiabilité du chiffre et le rendement théorique.
                  </p>
                </div>
                <div className="barometre-outil__choix">
                <OutilPrix
                  initial={null}
                  annee={prixParis.annee}
                  lignes={prixParis.lignes}
                  paris={prixParis.paris}
                  rendementParis={prixParis.rendementParis}
                  titre={false}
                  suivreAdresse={false}
                />
                </div>
              </div>
            </section>
            <TableauPrixParis donnees={prixParis} secondBouton={false} />
          </>
        )}

        {/*
          Lot 97 (MAV, 10/11/2026) : l'article devient une landing. Le texte reste
          celui de l'article, sur fond crème ; le formulaire est dans la page, collé
          à droite pendant la lecture sur ordinateur, en fin d'article au téléphone.
        */}
        <div className="section--creme article-corps">
          <div className="container article-grille">
            <div className="article-texte">
              <ul className="article-chiffres" aria-label="Nos chiffres" style={{ ["--n" as string]: reperes.length }}>
                {reperes.map((r) => (
                  <li key={r.libelle}>
                    <Picto nom={r.picto} taille={26} />
                    <span className="article-chiffres__val">{r.valeur}</span>
                    <span className="article-chiffres__lib">{r.libelle}</span>
                  </li>
                ))}
              </ul>
              {/*
                Contenu repris du WordPress : markup Gutenberg nettoyé (images
                rapatriées en local, liens internes relatifs, classes retirées).
                La source est notre propre export, pas une saisie utilisateur.
              */}
              {enBref && (
                <div className="article-bref">
                  <p className="article-bref__titre">En bref</p>
                  <p>{enBref}</p>
                </div>
              )}
              <div className="prose" dangerouslySetInnerHTML={{ __html: avant }} />
              {apres && (
                <>
                  {/* Au milieu du texte, sous 1180 px : le formulaire est plus bas. */}
                  <aside className="article-encart" aria-label={acheteur ? "Déposer une recherche" : "Estimer votre immeuble"}>
                    <p className="article-encart__titre">
                      {acheteur ? (
                        <>Recevez nos immeubles <span className="accent">avant leur diffusion</span></>
                      ) : (
                        <>Combien vaut <span className="accent">votre immeuble</span>&nbsp;?</>
                      )}
                    </p>
                    <p>
                      {acheteur
                        ? "Déposez votre recherche : vous recevez les dossiers qui y correspondent, off-market compris."
                        : "Estimation gratuite et confidentielle, par un agent spécialisé dans les immeubles de rapport."}
                    </p>
                    {/* « porte-action » : la pilule du téléphone s'efface devant ce bouton au lieu de le cacher. */}
                    <div className="btn-row porte-action">
                      <Button href="#estimer">{acheteur ? "Déposer ma recherche" : "Estimer mon immeuble"}</Button>
                    </div>
                  </aside>
                  <div className="prose prose--suite" dangerouslySetInnerHTML={{ __html: apres }} />
                </>
              )}

              {/*
                Les articles citent des chiffres et des seuils reglementaires
                vrais a leur date. On date, c'est tout. La date de modification
                WordPress n'est pas affichee : huit articles portent la meme,
                celle d'une passe technique groupee.
              */}
              <p className="article__date-note">
                Article publié le <time dateTime={a.publishedAt}>{dateFr(a.publishedAt)}</time>
                {a.revuLe && <>, chiffres et règles mis à jour le <time dateTime={a.revuLe}>{dateFr(a.revuLe)}</time></>}.
                Pour une lecture à jour de votre situation, appelez-nous au{" "}
                <a href={SITE.telHref}>{SITE.tel}</a>.
              </p>
            </div>

            <aside id="estimer" className="article-form" aria-label={acheteur ? "Déposer une recherche" : "Estimer votre immeuble"}>
              <div className="article-form__colle">
                <p className="article-form__titre">
                  {acheteur ? (
                    <>Déposez votre <span className="accent">recherche</span></>
                  ) : (
                    <>Votre <span className="accent">estimation gratuite</span></>
                  )}
                </p>
                <p className="article-form__lead">
                  {acheteur
                    ? `Rejoignez nos ${nombre(ch.investisseurs)} acheteurs et recevez les immeubles avant leur diffusion.`
                    : "Gratuite et confidentielle. Ou appelez-nous :"}{" "}
                  {!acheteur && <a href={SITE.telHref}>{SITE.tel}</a>}
                </p>
                {acheteur ? <RechercheForm /> : <EstimationForm formulaire="estimer" />}
              </div>
            </aside>
          </div>
        </div>

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
      <BoutonFixeMobile href="#estimer" cible="estimer" libelle={acheteur ? "Déposer ma recherche" : "Estimer mon immeuble"} />
    </>
  );
}
