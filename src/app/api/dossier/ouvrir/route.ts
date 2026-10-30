import { NextResponse } from "next/server";
import { sessionCourante } from "@/lib/compte/auth";
import { EMAIL, erreurEnReponse, lireJson, memeOrigine, refus, texte, UUID } from "@/lib/compte/requete";
import { creerDossier, dossierCourant } from "@/lib/dossier/serveur";

export const runtime = "nodejs";

/**
 * Bouton de l'écran de fin du formulaire d'estimation (retour #64) : ouvre le
 * dossier du vendeur, prérempli avec les lots qu'il vient d'annoncer.
 *
 * Le navigateur renvoie ce qu'il vient de saisir (le site n'a gardé aucune
 * copie du lead). Connecté avec une adresse vérifiée, le dossier est rattaché
 * au compte et l'adresse est celle du compte, jamais celle du formulaire.
 */
export async function POST(req: Request) {
  if (!memeOrigine(req)) return refus("Origine refusée.", 403);
  const b = await lireJson(req);
  if (!b) return refus("Requête illisible.");
  const ref = texte(b.ref, 36);
  if (!UUID.test(ref)) return refus("Référence inconnue.", 422);

  try {
    const s = await sessionCourante();
    const compte = s?.utilisateur.email_confirmed_at ? s.utilisateur.id : null;
    const email = compte ? s!.utilisateur.email : texte(b.email, 200).toLowerCase();
    if (!EMAIL.test(email)) return refus("Adresse e-mail manquante.", 422);

    // Un second clic sur le bouton retrouve le même dossier.
    const deja = await dossierCourant(compte);
    if (deja && deja.ref === ref && !deja.valide_le) return NextResponse.json({ ok: true, donnees: deja.donnees });

    const lots = (k: string) => Math.max(0, Math.min(99, Math.floor(Number(b[k]) || 0)));
    const cree = await creerDossier({
      ref,
      email,
      compte,
      identite: {
        formulaire: texte(b.formulaire, 20),
        prenom: texte(b.prenom, 80),
        nom: texte(b.nom, 80),
        telephone: texte(b.telephone, 30),
        numero: texte(b.numero, 20),
        rue: texte(b.rue, 160),
        codePostal: texte(b.codePostal, 10),
        ville: texte(b.ville, 80),
      },
      comptes: {
        habitation: lots("lotsHabitation"),
        bureau: lots("lotsBureaux"),
        commerce: lots("lotsCommerces"),
        local_activite: lots("lotsActivite"),
      },
    });
    return NextResponse.json({ ok: true, donnees: cree.donnees });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
