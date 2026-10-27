import { NextResponse } from "next/server";
import { codeDeConfirmation, sessionCourante } from "@/lib/compte/auth";
import { erreurEnReponse, lireJson, memeOrigine, refus } from "@/lib/compte/requete";
import { motDePasseValide, nettoyer } from "@/lib/dossier/modele";
import { codesRecents, dossierCourant, modifier, oublierCookie, supprimer } from "@/lib/dossier/serveur";
import { envoyerCode, transmettreDossier } from "@/lib/dossier/envoi";

export const runtime = "nodejs";

const CODES_MAX = 5;

/** « jean.dupont@gmail.com » → « je•••@gmail.com » : de quoi reconnaître son adresse. */
const masquer = (email: string) => email.replace(/^(.{1,2})[^@]*(@.*)$/, "$1•••$2");

/**
 * « Valider » (retour #64 de MAV) : le dossier part au BO, puis le compte.
 *
 * Connecté, c'est fini. Sinon, le visiteur a choisi un mot de passe et nous
 * envoyons un code à 6 chiffres à son adresse. Le compte ne s'ouvre qu'avec
 * ce code : sans lui, taper l'adresse d'un autre suffirait à ouvrir un compte
 * à son nom, et le BO y déposerait ses données (§2). Le mot de passe reste
 * dans la page ; il n'est envoyé qu'avec le code, jamais stocké par le site.
 *
 * Appelé une seconde fois sur un dossier déjà envoyé, la route ne fait que
 * renvoyer un code (« Renvoyer le code »).
 */
export async function POST(req: Request) {
  if (!memeOrigine(req)) return refus("Origine refusée.", 403);
  const b = await lireJson(req, 80_000);
  if (!b) return refus("Requête illisible.");
  try {
    const s = await sessionCourante();
    const verifie = s?.utilisateur.email_confirmed_at ? s.utilisateur : null;
    const l = await dossierCourant(verifie?.id ?? null);
    if (!l) return refus("Ce dossier n’est plus disponible. Recommencez depuis le formulaire d’estimation.", 404);

    // Connecté sous la même adresse : pas de code, le compte existe et il est vérifié.
    const connecte = !!verifie && (l.compte === verifie.id || l.email === verifie.email.toLowerCase());
    // Le mot de passe est contrôlé avant l'envoi du dossier, pour ne pas
    // l'envoyer puis bloquer le visiteur. Pour un simple renvoi du code, il
    // n'est pas demandé : il n'arrive qu'avec le code.
    if (!connecte && !l.valide_le && !motDePasseValide(String(b.motDePasse ?? ""))) {
      return refus("Mot de passe trop faible : 8 caractères au moins, avec des lettres et des chiffres.", 422);
    }

    if (!l.valide_le) {
      const donnees = nettoyer(b.donnees);
      const issue = await transmettreDossier(l, donnees, connecte ? verifie!.id : undefined);
      if (issue === "perdu") {
        await modifier(l.empreinte, { donnees });
        return refus("Votre dossier n’a pas pu partir. Réessayez dans un instant, ou appelez-nous.", 503);
      }
      if (connecte) {
        await supprimer(l.empreinte);
        await oublierCookie();
        return NextResponse.json({ ok: true, etape: "fini" });
      }
      // Envoyé : le brouillon est vidé. Il ne reste que l'adresse, le temps du code.
      await modifier(l.empreinte, { valide_le: new Date().toISOString(), donnees: nettoyer({}), identite: {} });
    } else if (connecte) {
      await supprimer(l.empreinte);
      await oublierCookie();
      return NextResponse.json({ ok: true, etape: "fini" });
    }

    if (l.codes >= CODES_MAX || (await codesRecents(l.email)) >= CODES_MAX) {
      return NextResponse.json(
        { ok: true, etape: "code", email: masquer(l.email), erreur: "Plusieurs codes sont déjà partis. Utilisez le dernier reçu, ou réessayez demain." },
      );
    }
    const { type, code } = await codeDeConfirmation(l.email, {
      prenom: l.identite.prenom, nom: l.identite.nom, telephone: l.identite.telephone,
    });
    if (!/^\d{6,10}$/.test(code) || !(await envoyerCode(l.email, code))) {
      return refus("Le code n’a pas pu partir. Réessayez dans un instant.", 503);
    }
    await modifier(l.empreinte, {
      codes: l.codes + 1,
      code_envoye_le: new Date().toISOString(),
      code_type: type,
      essais: 0,
    });
    return NextResponse.json({ ok: true, etape: "code", email: masquer(l.email) });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
