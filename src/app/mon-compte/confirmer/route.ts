import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_PKCE, echangerCode, poserSession } from "@/lib/compte/auth";
import { rattacher } from "@/lib/compte/rattachement";
import { origineSite } from "@/lib/compte/requete";

export const runtime = "nodejs";

/**
 * Retour du lien de vérification de l'adresse. Supabase a vérifié l'adresse
 * avant de nous renvoyer ici ; on échange le code contre une session et on
 * rattache le compte au BO. Ouvert sur un autre appareil (pas de vérificateur),
 * l'adresse reste vérifiée : la page invite simplement à se connecter.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = origineSite(req);
  const code = url.searchParams.get("code");
  const c = await cookies();
  const verifier = c.get(COOKIE_PKCE)?.value;
  if (!code || !verifier) return NextResponse.redirect(`${base}/mon-compte/?etat=verifie`, 303);
  try {
    const s = await echangerCode(code, verifier);
    await poserSession(s);
    c.delete(COOKIE_PKCE);
    await rattacher(s.user);
    return NextResponse.redirect(`${base}/mon-compte/?etat=bienvenue`, 303);
  } catch {
    return NextResponse.redirect(`${base}/mon-compte/?etat=verifie`, 303);
  }
}
