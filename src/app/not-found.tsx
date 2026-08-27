import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="section section--noir" style={{ minHeight: "68vh" }}>
      <div className="container container--narrow">
        <Eyebrow>Erreur 404</Eyebrow>
        <h1>Cette page n’existe pas</h1>
        <p className="lead" style={{ marginTop: "var(--space-s)" }}>
          Le lien est peut-être erroné, ou la page a changé d’adresse. Vous pouvez repartir de
          l’accueil, ou nous appeler directement — c’est souvent plus rapide.
        </p>
        <div className="btn-row" style={{ marginTop: "var(--space-l)" }}>
          <Button href="/" icone>
            Retour à l’accueil
          </Button>
          <Button href={SITE.telHref} variant="outline">
            {SITE.tel}
          </Button>
        </div>
      </div>
    </section>
  );
}
