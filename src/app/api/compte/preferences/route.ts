import { NextResponse } from "next/server";
import { modifierPreferences } from "@/lib/compte/auth";
import { erreurEnReponse, exigerCompte, lireJson, refus } from "@/lib/compte/requete";

export const runtime = "nodejs";

/** Les e-mails de notification que le client garde ou coupe (MAV, 30/10/2026). */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  if (!b) return refus("Requête illisible.");
  try {
    await modifierPreferences(s.utilisateur.id, {
      messages: b.messages !== false,
      biens: b.biens !== false,
      offres: b.offres !== false,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
