import { NextRequest, NextResponse } from "next/server";
import { DEPARTEMENTS } from "@/lib/departements";

/**
 * Les communes de France pour le choix des lieux d'une recherche (retour #94,
 * MAV, 02/11/2026 : « je ne veux pas que les villes soient limitées aux
 * immeubles dont on dispose, mets tout le reste de la France »).
 *
 * Source : la Base Adresse Nationale (Géoplateforme de l'IGN), index des
 * communes, déjà utilisée pour l'adresse du formulaire d'estimation. La requête
 * passe par ce serveur : l'adresse IP du visiteur ne part chez aucun tiers.
 */

export const runtime = "nodejs";

const SOURCE = "https://data.geopf.fr/geocodage/search";

export type Commune = { nom: string; dept: string; codePostal: string; population: number };

type Propriete = { name?: string; postcode?: string; citycode?: string; population?: number; type?: string };

/** Code du département d'après le code INSEE de la commune (2A/2B, outre-mer sur 3 chiffres). */
function deptDe(citycode: string): string {
  if (/^97/.test(citycode)) return citycode.slice(0, 3);
  return citycode.slice(0, 2).toUpperCase();
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ communes: [] });
  const url = `${SOURCE}?${new URLSearchParams({ q, autocomplete: "1", limit: "12", index: "address", type: "municipality" })}`;
  try {
    const r = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return NextResponse.json({ communes: [], indisponible: true });
    const json = (await r.json()) as { features?: { properties?: Propriete }[] };
    const vues = new Set<string>();
    const communes: Commune[] = [];
    for (const f of json.features ?? []) {
      const p = f.properties ?? {};
      if (!p.name || !p.citycode) continue;
      // Seulement les départements que le BO connaît (pas les collectivités du Pacifique).
      if (!(deptDe(p.citycode) in DEPARTEMENTS)) continue;
      const cle = `${p.name}|${p.citycode}`;
      if (vues.has(cle)) continue;
      vues.add(cle);
      communes.push({ nom: p.name, dept: deptDe(p.citycode), codePostal: p.postcode ?? "", population: p.population ?? 0 });
    }
    return NextResponse.json({ communes }, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch {
    return NextResponse.json({ communes: [], indisponible: true });
  }
}
