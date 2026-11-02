"use client";

import { useId, useState } from "react";
import { LIBELLE_DESTINATION } from "@/lib/annonce";
import { CIBLES, LIBELLE_OPERATION, villeDe } from "@/lib/recherche-biens";
import { ChoixLieux } from "@/components/biens/ChoixLieux";
import { envoyer } from "./envoyer";

// Les quatre types d'immeuble de l'agence (MAV, 02/11/2026), valeurs des destinations du BO.
const DESTINATIONS = ["Logement", "Commerce", "Bureau", "Logistique"] as const;

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

/** Les lieux du BO en zones du choix des lieux, et retour (une ville apporte son département). */
const versZones = (v?: ValeursRecherche) => [
  ...(v?.departements ?? []).map((d) => `d:${d}`),
  ...(v?.villes ?? []).map((n) => `v:${n}`),
];
function versBO(zones: string[]) {
  const departements = new Set<string>();
  const villes: string[] = [];
  for (const z of zones) {
    if (z.startsWith("d:")) departements.add(z.slice(2));
    else { const v = villeDe(z); villes.push(v.nom); if (v.dept) departements.add(v.dept); }
  }
  return { departements: [...departements], villes };
}

/**
 * Ajouter ou modifier une recherche (§9.2). Le BO met à jour la recherche du
 * contact puis redépose la liste : la carte se met à jour quelques instants
 * plus tard, d'où le message de confirmation plutôt qu'une modification
 * affichée tout de suite.
 */
export function RechercheCompte({ valeurs, onFerme }: { valeurs?: ValeursRecherche; onFerme?: () => void }) {
  const uid = useId();
  const [cible, setCible] = useState(valeurs?.cible ?? "");
  const [zones, setZones] = useState<string[]>(versZones(valeurs));
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
      ...versBO(zones),
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
        <span className="field__lbl" id={`${uid}-cible`}>Type d’opération</span>
        <div className="choices" role="group" aria-labelledby={`${uid}-cible`}>
          {/* Une recherche ancienne garde son profil (patrimonial, promoteur) tant qu'on n'en change pas. */}
          {[...CIBLES, ...(cible && !(CIBLES as readonly string[]).includes(cible) ? [cible] : [])].map((c) => (
            <button key={c} type="button" className="choice" aria-pressed={cible === c} onClick={() => setCible(c)}>
              {LIBELLE_OPERATION[c as keyof typeof LIBELLE_OPERATION] ?? c}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${uid}-lieux`}>Où cherchez-vous ?</label>
        <div className="lieux-champ">
          <ChoixLieux id={`${uid}-lieux`} zones={zones} setZones={setZones} variante="formulaire" />
        </div>
      </div>
      <div className="fields fields--2">
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
        <span className="field__lbl" id={`${uid}-dest`}>Type d’immeuble</span>
        <div className="choices" role="group" aria-labelledby={`${uid}-dest`}>
          {DESTINATIONS.map((d) => (
            <button key={d} type="button" className="choice" aria-pressed={dest.includes(d)}
              onClick={() => setDest((v) => (v.includes(d) ? v.filter((x) => x !== d) : [...v, d]))}>{LIBELLE_DESTINATION[d]}</button>
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
