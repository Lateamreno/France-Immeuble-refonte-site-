import { NextResponse } from "next/server";
import { jetonFormulaire } from "@/lib/anti-robots";

/**
 * Le jeton d'un formulaire public (`src/lib/anti-robots.ts`), demandé par le formulaire à son
 * ouverture et renvoyé avec l'envoi. Jamais en cache : chaque ouverture a son heure.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ j: jetonFormulaire() }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
