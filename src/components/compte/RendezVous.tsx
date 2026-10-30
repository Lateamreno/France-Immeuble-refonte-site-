"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { envoyer } from "./envoyer";
import { CRENEAUX, OBJETS_RDV, jourEnClair, joursProposes } from "@/lib/compte/rendez-vous";

type Choix = { cle: string; nom: string };

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * Une demande de rendez-vous sur calendrier (MAV, 30/10/2026) : le client
 * choisit un jour et un moment, l'agent confirme. Les dimanches et les jours
 * passés ne se choisissent pas.
 */
export function DemandeRendezVous({
  biens = [],
  propositions = [],
  bien = "",
  proposition = "",
  objet: objetInitial,
}: {
  biens?: Choix[];
  propositions?: Choix[];
  bien?: string;
  proposition?: string;
  objet?: keyof typeof OBJETS_RDV;
}) {
  const uid = useId();
  const router = useRouter();
  const ouverts = useMemo(() => joursProposes(), []);
  // Les mois couverts par les jours ouverts. Un mois presque fini ne s'ouvre pas en premier.
  const moisCouverts = [...new Set(ouverts.map((j) => j.slice(0, 7)))];
  const [mois, setMois] = useState(() =>
    moisCouverts.length > 1 && ouverts.filter((j) => j.startsWith(moisCouverts[0])).length < 6 ? 1 : 0);
  const [jour, setJour] = useState("");
  const [creneau, setCreneau] = useState<keyof typeof CRENEAUX | "">("");
  const [objet, setObjet] = useState<keyof typeof OBJETS_RDV | "">(objetInitial ?? (proposition ? "visite" : ""));
  const [sujet, setSujet] = useState(bien ? `b:${bien}` : proposition ? `p:${proposition}` : "");
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState(false);

  const cle = moisCouverts[Math.min(mois, moisCouverts.length - 1)];
  const [a, m] = cle.split("-").map(Number);
  const premier = new Date(Date.UTC(a, m - 1, 1));
  const decalage = (premier.getUTCDay() + 6) % 7;
  const nbJours = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const cases = [...Array(decalage).fill(null), ...Array.from({ length: nbJours }, (_, i) => `${cle}-${String(i + 1).padStart(2, "0")}`)];
  const nomMois = premier.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

  if (fait) {
    return (
      <div className="compte-panneau outcome">
        <span className="outcome__badge">Demande envoyée</span>
        <h3>{jourEnClair(jour)}, {CRENEAUX[creneau as keyof typeof CRENEAUX].toLowerCase()}</h3>
        <p>Votre agent confirme le rendez-vous, ou vous propose un autre moment.</p>
      </div>
    );
  }

  return (
    <form className="rdv" noValidate onSubmit={async (e) => {
      e.preventDefault();
      setErreur("");
      setEnvoi(true);
      const r = await envoyer("/api/compte/rendez-vous/", {
        date: jour, creneau, objet, texte,
        bien: sujet.startsWith("b:") ? sujet.slice(2) : undefined,
        proposition: sujet.startsWith("p:") ? sujet.slice(2) : undefined,
      });
      setEnvoi(false);
      if (!r.ok) return setErreur(r.erreur ?? "");
      setFait(true);
      router.refresh();
    }}>
      <div className="calendrier compte-panneau">
        <div className="calendrier__tete">
          <button type="button" className="calendrier__fleche" aria-label="Mois précédent" disabled={mois === 0} onClick={() => setMois((x) => Math.max(0, x - 1))}>‹</button>
          <p className="calendrier__mois">{nomMois}</p>
          <button type="button" className="calendrier__fleche" aria-label="Mois suivant" disabled={mois >= moisCouverts.length - 1} onClick={() => setMois((x) => Math.min(moisCouverts.length - 1, x + 1))}>›</button>
        </div>
        <div className="calendrier__grille" role="grid" aria-label={`Jours de ${nomMois}`}>
          {JOURS.map((j, i) => <span key={i} className="calendrier__jsem" aria-hidden="true">{j}</span>)}
          {cases.map((c, i) =>
            c === null ? <span key={`v${i}`} /> : (
              <button key={c} type="button" className="calendrier__jour" disabled={!ouverts.includes(c)}
                aria-pressed={jour === c} aria-label={jourEnClair(c)} onClick={() => setJour(c)}>
                {Number(c.slice(8))}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="rdv__details">
        <fieldset className="field">
          <legend className="field__lbl">Moment de la journée</legend>
          <div className="choices">
            {(Object.keys(CRENEAUX) as (keyof typeof CRENEAUX)[]).map((k) => (
              <button key={k} type="button" className="choice" aria-pressed={creneau === k} onClick={() => setCreneau(k)}>{CRENEAUX[k]}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="field">
          <legend className="field__lbl">Pour</legend>
          <div className="choices">
            {(Object.keys(OBJETS_RDV) as (keyof typeof OBJETS_RDV)[]).map((k) => (
              <button key={k} type="button" className="choice" aria-pressed={objet === k} onClick={() => setObjet(k)}>{OBJETS_RDV[k]}</button>
            ))}
          </div>
        </fieldset>
        {biens.length + propositions.length > 0 && (
          <div className="field">
            <label htmlFor={`${uid}-s`}>Immeuble</label>
            <select id={`${uid}-s`} value={sujet} onChange={(e) => setSujet(e.target.value)}>
              <option value="">Aucun en particulier</option>
              {biens.map((b) => <option key={b.cle} value={`b:${b.cle}`}>{b.nom}</option>)}
              {propositions.map((p) => <option key={p.cle} value={`p:${p.cle}`}>{p.nom}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor={`${uid}-t`}>Un mot pour l’agent (facultatif)</label>
          <textarea id={`${uid}-t`} rows={3} maxLength={1000} value={texte} onChange={(e) => setTexte(e.target.value)} />
        </div>
        <p className="rdv__recap" aria-live="polite">
          {jour ? `${jourEnClair(jour)}${creneau ? `, ${CRENEAUX[creneau].toLowerCase()}` : ""}` : "Choisissez un jour dans le calendrier."}
        </p>
        {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
        <button type="submit" className="btn btn--primary" disabled={envoi || !jour || !creneau || !objet}>
          {envoi ? "Envoi…" : "Demander ce rendez-vous"}
        </button>
      </div>
    </form>
  );
}
