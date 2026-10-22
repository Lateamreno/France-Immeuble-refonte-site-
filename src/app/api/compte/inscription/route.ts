import { NextResponse } from "next/server";
import { inscrire, nouveauPkce, poserPkce } from "@/lib/compte/auth";
import { EMAIL, erreurEnReponse, lireJson, memeOrigine, origineSite, refus, texte } from "@/lib/compte/requete";

export const runtime = "nodejs";

/**
 * Création de compte (§9.1). Supabase Auth envoie le lien de vérification ;
 * le compte n'est rattaché au BO qu'une fois l'adresse vérifiée. Aucun autre
 * e-mail ne part vers le client.
 */
export async function POST(req: Request) {
  if (!memeOrigine(req)) return refus("Origine refusée.", 403);
  const b = await lireJson(req);
  if (!b) return refus("Requête illisible.");
  const email = texte(b.email, 200).toLowerCase();
  const motDePasse = String(b.motDePasse ?? "");
  const prenom = texte(b.prenom, 80);
  const nom = texte(b.nom, 80);
  const telephone = texte(b.telephone, 40);
  if (!EMAIL.test(email)) return refus("Adresse e-mail invalide.", 422);
  if (motDePasse.length < 8 || motDePasse.length > 72) {
    return refus("Le mot de passe doit faire 8 caractères au moins.", 422);
  }
  if (!prenom || !nom) return refus("Indiquez votre prénom et votre nom.", 422);

  try {
    const { verifier, challenge } = nouveauPkce();
    await inscrire({
      email, motDePasse, prenom, nom, telephone, challenge,
      retour: `${origineSite(req)}/mon-compte/confirmer/`,
    });
    await poserPkce(verifier);
    // Même réponse qu'un compte existe déjà ou non : on ne dit pas à un
    // inconnu quelles adresses ont un compte.
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
