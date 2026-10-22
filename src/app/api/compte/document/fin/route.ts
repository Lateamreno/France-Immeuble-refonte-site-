import { NextResponse } from "next/server";
import { deposerLead } from "@/lib/leads";
import { appartient } from "@/lib/compte/donnees";
import { contenuConforme, controlerAnnonce, estCategorie } from "@/lib/compte/pieces";
import { deposerObjet, effacerObjets, extension, FORMATS, lireObjet, nomDeFichier, TAILLE_MAX } from "@/lib/compte/stockage";
import { exigerCompte, lireJson, refus, texte, UUID, contexteDe } from "@/lib/compte/requete";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Fin d'un dépôt (§10.1, étapes 2 et 3) : les morceaux sont réunis en une
 * pièce posée à `<compte>/<uuid>-<nom>`, puis le type `document` part au BO.
 *
 * - 200 : le BO a rangé la pièce au coffre de l'immeuble et l'a effacée du seau.
 * - 422 : refusée ; on l'efface nous-mêmes et on le dit au propriétaire.
 * - autre : le dépôt attend dans la file et la pièce dans le seau, jusqu'à ce
 *   que le BO réponde. Le propriétaire est prévenu que c'est en cours.
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const compte = s.utilisateur.id;
  const b = await lireJson(req);
  const depot = texte(b?.depot, 36);
  const morceaux = Number(b?.morceaux);
  const bien = texte(b?.bien, 36);
  const categorie = texte(b?.categorie, 20);
  const nom = texte(b?.nom, 200);
  if (!UUID.test(depot) || !Number.isInteger(morceaux) || morceaux < 1 || morceaux > 7) {
    return refus("Dépôt illisible.", 422);
  }
  if (!UUID.test(bien) || !(await appartient(s.jeton, "compte_biens", bien))) {
    return refus("Immeuble introuvable.", 404);
  }
  if (!estCategorie(categorie)) return refus("Catégorie inconnue.", 422);

  const cheminsMorceaux = Array.from({ length: morceaux }, (_, i) => `${compte}/morceaux/${depot}/${i}`);
  const parts: Uint8Array[] = [];
  for (const c of cheminsMorceaux) {
    const p = await lireObjet(c);
    if (!p) {
      await effacerObjets(cheminsMorceaux);
      return refus("Une partie du fichier manque. Réessayez l’envoi.", 422);
    }
    parts.push(p);
  }
  const taille = parts.reduce((t, p) => t + p.byteLength, 0);
  const fichier = new Uint8Array(taille);
  let pos = 0;
  for (const p of parts) {
    fichier.set(p, pos);
    pos += p.byteLength;
  }
  await effacerObjets(cheminsMorceaux);

  const erreur = controlerAnnonce(nom, taille) ?? (taille > TAILLE_MAX ? "Le fichier dépasse 25 Mo." : null);
  if (erreur) return refus(erreur, 422);
  if (!contenuConforme(nom, fichier)) {
    return refus("Le contenu du fichier ne correspond pas à son format. Vérifiez la pièce.", 422);
  }

  const chemin = `${compte}/${depot}-${nomDeFichier(nom)}`;
  try {
    await deposerObjet(chemin, fichier, FORMATS[extension(nom)]);
  } catch (e) {
    console.error("[pièces] pièce non déposée —", e);
    return refus("Envoi interrompu. Réessayez.", 503);
  }

  const issue = await deposerLead(
    { type: "document", ref: depot, compte, bien, categorie, chemin, nom },
    { refusDefinitif: true, contexte: contexteDe(s.utilisateur) },
  );
  if (issue === "refuse") {
    await effacerObjets([chemin]);
    return refus("L’agence n’a pas pu accepter cette pièce. Vérifiez le fichier ou appelez-nous.", 422);
  }
  if (issue === "perdu") {
    await effacerObjets([chemin]);
    return refus("Envoi impossible pour le moment. Réessayez.", 503);
  }
  return NextResponse.json({ ok: true, stocke: issue });
}
