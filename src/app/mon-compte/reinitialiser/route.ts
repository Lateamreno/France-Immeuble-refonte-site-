import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_PKCE, echangerCode, poserSession } from "@/lib/compte/auth";
import { origineSite } from "@/lib/compte/requete";

export const runtime = "nodejs";

/** Retour du lien « mot de passe oublié » : session ouverte, puis formulaire du nouveau mot de passe. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = origineSite(req);
  const code = url.searchParams.get("code");
  const c = await cookies();
  const verifier = c.get(COOKIE_PKCE)?.value;
  if (!code || !verifier) return NextResponse.redirect(`${base}/mon-compte/?etat=lien-expire`, 303);
  try {
    await poserSession(await echangerCode(code, verifier));
    c.delete(COOKIE_PKCE);
    return NextResponse.redirect(`${base}/mon-compte/?etat=nouveau-mot-de-passe`, 303);
  } catch {
    return NextResponse.redirect(`${base}/mon-compte/?etat=lien-expire`, 303);
  }
}
