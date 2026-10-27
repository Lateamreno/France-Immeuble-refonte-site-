// Serveur uniquement : clé secrète du site et clé SendGrid.
import { createHash } from "node:crypto";
import { configSite } from "../supabase-site";
import { envoyerAuClient } from "../notifications";
import { bouton as bouton_, COULEURS, echap, gabarit, liste, origineLiens, paragraphe, piedTexte, sansLienAuto } from "../courriel";
import { ELEMENTS_ATTENDUS } from "../dossier/modele";
import { lienDAcces } from "./auth";

/**
 * Après une estimation complète, partie 2 comprise, le client reçoit un
 * e-mail (MAV, 27/10/2026) :
 * un agent l'appelle sous 48 h, voici les éléments à préparer, et voici son
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

/** L'adresse du site dans les liens envoyés par e-mail (voir `courriel.ts`). */
export { origineLiens };

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

const t = (v: unknown) => String(v ?? "").trim();

/**
 * Ce que contient l'e-mail : le même texte en HTML et en texte brut. Sur fond
 * blanc, avec le logo (MAV, 27/10/2026 : « plus lisibles et sympas », « moins
 * l'impression que c'est une pub »). La liste est celle de l'écran de fin du
 * formulaire (retour #64).
 */
export function courrielEstimation(l: Record<string, unknown>, lien: string | null) {
  const adresse = [[t(l.numero), t(l.rue)].filter(Boolean).join(" "), [t(l.codePostal), t(l.ville)].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const sujet = "Votre demande d’estimation";
  const bouton = lien ?? `${origineLiens()}/mon-compte/`;
  const texteBouton = "Ouvrir mon espace client";
  const recu = `Merci pour votre demande. Nous avons bien reçu les informations sur votre immeuble${adresse ? ` situé ${adresse}` : ""}.`;

  const html = gabarit({
    apercu: "Un agent vous appelle sous 48 h. Voici ce qui l’aidera à préparer l’entretien.",
    corps: [
      paragraphe("Bonjour,"),
      paragraphe(
        `Merci pour votre demande. Nous avons bien reçu les informations sur votre immeuble${adresse ? ` situé ${sansLienAuto(adresse)}` : ""}.`,
      ),
      paragraphe("<b>Un agent vous appelle sous 48&nbsp;h.</b>", "font-size:17px"),
      paragraphe("Pour préparer l’entretien, voici les éléments dont nous aurons besoin&nbsp;:"),
      liste(ELEMENTS_ATTENDUS.map(echap)),
      paragraphe(
        `Vous pouvez nous les envoyer en répondant simplement à cet e-mail, ou les remplir dans votre espace client. Vous y retrouverez ensuite votre estimation.`,
      ),
      bouton_(bouton, texteBouton),
      lien
        ? paragraphe(
            "Ce lien vous est réservé et ne sert qu’une fois. Plus tard, connectez-vous avec cette adresse e-mail et « Mot de passe oublié ».",
            `font-size:13px;color:${COULEURS.doux}`,
          )
        : "",
      paragraphe("À très vite,<br>L’équipe France Immeuble", "margin-top:24px"),
    ].join("\n"),
    piedDePage:
      "Vous recevez cet e-mail parce qu’une demande d’estimation a été faite avec cette adresse sur france-immeuble.fr. Si ce n’est pas vous, ignorez-le : rien ne sera fait sans votre accord.",
  });

  const text = [
    "Bonjour,",
    "",
    recu,
    "",
    "Un agent vous appelle sous 48 h.",
    "",
    "Pour préparer l’entretien, voici les éléments dont nous aurons besoin :",
    ...ELEMENTS_ATTENDUS.map((e) => `- ${e}`),
    "",
    "Vous pouvez nous les envoyer en répondant simplement à cet e-mail, ou les remplir dans votre espace client. Vous y retrouverez ensuite votre estimation.",
    "",
    `${texteBouton} : ${bouton}`,
    "",
    "À très vite,",
    "L’équipe France Immeuble",
    "",
    piedTexte(),
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
    const n = (v: unknown) => Math.max(0, Math.min(99, Math.floor(Number(v) || 0)));
    const { type, empreinte: jeton } = await lienDAcces(
      email,
      { prenom: t(l.prenom), nom: t(l.nom), telephone: t(l.telephone) },
      // De quoi préremplir le dossier ouvert depuis le compte (retour #64).
      typeof l.ref === "string"
        ? {
            ref: l.ref,
            lots: { habitation: n(l.lotsHabitation), bureau: n(l.lotsBureaux), commerce: n(l.lotsCommerces), local_activite: n(l.lotsActivite) },
          }
        : undefined,
    );
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
