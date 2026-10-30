import { NextResponse } from "next/server";
import { donneesCompte } from "@/lib/compte/donnees";
import { entier, envoyerDuCompte, tropDEnvois } from "@/lib/compte/envois";
import { exigerCompte, lireJson, refus, texte, UUID } from "@/lib/compte/requete";

export const runtime = "nodejs";

const FINANCEMENTS = new Set(["comptant", "pret", "mixte"]);

/**
 * Une offre d'achat faite en ligne sur un bien proposé (contrat §13, type
 * `offre_acquereur`). Elle part à l'agent, qui la confirme et la transmet ;
 * le profil investisseur déjà reçu l'accompagne côté BO.
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  if (!b) return refus("Requête illisible.");

  const proposition = texte(b.proposition, 36);
  if (!UUID.test(proposition)) return refus("Ce bien ne vous a pas été proposé.", 404);
  const d = await donneesCompte(s.jeton);
  const p = d.propositions.find((x) => x.cle === proposition);
  if (!p) return refus("Ce bien ne vous a pas été proposé.", 404);
  if (p.etat !== "disponible" && p.etat !== "sous_offre") return refus("Ce bien n’est plus à vendre.", 409);

  const montant = entier(b.montant, 10_000, 1_000_000_000);
  if (montant == null) return refus("Indiquez le montant de votre offre.", 422);
  const financement = texte(b.financement, 10);
  if (!FINANCEMENTS.has(financement)) return refus("Dites-nous comment vous financez l’achat.", 422);
  const apport = financement === "comptant" ? null : entier(b.apport, 0, 1_000_000_000);
  const validite = entier(b.validite_jours, 1, 60) ?? 10;
  if (tropDEnvois(d, "offre_acquereur", 3, 24, (x) => x.proposition === proposition)) {
    return refus("Vous avez déjà fait plusieurs offres sur ce bien aujourd’hui. Votre agent revient vers vous.", 429);
  }

  const { issue } = await envoyerDuCompte(s, d, "offre_acquereur", {
    proposition,
    montant,
    conditions: texte(b.conditions, 1500),
    financement,
    ...(apport != null ? { apport } : {}),
    validite_jours: validite,
    pieces: [],
    // Pour l'alerte de l'agence seulement : de quel bien il s'agit.
    bienTitre: [p.type, p.commune, p.dept ? `(${p.dept})` : null, p.lots ? `${p.lots} lots` : null].filter(Boolean).join(" "),
  });
  if (issue === "perdu") return refus("Envoi impossible pour le moment. Réessayez.", 503);
  return NextResponse.json({ ok: true });
}
