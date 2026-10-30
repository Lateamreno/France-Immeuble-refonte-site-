import { NextResponse } from "next/server";
import { donneesCompte } from "@/lib/compte/donnees";
import { conversations } from "@/lib/compte/messagerie";
import { envoyerDuCompte, tropDEnvois } from "@/lib/compte/envois";
import { copieDuMessage } from "@/lib/compte/courriels";
import { envoyerAuClient } from "@/lib/notifications";
import { exigerCompte, lireJson, refus, texte, UUID } from "@/lib/compte/requete";

export const runtime = "nodejs";

/**
 * Un message à l'agence depuis le compte (contrat §12.3, type `message`).
 * Sans `conversation`, il en ouvre une nouvelle, avec son titre. L'agence et
 * le client reçoivent chacun un e-mail avec l'historique (MAV, 30/10/2026).
 */
export async function POST(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const b = await lireJson(req);
  if (!b) return refus("Requête illisible.");

  const message = texte(b.texte, 5000);
  if (message.length < 2) return refus("Écrivez votre message.", 422);
  const d = await donneesCompte(s.jeton);
  if (tropDEnvois(d, "message", 20, 1)) return refus("Beaucoup de messages en peu de temps. Réessayez dans un moment.", 429);

  const toutes = conversations(d);
  const demandee = texte(b.conversation, 36);
  let conversation: string;
  let titre: string;
  let bien = texte(b.bien, 36);
  let proposition = texte(b.proposition, 36);
  const existante = demandee ? toutes.find((c) => c.id === demandee) : undefined;
  if (demandee) {
    if (!UUID.test(demandee) || !existante) return refus("Conversation introuvable.", 404);
    conversation = existante.id;
    titre = existante.titre;
    bien ||= existante.bien_cle ?? "";
    proposition ||= existante.proposition ?? "";
  } else {
    conversation = crypto.randomUUID();
    titre = texte(b.titre, 120) || "Conversation avec l’agence";
  }
  // Le bien dont parle le client doit être le sien (le BO le revérifie, 422 sinon).
  if (bien && (!UUID.test(bien) || !d.biens.some((x) => x.cle === bien))) return refus("Immeuble introuvable.", 404);
  if (proposition && (!UUID.test(proposition) || !d.propositions.some((x) => x.cle === proposition))) {
    return refus("Ce bien ne vous a pas été proposé.", 404);
  }

  const historique = (existante?.fil ?? []).map((l) => ({ de: l.de, auteur: l.auteur, texte: l.texte, envoye_le: l.envoye_le }));
  const { issue } = await envoyerDuCompte(s, d, "message", {
    conversation,
    titre,
    texte: message,
    ...(bien ? { bien } : {}),
    ...(proposition ? { proposition } : {}),
    pieces: [],
  }, { historique });
  if (issue === "perdu") return refus("Envoi impossible pour le moment. Réessayez.", 503);

  const c = copieDuMessage(titre, [...historique, { de: "client", auteur: null, texte: message, envoye_le: new Date().toISOString() }], conversation);
  await envoyerAuClient({ a: s.utilisateur.email, sujet: c.sujet, html: c.html, text: c.text });
  return NextResponse.json({ ok: true, conversation });
}
