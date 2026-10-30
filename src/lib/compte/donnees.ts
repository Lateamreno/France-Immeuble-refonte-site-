// Serveur uniquement.
import { cache } from "react";
import { configSitePublique } from "../supabase-site";

/**
 * Lecture des tables du compte (§9.5, §10.4) AVEC LE JETON DE LA PERSONNE :
 * c'est la base, par sa règle d'accès, qui ne rend que les lignes de son
 * compte. Le code ne filtre rien lui-même et ne pourrait pas lire plus.
 */

export type Recherche = {
  cle: string; cible: string | null; departements: string[]; villes: string[];
  prix_min: number | null; prix_max: number | null; rendement_min: number | null;
  destinations: string[]; commentaire: string | null; maj_le: string;
};
export type Proposition = {
  cle: string; bien: string | null; commune: string | null; dept: string | null; type: string | null;
  lots: number | null; prix: number | null; rendement: number | null; propose_le: string | null;
  reponse: "interesse" | "visite" | "pas_pour_moi" | null; repondu_le: string | null;
  etat: "disponible" | "sous_offre" | "vendu" | "retire";
};
export type Demande = {
  cle: string; bien: string | null; titre: string | null;
  etat: "en_attente" | "dossier_envoye" | "close"; demande_le: string | null;
};
export type BienCompte = {
  cle: string; commune: string | null; dept: string | null; type: string | null; lots: number | null;
  etape: string | null; prix: number | null; sollicites: number | null; visites: number | null;
  offres: number | null; bien: string | null;
};
export type Estimation = {
  cle: string; bien_cle: string | null; valeur: number | null; prix_m2: number | null;
  rendement: number | null; estimee_le: string | null;
};
export type Document = {
  cle: string; bien_cle: string | null; categorie: string; nom: string; recu_le: string;
};

/** §12.1 : une offre que l'agent a transmise au vendeur. */
export type Offre = {
  cle: string; bien_cle: string | null; acquereur: string | null; recue_le: string | null;
  valable_jours: number | null; valable_jusqu_au: string | null; prix_hai: number | null;
  net_vendeur: number | null; honoraires: number | null;
  statut: "en_cours" | "contre_offre" | "acceptee" | "refusee" | "compromis" | "vendu";
  document: string | null; transmise_le: string | null;
};
/** §12.2 : une ligne du fil des messages, déposé en entier par le BO. */
export type Message = {
  cle: string; conversation: string; titre: string | null; bien_cle: string | null; pieces: string[];
  de: "client" | "agent"; auteur: string | null; texte: string; envoye_le: string;
};
/** §12.4 : l'agent attitré. `appele` faux : pas encore d'appel, l'off-market reste fermé. */
export type Agent = {
  appele: boolean; agent_nom: string | null; agent_poste: string | null; agent_tel: string | null;
  agent_email: string | null; agent_photo: string | null;
};

/** Ce que le client a envoyé depuis son compte, gardé par le site jusqu'au retour du BO (0012). */
export type Saisie = {
  ref: string; type: "message" | "rendez_vous" | "offre_acquereur" | "profil_investisseur";
  donnees: Record<string, unknown>; envoye_le: string;
};

export type DonneesCompte = {
  recherches: Recherche[];
  propositions: Proposition[];
  demandes: Demande[];
  biens: BienCompte[];
  estimations: Estimation[];
  documents: Document[];
  offres: Offre[];
  messages: Message[];
  agent: Agent | null;
  saisies: Saisie[];
};

async function lire<T>(jeton: string, requete: string): Promise<T[]> {
  const cfg = configSitePublique();
  if (!cfg) return [];
  try {
    const r = await fetch(`${cfg.url}/rest/v1/${requete}`, {
      headers: { apikey: cfg.cle, Authorization: `Bearer ${jeton}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.warn(`[compte] lecture ${requete.split("?")[0]} : ${r.status}`);
      return [];
    }
    return (await r.json()) as T[];
  } catch {
    return [];
  }
}

/**
 * Tout ce que le BO a déposé pour ce compte. Mis en cache le temps d'une
 * requête : le cadre du compte et la page lisent les mêmes données sans
 * interroger la base deux fois.
 */
export const donneesCompte = cache(async (jeton: string): Promise<DonneesCompte> => {
  const [recherches, propositions, demandes, biens, estimations, documents, offres, messages, agents, saisies] = await Promise.all([
    lire<Recherche>(jeton, "compte_recherches?select=*&order=maj_le.desc"),
    lire<Proposition>(jeton, "compte_propositions?select=*&order=propose_le.desc.nullslast"),
    lire<Demande>(jeton, "compte_demandes?select=*&order=demande_le.desc.nullslast"),
    lire<BienCompte>(jeton, "compte_biens?select=*&order=maj_le.desc"),
    lire<Estimation>(jeton, "compte_estimations?select=*&order=estimee_le.desc.nullslast"),
    lire<Document>(jeton, "compte_documents?select=*&order=recu_le.desc"),
    lire<Offre>(jeton, "compte_offres?select=*&order=recue_le.desc.nullslast"),
    lire<Message>(jeton, "compte_messages?select=*&order=envoye_le.asc"),
    lire<Agent>(jeton, "compte_agent?select=*&limit=1"),
    lire<Saisie>(jeton, "compte_saisies?select=ref,type,donnees,envoye_le&order=envoye_le.desc&limit=200"),
  ]);
  return { recherches, propositions, demandes, biens, estimations, documents, offres, messages, agent: agents[0] ?? null, saisies };
});

/** true si la ligne `cle` de `table` appartient au compte du jeton. */
export async function appartient(
  jeton: string,
  table: "compte_recherches" | "compte_propositions" | "compte_biens" | "compte_offres",
  cle: string,
): Promise<boolean> {
  const l = await lire<{ cle: string }>(jeton, `${table}?select=cle&cle=eq.${encodeURIComponent(cle)}&limit=1`);
  return l.length === 1;
}
