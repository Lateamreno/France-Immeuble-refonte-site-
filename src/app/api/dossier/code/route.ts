import { NextResponse } from "next/server";
import { changerMotDePasse, ErreurAuth, poserSession, verifierCode } from "@/lib/compte/auth";
import { rattacher } from "@/lib/compte/rattachement";
import { erreurEnReponse, lireJson, memeOrigine, refus } from "@/lib/compte/requete";
import { motDePasseValide } from "@/lib/dossier/modele";
import { dossierCourant, modifier, oublierCookie, supprimer } from "@/lib/dossier/serveur";

export const runtime = "nodejs";

const ESSAIS_MAX = 5;

/**
 * Le code reçu par e-mail ouvre le compte (retour #64). L'adresse est prouvée :
 * le compte reçoit le mot de passe choisi, la session est posée et le compte
 * est rattaché au BO. Le brouillon disparaît.
 */
export async function POST(req: Request) {
  if (!memeOrigine(req)) return refus("Origine refusée.", 403);
  const b = await lireJson(req);
  const code = String(b?.code ?? "").replace(/\D/g, "");
  const motDePasse = String(b?.motDePasse ?? "");
  if (code.length < 6 || code.length > 10) return refus("Saisissez le code reçu par e-mail.", 422);
  if (!motDePasseValide(motDePasse)) {
    return refus("Mot de passe trop faible : 8 caractères au moins, avec des lettres et des chiffres.", 422);
  }
  try {
    const l = await dossierCourant(null);
    if (!l || !l.valide_le || (l.code_type !== "invite" && l.code_type !== "magiclink")) {
      return refus("Demandez d’abord un code.", 409);
    }
    if (l.essais >= ESSAIS_MAX) return refus("Trop d’essais. Demandez un nouveau code.", 429);
    await modifier(l.empreinte, { essais: l.essais + 1 });

    let s;
    try {
      s = await verifierCode(l.code_type, l.email, code);
    } catch (e) {
      if (e instanceof ErreurAuth && e.statut < 500) return refus("Ce code n’est pas le bon, ou il a expiré.", 422);
      throw e;
    }
    await poserSession(s);
    let motDePassePose = true;
    try {
      await changerMotDePasse(s.access_token, motDePasse);
    } catch (e) {
      // Le compte est ouvert ; le mot de passe se choisit alors depuis le compte.
      motDePassePose = false;
      console.error("[dossier] mot de passe non posé —", e instanceof Error ? e.message : e);
    }
    await rattacher(s.user);
    await supprimer(l.empreinte);
    await oublierCookie();
    return NextResponse.json({ ok: true, suite: motDePassePose ? "/mon-compte/?etat=dossier-envoye" : "/mon-compte/?etat=choisir-mot-de-passe" });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
