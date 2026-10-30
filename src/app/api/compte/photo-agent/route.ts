import { sessionCourante } from "@/lib/compte/auth";
import { donneesCompte } from "@/lib/compte/donnees";
import { photoAgent } from "@/lib/compte/photo-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * La photo de l'agent attitré du client connecté. L'adresse vient de la ligne
 * `compte_agent` lue avec SON jeton : le navigateur ne choisit jamais quelle
 * adresse le serveur va chercher.
 */
export async function GET() {
  const vide = () => new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
  const s = await sessionCourante();
  if (!s) return vide();
  const agent = (await donneesCompte(s.jeton)).agent;
  if (!agent?.appele || !agent.agent_photo) return vide();
  const photo = await photoAgent(agent.agent_photo);
  if (!photo) return vide();
  return new Response(photo.octets as BodyInit, {
    headers: {
      "content-type": photo.type,
      "cache-control": "private, max-age=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
