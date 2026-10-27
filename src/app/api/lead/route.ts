import { NextResponse, after } from "next/server";
import { router, type Dossier } from "@/lib/routage";
import { deposerLead, relancerFile } from "@/lib/leads";
import { sessionCourante } from "@/lib/compte/auth";
import { accueillirVendeur } from "@/lib/compte/accueil";

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
  const u = compte ? session?.utilisateur : undefined;
  const issue = await deposerLead(lead, {
    contexte: u
      ? { email: u.email, prenom: u.user_metadata?.prenom, nom: u.user_metadata?.nom, telephone: u.user_metadata?.telephone }
      : {},
  });

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

  // Après une estimation, le client reçoit la liste des pièces et l'accès à
  // son espace, ouvert pour lui (MAV, 27/10/2026). Seulement quand il a donné
  // de quoi estimer (la seconde partie : surface et loyer), hors compte
  // connecté, hors PleinBail, et après la réponse au navigateur. S'il s'arrête
  // après la première partie, rien ne part vers lui : l'agent l'appelle.
  const surface = nombreOuNull(body.surface);
  const loyer = nombreOuNull(body.loyerAnnuel);
  const estimable = surface !== null && surface > 0 && loyer !== null && loyer >= 0;
  if (
    body.type === "estimation" && body.etat === "complement" && estimable &&
    verdict.piste !== "pleinbail" && !compte && issue !== "perdu"
  ) {
    after(async () => {
      const r = await accueillirVendeur(lead);
      if (r === "echec") console.error("[lead] e-mail au client non parti");
    });
  }

  if (issue === "perdu") {
    return NextResponse.json({ ok: false, piste: verdict.piste, stocke: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true, piste: verdict.piste, stocke: issue });
}
