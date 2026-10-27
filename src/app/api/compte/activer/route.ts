import { NextResponse } from "next/server";
import { poserSession, verifierJeton } from "@/lib/compte/auth";
import { rattacher } from "@/lib/compte/rattachement";
import { memeOrigine, origineSite } from "@/lib/compte/requete";

export const runtime = "nodejs";

/**
 * Bouton « Ouvrir mon espace » de /mon-compte/activer/. Le jeton à usage
 * unique est échangé contre une session ; l'adresse est vérifiée par le fait
 * même (seul le destinataire de l'e-mail a le lien), le compte est donc
 * rattaché au BO. Un compte créé pour l'occasion n'a pas de mot de passe :
 * la page du compte propose aussitôt d'en choisir un.
 */
export async function POST(req: Request) {
  const base = origineSite(req);
  if (!memeOrigine(req)) return NextResponse.redirect(`${base}/mon-compte/`, 303);
  let type = "";
  let jeton = "";
  try {
    const f = await req.formData();
    type = String(f.get("type") ?? "");
    jeton = String(f.get("jeton") ?? "");
  } catch {
    /* corps illisible : traité comme un lien expiré */
  }
  if ((type !== "invite" && type !== "magiclink") || !/^[A-Za-z0-9_-]{10,200}$/.test(jeton)) {
    return NextResponse.redirect(`${base}/mon-compte/?etat=lien-expire`, 303);
  }
  try {
    const s = await verifierJeton(type, jeton);
    await poserSession(s);
    await rattacher(s.user);
    return NextResponse.redirect(`${base}/mon-compte/?etat=${type === "invite" ? "choisir-mot-de-passe" : "bienvenue"}`, 303);
  } catch {
    return NextResponse.redirect(`${base}/mon-compte/?etat=lien-expire`, 303);
  }
}
