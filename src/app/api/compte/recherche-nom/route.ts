import { NextResponse } from "next/server";
import { uuidDe } from "@/lib/compte/auth";
import { appartient } from "@/lib/compte/donnees";
import { erreurEnReponse, exigerCompte, lireJson, refus, texte, UUID } from "@/lib/compte/requete";
import { fusionnerSaisie } from "@/lib/compte/saisies";
import { deposerLead } from "@/lib/leads";

export const runtime = "nodejs";

/**
 * Renommer une recherche (retour #271, MAV, 05/11/2026). Le nom part au BO
 * (`recherche_nom`, sans e-mail à l'agence : ce n'est pas une demande) et le
 * site en garde la copie pour l'afficher tout de suite. Un nom vide rend à la
 * recherche son titre d'origine.
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  const cle = texte(b?.cle, 36);
  const nom = texte(b?.nom, 60).replace(/\s+/g, " ");
  if (!UUID.test(cle)) return refus("Recherche introuvable.", 404);
  try {
    if (!(await appartient(s.jeton, "compte_recherches", cle))) return refus("Recherche introuvable.", 404);
    const ref = uuidDe(`nom-recherche|${s.utilisateur.id}|${cle}`);
    const issue = await deposerLead(
      { type: "recherche_nom", ref: crypto.randomUUID(), compte: s.utilisateur.id, cle, nom },
      { silencieux: true },
    );
    if (issue === "perdu") return refus("Le nom n’a pas pu être enregistré. Réessayez.", 503);
    await fusionnerSaisie(s.utilisateur.id, ref, "nom_recherche", { cle, nom });
    return NextResponse.json({ ok: true, nom });
  } catch (e) {
    return erreurEnReponse(e);
  }
}
