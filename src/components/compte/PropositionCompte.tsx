"use client";

import { ouvrirCompte } from "@/components/biens/etat";

/**
 * Après un formulaire (recherche, demande de dossier, estimation), le compte
 * est proposé, jamais imposé (§9.1). Il s'ouvre dans la fenêtre de compte,
 * sans quitter la page (retour #108).
 */
export function PropositionCompte({ texte }: { texte: string }) {
  return (
    <p className="form-note">
      {texte}{" "}
      <button type="button" className="lien-discret" onClick={() => ouvrirCompte({ onglet: "creation" })}>Créer mon compte ou me connecter</button>
    </p>
  );
}
