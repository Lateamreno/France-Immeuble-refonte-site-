import { NextResponse } from "next/server";
import { donneesCompte } from "@/lib/compte/donnees";
import { conversations } from "@/lib/compte/messagerie";
import { envoyerDuCompte, tropDEnvois } from "@/lib/compte/envois";
import { copieDuMessage } from "@/lib/compte/courriels";
import { envoyerAuClient } from "@/lib/notifications";
import { exigerCompte, lireJson, refus, texte, UUID } from "@/lib/compte/requete";
import { effacerObjets, extension, FORMATS, objetExiste } from "@/lib/compte/stockage";

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

  // Les pièces jointes ont été posées par /api/compte/document/fin/ (pour: message),
  // sous le dossier de CE compte. Un chemin d'ailleurs, ou absent du seau, est refusé.
  const brutes = Array.isArray(b.pieces) ? b.pieces.slice(0, 6) : [];
  if (brutes.length > 5) return refus("Cinq pièces au plus par message.", 422);
  const motif = new RegExp(`^${s.utilisateur.id}/[0-9a-f-]{36}-[a-z0-9-]+\\.([a-z0-9]{2,5})$`);
  const pieces: { chemin: string; nom: string }[] = [];
  for (const x of brutes as Record<string, unknown>[]) {
    const chemin = texte(x?.chemin, 300);
    if (!motif.test(chemin) || !FORMATS[extension(chemin)] || !(await objetExiste(chemin))) {
      return refus("Une pièce jointe est introuvable. Joignez-la de nouveau.", 422);
    }
    pieces.push({ chemin, nom: texte(x?.nom, 120) || chemin.split("/").pop()! });
  }

  const historique = (existante?.fil ?? []).map((l) => ({ de: l.de, auteur: l.auteur, texte: l.texte, envoye_le: l.envoye_le }));
  const { issue } = await envoyerDuCompte(s, d, "message", {
    conversation,
    titre,
    texte: message,
    ...(bien ? { bien } : {}),
    ...(proposition ? { proposition } : {}),
    pieces,
  }, { historique });
  if (issue === "perdu") {
    await effacerObjets(pieces.map((x) => x.chemin));
    return refus("Envoi impossible pour le moment. Réessayez.", 503);
  }

  const c = copieDuMessage(titre, [...historique, {
    de: "client", auteur: null, envoye_le: new Date().toISOString(),
    texte: pieces.length ? `${message}\n\nPièces jointes : ${pieces.map((x) => x.nom).join(", ")}` : message,
  }], conversation);
  await envoyerAuClient({ a: s.utilisateur.email, sujet: c.sujet, html: c.html, text: c.text });
  return NextResponse.json({ ok: true, conversation });
}
