import type { Metadata } from "next";
import "../app/page-wp.css";
import { notFound } from "next/navigation";
import { EstimationForm } from "./EstimationForm";
import { ContactForm } from "./ContactForm";
import { pageParChemin, segmenterPage, type PageWP } from "@/lib/contenu";

/**
 * Rendu d'une page reprise du WordPress.
 *
 * Le site d'origine est tombé et sa base a été vidée : ce qui est ici est la
 * seule copie. On le rend DONC tel quel — 100 % du texte, 100 % des images,
 * la structure de la page inchangée. Seule la couche graphique est neuve :
 * le markup hérite des styles `.prose` du design system (CLAUDE.md §3-§5).
 *
 * Les deux seules substitutions sont les formulaires, dont le JS de thème
 * n'existe plus : ils sont remontés au même endroit, avec les mêmes champs.
 */
export function ContenuWP({ page }: { page: PageWP }) {
  const segments = segmenterPage(page.contenuHtml);

  return (
    <article className="page-wp">
      <header className="section section--noir page-wp__tete">
        <div className="container container--narrow">
          <h1>{page.h1}</h1>
        </div>
      </header>

      {/*
        Corps sur fond crème : le contenu repris est du texte long, illisible
        en clair sur sombre. Même rythme que les articles (hero sombre → corps
        clair) pour que la reprise ne jure pas avec le reste du site.
      */}
      <div className="section--creme">
        <div className="container container--narrow">
          <div className="prose">
            {segments.map((s, i) =>
              s.type === "html" ? (
                <div key={i} dangerouslySetInnerHTML={{ __html: s.valeur }} />
              ) : s.type === "estimation" ? (
                <EstimationForm key={i} />
              ) : (
                <ContactForm key={i} />
              ),
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Métadonnées reprises au caractère près — c'est tout l'enjeu SEO (§10). */
export function metadonneesWP(chemin: string): Metadata {
  const p = pageParChemin(chemin);
  if (!p) return {};
  return {
    title: { absolute: p.seoTitle },
    description: p.seoDesc ?? undefined,
    alternates: { canonical: p.canonical ?? p.chemin },
    robots: p.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title: p.seoTitle,
      description: p.seoDesc ?? undefined,
      url: p.chemin,
      images: p.ogImage ? [p.ogImage] : undefined,
    },
  };
}

/** Raccourci : récupère la page ou renvoie un 404 plutôt qu'une page vide. */
export function pageOu404(chemin: string): PageWP {
  const p = pageParChemin(chemin);
  if (!p) notFound();
  return p;
}
