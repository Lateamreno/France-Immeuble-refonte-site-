import { NextResponse, after } from "next/server";
import { connecter, poserSession } from "@/lib/compte/auth";
import { rattacher } from "@/lib/compte/rattachement";
import { EMAIL, erreurEnReponse, lireJson, memeOrigine, refus, texte } from "@/lib/compte/requete";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!memeOrigine(req)) return refus("Origine refusée.", 403);
  const b = await lireJson(req);
  if (!b) return refus("Requête illisible.");
  const email = texte(b.email, 200).toLowerCase();
  const motDePasse = String(b.motDePasse ?? "");
  if (!EMAIL.test(email) || !motDePasse) return refus("E-mail ou mot de passe incorrect.", 422);
  try {
    const s = await connecter(email, motDePasse);
    await poserSession(s);
    // Premier passage après vérification : on rattache au BO, sans faire
    // attendre la personne qui se connecte.
    after(() => rattacher(s.user));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
