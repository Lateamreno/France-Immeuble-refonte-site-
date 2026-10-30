import { NextResponse } from "next/server";
import { donneesCompte } from "@/lib/compte/donnees";
import { envoyerDuCompte, tropDEnvois } from "@/lib/compte/envois";
import { exigerCompte, lireJson, refus, texte, UUID } from "@/lib/compte/requete";
import { CRENEAUX, OBJETS_RDV, jourOuvert } from "@/lib/compte/rendez-vous";

export const runtime = "nodejs";

/**
 * Une demande de rendez-vous (contrat §13, type `rendez_vous`). L'agent la
 * confirme ; l'alerte part tout de suite à l'agence, l'agent attitré en copie
 * (MAV, 30/10/2026).
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  if (!b) return refus("Requête illisible.");

  const date = texte(b.date, 10);
  const creneau = texte(b.creneau, 12);
  const objet = texte(b.objet, 12);
  if (!jourOuvert(date)) return refus("Choisissez un jour dans le calendrier.", 422);
  if (!(creneau in CRENEAUX)) return refus("Choisissez un moment de la journée.", 422);
  if (!(objet in OBJETS_RDV)) return refus("Dites-nous l’objet du rendez-vous.", 422);

  const d = await donneesCompte(s.jeton);
  if (tropDEnvois(d, "rendez_vous", 5)) return refus("Vous avez déjà plusieurs demandes en attente. Votre agent revient vers vous.", 429);
  const bien = texte(b.bien, 36);
  const proposition = texte(b.proposition, 36);
  if (bien && (!UUID.test(bien) || !d.biens.some((x) => x.cle === bien))) return refus("Immeuble introuvable.", 404);
  if (proposition && (!UUID.test(proposition) || !d.propositions.some((x) => x.cle === proposition))) {
    return refus("Ce bien ne vous a pas été proposé.", 404);
  }

  const { issue } = await envoyerDuCompte(s, d, "rendez_vous", {
    date,
    creneau,
    objet,
    texte: texte(b.texte, 1000),
    ...(bien ? { bien } : {}),
    ...(proposition ? { proposition } : {}),
  });
  if (issue === "perdu") return refus("Envoi impossible pour le moment. Réessayez.", 503);
  return NextResponse.json({ ok: true });
}
