import localFont from "next/font/local";

/**
 * Polices self-hébergées — CLAUDE.md §4.
 * Aucune requête vers une CDN de polices : les 4 woff2 variables vivent dans le repo
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

/**
 * Écriture manuscrite des légendes de polaroïds, et rien d'autre (MAV,
 * 22/10/2026). Sous-ensemble latin de Google Fonts, hébergé ici comme les trois
 * autres : aucune requête vers Google depuis le navigateur.
 */
export const caveat = localFont({
  src: "../../assets/fonts/Caveat[wght].woff2",
  variable: "--font-caveat",
  weight: "400 700",
  display: "swap",
});

export const fontVariables = `${archivo.variable} ${inter.variable} ${jetbrainsMono.variable} ${caveat.variable}`;
