import { NextResponse, after } from "next/server";
import { biensAVendre } from "@/lib/biens";
import {
  COOKIE_EQUIPE, EVENEMENTS, empreinteDuJour, estRobot, jourEtHeureParis, noterStat, type EvenementAnnonce,
} from "@/lib/stats-annonces";

/**
 * Reçoit un événement d'annonce envoyé par la page (contrat du BO §19, lot 141) : `{ e, biens }`.
 * Répond toujours 204, sans rien dire de ce qui a été compté : la page n'attend rien.
 *
 * Écarté : robots et aperçus de liens (agent utilisateur), navigateurs de l'équipe (cookie
 * `fi_equipe`, posé par /api/stats/equipe/), aperçus Vercel (seule la production compte), annonces
 * inconnues (seuls les identifiants de `biens_a_vendre` en ligne sont gardés).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDE = () => new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function POST(req: Request) {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return VIDE();
  const agent = req.headers.get("user-agent");
  if (estRobot(agent)) return VIDE();
  if (new RegExp(`(?:^|;\\s*)${COOKIE_EQUIPE}=1(?:;|$)`).test(req.headers.get("cookie") ?? "")) return VIDE();
  // Un préchargement n'est pas une visite.
  if (req.headers.get("sec-purpose")?.includes("prefetch") || req.headers.get("purpose") === "prefetch") return VIDE();

  let corps: { e?: unknown; biens?: unknown };
  try {
    const texte = await req.text();
    if (texte.length > 4000) return VIDE();
    corps = JSON.parse(texte);
  } catch {
    return VIDE();
  }
  const e = String(corps.e) as EvenementAnnonce;
  if (!EVENEMENTS.includes(e) || !Array.isArray(corps.biens)) return VIDE();
  const demandes = [...new Set(corps.biens.filter((x): x is string => typeof x === "string" && x.length <= 80))].slice(0, 60);
  if (!demandes.length || (e !== "impression" && demandes.length !== 1)) return VIDE();

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  const ua = agent ?? "";

  after(async () => {
    // Seules les annonces en ligne : personne ne remplit la table avec des identifiants inventés.
    const enLigne = new Set((await biensAVendre()).map((b) => b.id));
    const biens = demandes.filter((id) => enLigne.has(id));
    if (!biens.length) return;
    const { jour, heure } = jourEtHeureParis();
    await noterStat(e, biens, e === "vue" ? empreinteDuJour(jour, ip, ua) : null, jour, heure);
  });
  return VIDE();
}
