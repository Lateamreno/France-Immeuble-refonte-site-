// Serveur uniquement : clé secrète du site et clé SendGrid.
import { createHash } from "node:crypto";
import { configSite } from "../supabase-site";
import { envoyerAuClient } from "../notifications";
import { SITE } from "../site";
import { CATEGORIES } from "./categories";
import { lienDAcces } from "./auth";

/**
 * Après une estimation, le client reçoit un e-mail (MAV, 27/10/2026) :
 * un agent l'appelle sous 48 h, voici les pièces à préparer, et voici son
 * espace client, créé pour lui, où il verra son estimation.
 *
 * Trois garde-fous :
 *  - une adresse reçoit au plus un e-mail par 24 h (table `envois_client`,
 *    empreinte de l'adresse seulement) : le formulaire est public, il ne doit
 *    pas servir à bombarder une adresse ;
 *  - le lien d'accès pointe sur l'adresse du site fixée par la configuration,
 *    jamais sur l'en-tête Host de la requête, qu'un attaquant choisit ;
 *  - le lien ne s'ouvre que par un bouton sur notre page : les antivirus de
 *    messagerie qui visitent les liens ne le consomment pas.
 *
 * Seule la personne qui lit cette boîte peut ouvrir le compte : taper
 * l'adresse d'un autre ne donne accès à rien.
 */

const JOUR = 24 * 60 * 60 * 1000;

/** L'adresse du site dans les liens envoyés par e-mail. */
export function origineLiens(): string {
  const fixe = process.env.SITE_ORIGINE?.trim();
  if (fixe && /^https?:\/\/[^/]+$/.test(fixe)) return fixe;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return SITE.url;
}

const empreinte = (email: string) => createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

async function dejaEcrit(cle: string): Promise<boolean> {
  const cfg = configSite();
  if (!cfg) return true; // sans base, pas de garde-fou : on n'envoie pas
  try {
    const r = await fetch(`${cfg.url}/rest/v1/envois_client?select=dernier&empreinte=eq.${cle}`, {
      headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return true;
    const [l] = (await r.json()) as { dernier: string }[];
    return !!l && Date.now() - new Date(l.dernier).getTime() < JOUR;
  } catch {
    return true;
  }
}

async function noterEnvoi(cle: string): Promise<void> {
  const cfg = configSite();
  if (!cfg) return;
  try {
    await fetch(`${cfg.url}/rest/v1/envois_client?on_conflict=empreinte`, {
      method: "POST",
      headers: {
        apikey: cfg.cle,
        Authorization: `Bearer ${cfg.cle}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ empreinte: cle, dernier: new Date().toISOString() }),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
  } catch (e) {
    console.error("[client] envoi non noté —", e instanceof Error ? e.message : e);
  }
}

const echap = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const t = (v: unknown) => String(v ?? "").trim();

/** Ce que contient l'e-mail : le même texte en HTML et en texte brut. */
export function courrielEstimation(l: Record<string, unknown>, lien: string | null) {
  const adresse = [[t(l.numero), t(l.rue)].filter(Boolean).join(" "), [t(l.codePostal), t(l.ville)].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const pieces = CATEGORIES.filter((c) => c.cle !== "autre");
  const sujet = "Votre demande d’estimation · France Immeuble";
  const bouton = lien ?? `${origineLiens()}/mon-compte/`;
  const texteBouton = lien ? "Ouvrir mon espace client" : "Accéder à mon espace client";

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#EFE9DE">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#0A0A0A">
<p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#7A5C3E;margin:0 0 18px">France Immeuble</p>
<p style="margin:0 0 14px">Bonjour,</p>
<p style="margin:0 0 14px">Nous avons bien reçu votre demande d’estimation${adresse ? ` pour l’immeuble situé ${echap(adresse)}` : ""}. Un agent vous appelle sous 48&nbsp;h.</p>
<p style="margin:0 0 8px">Pour préparer l’estimation, voici les pièces dont nous aurons besoin&nbsp;:</p>
<ul style="margin:0 0 16px;padding-left:20px">
${pieces.map((c) => `<li style="margin-bottom:6px"><b>${echap(c.titre)}</b> : ${echap(c.aide)}</li>`).join("\n")}
</ul>
<p style="margin:0 0 14px">Vous pouvez nous les envoyer en répondant à cet e-mail, ou les déposer vous-même dans votre espace client. Nous l’avons ouvert pour vous&nbsp;: vous y retrouverez votre estimation dès que l’agent l’aura validée.</p>
<p style="margin:24px 0;text-align:center"><a href="${echap(bouton)}" style="display:inline-block;background:#C19B6E;color:#0A0A0A;text-decoration:none;font-weight:bold;padding:16px 32px;border-radius:999px">${texteBouton}</a></p>
${lien ? `<p style="margin:0 0 14px;font-size:13px;color:#615F5B">Ce lien est personnel et ne sert qu’une fois. S’il a expiré, choisissez « Mot de passe oublié » sur la page de connexion avec cette adresse e-mail.</p>` : ""}
<p style="margin:24px 0 0">L’équipe France Immeuble<br>${SITE.tel} · ${echap(SITE.adresse)}, ${echap(SITE.codePostalVille)}</p>
<p style="margin:20px 0 0;font-size:12px;color:#615F5B">Vous recevez cet e-mail parce qu’une demande d’estimation a été faite avec cette adresse sur france-immeuble.fr. Si ce n’est pas vous, ignorez-le : rien ne sera fait sans votre accord.</p>
</div></body></html>`;

  const text = [
    "Bonjour,",
    "",
    `Nous avons bien reçu votre demande d’estimation${adresse ? ` pour l’immeuble situé ${adresse}` : ""}. Un agent vous appelle sous 48 h.`,
    "",
    "Pour préparer l’estimation, voici les pièces dont nous aurons besoin :",
    ...pieces.map((c) => `- ${c.titre} : ${c.aide}`),
    "",
    "Vous pouvez nous les envoyer en répondant à cet e-mail, ou les déposer vous-même dans votre espace client. Nous l’avons ouvert pour vous : vous y retrouverez votre estimation dès que l’agent l’aura validée.",
    "",
    `${texteBouton} : ${bouton}`,
    "",
    "L’équipe France Immeuble",
    `${SITE.tel} · ${SITE.adresse}, ${SITE.codePostalVille}`,
    "",
    "Vous recevez cet e-mail parce qu’une demande d’estimation a été faite avec cette adresse sur france-immeuble.fr. Si ce n’est pas vous, ignorez-le.",
  ].join("\n");
  return { sujet, html, text };
}

/**
 * Crée (ou retrouve) le compte du client et lui écrit. Appelé après la
 * réponse au navigateur : le visiteur n'attend pas. Ne lève jamais.
 */
export async function accueillirVendeur(l: Record<string, unknown>): Promise<string> {
  const email = t(l.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "sans-email";
  const cle = empreinte(email);
  if (await dejaEcrit(cle)) return "deja";

  let lien: string | null = null;
  try {
    const { type, empreinte: jeton } = await lienDAcces(email, {
      prenom: t(l.prenom), nom: t(l.nom), telephone: t(l.telephone),
    });
    if (jeton) lien = `${origineLiens()}/mon-compte/activer/?type=${type}&jeton=${encodeURIComponent(jeton)}`;
  } catch (e) {
    // Sans compte, l'e-mail part quand même : la liste des pièces reste utile.
    console.error("[client] compte non créé —", e instanceof Error ? e.message : e);
  }

  const { sujet, html, text } = courrielEstimation(l, lien);
  const ok = await envoyerAuClient({ a: email, nom: [t(l.prenom), t(l.nom)].filter(Boolean).join(" "), sujet, html, text });
  if (ok) await noterEnvoi(cle);
  return ok ? (lien ? "envoye-avec-compte" : "envoye") : "echec";
}
