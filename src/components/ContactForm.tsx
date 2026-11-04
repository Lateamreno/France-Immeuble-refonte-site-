"use client";

import { useId, useState } from "react";
import { SITE } from "@/lib/site";
import { PropositionCompte } from "./compte/PropositionCompte";
import { EstimationForm } from "./EstimationForm";
import { RechercheForm } from "./RechercheForm";

/**
 * Formulaire de contact — repris du WordPress.
 *
 * Champs et libellés identiques à l'original (téléphone, projet, message), y
 * compris les trois intitulés du menu déroulant, repris au mot près.
 *
 * L'original découpait la saisie en deux écrans : le téléphone d'abord, le
 * projet et le message ensuite. On garde les mêmes champs sur UN seul écran,
 * conformément à la règle retenue pour le tunnel d'estimation : le visiteur ne
 * doit jamais voir d'étapes.
 */
const PROJETS = [
  "Je souhaite acheter un immeuble",
  "Je souhaite vendre un immeuble",
  "Autre",
] as const;
/** Retour #71 (MAV, 02/11/2026) : acheter, vendre ou autre. Vendre ouvre le formulaire de vente. */
export const PROJET_VENDRE = PROJETS[1];
const PROJET_ACHETER = PROJETS[0];

/**
 * `bien` : posé depuis une fiche « à vendre ». Le projet est pré-rempli et la
 * référence du bien part avec le lead — l'agent sait de quel immeuble on parle
 * sans avoir à le demander. Le BO rattache la demande à la fiche immeuble et au
 * contact : il lui faut donc prénom, nom et e-mail en plus du téléphone
 * (contrat BO du 21/10/2026). Le formulaire général, repris du WordPress, garde
 * ses trois champs.
 */
export function ContactForm({ bien, onVendre }: {
  bien?: { ref: string; titre: string };
  /** Page Contact : choisir « vendre » remplace ce formulaire par celui de la vente. */
  onVendre?: () => void;
} = {}) {
  const uid = useId();
  const [telephone, setTelephone] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [projet, setProjet] = useState<string>(bien ? PROJETS[0] : "");
  const [message, setMessage] = useState("");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState<null | "ok" | "echec">(null);
  /** La référence du message : la recherche ou l'estimation qui suit la reprend, le BO les regroupe. */
  const [refMessage, setRefMessage] = useState("");

  async function envoyer(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    // L'original imposait exactement 10 chiffres : on garde la règle.
    if (!/^\d{10}$/.test(telephone.replace(/\D/g, ""))) {
      e.telephone = "Veuillez entrer un numéro de téléphone à 10 chiffres.";
    }
    if (!projet) e.projet = "Veuillez sélectionner une option.";
    // Prénom, nom et e-mail sur tous les formulaires (retour #120, MAV, 03/11/2026) :
    // le message se prolonge en estimation ou en recherche, déjà remplie.
    if (!prenom.trim()) e.prenom = "Requis.";
    if (!nom.trim()) e.nom = "Requis.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "E-mail invalide.";
    setErreurs(e);
    if (Object.keys(e).length > 0) return;

    setEnvoi(true);
    let ok = false;
    const ref = globalThis.crypto?.randomUUID?.() ?? `fi-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setRefMessage(ref);
    try {
      const r = await fetch("/api/lead/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          ref,
          telephone,
          projet,
          message,
          prenom: prenom.trim(),
          nom: nom.trim(),
          email: email.trim(),
          ...(bien ? { bien: bien.ref, bienTitre: bien.titre } : {}),
        }),
      });
      ok = r.ok;
    } catch {
      ok = false;
    }
    if (ok) {
      type DL = { push: (o: Record<string, unknown>) => void };
      (window as unknown as { dataLayer?: DL }).dataLayer?.push({ event: "form_submit_contact" });
    }
    setEnvoi(false);
    setEnvoye(ok ? "ok" : "echec");
  }

  /* Ni le BO ni la file d'attente n'ont pu garder le message : on le dit, et
     on donne le numéro, plutôt que de laisser croire qu'il est parti. */
  if (envoye === "echec") {
    return (
      <div className="form-shell outcome">
        <span className="outcome__badge outcome__badge--autre">Envoi impossible</span>
        <h3>Votre message n’a pas pu partir</h3>
        <p>Un incident technique nous empêche de l’enregistrer. Appelez-nous directement.</p>
        <div className="btn-row">
          <a className="btn btn--primary" href={SITE.telHref}>
            Appeler · {SITE.tel}
          </a>
        </div>
      </div>
    );
  }

  if (envoye === "ok" && bien) {
    return (
      <div className="form-shell outcome">
        <span className="outcome__badge">Demande envoyée</span>
        {/* Texte fixé par le contrat BO du 21/10/2026, au mot près. */}
        <h3>Merci. L’agent en charge de ce bien vous appelle pour en parler avant de vous envoyer le dossier.</h3>
        <div className="btn-row">
          <a className="btn btn--outline" href={SITE.telHref}>
            Nous joindre directement · {SITE.tel}
          </a>
        </div>
        <PropositionCompte texte="Suivez votre demande de dossier dans votre compte." />
      </div>
    );
  }

  /* Retour #120 (MAV, 03/11/2026) : le message parti, le formulaire se
     prolonge. Un acheteur précise sa recherche, un vendeur lance l'estimation,
     avec les coordonnées et le message déjà saisis. S'il s'arrête là, l'agence
     a quand même reçu son message. */
  if (envoye === "ok" && projet === PROJET_ACHETER) {
    return (
      <div className="contact-suite">
        <span className="outcome__badge">Message envoyé</span>
        <h3>Précisez votre recherche</h3>
        <p className="contact-suite__intro">
          Vos coordonnées sont reprises. Décrivez ce que vous cherchez pour recevoir en avant-première
          les immeubles qui y correspondent.
        </p>
        <RechercheForm contact={{ prenom: prenom.trim(), nom: nom.trim(), email: email.trim(), telephone }} commentaire={message} refContact={refMessage} />
      </div>
    );
  }
  if (envoye === "ok" && projet === PROJET_VENDRE) {
    return (
      <div className="contact-suite">
        <span className="outcome__badge">Message envoyé</span>
        <h3>Lancez l’estimation de votre immeuble</h3>
        <p className="contact-suite__intro">
          Vos coordonnées sont reprises. Il ne manque que l’adresse de l’immeuble.
        </p>
        <EstimationForm formulaire="vendre"
          initial={{ prenom: prenom.trim(), nom: nom.trim(), email: email.trim(), telephone, message }} refContact={refMessage} />
      </div>
    );
  }

  if (envoye === "ok") {
    return (
      <div className="form-shell outcome">
        <span className="outcome__badge">Message envoyé</span>
        {/* Message de succès repris mot pour mot de l'original. */}
        <h3>Nous vous remercions pour votre message</h3>
        <p>Nous vous rappelons au plus vite.</p>
        <div className="btn-row">
          <a className="btn btn--outline" href={SITE.telHref}>
            Nous joindre directement · {SITE.tel}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="form-shell" onSubmit={envoyer} noValidate>
      <div className="fields">
        <div className="fields fields--2">
            <div className="field">
              <label htmlFor={`${uid}-prenom`}>Prénom</label>
              <input id={`${uid}-prenom`} value={prenom} autoComplete="given-name"
                onChange={(e) => { setPrenom(e.target.value); setErreurs((p) => ({ ...p, prenom: "" })); }} />
              {erreurs.prenom && <span className="err">{erreurs.prenom}</span>}
            </div>
            <div className="field">
              <label htmlFor={`${uid}-nom`}>Nom</label>
              <input id={`${uid}-nom`} value={nom} autoComplete="family-name"
                onChange={(e) => { setNom(e.target.value); setErreurs((p) => ({ ...p, nom: "" })); }} />
              {erreurs.nom && <span className="err">{erreurs.nom}</span>}
            </div>
            <div className="field field--full">
              <label htmlFor={`${uid}-email`}>E-mail</label>
              <input id={`${uid}-email`} type="email" value={email} autoComplete="email"
                onChange={(e) => { setEmail(e.target.value); setErreurs((p) => ({ ...p, email: "" })); }} />
              {erreurs.email && <span className="err">{erreurs.email}</span>}
            </div>
          </div>
        <div className="field">
          <label htmlFor={`${uid}-tel`}>Entrez votre numéro de téléphone</label>
          <input
            id={`${uid}-tel`}
            type="tel"
            value={telephone}
            onChange={(e) => {
              setTelephone(e.target.value);
              setErreurs((p) => ({ ...p, telephone: "" }));
            }}
            inputMode="tel"
            autoComplete="tel"
            placeholder="06 12 34 56 78"
          />
          {erreurs.telephone && <span className="err">{erreurs.telephone}</span>}
        </div>

        <div className="field">
          <label htmlFor={`${uid}-projet`}>Votre projet</label>
          <select
            id={`${uid}-projet`}
            value={projet}
            onChange={(e) => {
              if (e.target.value === PROJET_VENDRE && onVendre) { onVendre(); return; }
              setProjet(e.target.value);
              setErreurs((p) => ({ ...p, projet: "" }));
            }}
          >
            <option value="" disabled>
              Veuillez sélectionner une option
            </option>
            {(bien ? PROJETS.filter((x) => x !== PROJET_VENDRE) : PROJETS).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {erreurs.projet && <span className="err">{erreurs.projet}</span>}
        </div>

        <div className="field">
          <label htmlFor={`${uid}-msg`}>Votre message :</label>
          <textarea
            id={`${uid}-msg`}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Entrez votre message"
          />
        </div>
      </div>

      <div className="field-nav">
        <button type="submit" className="btn btn--primary" disabled={envoi}>
          {envoi ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </form>
  );
}
