import { NextResponse } from "next/server";
import { motDePasseOublie, nouveauPkce, poserPkce } from "@/lib/compte/auth";
import { EMAIL, lireJson, memeOrigine, origineSite, refus, texte } from "@/lib/compte/requete";

export const runtime = "nodejs";

/**
 * Mot de passe oublié. La réponse est la même que l'adresse ait un compte ou
 * non : on ne confirme jamais à un inconnu qu'un e-mail est inscrit.
 */
export async function POST(req: Request) {
  if (!memeOrigine(req)) return refus("Origine refusée.", 403);
  const b = await lireJson(req);
  const email = texte(b?.email, 200).toLowerCase();
  if (!EMAIL.test(email)) return refus("Adresse e-mail invalide.", 422);
  try {
    const { verifier, challenge } = nouveauPkce();
    await motDePasseOublie(email, `${origineSite(req)}/mon-compte/reinitialiser/`, challenge);
    await poserPkce(verifier);
  } catch (e) {
    console.warn("[compte] mot de passe oublié —", e instanceof Error ? e.message : e);
  }
  return NextResponse.json({ ok: true });
}
