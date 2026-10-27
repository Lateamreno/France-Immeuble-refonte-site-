import { NextResponse } from "next/server";
import { sessionCourante } from "@/lib/compte/auth";
import { erreurEnReponse, lireJson, memeOrigine, refus } from "@/lib/compte/requete";
import { nettoyer } from "@/lib/dossier/modele";
import { dossierCourant, modifier } from "@/lib/dossier/serveur";

export const runtime = "nodejs";

/** Enregistrement du brouillon au fil de la saisie. */
export async function PUT(req: Request) {
  if (!memeOrigine(req)) return refus("Origine refusée.", 403);
  const b = await lireJson(req, 80_000);
  if (!b) return refus("Requête illisible.");
  try {
    const s = await sessionCourante();
    const l = await dossierCourant(s?.utilisateur.email_confirmed_at ? s.utilisateur.id : null);
    if (!l) return refus("Ce dossier n’est plus disponible.", 404);
    if (l.valide_le) return refus("Ce dossier est déjà envoyé.", 409);
    await modifier(l.empreinte, { donnees: nettoyer(b.donnees) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
