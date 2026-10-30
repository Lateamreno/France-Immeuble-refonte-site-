import { NextResponse } from "next/server";
import { aviserClients } from "@/lib/compte/avis";

/**
 * Annonce aux clients ce que le BO vient de déposer (messages, biens, offres).
 * Même verrou que la relance : `CRON_SECRET`, posé dans Vercel. Le BO peut
 * l'appeler juste après un dépôt ; la tâche quotidienne et chaque envoi depuis
 * un compte la rattrapent sinon. Ne renvoie que des compteurs.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
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
