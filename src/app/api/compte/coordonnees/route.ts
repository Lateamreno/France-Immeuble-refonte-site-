import { NextResponse } from "next/server";
import { modifierCompte } from "@/lib/compte/auth";
import { deposerLead } from "@/lib/leads";
import { contexteDe, erreurEnReponse, exigerCompte, lireJson, refus, texte } from "@/lib/compte/requete";

export const runtime = "nodejs";

/**
 * Le client change lui-même son nom et son téléphone (MAV, 30/10/2026).
 * Le compte est mis à jour tout de suite, et le changement part au BO
 * (type `coordonnees`, gardé en file tant que le BO ne le lit pas).
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  if (!b) return refus("Requête illisible.");
  const prenom = texte(b.prenom, 80);
  const nom = texte(b.nom, 80);
  const telephone = texte(b.telephone, 30);
  if (!prenom || !nom) return refus("Indiquez votre prénom et votre nom.", 422);
  if (telephone && !/^\+?[\d\s.()-]{6,24}$/.test(telephone)) return refus("Ce numéro de téléphone n’est pas lisible.", 422);
  try {
    const u = await modifierCompte(s.utilisateur.id, { user_metadata: { prenom, nom, telephone } });
    await deposerLead(
      { type: "coordonnees", ref: crypto.randomUUID(), compte: s.utilisateur.id, prenom, nom, telephone, email: s.utilisateur.email },
      { contexte: contexteDe(u) },
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
