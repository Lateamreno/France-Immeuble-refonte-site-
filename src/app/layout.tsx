import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { GtmNoScript, GtmScript } from "@/components/GoogleTagManager";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ModaleCompte } from "@/components/compte/ModaleCompte";
import { AncreStable } from "@/components/AncreStable";
import { SITE } from "@/lib/site";
import dynamic from "next/dynamic";
// Outil de recette, absent de la production : chargé seulement là où il s'affiche,
// sinon son script et sa feuille partaient vers chaque visiteur (vitesse, 05/11/2026).
const RevueButton = dynamic(() => import("@/components/revue").then((m) => m.RevueButton));
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
/* Pose aussi la hauteur d'écran figée (MAV, 06/11/2026) : voir `--h-ecran` dans globals.css.
   Elle ne suit la fenêtre que si la largeur change (rotation) ou à la souris (ordinateur) :
   ni la barre d'un navigateur intégré qui se replie, ni le clavier ne font sauter la page. */
const scriptJs = `(function(){var d=document.documentElement,w=-1;d.classList.add('js');function f(){if(innerWidth!==w||matchMedia('(pointer: fine)').matches){w=innerWidth;var h=innerHeight;d.style.setProperty('--h-ecran',h+'px');[600,700,720,760,820].forEach(function(t){d.classList.toggle('h-'+t,h<=t)})}}f();addEventListener('resize',f)})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* `data-scroll-behavior` : Next suspend le défilement doux le temps d'un
       changement de page. Sans lui, l'animation vers le haut était interrompue
       et Vendre ou Estimer s'ouvraient déjà défilées (MAV, 22/10/2026). */
    <html lang="fr" className={fontVariables} data-scroll-behavior="smooth" suppressHydrationWarning>
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
        <ModaleCompte />
        <AncreStable />
        {MODE_REVUE && <RevueButton pins={await listFeedbackOuverts().catch(() => [])} />}
      </body>
    </html>
  );
}
