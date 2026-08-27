import localFont from "next/font/local";

/**
 * Polices self-hébergées — CLAUDE.md §4.
 * Aucune requête vers une CDN de polices : les 3 woff2 variables vivent dans le repo
 * et sont servies depuis notre domaine (maîtrise du chargement + RGPD).
 *
 * Archivo ne doit JAMAIS être découpée par graisse : l'axe `wdth` 118 du titrage
 * en dépend, et c'est lui qui justifie tout le choix typographique.
 */

export const archivo = localFont({
  src: "../../assets/fonts/Archivo[wdth,wght].woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  // next/font n'expose pas font-stretch : on l'ajoute comme descripteur brut.
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

export const inter = localFont({
  src: "../../assets/fonts/Inter[opsz,wght].woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const jetbrainsMono = localFont({
  src: "../../assets/fonts/JetBrainsMono[wght].woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
});

export const fontVariables = `${archivo.variable} ${inter.variable} ${jetbrainsMono.variable}`;
