import { NextResponse } from "next/server";
import { router, type Dossier } from "@/lib/routage";

/**
 * Réception des leads — CLAUDE.md §2 et §9.
 *
 * Le navigateur n'écrit jamais directement : il poste ici, et c'est ce
 * handler serveur qui relaie vers l'endpoint du BO. Le site ne détient aucune
 * clé de lecture vers le BO — cet endpoint ne sait qu'écrire.
 *
 * ⚠️ TANT QUE `BO_LEAD_ENDPOINT` N'EST PAS CONFIGURÉ, AUCUN LEAD N'EST STOCKÉ.
 * Le handler le signale explicitement dans sa réponse et dans les logs serveur.
 * À câbler impérativement avant toute mise en production : c'est le canal
 * d'acquisition n°1.
 */

export const runtime = "nodejs";

type Payload = Record<string, unknown> & Partial<Dossier> & { type?: string };

function nombreOuNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, erreur: "Requête illisible." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  const telephone = String(body.telephone ?? "").trim();
  if (!email && !telephone) {
    return NextResponse.json(
      { ok: false, erreur: "Un e-mail ou un téléphone est nécessaire pour vous répondre." },
      { status: 422 },
    );
  }

  const verdict = router({
    codePostal: String(body.codePostal ?? ""),
    valeurEstimee: nombreOuNull(body.valeurEstimee),
    loyerAnnuel: nombreOuNull(body.loyerAnnuel),
  });

  const lead = { ...body, verdict, recuLe: new Date().toISOString() };
  const endpoint = process.env.BO_LEAD_ENDPOINT;

  if (!endpoint) {
    console.warn(
      "[lead] BO_LEAD_ENDPOINT absent — LEAD NON ENREGISTRÉ.",
      JSON.stringify({ type: body.type, etat: body.etat, ref: body.ref, piste: verdict.piste }),
    );
    return NextResponse.json({ ok: true, piste: verdict.piste, stocke: false });
  }

  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.BO_LEAD_TOKEN ? { authorization: `Bearer ${process.env.BO_LEAD_TOKEN}` } : {}),
      },
      body: JSON.stringify(lead),
    });
    if (!r.ok) throw new Error(`BO a répondu ${r.status}`);
    return NextResponse.json({ ok: true, piste: verdict.piste, stocke: true });
  } catch (e) {
    // Le BO ne répond pas : on ne perd pas le lead, on le signale bruyamment.
    // La file d'attente `web.leads_outbox` du §2 se branchera ici.
    console.error("[lead] transmission au BO impossible —", e, JSON.stringify(lead));
    return NextResponse.json({ ok: true, piste: verdict.piste, stocke: false });
  }
}
