"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Picto } from "@/components/Picto";
import { envoyer, FORMATS_ACCEPTES, televerser } from "./envoyer";

type Choix = { cle: string; nom: string };

const MAX_PIECES = 5;
const MAX_OCTETS = 25 * 1024 * 1024;

/**
 * Les pièces jointes d'un message (contrat §12.3) : cinq au plus, 25 Mo
 * chacune, les formats des pièces du propriétaire. Elles partent au moment
 * d'envoyer, par le même chemin contrôlé que les documents, puis le BO les
 * range et les efface du site.
 */
function usePieces() {
  const uid = useId();
  const champ = useRef<HTMLInputElement>(null);
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [alerte, setAlerte] = useState("");
  const [progres, setProgres] = useState("");

  const ajouter = (liste: FileList | null) => {
    setAlerte("");
    const nouveaux = [...(liste ?? [])].filter((f) => {
      if (f.size > MAX_OCTETS) { setAlerte(`« ${f.name} » dépasse 25 Mo.`); return false; }
      return true;
    });
    setFichiers((x) => {
      const tous = [...x, ...nouveaux];
      if (tous.length > MAX_PIECES) setAlerte("Cinq pièces au plus par message.");
      return tous.slice(0, MAX_PIECES);
    });
  };

  async function envoyerPieces(): Promise<{ ok: true; pieces: { chemin: string; nom: string }[] } | { ok: false; erreur: string }> {
    const pieces: { chemin: string; nom: string }[] = [];
    for (const [i, f] of fichiers.entries()) {
      const r = await televerser(f, { pour: "message" }, (pct) => setProgres(`Pièce ${i + 1} sur ${fichiers.length} : ${pct} %`));
      if (!r.ok) { setProgres(""); return { ok: false, erreur: `« ${f.name} » : ${r.erreur ?? "envoi impossible."}` }; }
      pieces.push({ chemin: String(r.chemin), nom: String(r.nom) });
    }
    setProgres("");
    return { ok: true, pieces };
  }

  const zone = (
    <div className="pieces-jointes">
      <input ref={champ} id={`${uid}-pj`} type="file" multiple accept={FORMATS_ACCEPTES} className="depot__champ"
        aria-label="Joindre des fichiers" onChange={(e) => { ajouter(e.target.files); e.target.value = ""; }} />
      {fichiers.length > 0 && (
        <ul className="pieces-jointes__liste">
          {fichiers.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <Picto nom="trombone" taille={15} />
              <span>{f.name}</span>
              <button type="button" className="pieces-jointes__retirer" aria-label={`Retirer ${f.name}`}
                onClick={() => setFichiers((x) => x.filter((_, j) => j !== i))}>×</button>
            </li>
          ))}
        </ul>
      )}
      {(alerte || progres) && <p className="compte-form__aide" role="status">{progres || alerte}</p>}
    </div>
  );
  const bouton = (
    <button type="button" className="joindre" onClick={() => champ.current?.click()}
      disabled={fichiers.length >= MAX_PIECES} aria-label="Joindre un fichier" title="Joindre un fichier (PDF, photo, Word, Excel)">
      <Picto nom="trombone" taille={19} />
    </button>
  );
  return { fichiers, vider: () => setFichiers([]), envoyerPieces, zone, bouton };
}

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
  const pj = usePieces();
  useEffect(() => setErreur(""), [pj.fichiers]);

  if (!ouvert) {
    return <button type="button" className="btn btn--primary" onClick={() => setOuvert(true)}>Nouvelle conversation</button>;
  }
  return (
    <form className="compte-panneau compte-form" noValidate onSubmit={async (e) => {
      e.preventDefault();
      setErreur("");
      setEnvoi(true);
      const p = await pj.envoyerPieces();
      if (!p.ok) { setEnvoi(false); return setErreur(p.erreur); }
      const r = await envoyer("/api/compte/message/", {
        titre,
        texte,
        pieces: p.pieces,
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
      {pj.zone}
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
      <div className="compte-form__actions">
        <button type="submit" className="btn btn--primary" disabled={envoi || texte.trim().length < 2}>
          {envoi ? "Envoi…" : "Envoyer"}
        </button>
        {pj.bouton}
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
  const pj = usePieces();
  useEffect(() => setErreur(""), [pj.fichiers]);
  return (
    <form className="fil-reponse" noValidate onSubmit={async (e) => {
      e.preventDefault();
      setErreur("");
      setEnvoi(true);
      const p = await pj.envoyerPieces();
      if (!p.ok) { setEnvoi(false); return setErreur(p.erreur); }
      const r = await envoyer("/api/compte/message/", { conversation, texte, pieces: p.pieces });
      setEnvoi(false);
      if (!r.ok) return setErreur(r.erreur ?? "");
      setTexte("");
      pj.vider();
      router.refresh();
    }}>
      <div className="fil-reponse__saisie">
        <label htmlFor={`${uid}-m`} className="sr-only">Votre message</label>
        <textarea id={`${uid}-m`} rows={3} maxLength={5000} placeholder="Écrire à votre agent…" value={texte}
          onChange={(e) => setTexte(e.target.value)} />
        {pj.zone}
      </div>
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
      {pj.bouton}
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
