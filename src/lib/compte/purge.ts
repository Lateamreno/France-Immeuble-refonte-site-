// Serveur uniquement : clé secrète du site.
import { listerUtilisateurs, supprimerUtilisateur, type UtilisateurAdmin } from "./auth";

/**
 * Les comptes vendeurs jamais ouverts disparaissent au bout de 30 jours
 * (MAV, 27/10/2026).
 *
 * Un compte est créé pour le vendeur après son estimation (`accueil.ts`).
 * S'il n'a jamais suivi le lien de l'e-mail, ce compte n'a servi à rien et
 * n'a jamais été rattaché au BO : on le supprime, sans rien dire à personne.
 *
 * Ne sont jamais touchés :
 *  - les comptes créés par le visiteur lui-même (acquéreurs surtout) : MAV
 *    tient à leur laisser leur compte ;
 *  - un compte vendeur ouvert une seule fois.
 */

const DELAI = 30 * 24 * 60 * 60 * 1000;

export function aPurger(u: UtilisateurAdmin, maintenant = Date.now()): boolean {
  if (u.app_metadata?.origine !== "estimation") return false;
  if (u.email_confirmed_at || u.last_sign_in_at) return false;
  const cree = u.created_at ? new Date(u.created_at).getTime() : NaN;
  return Number.isFinite(cree) && maintenant - cree > DELAI;
}

/** Renvoie le nombre de comptes supprimés. */
export async function purgerComptesInutilises(): Promise<number> {
  const cibles: string[] = [];
  for (let page = 1; page <= 50; page++) {
    const lot = await listerUtilisateurs(page);
    cibles.push(...lot.filter((u) => aPurger(u)).map((u) => u.id));
    if (lot.length < 200) break;
  }
  let n = 0;
  for (const id of cibles) {
    try {
      await supprimerUtilisateur(id);
      n++;
    } catch (e) {
      console.error("[compte] suppression impossible —", e instanceof Error ? e.message : e);
    }
  }
  return n;
}
