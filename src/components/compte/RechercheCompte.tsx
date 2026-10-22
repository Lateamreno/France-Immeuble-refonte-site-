"use client";

import { useId, useState } from "react";
import { envoyer } from "./envoyer";

const CIBLES = ["Investisseur", "Patrimonial", "Marchand de biens", "Promoteur"] as const;
const DESTINATIONS = ["Logement", "Commerce", "Bureau", "Logistique", "Hôtel", "Parking"] as const;

export type ValeursRecherche = {
  cle?: string;
  cible?: string | null;
  departements?: string[];
  villes?: string[];
  prix_min?: number | null;
  prix_max?: number | null;
  rendement_min?: number | null;
  destinations?: string[];
  commentaire?: string | null;
};

const liste = (t: string) => t.split(/[,;\s]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);

/**
 * Ajouter ou modifier une recherche (§9.2). Le BO met à jour la recherche du
 * contact puis redépose la liste : la carte se met à jour quelques instants
 * plus tard, d'où le message de confirmation plutôt qu'une modification
 * affichée tout de suite.
 */
export function RechercheCompte({ valeurs, onFerme }: { valeurs?: ValeursRecherche; onFerme?: () => void }) {
  const uid = useId();
  const [cible, setCible] = useState(valeurs?.cible ?? "");
  const [depts, setDepts] = useState((valeurs?.departements ?? []).join(", "));
  const [villes, setVilles] = useState((valeurs?.villes ?? []).join(", "));
  const [prixMin, setPrixMin] = useState(valeurs?.prix_min?.toString() ?? "");
  const [prixMax, setPrixMax] = useState(valeurs?.prix_max?.toString() ?? "");
  const [rdt, setRdt] = useState(valeurs?.rendement_min?.toString() ?? "");
  const [dest, setDest] = useState<string[]>(valeurs?.destinations ?? []);
  const [commentaire, setCommentaire] = useState(valeurs?.commentaire ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState<null | "enregistrer" | "supprimer">(null);

  async function agir(action: "enregistrer" | "supprimer") {
    setEnvoi(true);
    setErreur("");
    const r = await envoyer("/api/compte/recherche/", {
      action,
      cle: valeurs?.cle,
      cible,
      departements: liste(depts),
      villes: villes.split(/[,;]+/).map((v) => v.trim()).filter(Boolean),
      prixMin, prixMax, rendementMin: rdt,
      destinations: dest,
      commentaire,
    });
    setEnvoi(false);
    if (r.ok) setFait(action); else setErreur(r.erreur ?? "");
  }

  if (fait) {
    return (
      <div className="compte-confirme">
        <p>
          {fait === "supprimer" ? "Recherche supprimée." : "Recherche enregistrée."} Votre agent
          la reçoit tout de suite ; elle s’affiche ici à la prochaine mise à jour de votre compte.
        </p>
        {onFerme && <button type="button" className="lien-discret" onClick={onFerme}>Fermer</button>}
      </div>
    );
  }

  return (
    <form className="compte-recherche-form" noValidate onSubmit={(e) => { e.preventDefault(); agir("enregistrer"); }}>
      <div className="field">
        <span className="field__lbl" id={`${uid}-cible`}>Votre profil</span>
        <div className="choices" role="group" aria-labelledby={`${uid}-cible`}>
          {CIBLES.map((c) => (
            <button key={c} type="button" className="choice" aria-pressed={cible === c} onClick={() => setCible(c)}>{c}</button>
          ))}
        </div>
      </div>
      <div className="fields fields--2">
        <div className="field">
          <label htmlFor={`${uid}-dep`}>Départements</label>
          <input id={`${uid}-dep`} value={depts} onChange={(e) => setDepts(e.target.value)} placeholder="75, 92, 93" />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-villes`}>Villes (facultatif)</label>
          <input id={`${uid}-villes`} value={villes} onChange={(e) => setVilles(e.target.value)} placeholder="Paris, Boulogne-Billancourt" />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-min`}>Prix minimum (€)</label>
          <input id={`${uid}-min`} inputMode="numeric" value={prixMin} onChange={(e) => setPrixMin(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-max`}>Prix maximum (€)</label>
          <input id={`${uid}-max`} inputMode="numeric" value={prixMax} onChange={(e) => setPrixMax(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-rdt`}>Rendement minimum (%)</label>
          <input id={`${uid}-rdt`} inputMode="decimal" value={rdt} onChange={(e) => setRdt(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <span className="field__lbl" id={`${uid}-dest`}>Destinations</span>
        <div className="choices" role="group" aria-labelledby={`${uid}-dest`}>
          {DESTINATIONS.map((d) => (
            <button key={d} type="button" className="choice" aria-pressed={dest.includes(d)}
              onClick={() => setDest((v) => (v.includes(d) ? v.filter((x) => x !== d) : [...v, d]))}>{d}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${uid}-com`}>Précisions (facultatif)</label>
        <textarea id={`${uid}-com`} rows={2} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
      </div>
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
      <div className="field-nav">
        <button type="submit" className="btn btn--primary" disabled={envoi}>{envoi ? "Envoi…" : "Enregistrer la recherche"}</button>
        {valeurs?.cle && (
          <button type="button" className="btn btn--outline" disabled={envoi} onClick={() => agir("supprimer")}>
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}

/** Une recherche existante : son résumé, et le formulaire à la demande. */
export function RechercheEditable({ valeurs, children }: { valeurs: ValeursRecherche; children: React.ReactNode }) {
  const [edition, setEdition] = useState(false);
  return (
    <>
      {children}
      {edition ? (
        <RechercheCompte valeurs={valeurs} onFerme={() => setEdition(false)} />
      ) : (
        <button type="button" className="lien-discret" onClick={() => setEdition(true)}>Modifier</button>
      )}
    </>
  );
}

/** « Ajouter une recherche » : le formulaire vide, déplié à la demande. */
export function NouvelleRecherche({ ouverte = false }: { ouverte?: boolean }) {
  const [ouvert, setOuvert] = useState(ouverte);
  if (!ouvert) {
    return <button type="button" className="btn btn--primary" onClick={() => setOuvert(true)}>Ajouter une recherche</button>;
  }
  return (
    <div className="form-shell">
      <RechercheCompte onFerme={() => setOuvert(false)} />
    </div>
  );
}
