"use client";

import { useRef, useState, useTransition } from "react";
import { deleteFeedback, modifierFeedback, setFeedbackStatut, type Resultat } from "@/lib/bo/feedback";
import { useQuestion } from "@/components/modale";

const GRAVITES = [
  { v: "bloquant", l: "Bloquant" },
  { v: "ecart", l: "Écart" },
  { v: "detail", l: "Détail" },
  { v: "idee", l: "Idée" },
];

export function FeedbackActions({ id, statut, commentaire, gravite }: {
  id: number; statut: string;
  /** Repris tels quels dans l'éditeur : on corrige, on ne réécrit pas. */
  commentaire?: string;
  gravite?: string;
}) {
  const [pending, start] = useTransition();
  const [edite, setEdite] = useState(false);
  const [texte, setTexte] = useState(commentaire ?? "");
  const [grav, setGrav] = useState(gravite ?? "ecart");
  const [ajouts, setAjouts] = useState<File[]>([]);
  /* Les actions rendent un resultat au lieu de lancer : un echec doit se lire
     ici, pas seulement dans la console du navigateur. */
  const [erreur, setErreur] = useState<string | null>(null);
  const zone = useRef<HTMLTextAreaElement>(null);
  const { confirmer, saisir, question } = useQuestion();

  /** Joue une action et affiche son message si elle echoue. */
  const agir = (action: () => Promise<Resultat>, apres?: () => void) =>
    start(async () => {
      setErreur(null);
      const r = await action();
      if (!r.ok) { setErreur(r.message); return; }
      apres?.();
    });

  const enregistrer = () => {
    const fd = new FormData();
    fd.set("id", String(id));
    fd.set("commentaire", texte);
    fd.set("gravite", grav);
    for (const f of ajouts) fd.append("capture", f);
    agir(() => modifierFeedback(fd), () => { setAjouts([]); setEdite(false); });
  };

  const avis = erreur ? <div className="fbk-err" role="status">{erreur}</div> : null;

  if (edite) {
    return (
      <div className="fbk-edit">
        <textarea ref={zone} rows={4} value={texte} onChange={(e) => setTexte(e.target.value)}
          /* Un collage suffit à joindre une capture, comme à la saisie. */
          onPaste={(e) => {
            const f = Array.from(e.clipboardData.files).filter((x) => x.type.startsWith("image/"));
            if (f.length) setAjouts((v) => [...v, ...f]);
          }} />
        <div className="fbk-edit-l">
          {GRAVITES.map((g) => (
            <button key={g.v} type="button" className={grav === g.v ? "on" : ""}
              onClick={() => setGrav(g.v)}>{g.l}</button>
          ))}
          <span style={{ flex: 1 }} />
          <label className="fadd">
            + Image
            <input type="file" accept="image/*" multiple hidden
              onChange={(e) => setAjouts((v) => [...v, ...Array.from(e.target.files ?? [])])} />
          </label>
        </div>
        {ajouts.length > 0 && (
          <div className="fbk-edit-n">
            {ajouts.length} image{ajouts.length > 1 ? "s" : ""} à ajouter — les captures déjà là sont conservées.
          </div>
        )}
        {avis}
        <div className="mrow" style={{ gap: 5, marginTop: 8 }}>
          <button className="fadd" type="button" disabled={pending} onClick={() => setEdite(false)}>
            Annuler
          </button>
          <span style={{ flex: 1 }} />
          <button className="savebar-go" type="button" disabled={pending || !texte.trim()}
            onClick={enregistrer}>
            <span className="ch">›</span> Enregistrer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mrow" style={{ gap: 5, marginTop: 8 }}>
      <button className="fadd" type="button" title="Modifier le texte ou ajouter une image"
        onClick={() => setEdite(true)}>
        <svg viewBox="0 0 24 24" className="fbk-crayon" aria-hidden>
          <path d="m14.5 5.5 4 4-9 9H5.5v-4z" /><path d="M13 7 17 11" />
        </svg>
        Modifier
      </button>
      {statut !== "corrige" && (
        <button className="fadd" type="button" disabled={pending}
          onClick={() => agir(() => setFeedbackStatut(id, "corrige"))}>
          Marquer corrigé
        </button>
      )}
      {statut !== "ecarte" && (
        <button className="fadd" type="button" disabled={pending}
          onClick={async () => {
            /* Comme avec l'ancien `prompt()` : annuler la question n'annule pas
               l'écart, il part simplement sans motif. */
            const r = (await saisir("Pourquoi écarter ce retour ? (optionnel)", { oui: "Écarter" })) ?? undefined;
            agir(() => setFeedbackStatut(id, "ecarte", r));
          }}>
          Écarter
        </button>
      )}
      {statut !== "ouvert" && (
        <button className="fadd" type="button" disabled={pending}
          onClick={() => agir(() => setFeedbackStatut(id, "ouvert"))}>
          Rouvrir
        </button>
      )}
      <button className="xdel" type="button" disabled={pending} title="Supprimer"
        onClick={async () => {
          if (!(await confirmer("Supprimer ce retour ?", { danger: true, oui: "Supprimer" }))) return;
          agir(() => deleteFeedback(id));
        }}>✕</button>
      {avis}
      {question}
    </div>
  );
}
