"use client";

import { useId, useState } from "react";
import { envoyer } from "./envoyer";

type Onglet = "connexion" | "creation" | "oubli";

const MESSAGES_ETAT: Record<string, string> = {
  verifie: "Votre adresse est vérifiée. Connectez-vous pour ouvrir votre compte.",
  "lien-expire": "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau ci-dessous.",
  ferme: "Votre compte est fermé. Merci de nous avoir fait confiance.",
};

/**
 * Connexion, création de compte et mot de passe oublié (§9.1). Tout passe par
 * nos routes serveur ; le navigateur ne reçoit jamais de jeton.
 */
export function Acces({ etat }: { etat?: string }) {
  const uid = useId();
  const [onglet, setOnglet] = useState<Onglet>(etat === "lien-expire" ? "oubli" : "connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [voir, setVoir] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState<null | "creation" | "oubli">(null);

  async function soumettre(ev: React.FormEvent) {
    ev.preventDefault();
    setErreur("");
    setEnvoi(true);
    const r =
      onglet === "connexion"
        ? await envoyer("/api/compte/connexion/", { email, motDePasse })
        : onglet === "creation"
          ? await envoyer("/api/compte/inscription/", { email, motDePasse, prenom, nom, telephone })
          : await envoyer("/api/compte/mot-de-passe/", { email });
    setEnvoi(false);
    if (!r.ok) return setErreur(r.erreur ?? "");
    if (onglet === "connexion") window.location.assign("/mon-compte/");
    else setFait(onglet);
  }

  if (fait === "creation") {
    return (
      <div className="form-shell outcome">
        <span className="outcome__badge">Compte créé</span>
        <h3>Vérifiez votre boîte e-mail</h3>
        <p>
          Nous venons d’envoyer un lien à <strong>{email}</strong>. Cliquez dessus pour activer
          votre compte. Pensez à regarder dans les courriers indésirables.
        </p>
      </div>
    );
  }
  if (fait === "oubli") {
    return (
      <div className="form-shell outcome">
        <span className="outcome__badge">Lien envoyé</span>
        <h3>Regardez vos e-mails</h3>
        <p>
          Si un compte existe pour <strong>{email}</strong>, un lien pour choisir un nouveau mot de
          passe vient de partir. Il est valable une heure.
        </p>
      </div>
    );
  }

  const ONGLETS: [Onglet, string][] = [
    ["connexion", "Se connecter"],
    ["creation", "Créer un compte"],
  ];

  return (
    <form className="form-shell compte-acces" onSubmit={soumettre} noValidate>
      {etat && MESSAGES_ETAT[etat] && <p className="compte-note">{MESSAGES_ETAT[etat]}</p>}
      {onglet !== "oubli" && (
        <div className="choices compte-onglets" role="tablist">
          {ONGLETS.map(([o, l]) => (
            <button key={o} type="button" role="tab" className="choice" aria-pressed={onglet === o}
              aria-selected={onglet === o} onClick={() => { setOnglet(o); setErreur(""); }}>
              {l}
            </button>
          ))}
        </div>
      )}
      {onglet === "oubli" && (
        <div className="step-head">
          <h3>Mot de passe oublié</h3>
          <p>Indiquez votre e-mail : nous vous envoyons un lien pour en choisir un nouveau.</p>
        </div>
      )}

      <div className="fields">
        {onglet === "creation" && (
          <div className="fields fields--2">
            <div className="field">
              <label htmlFor={`${uid}-prenom`}>Prénom</label>
              <input id={`${uid}-prenom`} value={prenom} autoComplete="given-name" required
                onChange={(e) => setPrenom(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor={`${uid}-nom`}>Nom</label>
              <input id={`${uid}-nom`} value={nom} autoComplete="family-name" required
                onChange={(e) => setNom(e.target.value)} />
            </div>
            <div className="field field--full">
              <label htmlFor={`${uid}-tel`}>Téléphone</label>
              <input id={`${uid}-tel`} type="tel" inputMode="tel" value={telephone} autoComplete="tel"
                onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" />
            </div>
          </div>
        )}
        <div className="field">
          <label htmlFor={`${uid}-email`}>E-mail</label>
          <input id={`${uid}-email`} type="email" value={email} autoComplete="email" required
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        {onglet !== "oubli" && (
          <div className="field">
            <label htmlFor={`${uid}-mdp`}>Mot de passe</label>
            <input id={`${uid}-mdp`} type={voir ? "text" : "password"} value={motDePasse} required
              autoComplete={onglet === "creation" ? "new-password" : "current-password"}
              minLength={8} onChange={(e) => setMotDePasse(e.target.value)} />
            <span className="hint">
              <button type="button" className="lien-discret" onClick={() => setVoir((v) => !v)}>
                {voir ? "Masquer" : "Afficher"} le mot de passe
              </button>
              {onglet === "creation" && " · 8 caractères au moins."}
            </span>
          </div>
        )}
      </div>

      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}

      <div className="field-nav">
        <button type="submit" className="btn btn--primary" disabled={envoi}>
          {envoi ? "Un instant…" : onglet === "connexion" ? "Me connecter" : onglet === "creation" ? "Créer mon compte" : "Recevoir le lien"}
        </button>
      </div>
      <p className="compte-liens">
        {onglet === "connexion" && (
          <button type="button" className="lien-discret" onClick={() => { setOnglet("oubli"); setErreur(""); }}>
            Mot de passe oublié ?
          </button>
        )}
        {onglet === "oubli" && (
          <button type="button" className="lien-discret" onClick={() => { setOnglet("connexion"); setErreur(""); }}>
            Retour à la connexion
          </button>
        )}
      </p>
      {onglet === "creation" && (
        <p className="form-note">
          Votre compte reste privé. Nous ne vous écrivons que lorsqu’un agent a un immeuble ou une
          estimation à vous envoyer, jamais de lettre d’information.
        </p>
      )}
    </form>
  );
}
