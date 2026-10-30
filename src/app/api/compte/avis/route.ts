import { NextResponse } from "next/server";
import { aviserClients } from "@/lib/compte/avis";

/**
 * Annonce aux clients ce que le BO vient de déposer (messages, biens, offres).
 * Le BO l'appelle juste après un dépôt (MAV, 30/10/2026), avec `AVIS_SECRET` :
 * un secret à lui seul, qui n'ouvre que cette route (la relance des leads garde
 * `CRON_SECRET`). La tâche quotidienne et chaque envoi depuis un compte
 * rattrapent un appel manqué. Ne renvoie que des compteurs.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const recu = req.headers.get("authorization") ?? "";
  const permis = [process.env.AVIS_SECRET, process.env.CRON_SECRET].filter((x): x is string => !!x && x.length >= 24);
  if (!permis.some((x) => recu === `Bearer ${x}`)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await aviserClients()) });
  } catch (e) {
    console.error("[avis] annonce impossible —", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export const POST = GET;
