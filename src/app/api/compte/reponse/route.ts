import { NextResponse } from "next/server";
import { deposerLead } from "@/lib/leads";
import { appartient } from "@/lib/compte/donnees";
import { exigerCompte, lireJson, refus, texte, UUID } from "@/lib/compte/requete";

export const runtime = "nodejs";

const REPONSES = new Set(["interesse", "visite", "pas_pour_moi"]);

/** « Intéressé », « Demander une visite », « Pas pour moi » sur un bien proposé (§9.2, type `reponse`). */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  const proposition = texte(b?.proposition, 36);
  const reponse = texte(b?.reponse, 20);
  if (!UUID.test(proposition) || !REPONSES.has(reponse)) return refus("Réponse illisible.", 422);
  if (!(await appartient(s.jeton, "compte_propositions", proposition))) {
    return refus("Ce bien ne vous a pas été proposé.", 404);
  }
  const issue = await deposerLead({
    type: "reponse",
    ref: crypto.randomUUID(),
    compte: s.utilisateur.id,
    proposition,
    reponse,
    message: texte(b?.message, 1000),
  });
  if (issue === "perdu") return refus("Envoi impossible pour le moment. Réessayez.", 503);
  return NextResponse.json({ ok: true, stocke: issue });
}
