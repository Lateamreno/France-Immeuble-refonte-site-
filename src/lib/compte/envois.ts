// Serveur uniquement.
import { after } from "next/server";
import { deposerLead, type Issue } from "../leads";
import type { OptionsAlerte } from "../notifications";
import type { Connecte } from "./auth";
import type { DonneesCompte } from "./donnees";
import { contexteDe } from "./requete";
import { noterSaisie, type TypeSaisie } from "./saisies";
import { aviserClients } from "./avis";

/**
 * Tout ce que le client saisit dans son compte part au BO (règle du 30/10,
 * contrat §11) : le lead d'abord, puis la copie gardée pour l'affichage.
 * L'alerte de l'agence met en copie l'agent attitré quand il est connu.
 */
export async function envoyerDuCompte(
  s: Connecte,
  d: DonneesCompte,
  type: TypeSaisie,
  champs: Record<string, unknown>,
  { historique }: { historique?: OptionsAlerte["historique"] } = {},
): Promise<{ ref: string; issue: Issue }> {
  const ref = crypto.randomUUID();
  const lead = { type, ref, compte: s.utilisateur.id, ...champs };
  const copie = d.agent?.appele && d.agent.agent_email ? [d.agent.agent_email] : [];
  const issue = await deposerLead(lead, { contexte: contexteDe(s.utilisateur), alerte: { copie, historique, agentAuLieuDeContact: type === "rendez_vous" } });
  if (issue !== "perdu") await noterSaisie(s.utilisateur.id, ref, type, champs);
  // Au passage, les réponses de l'agent déjà déposées sont annoncées aux clients.
  after(() => aviserClients().catch((e) => console.error("[avis]", e)));
  return { ref, issue };
}

/** Trop d'envois du même type en peu de temps : un compte volé ne doit pas inonder l'agence. */
export function tropDEnvois(d: DonneesCompte, type: TypeSaisie, max: number, heures = 24, filtre?: (x: Record<string, unknown>) => boolean) {
  const depuis = Date.now() - heures * 3600_000;
  return d.saisies.filter((x) => x.type === type && new Date(x.envoye_le).getTime() > depuis && (!filtre || filtre(x.donnees))).length >= max;
}

export const entier = (v: unknown, min: number, max: number): number | null => {
  const n = Number(String(v ?? "").replace(/[^\d]/g, ""));
  return String(v ?? "").trim() !== "" && Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null;
};
