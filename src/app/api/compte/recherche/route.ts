import { NextResponse } from "next/server";
import { deposerLead } from "@/lib/leads";
import { appartient } from "@/lib/compte/donnees";
import { exigerCompte, lireJson, refus, texte, UUID, contexteDe } from "@/lib/compte/requete";

export const runtime = "nodejs";

const CIBLES = new Set(["Investisseur", "Marchand de biens", "Patrimonial", "Promoteur"]);
const DESTINATIONS = new Set(["Logement", "Commerce", "Bureau", "Logistique", "Hôtel", "Parking"]);

const liste = (v: unknown, max: number) =>
  (Array.isArray(v) ? v : []).map((x) => texte(x, 60)).filter(Boolean).slice(0, max);
const nombre = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/**
 * Ajouter, modifier ou supprimer une recherche depuis le compte (§9.2,
 * type `recherche_compte` du §9.4). Le BO met à jour la recherche du contact
 * et redépose `compte_recherches` : le compte la montre à son prochain dépôt.
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  if (!b) return refus("Requête illisible.");

  const action = b.action === "supprimer" ? "supprimer" : "enregistrer";
  let cle = texte(b.cle, 36);
  if (cle) {
    if (!UUID.test(cle) || !(await appartient(s.jeton, "compte_recherches", cle))) {
      return refus("Recherche introuvable.", 404);
    }
  } else if (action === "supprimer") {
    return refus("Recherche introuvable.", 404);
  } else {
    cle = crypto.randomUUID();
  }

  const lead: Record<string, unknown> = {
    type: "recherche_compte",
    ref: crypto.randomUUID(),
    compte: s.utilisateur.id,
    cle,
    action,
  };
  if (action === "enregistrer") {
    const cible = texte(b.cible, 40);
    const departements = liste(b.departements, 20).filter((d) => /^(\d{2}|2[AB]|97\d)$/.test(d));
    if (!CIBLES.has(cible)) return refus("Choisissez votre profil d’acquéreur.", 422);
    if (departements.length === 0) return refus("Indiquez au moins un département.", 422);
    Object.assign(lead, {
      cible,
      departements,
      villes: liste(b.villes, 20),
      prixMin: nombre(b.prixMin),
      prixMax: nombre(b.prixMax),
      rendementMin: nombre(b.rendementMin),
      destinations: liste(b.destinations, 6).filter((d) => DESTINATIONS.has(d)),
      commentaire: texte(b.commentaire, 1000),
    });
  }

  const issue = await deposerLead(lead, { contexte: contexteDe(s.utilisateur) });
  if (issue === "perdu") return refus("Envoi impossible pour le moment. Réessayez.", 503);
  return NextResponse.json({ ok: true, cle, stocke: issue });
}
