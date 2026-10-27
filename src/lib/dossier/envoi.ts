// Serveur uniquement.
import { deposerLead, type Issue } from "../leads";
import { envoyerAuClient } from "../notifications";
import { COULEURS, echap, gabarit, paragraphe, piedTexte } from "../courriel";
import { pourBO, type Dossier } from "./modele";
import type { LigneDossier } from "./serveur";

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
