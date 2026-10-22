import { NextResponse, after } from "next/server";
import { router, type Dossier } from "@/lib/routage";
import { deposerLead, relancerFile } from "@/lib/leads";
import { sessionCourante } from "@/lib/compte/auth";

/**
 * Réception des leads — CLAUDE.md §2 et §9, contrat BO du 21/10/2026.
 *
 * Le navigateur n'écrit jamais directement : il poste ici, et ce handler
 * serveur dépose au BO (`BO_LEAD_ENDPOINT`, qui ne sait qu'enregistrer). Si le
 * BO ne répond pas 200, le lead attend dans `leads_outbox` et il est réessayé :
 * on ne perd jamais un lead. Voir `src/lib/leads.ts`.
 *
 * Réponse au navigateur : 200 dès que le lead est quelque part (au BO ou en
 * file) ; 503 seulement s'il n'est nulle part — le formulaire invite alors à
 * appeler, plutôt que d'afficher un faux « c'est envoyé ».
 */

export const runtime = "nodejs";

type Payload = Record<string, unknown> & Partial<Dossier> & { type?: string };

/** Les formulaires publics. Les types du compte (§9.4) passent par /api/compte/. */
const TYPES = new Set(["estimation", "recherche_acquereur", "contact"]);

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
  if (!body || typeof body !== "object" || !TYPES.has(String(body.type))) {
    return NextResponse.json({ ok: false, erreur: "Type de formulaire inconnu." }, { status: 400 });
  }
  if (JSON.stringify(body).length > 20_000) {
    return NextResponse.json({ ok: false, erreur: "Requête trop volumineuse." }, { status: 413 });
  }

  const email = String(body.email ?? "").trim();
  const telephone = String(body.telephone ?? "").trim();
  if (!email && !telephone) {
    return NextResponse.json(
      { ok: false, erreur: "Un e-mail ou un téléphone est nécessaire pour vous répondre." },
      { status: 422 },
    );
  }

  // Le BO est idempotent sur `ref` : un lead sans ref en reçoit un ici.
  const ref = typeof body.ref === "string" && body.ref ? body.ref : crypto.randomUUID();

  const verdict = router({
    codePostal: String(body.codePostal ?? ""),
    valeurEstimee: nombreOuNull(body.valeurEstimee),
    loyerAnnuel: nombreOuNull(body.loyerAnnuel),
  });

  // Le champ `compte` (§9.4) ne vient JAMAIS du navigateur : sinon n'importe
  // qui rattacherait un formulaire au compte d'un autre. Il est pris dans la
  // session vérifiée, et seulement si l'adresse du compte est vérifiée.
  const { compte: _ignore, ...propre } = body;
  void _ignore;
  const session = await sessionCourante();
  const compte = session?.utilisateur.email_confirmed_at ? session.utilisateur.id : undefined;

  const lead = { ...propre, ...(compte ? { compte } : {}), ref, verdict, recuLe: new Date().toISOString() };
  const issue = await deposerLead(lead);

  // Chaque lead qui arrive est l'occasion de vider la file : si le BO vient de
  // répondre, ceux qui attendaient partent aussi. Après la réponse, pour ne pas
  // faire attendre le visiteur.
  if (issue === "bo") {
    after(async () => {
      try {
        await relancerFile(10);
      } catch (e) {
        console.error("[lead] relance de la file impossible —", e);
      }
    });
  }

  if (issue === "perdu") {
    return NextResponse.json({ ok: false, piste: verdict.piste, stocke: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true, piste: verdict.piste, stocke: issue });
}
