import { csvBarometre, historiqueParis } from "@/lib/barometre";

/**
 * Les chiffres du baromètre en fichier (lot 124) : rien que des agrégats, ceux que l'article affiche.
 * Mis en cache comme l'article ; la tâche mensuelle relit la base.
 */
export const revalidate = 86400;

export async function GET() {
  const h = await historiqueParis();
  if (!h.size) return new Response("Chiffres indisponibles pour le moment.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  return new Response(csvBarometre(h), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'inline; filename="prix-immeubles-paris-france-immeuble.csv"',
    },
  });
}
