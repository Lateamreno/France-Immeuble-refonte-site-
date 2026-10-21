import { NextRequest } from "next/server";
import { configSite } from "@/lib/supabase-site";

/**
 * Sert les captures du coffre privé des retours de recette.
 *
 * ⚠️ CLAUDE.md §2 : la configuration passe par `configSite()`, qui refuse
 * toute URL du projet du BO. Sans configuration, la route répond 503 plutôt
 * que d'aller chercher un fichier ailleurs.
 */

/** Pixel transparent : une image source cassée ne doit pas casser la page. */
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const pixel = () =>
  new Response(new Uint8Array(PIXEL), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" },
  });

export async function GET(req: NextRequest) {
  // Fichiers du bucket privé Supabase (`bo-files`) : ?s=<chemin dans le bucket>
  const s = req.nextUrl.searchParams.get("s");
  if (!s) return new Response("missing s", { status: 400 });
  if (s.includes("..")) return new Response("bad path", { status: 400 });
  const cfg = configSite();
  if (!cfg) return new Response("storage indisponible", { status: 503 });
  const upstream = await fetch(`${cfg.url}/storage/v1/object/bo-files/${s}`, {
    headers: { Authorization: `Bearer ${cfg.cle}`, apikey: cfg.cle },
    next: { revalidate: 86400 },
  });
  if (!upstream.ok) return pixel();
  const type = upstream.headers.get("Content-Type") ?? "application/octet-stream";
  const nom = s.split("/").pop() || "document";
  return new Response(upstream.body, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `inline; filename="${nom.replace(/"/g, "")}"`,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
