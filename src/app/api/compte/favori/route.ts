import { NextResponse } from "next/server";
import { biensAVendre } from "@/lib/biens";
import { deposerLead } from "@/lib/leads";
import { requeteSite } from "@/lib/compte/saisies";
import { contexteDe, erreurEnReponse, exigerCompte, lireJson, refus, texte } from "@/lib/compte/requete";

export const runtime = "nodejs";

/**
 * Ajouter ou retirer un immeuble à vendre des favoris (MAV, 31/10/2026).
 * Le favori est gardé par le site (0014) et part au BO (type `favori`),
 * sans e-mail à l'agence : c'est un signal d'intérêt, pas une demande.
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  const bien = texte(b?.bien, 80);
  const actif = b?.actif !== false;
  const fiche = (await biensAVendre()).find((x) => x.id === bien);
  if (!fiche) return refus("Cet immeuble n’est plus en vente.", 404);
  const compte = s.utilisateur.id;
  try {
    if (actif) {
      await requeteSite("compte_favoris", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({ compte, bien }),
      });
    } else {
      await requeteSite(`compte_favoris?compte=eq.${compte}&bien=eq.${encodeURIComponent(bien)}`, { method: "DELETE" });
    }
    await deposerLead(
      { type: "favori", ref: crypto.randomUUID(), compte, bien, action: actif ? "ajouter" : "retirer", bienTitre: `${fiche.titre} (${fiche.ville})` },
      { contexte: contexteDe(s.utilisateur), silencieux: true },
    );
    return NextResponse.json({ ok: true, actif });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
