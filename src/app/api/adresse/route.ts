import { NextRequest, NextResponse } from "next/server";

/**
 * Suggestions d'adresse pour le formulaire d'estimation (retour #60, MAV,
 * 27/10/2026 : « il faut que ce soit ultra fluide pour qu'il nous mette
 * toujours la bonne adresse »).
 *
 * Source : la Base Adresse Nationale, servie par la Géoplateforme de l'IGN.
 * Gratuite, sans clé, officielle. La requête passe par ce serveur et non par
 * le navigateur : l'adresse IP du visiteur ne part chez aucun tiers (même
 * principe que les polices, CLAUDE.md §4 et §16).
 */

export const runtime = "nodejs";

const SOURCE = "https://data.geopf.fr/geocodage/search";

export type Suggestion = {
  label: string;
  numero: string;
  rue: string;
  codePostal: string;
  ville: string;
};

type Propriete = {
  label?: string;
  housenumber?: string;
  street?: string;
  name?: string;
  postcode?: string;
  city?: string;
  type?: string;
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 200);
  if (q.length < 3) return NextResponse.json({ suggestions: [] });

  const url = `${SOURCE}?${new URLSearchParams({ q, autocomplete: "1", limit: "6", index: "address" })}`;
  try {
    const r = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return NextResponse.json({ suggestions: [], indisponible: true });
    const json = (await r.json()) as { features?: { properties?: Propriete }[] };
    const suggestions: Suggestion[] = (json.features ?? [])
      .map((f) => f.properties ?? {})
      .filter((p) => p.postcode && p.city && (p.type === "housenumber" || p.type === "street"))
      .map((p) => ({
        label: p.label ?? "",
        numero: p.housenumber ?? "",
        rue: p.street ?? p.name ?? "",
        codePostal: p.postcode ?? "",
        ville: p.city ?? "",
      }));
    return NextResponse.json(
      { suggestions },
      { headers: { "Cache-Control": "public, max-age=3600" } },
    );
  } catch {
    // La saisie libre reste possible : le formulaire ne bloque jamais sur ce service.
    return NextResponse.json({ suggestions: [], indisponible: true });
  }
}
