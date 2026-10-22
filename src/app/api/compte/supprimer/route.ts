import { NextResponse } from "next/server";
import { deposerLead } from "@/lib/leads";
import { effacerSession, supprimerUtilisateur, uuidDe } from "@/lib/compte/auth";
import { viderCompte } from "@/lib/compte/stockage";
import { erreurEnReponse, exigerCompte, lireJson, refus } from "@/lib/compte/requete";

export const runtime = "nodejs";

/**
 * Fermeture du compte (§9.1, type `compte_supprime`). Le BO efface ce qu'il
 * avait déposé et retire la clé de la fiche ; le site efface les pièces
 * encore en attente dans le seau, puis le compte lui-même, ce qui emporte
 * toutes ses lignes (on delete cascade).
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  if (b?.confirmation !== "FERMER") return refus("Tapez FERMER pour confirmer.", 422);
  const id = s.utilisateur.id;
  const issue = await deposerLead({ type: "compte_supprime", ref: uuidDe(`compte_supprime|${id}`), compte: id });
  if (issue === "perdu") return refus("Fermeture impossible pour le moment. Réessayez.", 503);
  try {
    await viderCompte(id);
    await supprimerUtilisateur(id);
    await effacerSession();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
