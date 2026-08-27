import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { GtmNoScript, GtmScript } from "@/components/GoogleTagManager";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  // Chaque page définit son propre title. Le template s'applique aux pages
  // qui n'en fournissent pas — jamais à la homepage, dont le title est gelé
  // au caractère près (CLAUDE.md §10).
  title: { default: `${SITE.nom}`, template: `%s | ${SITE.nom}` },
};

/** Pose .js avant le premier rendu — voir §10 de globals.css. */
const scriptJs = `document.documentElement.classList.add('js');`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
      </body>
    </html>
  );
}
