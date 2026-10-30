import type { DonneesCompte } from "./donnees";
import { conversations } from "./messagerie";

/** Vendeur s'il a un immeuble ou une estimation ; acheteur s'il cherche, ou s'il n'est pas vendeur. */
export function profils(d: DonneesCompte) {
  const vendeur = d.biens.length > 0 || d.estimations.length > 0;
  const acheteur = d.recherches.length > 0 || d.propositions.length > 0 || d.demandes.length > 0 || !vendeur;
  return { vendeur, acheteur };
}

/** Les biens proposés auxquels le client n'a pas encore répondu. */
export const nouveauxBiens = (d: DonneesCompte) =>
  d.propositions.filter((p) => !p.reponse && (p.etat === "disponible" || p.etat === "sous_offre")).length;

/** Les conversations dont le dernier message vient de l'agent. */
export const conversationsEnAttente = (d: DonneesCompte) => conversations(d).filter((c) => c.aLire).length;

/** Les offres reçues encore à l'étude : le vendeur a une décision à prendre. */
export const offresAEtudier = (d: DonneesCompte) =>
  d.offres.filter((o) => o.statut === "en_cours" || o.statut === "contre_offre").length;
