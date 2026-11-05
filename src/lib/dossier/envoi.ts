// Serveur uniquement.
import { deposerLead, type Issue } from "../leads";
import { fusionnerSaisie } from "../compte/saisies";
import { rueSansNumero } from "../compte/immeubles";
import { envoyerAuClient } from "../notifications";
import { COULEURS, echap, gabarit, paragraphe, piedTexte } from "../courriel";
import { createHash } from "node:crypto";
import { enNombre, pourBO, type Dossier } from "./modele";
import { modifier, type LigneDossier } from "./serveur";

/**
 * Le dossier part au BO comme une suite de l'estimation : même `type`, même
 * `ref`, `etat: "dossier"`. Le BO range les lots dans l'état locatif de
 * l'immeuble créé par le premier envoi. L'agence reçoit aussi son alerte,
 * tableau des lots compris : si le BO ne sait pas encore lire ce dépôt, rien
 * n'est perdu.
 *
 * `compte` n'est renseigné que par une session vérifiée (adresse confirmée),
 * jamais par le navigateur.
 */
export async function transmettreDossier(l: LigneDossier, d: Dossier, compte?: string): Promise<Issue> {
  const lead = {
    type: "estimation",
    etat: "dossier",
    ref: l.ref,
    ...l.identite,
    email: l.email,
    ...pourBO(d),
    ...(compte ? { compte } : {}),
    recuLe: new Date().toISOString(),
  };
  return deposerLead(lead);
}

/**
 * L'état locatif au fil de la saisie (retour #266, MAV, 05/11/2026 : « même si
 * le client ne veut pas créer son compte, on a quand même les infos qui sont
 * remontées »). Même dépôt que l'envoi final, avec `enCours: true` : le BO
 * remplace l'état locatif de l'immeuble à chaque dépôt. Pas d'e-mail à
 * l'agence (elle l'a eu à l'estimation, elle l'aura à la validation) ; en
 * file, la dernière version remplace la précédente (`leads.ts`).
 */
export const PAS_TRANSMISSION = 45_000;

/** Un état locatif qui dit quelque chose : au moins une surface ou un loyer. */
export const dossierRempli = (d: Dossier) =>
  d.lots.some((l) => (enNombre(l.surface) ?? 0) > 0 || (enNombre(l.loyer) ?? 0) > 0) || !!d.commentaire.trim();

export const empreinteDossier = (d: Dossier) =>
  createHash("sha1").update(JSON.stringify(pourBO(d))).digest("hex");

/**
 * Transmet le brouillon s'il a changé depuis le dernier dépôt, au plus une
 * fois toutes les 45 s, sauf `maintenant` (la page se ferme, la tâche de la
 * nuit). Renvoie l'heure de la dernière transmission.
 */
export async function transmettreEnCours(
  l: LigneDossier & { transmis_le?: string | null; transmis_empreinte?: string | null },
  d: Dossier,
  { maintenant = false, compte }: { maintenant?: boolean; compte?: string } = {},
): Promise<string | null> {
  const dernier = l.transmis_le ?? null;
  if (l.valide_le || !dossierRempli(d)) return dernier;
  const empreinte = empreinteDossier(d);
  if (empreinte === l.transmis_empreinte) return dernier;
  if (!maintenant && dernier && Date.now() - Date.parse(dernier) < PAS_TRANSMISSION) return dernier;
  const issue = await deposerLead({
    type: "estimation",
    etat: "dossier",
    enCours: true,
    ref: l.ref,
    ...l.identite,
    email: l.email,
    ...pourBO(d),
    ...(compte ? { compte } : {}),
    recuLe: new Date().toISOString(),
  }, { silencieux: true });
  if (issue === "perdu" || issue === "refuse") return dernier;
  const le = new Date().toISOString();
  // `maj_le` n'est pas touché : il date la dernière saisie, pas le dépôt.
  await modifier(l.empreinte, { transmis_le: le, transmis_empreinte: empreinte, maj_le: undefined });
  return le;
}

/**
 * Le dossier envoyé rejoint « Mes immeubles » du compte (retour #274) : la
 * copie de l'estimation, avec son état locatif. Rue sans numéro.
 */
export async function garderDansLeCompte(compte: string, l: LigneDossier, d: Dossier): Promise<void> {
  const i = l.identite;
  await fusionnerSaisie(compte, l.ref, "estimation", {
    formulaire: i.formulaire ?? "",
    rue: rueSansNumero(i.rue),
    codePostal: i.codePostal ?? "",
    ville: i.ville ?? "",
    dossier: d,
    dossier_envoye_le: new Date().toISOString(),
  });
}

/** L’e-mail du code de confirmation. Rien d’autre dedans : pas de lien, pas de publicité. */
export async function envoyerCode(email: string, code: string): Promise<boolean> {
  // « 583 131 » : deux groupes, plus faciles à recopier.
  const lisible = `${code.slice(0, Math.ceil(code.length / 2))} ${code.slice(Math.ceil(code.length / 2))}`;
  const html = gabarit({
    apercu: `Votre code : ${lisible}`,
    corps: [
      paragraphe("Bonjour,"),
      paragraphe("Voici le code qui confirme votre adresse e-mail et ouvre votre compte France Immeuble&nbsp;:"),
      `<p style="margin:8px 0 24px;font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:bold;letter-spacing:8px;color:${COULEURS.texte}">${echap(lisible)}</p>`,
      paragraphe("Saisissez-le sur la page de votre dossier. Il ne sert qu’une fois."),
    ].join("\n"),
    piedDePage: "Si vous n’avez rien demandé, ignorez cet e-mail : aucun compte ne sera ouvert sans ce code.",
  });
  const text = [
    "Bonjour,",
    "",
    "Voici le code qui confirme votre adresse e-mail et ouvre votre compte France Immeuble :",
    "",
    lisible,
    "",
    "Saisissez-le sur la page de votre dossier. Il ne sert qu’une fois.",
    "",
    piedTexte(),
    "",
    "Si vous n’avez rien demandé, ignorez cet e-mail : aucun compte ne sera ouvert sans ce code.",
  ].join("\n");
  return envoyerAuClient({ a: email, sujet: `Votre code France Immeuble : ${lisible}`, html, text });
}
