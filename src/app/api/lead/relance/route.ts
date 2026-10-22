import { NextResponse } from "next/server";
import { relancerFile } from "@/lib/leads";
import { nettoyerMorceaux } from "@/lib/compte/stockage";

/**
 * Relance de la file d'attente des leads — appelée par la tâche planifiée de
 * Vercel (vercel.json), en plus de la relance faite à chaque nouveau lead.
 *
 * Si `CRON_SECRET` est posée dans Vercel, Vercel l'envoie en en-tête et toute
 * autre requête est refusée. La route ne renvoie que des compteurs, jamais le
 * contenu d'un lead : l'appeler sans autorisation ne ferait que réessayer des
 * dépôts que le BO dédoublonne de toute façon.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const r = await relancerFile(50);
    let morceauxEffaces = 0;
    try {
      morceauxEffaces = await nettoyerMorceaux();
    } catch (e) {
      console.error("[pièces] nettoyage des morceaux impossible —", e);
    }
    return NextResponse.json({ ok: true, ...r, morceauxEffaces });
  } catch (e) {
    console.error("[lead][ALERTE] relance de la file impossible —", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
