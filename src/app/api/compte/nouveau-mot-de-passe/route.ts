import { NextResponse } from "next/server";
import { changerMotDePasse, sessionCourante } from "@/lib/compte/auth";
import { erreurEnReponse, lireJson, memeOrigine, refus } from "@/lib/compte/requete";

export const runtime = "nodejs";

/** Nouveau mot de passe, après le lien « mot de passe oublié » ou depuis le compte. */
export async function POST(req: Request) {
  if (!memeOrigine(req)) return refus("Origine refusée.", 403);
  const s = await sessionCourante();
  if (!s) return refus("Votre lien a expiré. Demandez-en un nouveau.", 401);
  const b = await lireJson(req);
  const motDePasse = String(b?.motDePasse ?? "");
  if (motDePasse.length < 8 || motDePasse.length > 72) {
    return refus("Le mot de passe doit faire 8 caractères au moins.", 422);
  }
  try {
    await changerMotDePasse(s.jeton, motDePasse);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
