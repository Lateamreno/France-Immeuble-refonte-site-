import { NextResponse } from "next/server";
import { sessionCourante } from "@/lib/compte/auth";
import { donneesCompte } from "@/lib/compte/donnees";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ce que les pages publiques des immeubles à vendre doivent savoir du
 * visiteur : connecté ou non, ses favoris, ses offres déjà faites. Les pages
 * restent en cache pour tout le monde ; seul ce petit état est personnel.
 */
export async function GET() {
  const s = await sessionCourante();
  const entete = { "cache-control": "private, no-store" };
  if (!s || !s.utilisateur.email_confirmed_at) return NextResponse.json({ connecte: false }, { headers: entete });
  const d = await donneesCompte(s.jeton);
  const offres = d.saisies
    .filter((x) => x.type === "offre_acquereur" && typeof x.donnees.annonce === "string")
    .map((x) => ({ annonce: String(x.donnees.annonce), montant: Number(x.donnees.montant), envoye_le: x.envoye_le }));
  return NextResponse.json({
    connecte: true,
    favoris: d.favoris.map((f) => f.bien),
    offres,
    profil: d.saisies.some((x) => x.type === "profil_investisseur"),
    prenom: s.utilisateur.user_metadata?.prenom ?? "",
    nom: s.utilisateur.user_metadata?.nom ?? "",
    // Les formulaires du site se préremplissent quand on est connecté (retours #262, #263, #275).
    email: s.utilisateur.email,
    telephone: s.utilisateur.user_metadata?.telephone ?? "",
    appele: !!d.agent?.appele,
  }, { headers: entete });
}
