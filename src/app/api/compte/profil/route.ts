import { NextResponse } from "next/server";
import { donneesCompte } from "@/lib/compte/donnees";
import { entier, envoyerDuCompte, tropDEnvois } from "@/lib/compte/envois";
import { exigerCompte, lireJson, refus, texte } from "@/lib/compte/requete";

export const runtime = "nodejs";

const FINANCEMENTS = new Set(["comptant", "pret", "mixte"]);

/**
 * Le profil investisseur, facultatif (contrat §13, type `profil_investisseur`) :
 * le client se présente, et ce profil accompagne ses offres. Un nouvel envoi
 * remplace le précédent, au BO comme sur le site.
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  if (!b) return refus("Requête illisible.");

  const achatEn = texte(b.achat_en, 12) === "societe" ? "societe" : "nom_propre";
  const siren = texte(b.siren, 20).replace(/\s/g, "");
  if (siren && !/^\d{9}$/.test(siren)) return refus("Le SIREN compte 9 chiffres.", 422);
  const financement = texte(b.financement, 10);
  const d = await donneesCompte(s.jeton);
  if (tropDEnvois(d, "profil_investisseur", 10)) return refus("Profil déjà modifié plusieurs fois aujourd’hui. Réessayez demain.", 429);

  const { issue } = await envoyerDuCompte(s, d, "profil_investisseur", {
    achat_en: achatEn,
    societe: achatEn === "societe" ? texte(b.societe, 120) : "",
    siren: achatEn === "societe" ? siren : "",
    immeubles_detenus: entier(b.immeubles_detenus, 0, 9999),
    budget: entier(b.budget, 0, 1_000_000_000),
    apport: entier(b.apport, 0, 1_000_000_000),
    financement: FINANCEMENTS.has(financement) ? financement : "",
    presentation: texte(b.presentation, 3000),
    pieces: [],
  });
  if (issue === "perdu") return refus("Envoi impossible pour le moment. Réessayez.", 503);
  return NextResponse.json({ ok: true });
}
