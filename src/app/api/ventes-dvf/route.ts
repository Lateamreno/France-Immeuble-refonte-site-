import { NextResponse } from "next/server";
import { CODES_ARRONDISSEMENTS, historiqueParis } from "@/lib/barometre";
import { ventesDvf } from "@/lib/ventes-dvf";

/**
 * Le détail des ventes d'immeubles d'un arrondissement, pour la page `/ventes-immeubles-paris/`
 * (lot 125). Fermé aux moteurs de recherche : robots.txt interdit `/api/` à tous les robots, et la
 * réponse porte `X-Robots-Tag: noindex` (conditions de réutilisation de DVF). Le rendement théorique
 * suit la règle du baromètre : loyer de marché des appartements de l'année × 12 ÷ prix au m².
 * `?code=paris` rend les ventes des vingt arrondissements, pour la carte et les listes (lot 127).
 */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  const codes = code === "paris" ? CODES_ARRONDISSEMENTS : CODES_ARRONDISSEMENTS.includes(code) ? [code] : [];
  if (!codes.length) return NextResponse.json({ ventes: [] }, { status: 404 });
  const [ventes, h] = await Promise.all([ventesDvf(codes), historiqueParis()]);
  const loyer = (c: string, annee: number) => (h.get(c) ?? []).find((a) => a.annee === annee)?.loyerM2 ?? null;
  const sortie = ventes.map((v) => {
    const l = loyer(v.codeInsee, v.annee);
    return {
      ...v,
      // Lot 128 : le loyer de marché de l'année (€ le m² par mois), pour le loyer théorique de chaque lot.
      loyerM2: l,
      rendement: l && v.prixM2 ? Math.round(((l * 12 * 100) / v.prixM2) * 10) / 10 : null,
      photo: v.photo ? { ...v.photo, url: `/api/ventes-dvf/photo/${v.photo.id}/?cap=${v.photo.cap}` } : null,
    };
  });
  return NextResponse.json(
    { ventes: sortie },
    { headers: { "x-robots-tag": "noindex, nofollow", "cache-control": "public, s-maxage=86400, stale-while-revalidate=86400" } },
  );
}
