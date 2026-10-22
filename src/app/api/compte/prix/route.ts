import { NextResponse } from "next/server";
import { deposerLead } from "@/lib/leads";
import { appartient } from "@/lib/compte/donnees";
import { exigerCompte, lireJson, refus, texte, UUID, contexteDe } from "@/lib/compte/requete";

export const runtime = "nodejs";

/** « Proposer mon prix » sur un de ses immeubles (§9.3, type `prix_proprietaire`). */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  const bien = texte(b?.bien, 36);
  const prix = Number(String(b?.prix ?? "").replace(/[^\d]/g, ""));
  if (!UUID.test(bien)) return refus("Immeuble introuvable.", 404);
  if (!Number.isFinite(prix) || prix < 10_000 || prix > 1_000_000_000) {
    return refus("Indiquez un prix en euros.", 422);
  }
  if (!(await appartient(s.jeton, "compte_biens", bien))) return refus("Immeuble introuvable.", 404);
  const issue = await deposerLead({
    type: "prix_proprietaire",
    ref: crypto.randomUUID(),
    compte: s.utilisateur.id,
    bien,
    prix,
    message: texte(b?.message, 1000),
  }, { contexte: contexteDe(s.utilisateur) });
  if (issue === "perdu") return refus("Envoi impossible pour le moment. Réessayez.", 503);
  return NextResponse.json({ ok: true, stocke: issue });
}
