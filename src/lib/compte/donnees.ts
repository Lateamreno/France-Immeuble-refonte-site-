// Serveur uniquement.
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

export type DonneesCompte = {
  recherches: Recherche[];
  propositions: Proposition[];
  demandes: Demande[];
  biens: BienCompte[];
  estimations: Estimation[];
  documents: Document[];
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

export async function donneesCompte(jeton: string): Promise<DonneesCompte> {
  const [recherches, propositions, demandes, biens, estimations, documents] = await Promise.all([
    lire<Recherche>(jeton, "compte_recherches?select=*&order=maj_le.desc"),
    lire<Proposition>(jeton, "compte_propositions?select=*&order=propose_le.desc.nullslast"),
    lire<Demande>(jeton, "compte_demandes?select=*&order=demande_le.desc.nullslast"),
    lire<BienCompte>(jeton, "compte_biens?select=*&order=maj_le.desc"),
    lire<Estimation>(jeton, "compte_estimations?select=*&order=estimee_le.desc.nullslast"),
    lire<Document>(jeton, "compte_documents?select=*&order=recu_le.desc"),
  ]);
  return { recherches, propositions, demandes, biens, estimations, documents };
}

/** true si la ligne `cle` de `table` appartient au compte du jeton. */
export async function appartient(
  jeton: string,
  table: "compte_recherches" | "compte_propositions" | "compte_biens",
  cle: string,
): Promise<boolean> {
  const l = await lire<{ cle: string }>(jeton, `${table}?select=cle&cle=eq.${encodeURIComponent(cle)}&limit=1`);
  return l.length === 1;
}
