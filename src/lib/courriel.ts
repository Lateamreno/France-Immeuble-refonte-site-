// Serveur uniquement.
import { SITE } from "./site";

/**
 * Le gabarit des e-mails du site (MAV, 27/10/2026 : « sur fond blanc, pour
 * que ça fasse plus simple et qu'on ait moins l'impression que c'est une
 * pub », avec le vrai logo).
 *
 * Fond blanc, texte noir, une seule touche d'or : le logo et le bouton. Une
 * colonne de 560 px, des tableaux plutôt que des boîtes flexibles, des styles
 * en ligne : c'est ce que toutes les messageries affichent pareil.
 *
 * Le logo est une image servie par NOTRE domaine (§16 : aucune image hors du
 * domaine). Si la messagerie bloque les images, son texte de remplacement
 * dit « France Immeuble » dans la même police que le reste.
 */

export const COULEURS = {
  texte: "#0A0A0A",
  /** Texte secondaire : noir à 62 % sur crème, la règle du §3, arrondie. */
  doux: "#615F5B",
  or: "#C19B6E",
  orProfond: "#7A5C3E",
  filet: "#EFE9DE",
} as const;

const POLICE = "Arial,Helvetica,sans-serif";

/** L'adresse du site dans les liens et les images des e-mails. */
export function origineLiens(): string {
  const fixe = process.env.SITE_ORIGINE?.trim();
  if (fixe && /^https?:\/\/[^/]+$/.test(fixe)) return fixe;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return SITE.url;
}

export const echap = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Gmail souligne en bleu tout ce qui ressemble à une adresse postale ou à une
 * date. Un caractère invisible entre les mots casse la détection, sans rien
 * changer à l'œil.
 */
export const sansLienAuto = (s: string) => echap(s).replace(/ /g, " &#8203;");

export const paragraphe = (html: string, style = "") =>
  `<p style="margin:0 0 16px;${style}">${html}</p>`;

export function bouton(href: string, texte: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0"><tr><td style="border-radius:999px;background:${COULEURS.or}">
<a href="${echap(href)}" style="display:inline-block;padding:16px 34px;border-radius:999px;background:${COULEURS.or};color:${COULEURS.texte};font-family:${POLICE};font-size:15px;font-weight:bold;text-decoration:none">${echap(texte)}</a>
</td></tr></table>`;
}

/** Une liste à puces or, en tableau : les puces HTML se décalent selon les messageries. */
export function liste(elements: string[]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px">
${elements
  .map(
    (e) => `<tr><td style="width:22px;vertical-align:top;padding:0 0 10px;color:${COULEURS.or};font-size:15px;line-height:1.55">&#9632;</td><td style="padding:0 0 10px;font-size:15px;line-height:1.55;color:${COULEURS.texte}">${e}</td></tr>`,
  )
  .join("\n")}
</table>`;
}

export const lienCourriel = (email: string) =>
  `<a href="mailto:${echap(email)}" style="color:${COULEURS.texte};text-decoration:underline">${echap(email)}</a>`;

export const lienTelephone = () =>
  `<a href="${SITE.telHref}" style="color:${COULEURS.texte};text-decoration:none">${echap(SITE.tel)}</a>`;

/**
 * Le message complet. `apercu` est la ligne grise que les messageries
 * affichent à côté de l'objet, dans la liste des e-mails.
 */
export function gabarit({
  apercu,
  corps,
  piedDePage,
  largeur = 560,
}: {
  apercu: string;
  corps: string;
  piedDePage?: string;
  largeur?: number;
}): string {
  const logo = `${origineLiens()}/logo/logo-france-immeuble-email.png`;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>France Immeuble</title></head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#ffffff">${echap(apercu)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff"><tr><td align="center" style="padding:32px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${largeur}px;font-family:${POLICE};font-size:15px;line-height:1.6;color:${COULEURS.texte}">
<tr><td style="padding:0 0 28px;border-bottom:1px solid ${COULEURS.filet}">
<img src="${echap(logo)}" width="168" height="30" alt="France Immeuble" style="display:block;width:168px;height:auto;border:0;font-family:${POLICE};font-size:18px;font-weight:bold;color:${COULEURS.texte}">
</td></tr>
<tr><td style="padding:28px 0 8px">
${corps}
</td></tr>
<tr><td style="padding:20px 0 0;border-top:1px solid ${COULEURS.filet};font-size:13px;line-height:1.6;color:${COULEURS.doux}">
<b style="color:${COULEURS.texte}">France Immeuble</b><br>
${sansLienAuto(`${SITE.adresse}, ${SITE.codePostalVille}`)}<br>
${lienTelephone()}
${piedDePage ? `<p style="margin:14px 0 0;font-size:12px;color:${COULEURS.doux}">${piedDePage}</p>` : ""}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** Pied du texte brut, même contenu que le pied HTML. */
export const piedTexte = () => ["France Immeuble", `${SITE.adresse}, ${SITE.codePostalVille}`, SITE.tel].join("\n");
