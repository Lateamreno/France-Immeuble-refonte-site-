"use client";

import { useId, useState } from "react";
import { envoyer } from "./envoyer";

/** Bouton de déconnexion. */
export function Deconnexion() {
  const [envoi, setEnvoi] = useState(false);
  return (
    <button type="button" className="lien-discret" disabled={envoi}
      onClick={async () => {
        setEnvoi(true);
        await envoyer("/api/compte/deconnexion/", {});
        window.location.assign("/mon-compte/");
      }}>
      Me déconnecter
    </button>
  );
}

/** Nouveau mot de passe, après le lien reçu par e-mail. */
export function NouveauMotDePasse() {
  const uid = useId();
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState(false);
  if (fait) {
    return (
      <div className="form-shell outcome">
        <span className="outcome__badge">C’est fait</span>
        <h3>Votre mot de passe est changé</h3>
        <div className="btn-row"><a className="btn btn--primary" href="/mon-compte/">Ouvrir mon compte</a></div>
      </div>
    );
  }
  return (
    <form className="form-shell" noValidate onSubmit={async (e) => {
      e.preventDefault();
      setEnvoi(true);
      const r = await envoyer("/api/compte/nouveau-mot-de-passe/", { motDePasse: mdp });
      setEnvoi(false);
      if (r.ok) setFait(true); else setErreur(r.erreur ?? "");
    }}>
      <div className="step-head"><h3>Choisissez un nouveau mot de passe</h3></div>
      <div className="field">
        <label htmlFor={`${uid}-mdp`}>Nouveau mot de passe</label>
        <input id={`${uid}-mdp`} type="password" autoComplete="new-password" minLength={8}
          value={mdp} onChange={(e) => setMdp(e.target.value)} />
        <span className="hint">8 caractères au moins.</span>
      </div>
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
      <div className="field-nav">
        <button type="submit" className="btn btn--primary" disabled={envoi}>
          {envoi ? "Un instant…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

const LIBELLES_REPONSE = {
  interesse: "Intéressé",
  visite: "Demander une visite",
  pas_pour_moi: "Pas pour moi",
} as const;
type Rep = keyof typeof LIBELLES_REPONSE;

/** Les trois réponses à un bien proposé (§9.2). */
export function ReponseProposition({ cle, actuelle }: { cle: string; actuelle: Rep | null }) {
  const uid = useId();
  const [choix, setChoix] = useState<Rep | null>(null);
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [faite, setFaite] = useState<Rep | null>(actuelle);
  const [erreur, setErreur] = useState("");

  if (faite && !choix) {
    return (
      <p className="compte-reponse">
        Votre réponse : <strong>{LIBELLES_REPONSE[faite]}</strong>
        {" · "}
        <button type="button" className="lien-discret" onClick={() => setChoix(faite)}>changer</button>
      </p>
    );
  }
  return (
    <div className="compte-reponses">
      <div className="choices">
        {(Object.keys(LIBELLES_REPONSE) as Rep[]).map((r) => (
          <button key={r} type="button" className="choice" aria-pressed={choix === r} onClick={() => setChoix(r)}>
            {LIBELLES_REPONSE[r]}
          </button>
        ))}
      </div>
      {choix && (
        <form className="compte-reponses__form" onSubmit={async (e) => {
          e.preventDefault();
          setEnvoi(true);
          const r = await envoyer("/api/compte/reponse/", { proposition: cle, reponse: choix, message });
          setEnvoi(false);
          if (r.ok) { setFaite(choix); setChoix(null); setErreur(""); } else setErreur(r.erreur ?? "");
        }}>
          <div className="field">
            <label htmlFor={`${uid}-msg`}>Un mot pour l’agent (facultatif)</label>
            <textarea id={`${uid}-msg`} rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
          <div className="field-nav">
            <button type="submit" className="btn btn--primary" disabled={envoi}>
              {envoi ? "Envoi…" : `Envoyer « ${LIBELLES_REPONSE[choix]} »`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/** « Proposer mon prix » sur un de ses immeubles (§9.3). */
export function ProposerPrix({ bien }: { bien: string }) {
  const uid = useId();
  const [ouvert, setOuvert] = useState(false);
  const [prix, setPrix] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState(false);
  const [erreur, setErreur] = useState("");
  if (fait) return <p className="compte-reponse">Votre prix est transmis à l’agent de cet immeuble.</p>;
  if (!ouvert) {
    return <button type="button" className="lien-discret" onClick={() => setOuvert(true)}>Proposer mon prix</button>;
  }
  return (
    <form className="compte-reponses__form" onSubmit={async (e) => {
      e.preventDefault();
      setEnvoi(true);
      const r = await envoyer("/api/compte/prix/", { bien, prix, message });
      setEnvoi(false);
      if (r.ok) setFait(true); else setErreur(r.erreur ?? "");
    }}>
      <div className="fields fields--2">
        <div className="field">
          <label htmlFor={`${uid}-prix`}>Votre prix (€)</label>
          <input id={`${uid}-prix`} inputMode="numeric" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="2 400 000" />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-msg`}>Un mot (facultatif)</label>
          <input id={`${uid}-msg`} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
      </div>
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
      <div className="field-nav">
        <button type="submit" className="btn btn--primary" disabled={envoi}>{envoi ? "Envoi…" : "Envoyer mon prix"}</button>
      </div>
    </form>
  );
}

/** Fermeture du compte, avec confirmation tapée (§9.1). */
export function FermerCompte() {
  const uid = useId();
  const [saisie, setSaisie] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  return (
    <details className="compte-fermer">
      <summary>Fermer mon compte</summary>
      <p>
        Vos recherches, les biens proposés et vos pièces disparaissent du site. Votre agent garde
        votre fiche ; pour un effacement complet, écrivez-nous.
      </p>
      <div className="field">
        <label htmlFor={`${uid}-conf`}>Tapez FERMER pour confirmer</label>
        <input id={`${uid}-conf`} value={saisie} onChange={(e) => setSaisie(e.target.value)} autoComplete="off" />
      </div>
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
      <div className="field-nav">
        <button type="button" className="btn btn--primary" disabled={envoi || saisie !== "FERMER"}
          onClick={async () => {
            setEnvoi(true);
            const r = await envoyer("/api/compte/supprimer/", { confirmation: saisie });
            setEnvoi(false);
            if (r.ok) window.location.assign("/mon-compte/?etat=ferme"); else setErreur(r.erreur ?? "");
          }}>
          {envoi ? "Fermeture…" : "Fermer définitivement"}
        </button>
      </div>
    </details>
  );
}
