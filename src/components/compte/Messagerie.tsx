"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { envoyer } from "./envoyer";

type Choix = { cle: string; nom: string };

/**
 * Nouvelle conversation (MAV, 30/10/2026) : un titre, et si le client le veut,
 * l'immeuble dont il parle (le sien, ou un bien qu'on lui a proposé).
 */
export function NouvelleConversation({
  biens = [],
  propositions = [],
  titre: titreInitial = "",
  bien: bienInitial = "",
  proposition: propositionInitiale = "",
  ouverte = false,
}: {
  biens?: Choix[];
  propositions?: Choix[];
  titre?: string;
  bien?: string;
  proposition?: string;
  ouverte?: boolean;
}) {
  const uid = useId();
  const router = useRouter();
  const [ouvert, setOuvert] = useState(ouverte);
  const [titre, setTitre] = useState(titreInitial);
  const [sujet, setSujet] = useState(bienInitial ? `b:${bienInitial}` : propositionInitiale ? `p:${propositionInitiale}` : "");
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  if (!ouvert) {
    return <button type="button" className="btn btn--primary" onClick={() => setOuvert(true)}>Nouvelle conversation</button>;
  }
  return (
    <form className="compte-panneau compte-form" noValidate onSubmit={async (e) => {
      e.preventDefault();
      setErreur("");
      setEnvoi(true);
      const r = await envoyer("/api/compte/message/", {
        titre,
        texte,
        bien: sujet.startsWith("b:") ? sujet.slice(2) : undefined,
        proposition: sujet.startsWith("p:") ? sujet.slice(2) : undefined,
      });
      setEnvoi(false);
      if (!r.ok) return setErreur(r.erreur ?? "");
      router.push(`/mon-compte/messages/${r.conversation}/`);
      router.refresh();
    }}>
      <p className="compte-form__titre">Nouvelle conversation</p>
      <div className="field">
        <label htmlFor={`${uid}-t`}>Titre</label>
        <input id={`${uid}-t`} value={titre} maxLength={120} placeholder="Relevé de charges, visite, question sur l’offre…"
          onChange={(e) => setTitre(e.target.value)} />
      </div>
      {biens.length + propositions.length > 0 && (
        <div className="field">
          <label htmlFor={`${uid}-s`}>À propos de</label>
          <select id={`${uid}-s`} value={sujet} onChange={(e) => setSujet(e.target.value)}>
            <option value="">Aucun immeuble en particulier</option>
            {biens.length > 0 && (
              <optgroup label="Mes immeubles">
                {biens.map((b) => <option key={b.cle} value={`b:${b.cle}`}>{b.nom}</option>)}
              </optgroup>
            )}
            {propositions.length > 0 && (
              <optgroup label="Biens proposés">
                {propositions.map((p) => <option key={p.cle} value={`p:${p.cle}`}>{p.nom}</option>)}
              </optgroup>
            )}
          </select>
        </div>
      )}
      <div className="field">
        <label htmlFor={`${uid}-m`}>Message</label>
        <textarea id={`${uid}-m`} rows={5} maxLength={5000} value={texte} onChange={(e) => setTexte(e.target.value)} />
      </div>
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
      <div className="compte-form__actions">
        <button type="submit" className="btn btn--primary" disabled={envoi || texte.trim().length < 2}>
          {envoi ? "Envoi…" : "Envoyer"}
        </button>
        <button type="button" className="lien-discret" onClick={() => setOuvert(false)}>Annuler</button>
      </div>
    </form>
  );
}

/** La réponse dans une conversation ouverte, en bas du fil. */
export function Repondre({ conversation }: { conversation: string }) {
  const uid = useId();
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  return (
    <form className="fil-reponse" noValidate onSubmit={async (e) => {
      e.preventDefault();
      setErreur("");
      setEnvoi(true);
      const r = await envoyer("/api/compte/message/", { conversation, texte });
      setEnvoi(false);
      if (!r.ok) return setErreur(r.erreur ?? "");
      setTexte("");
      router.refresh();
    }}>
      <label htmlFor={`${uid}-m`} className="sr-only">Votre message</label>
      <textarea id={`${uid}-m`} rows={3} maxLength={5000} placeholder="Écrire à votre agent…" value={texte}
        onChange={(e) => setTexte(e.target.value)} />
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
      <button type="submit" className="btn btn--primary" disabled={envoi || texte.trim().length < 2}>
        {envoi ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}

/**
 * La carte d'avant l'appel (MAV, 30/10/2026) : la demande part comme un
 * message à l'agence, avec le moment où l'on préfère être appelé.
 */
export function DemanderAppel({ telephone }: { telephone?: string }) {
  const router = useRouter();
  const [moment, setMoment] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState(false);
  const [erreur, setErreur] = useState("");
  if (fait) return <p className="compte-confirme">C’est noté : un agent vous appelle{telephone ? ` au ${telephone}` : ""}.</p>;
  const MOMENTS = { "le matin": "Le matin", "l’après-midi": "L’après-midi", "en fin de journée": "En fin de journée" };
  return (
    <div className="appel">
      <div className="choices" role="group" aria-label="Le meilleur moment pour vous appeler">
        {Object.entries(MOMENTS).map(([k, v]) => (
          <button key={k} type="button" className="choice" aria-pressed={moment === k} onClick={() => setMoment(k)}>{v}</button>
        ))}
      </div>
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
      <button type="button" className="btn btn--primary" disabled={envoi} onClick={async () => {
        setEnvoi(true);
        const r = await envoyer("/api/compte/message/", {
          titre: "Demande d’appel",
          texte: `Je souhaite être appelé${moment ? `, de préférence ${moment}` : ""}${telephone ? `, au ${telephone}` : ""}.`,
        });
        setEnvoi(false);
        if (!r.ok) return setErreur(r.erreur ?? "");
        setFait(true);
        router.refresh();
      }}>
        {envoi ? "Envoi…" : "Demander l’appel"}
      </button>
    </div>
  );
}
