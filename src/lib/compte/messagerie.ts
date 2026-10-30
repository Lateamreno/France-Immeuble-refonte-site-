import type { DonneesCompte, Message } from "./donnees";

/**
 * Les conversations du compte (MAV, 30/10/2026 : plusieurs conversations
 * nommées, rattachables à un immeuble). Le fil déposé par le BO fait foi ; un
 * message que le client vient d'envoyer et que le BO n'a pas encore redéposé
 * s'affiche « en cours d'envoi » depuis la copie du site (contrat §12.2).
 */

export type LigneFil = Pick<Message, "de" | "auteur" | "texte" | "envoye_le"> & { cle: string; enCours?: boolean };

export type Conversation = {
  id: string;
  titre: string;
  bien_cle: string | null;
  proposition: string | null;
  fil: LigneFil[];
  dernier: LigneFil;
  /** Le dernier mot est à l'agent : le client a une réponse à lire. */
  aLire: boolean;
};

const TITRE_PAR_DEFAUT = "Conversation avec l’agence";

const meme = (a: string, b: string) => a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();

export function conversations(d: DonneesCompte): Conversation[] {
  const parId = new Map<string, Conversation>();
  const ouvrir = (id: string, titre: string | null, bien: string | null, proposition: string | null) => {
    let c = parId.get(id);
    if (!c) {
      c = { id, titre: titre || TITRE_PAR_DEFAUT, bien_cle: bien, proposition, fil: [], dernier: null as unknown as LigneFil, aLire: false };
      parId.set(id, c);
    }
    if (titre && c.titre === TITRE_PAR_DEFAUT) c.titre = titre;
    if (bien && !c.bien_cle) c.bien_cle = bien;
    return c;
  };

  for (const m of d.messages) {
    ouvrir(m.conversation, m.titre, m.bien_cle, null).fil.push({ cle: m.cle, de: m.de, auteur: m.auteur, texte: m.texte, envoye_le: m.envoye_le });
  }
  for (const s of d.saisies) {
    if (s.type !== "message") continue;
    const x = s.donnees as { conversation?: string; titre?: string; texte?: string; bien?: string; proposition?: string };
    if (!x.conversation || !x.texte) continue;
    const c = ouvrir(x.conversation, x.titre ?? null, x.bien ?? null, x.proposition ?? null);
    if (x.proposition && !c.proposition) c.proposition = x.proposition;
    const revenu = c.fil.some((l) => l.de === "client" && !l.enCours && meme(l.texte, x.texte!) &&
      new Date(l.envoye_le).getTime() >= new Date(s.envoye_le).getTime() - 120_000);
    if (!revenu) c.fil.push({ cle: s.ref, de: "client", auteur: null, texte: x.texte, envoye_le: s.envoye_le, enCours: true });
  }

  const liste = [...parId.values()];
  for (const c of liste) {
    c.fil.sort((a, b) => a.envoye_le.localeCompare(b.envoye_le));
    c.dernier = c.fil[c.fil.length - 1];
    c.aLire = c.dernier.de === "agent";
  }
  return liste.sort((a, b) => b.dernier.envoye_le.localeCompare(a.dernier.envoye_le));
}

/** Une demande d'appel part comme un message : elle entre dans les questions de l'agent dès aujourd'hui. */
export const TITRE_APPEL = "Demande d’appel";
