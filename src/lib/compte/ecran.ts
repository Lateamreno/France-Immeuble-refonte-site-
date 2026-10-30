// Serveur uniquement.
import { redirect } from "next/navigation";
import { sessionCourante } from "./auth";
import { donneesCompte, type DonneesCompte, type Proposition } from "./donnees";
import { euros, nomImmeuble } from "./vente";

/** Un écran du compte : connecté, ou renvoyé à la connexion. */
export async function ecranCompte() {
  const s = await sessionCourante();
  if (!s) redirect("/mon-compte/");
  const d = await donneesCompte(s.jeton);
  return { s, d };
}

export const nomProposition = (p: Pick<Proposition, "commune" | "dept" | "type" | "lots">) =>
  [p.type ?? "Immeuble", nomImmeuble(p), p.lots ? `${p.lots} lots` : null].filter(Boolean).join(" · ");

/** Les immeubles du client, pour les listes « à propos de » des formulaires. */
export function choixImmeubles(d: DonneesCompte) {
  return {
    biens: d.biens.map((b) => ({ cle: b.cle, nom: nomImmeuble(b) })),
    propositions: d.propositions
      .filter((p) => p.etat !== "retire")
      .map((p) => ({ cle: p.cle, nom: [nomProposition(p), euros(p.prix)].filter(Boolean).join(" · ") })),
  };
}

/** Le nom de l'immeuble dont parle une conversation ou une demande. */
export function sujetDe(d: DonneesCompte, bien: string | null | undefined, proposition: string | null | undefined): string | null {
  const b = bien ? d.biens.find((x) => x.cle === bien) : undefined;
  if (b) return nomImmeuble(b);
  const p = proposition ? d.propositions.find((x) => x.cle === proposition) : undefined;
  return p ? nomProposition(p) : null;
}
