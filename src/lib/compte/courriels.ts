// Serveur uniquement.
import { bouton, echap, gabarit, paragraphe, piedTexte, origineLiens } from "../courriel";
import { filHtml, filTexte, type OptionsAlerte } from "../notifications";

/**
 * Les e-mails de l'espace client (MAV, 30/10/2026) : gabarit blanc, texte
 * noir, « Bonjour, » sans prénom. Chaque e-mail de notification dit comment
 * l'arrêter (Mon profil, rubrique Notifications).
 */

type Fil = NonNullable<OptionsAlerte["historique"]>;
export type Courriel = { sujet: string; html: string; text: string };

const lienPreferences = () => `${origineLiens()}/mon-compte/profil/#notifications`;

const pied = (desactivable: boolean) =>
  desactivable
    ? `Vous recevez cet e-mail parce que vous avez un espace client France Immeuble. Pour ne plus le recevoir : <a href="${echap(lienPreferences())}" style="color:inherit">Mon profil, Notifications</a>.`
    : "Vous recevez cet e-mail parce que vous avez écrit à France Immeuble depuis votre espace client.";

/** La copie du message que le client vient d'envoyer, avec tout le fil. */
export function copieDuMessage(titre: string, fil: Fil, conversation: string): Courriel {
  const lien = `${origineLiens()}/mon-compte/messages/${conversation}/`;
  const html = gabarit({
    apercu: "Votre message est bien parti. Votre agent vous répond dans votre espace.",
    corps: [
      paragraphe("Bonjour,"),
      paragraphe(`Votre message est bien parti à l’agence. Voici la conversation «&nbsp;${echap(titre)}&nbsp;».`),
      filHtml(fil),
      bouton(lien, "Ouvrir la conversation"),
    ].join("\n"),
    piedDePage: pied(false),
  });
  const text = ["Bonjour,", "", `Votre message est bien parti à l'agence. Voici la conversation « ${titre} ».`, "", ...filTexte(fil), lien, "", piedTexte()].join("\n");
  return { sujet: `Votre message : ${titre}`, html, text };
}

/** Une réponse de l'agent est arrivée dans le compte. */
export function nouveauMessage(titre: string, fil: Fil, conversation: string): Courriel {
  const lien = `${origineLiens()}/mon-compte/messages/${conversation}/`;
  const html = gabarit({
    apercu: "Votre agent vous a répondu dans votre espace client.",
    corps: [
      paragraphe("Bonjour,"),
      paragraphe(`Vous avez un nouveau message dans la conversation «&nbsp;${echap(titre)}&nbsp;».`),
      filHtml(fil),
      bouton(lien, "Répondre"),
    ].join("\n"),
    piedDePage: pied(true),
  });
  const text = ["Bonjour,", "", `Vous avez un nouveau message dans la conversation « ${titre} ».`, "", ...filTexte(fil), lien, "", piedTexte()].join("\n");
  return { sujet: `Nouveau message : ${titre}`, html, text };
}

/** Un ou plusieurs immeubles proposés par l'agent. */
export function nouveauxBiensProposes(lignes: string[]): Courriel {
  const lien = `${origineLiens()}/mon-compte/biens/`;
  const n = lignes.length;
  const html = gabarit({
    apercu: n > 1 ? `${n} immeubles vous ont été proposés.` : "Un immeuble vous a été proposé.",
    corps: [
      paragraphe("Bonjour,"),
      paragraphe(n > 1 ? `Votre agent vous propose ${n} immeubles qui correspondent à votre recherche&nbsp;:` : "Votre agent vous propose un immeuble qui correspond à votre recherche&nbsp;:"),
      lignes.map((l) => paragraphe(`<b>${echap(l)}</b>`)).join("\n"),
      bouton(lien, n > 1 ? "Voir les immeubles" : "Voir l’immeuble"),
    ].join("\n"),
    piedDePage: pied(true),
  });
  const text = ["Bonjour,", "", n > 1 ? `Votre agent vous propose ${n} immeubles :` : "Votre agent vous propose un immeuble :", ...lignes, "", lien, "", piedTexte()].join("\n");
  return { sujet: n > 1 ? `${n} immeubles vous sont proposés` : `Un immeuble vous est proposé : ${lignes[0]}`, html, text };
}

/** Une offre transmise au vendeur par son agent. */
export function nouvelleOffre(immeuble: string, montant: string | null, bien: string | null): Courriel {
  const lien = `${origineLiens()}/mon-compte/immeubles/${bien ? `${bien}/?onglet=offres` : ""}`;
  const html = gabarit({
    apercu: "Votre agent vous a transmis une offre.",
    corps: [
      paragraphe("Bonjour,"),
      paragraphe(`Votre agent vous a transmis une offre pour votre immeuble de ${echap(immeuble)}${montant ? `, à <b>${echap(montant)}</b>` : ""}.`),
      paragraphe("Le détail et le document d’offre sont dans votre espace."),
      bouton(lien, "Voir l’offre"),
    ].join("\n"),
    piedDePage: pied(true),
  });
  const text = ["Bonjour,", "", `Votre agent vous a transmis une offre pour votre immeuble de ${immeuble}${montant ? `, à ${montant}` : ""}.`, "", lien, "", piedTexte()].join("\n");
  return { sujet: `Une offre pour votre immeuble de ${immeuble}`, html, text };
}

/** Le code qui prouve une nouvelle adresse (changement depuis Mon profil). */
export function codeNouvelleAdresse(code: string): Courriel {
  const html = gabarit({
    apercu: `Votre code : ${code}`,
    corps: [
      paragraphe("Bonjour,"),
      paragraphe("Pour utiliser cette adresse dans votre espace France Immeuble, saisissez ce code&nbsp;:"),
      `<p style="margin:8px 0 24px;font-family:'Courier New',Courier,monospace;font-size:30px;letter-spacing:.3em;font-weight:bold">${echap(code)}</p>`,
      paragraphe("Il reste valable 15 minutes. Si vous n’avez rien demandé, ignorez cet e-mail : rien ne change."),
    ].join("\n"),
    piedDePage: pied(false),
  });
  const text = ["Bonjour,", "", "Pour utiliser cette adresse dans votre espace France Immeuble, saisissez ce code :", code, "", "Il reste valable 15 minutes. Si vous n'avez rien demandé, ignorez cet e-mail.", "", piedTexte()].join("\n");
  return { sujet: `Votre code : ${code}`, html, text };
}

/** Prévenir l'ancienne adresse qu'elle n'ouvre plus le compte. */
export function adresseChangee(nouvelle: string): Courriel {
  const html = gabarit({
    apercu: "L’adresse de votre espace client a changé.",
    corps: [
      paragraphe("Bonjour,"),
      paragraphe(`L’adresse de votre espace France Immeuble est désormais <b>${echap(nouvelle)}</b>. Cette adresse-ci ne sert plus à vous connecter.`),
      paragraphe("Si vous n’êtes pas à l’origine de ce changement, appelez-nous tout de suite."),
    ].join("\n"),
    piedDePage: pied(false),
  });
  const text = ["Bonjour,", "", `L'adresse de votre espace France Immeuble est désormais ${nouvelle}.`, "Si vous n'êtes pas à l'origine de ce changement, appelez-nous tout de suite.", "", piedTexte()].join("\n");
  return { sujet: "L’adresse de votre espace client a changé", html, text };
}
