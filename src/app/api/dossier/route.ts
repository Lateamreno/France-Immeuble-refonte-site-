import { NextResponse } from "next/server";
import { sessionCourante } from "@/lib/compte/auth";
import { erreurEnReponse, lireJson, memeOrigine, refus } from "@/lib/compte/requete";
import { nettoyer } from "@/lib/dossier/modele";
import { dossierCourant, modifier } from "@/lib/dossier/serveur";
import { transmettreEnCours } from "@/lib/dossier/envoi";

export const runtime = "nodejs";

/**
 * Enregistrement du brouillon au fil de la saisie, et dépôt au BO (retour
 * #266) : toutes les 45 s au plus pendant la saisie, tout de suite quand la
 * page se ferme ou que le visiteur appuie sur « Enregistrer » (`maintenant`).
 * Le visiteur qui s'arrête là, sans créer de compte, nous a quand même
 * transmis son état locatif.
 */
export async function PUT(req: Request) {
  if (!memeOrigine(req)) return refus("Origine refusée.", 403);
  const b = await lireJson(req, 80_000);
  if (!b) return refus("Requête illisible.");
  try {
    const s = await sessionCourante();
    const verifie = s?.utilisateur.email_confirmed_at ? s.utilisateur : null;
    const l = await dossierCourant(verifie?.id ?? null);
    if (!l) return refus("Ce dossier n’est plus disponible.", 404);
    if (l.valide_le) return refus("Ce dossier est déjà envoyé.", 409);
    const donnees = nettoyer(b.donnees);
    await modifier(l.empreinte, { donnees });
    let transmisLe = l.transmis_le ?? null;
    try {
      const compte = verifie && (l.compte === verifie.id || l.email === verifie.email.toLowerCase()) ? verifie.id : undefined;
      transmisLe = await transmettreEnCours(l, donnees, { maintenant: b.maintenant === true, compte });
    } catch (e) {
      console.error("[dossier] dépôt en cours de saisie impossible —", e);
    }
    return NextResponse.json({ ok: true, transmis_le: transmisLe });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
