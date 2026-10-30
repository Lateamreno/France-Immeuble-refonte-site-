import { sessionCourante } from "@/lib/compte/auth";
import { configSitePublique } from "@/lib/supabase-site";
import { lireDocumentClient } from "@/lib/compte/stockage";
import { UUID } from "@/lib/compte/requete";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Le document d'une offre reçue (contrat §12.1). La ligne est lue avec le
 * jeton du client : la base ne la rend que si l'offre est à lui. Le PDF est
 * ensuite servi par notre serveur, jamais par une adresse du stockage, et
 * seulement s'il est rangé sous le dossier de ce compte.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ cle: string }> }) {
  const { cle } = await params;
  const non = (statut: number) => new Response(statut === 401 ? "Connectez-vous." : "Document introuvable.", {
    status: statut, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
  if (!UUID.test(cle)) return non(404);
  const s = await sessionCourante();
  if (!s) return non(401);
  const cfg = configSitePublique();
  if (!cfg) return non(404);

  const r = await fetch(`${cfg.url}/rest/v1/compte_offres?select=document,recue_le&cle=eq.${cle}&limit=1`, {
    headers: { apikey: cfg.cle, Authorization: `Bearer ${s.jeton}` },
    cache: "no-store",
  }).catch(() => null);
  const ligne = r?.ok ? ((await r.json()) as { document: string | null; recue_le: string | null }[])[0] : undefined;
  const chemin = ligne?.document ?? "";
  if (!chemin.startsWith(`${s.utilisateur.id}/offres/`) || chemin.includes("..")) return non(404);

  const pdf = await lireDocumentClient(chemin).catch(() => null);
  if (!pdf) return non(404);
  return new Response(pdf as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="offre-${ligne?.recue_le ?? "recue"}.pdf"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
