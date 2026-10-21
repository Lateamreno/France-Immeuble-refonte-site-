import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { GtmNoScript, GtmScript } from "@/components/GoogleTagManager";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";
import { RevueButton } from "@/components/revue";
import { listFeedbackOuverts } from "@/lib/bo/feedback";

/**
 * Le Mode Revue ne s'affiche QUE hors production.
 *
 * C'est un outil de recette : un visiteur de france-immeuble.fr ne doit jamais
 * voir « Signaler un écart » en bas de l'écran. `VERCEL_ENV` vaut "production"
 * sur le déploiement de production, "preview" sur les branches, et n'existe
 * pas en local — où l'outil est donc actif.
 */
const MODE_REVUE = process.env.VERCEL_ENV !== "production";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  // Chaque page définit son propre title. Le template s'applique aux pages
  // qui n'en fournissent pas — jamais à la homepage, dont le title est gelé
  // au caractère près (CLAUDE.md §10).
  title: { default: `${SITE.nom}`, template: `%s | ${SITE.nom}` },
};

/** Pose .js avant le premier rendu — voir §10 de globals.css. */
const scriptJs = `document.documentElement.classList.add('js');`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptJs }} />
      </head>
      <body>
        <GtmNoScript />
        <GtmScript />
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        {MODE_REVUE && <RevueButton pins={await listFeedbackOuverts().catch(() => [])} />}
      </body>
    </html>
  );
}
