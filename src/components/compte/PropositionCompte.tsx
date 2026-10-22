/**
 * Après un formulaire (recherche, demande de dossier, estimation), le compte
 * est proposé, jamais imposé (§9.1). Connecté, le lien ouvre simplement le
 * compte, où la demande apparaît.
 */
export function PropositionCompte({ texte }: { texte: string }) {
  return (
    <p className="form-note">
      {texte} <a className="lien-discret" href="/mon-compte/">Créer mon compte ou me connecter</a>
    </p>
  );
}
