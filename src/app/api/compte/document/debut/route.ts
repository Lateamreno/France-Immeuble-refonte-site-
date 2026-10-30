import { NextResponse } from "next/server";
import { appartient } from "@/lib/compte/donnees";
import { controlerAnnonce, estCategorie, nombreDeMorceaux } from "@/lib/compte/pieces";
import { exigerCompte, lireJson, refus, texte, UUID } from "@/lib/compte/requete";

export const runtime = "nodejs";

/**
 * Début d'un dépôt de pièce (§10.1) : contrôle de l'immeuble, de la catégorie,
 * du format et de la taille, avant qu'un seul octet ne soit envoyé.
 * `pour: "message"` : une pièce jointe à un message (§12.3), sans immeuble ni
 * catégorie ; elle partira avec le message.
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  const bien = texte(b?.bien, 36);
  const categorie = texte(b?.categorie, 20);
  const nom = texte(b?.nom, 200);
  const taille = Number(b?.taille);
  if (b?.pour !== "message") {
    if (!UUID.test(bien) || !(await appartient(s.jeton, "compte_biens", bien))) {
      return refus("Immeuble introuvable.", 404);
    }
    if (!estCategorie(categorie)) return refus("Catégorie inconnue.", 422);
  }
  const erreur = controlerAnnonce(nom, taille);
  if (erreur) return refus(erreur, 422);
  return NextResponse.json({ ok: true, depot: crypto.randomUUID(), morceaux: nombreDeMorceaux(taille) });
}
