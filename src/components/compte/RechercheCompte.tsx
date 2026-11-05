"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Picto } from "@/components/Picto";
import { LIBELLE_DESTINATION } from "@/lib/annonce";
import { CIBLES, LIBELLE_OPERATION, villeDe } from "@/lib/recherche-biens";
import { ChoixLieux } from "@/components/biens/ChoixLieux";
import { DoubleCurseur } from "@/components/DoubleCurseur";
import { CurseurMinimum } from "@/components/CurseurMinimum";
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
  occupation_min?: number | null;
  occupation_max?: number | null;
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

/** Le budget au curseur, comme le dépôt de recherche du site : de 0 à 10 M€ et plus (retour #272). */
const BUDGET_MAX = 10_000_000;
const BUDGET_PAS = 100_000;
const milliers = (n: number) => n.toLocaleString("fr-FR").replace(/\s/g, "\u202f");
const enEuros = (n: number | null) => (n == null ? "" : `${milliers(n)} €`);
const lireEntier = (s: string) => {
  const t = s.replace(/[^\d]/g, "");
  return t ? Math.min(Number(t), 999_000_000) : null;
};

/**
 * Le BO redépose la liste quelques instants après l'envoi : la page se relit
 * tout de suite, puis deux fois encore (retour #273 : « il faut que ça se
 * rafraîchisse seul »).
 */
function useRelire() {
  const router = useRouter();
  return () => {
    router.refresh();
    setTimeout(() => router.refresh(), 2500);
    setTimeout(() => router.refresh(), 7000);
  };
}

/**
 * Ajouter ou modifier une recherche (§9.2). Le BO met à jour la recherche du
 * contact puis redépose la liste : la carte se met à jour quelques instants
 * plus tard, d'où le message de confirmation plutôt qu'une modification
 * affichée tout de suite.
 */
export function RechercheCompte({ valeurs, onFerme, onFini }: {
  valeurs?: ValeursRecherche;
  onFerme?: () => void;
  /** Envoi réussi : le parent referme le formulaire et affiche la confirmation. */
  onFini?: (action: "enregistrer" | "supprimer") => void;
}) {
  const uid = useId();
  const relire = useRelire();
  const [cible, setCible] = useState(valeurs?.cible ?? "");
  const [zones, setZones] = useState<string[]>(versZones(valeurs));
  const [prixMin, setPrixMin] = useState<number | null>(valeurs?.prix_min ?? null);
  const [prixMax, setPrixMax] = useState<number | null>(valeurs?.prix_max ?? null);
  const [rdt, setRdt] = useState<number | null>(valeurs?.rendement_min ?? null);
  const [occMin, setOccMin] = useState<number | null>(valeurs?.occupation_min ?? null);
  const [occMax, setOccMax] = useState<number | null>(valeurs?.occupation_max ?? null);
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
      occupationMin: occMin, occupationMax: occMax,
      destinations: dest,
      commentaire,
    });
    setEnvoi(false);
    if (!r.ok) { setErreur(r.erreur ?? ""); return; }
    relire();
    if (onFini) onFini(action); else setFait(action);
  }

  if (fait) {
    return (
      <div className="compte-confirme">
        <p>
          {fait === "supprimer" ? "Recherche supprimée." : "Recherche enregistrée."} Votre agent
          la reçoit tout de suite ; la liste se met à jour dans quelques secondes.
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
      <div className="field">
        <span className="field__lbl">Budget</span>
        <div className="budget">
          <label className="budget__champ">
            <span>Minimum</span>
            <input id={`${uid}-min`} inputMode="numeric" autoComplete="off" value={enEuros(prixMin)} placeholder="0 €"
              onChange={(e) => setPrixMin(lireEntier(e.target.value))} />
          </label>
          <label className="budget__champ">
            <span>Maximum</span>
            <input id={`${uid}-max`} inputMode="numeric" autoComplete="off" value={enEuros(prixMax)} placeholder="Sans limite"
              onChange={(e) => setPrixMax(lireEntier(e.target.value))} />
          </label>
        </div>
        <DoubleCurseur min={0} max={BUDGET_MAX} pas={BUDGET_PAS} de={prixMin} a={prixMax} libelle="Budget"
          valeurTexte={(v) => (v >= BUDGET_MAX ? "10 millions d’euros et plus" : enEuros(v))}
          onChange={(d, a) => { setPrixMin(d); setPrixMax(a); }} />
        <div className="curseur__bornes" aria-hidden="true"><span>0 €</span><span>10 M€ et plus</span></div>
      </div>
      <div className="fields fields--2">
        <div className="field">
          <span className="field__lbl">Rendement minimum : {rdt == null ? "tous" : `${rdt.toLocaleString("fr-FR")} % et plus`}</span>
          <CurseurMinimum id={`${uid}-rdt`} min={0} max={12} pas={0.5} valeur={rdt} onChange={setRdt} libelle="Rendement minimum" />
        </div>
        <div className="field">
          <span className="field__lbl">Occupation : de {occMin ?? 0} à {occMax ?? 100} %</span>
          <DoubleCurseur min={0} max={100} pas={10} de={occMin} a={occMax} libelle="Occupation"
            valeurTexte={(v) => `${v} %`} onChange={(d, x) => { setOccMin(d); setOccMax(x); }} />
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
  const [note, setNote] = useState("");
  return (
    <>
      {children}
      {note && <p className="compte-confirme">{note}</p>}
      {edition ? (
        <RechercheCompte valeurs={valeurs} onFerme={() => setEdition(false)}
          onFini={(a) => { setEdition(false); setNote(a === "supprimer" ? "Recherche supprimée." : "Modification enregistrée."); }} />
      ) : (
        <button type="button" className="lien-discret" onClick={() => setEdition(true)}>Modifier les critères</button>
      )}
    </>
  );
}

/**
 * Le titre d'une recherche, renommable au crayon (retour #271). Vide, la
 * recherche reprend son titre d'origine.
 */
export function TitreRecherche({ cle, nom, defaut }: { cle: string; nom: string | null; defaut: string }) {
  const relire = useRelire();
  const [edition, setEdition] = useState(false);
  const [valeur, setValeur] = useState(nom ?? "");
  const [affiche, setAffiche] = useState(nom || defaut);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const r = await envoyer("/api/compte/recherche-nom/", { cle, nom: valeur });
    setEnvoi(false);
    if (!r.ok) { setErreur(r.erreur ?? ""); return; }
    setAffiche(valeur.trim() || defaut);
    setEdition(false);
    relire();
  }

  if (!edition) {
    return (
      <div className="recherche-titre">
        <p className="compte-carte__titre">{affiche}</p>
        <button type="button" className="recherche-titre__crayon" onClick={() => setEdition(true)}
          aria-label="Renommer la recherche" title="Renommer">
          <Picto nom="crayon" taille={16} />
        </button>
      </div>
    );
  }
  return (
    <form className="recherche-titre recherche-titre--edition" onSubmit={enregistrer}>
      <input value={valeur} onChange={(e) => setValeur(e.target.value)} maxLength={60} autoFocus
        placeholder={defaut} aria-label="Nom de la recherche" />
      <button type="submit" className="lien-discret" disabled={envoi}>{envoi ? "…" : "OK"}</button>
      <button type="button" className="lien-discret" onClick={() => { setEdition(false); setValeur(nom ?? ""); }}>Annuler</button>
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
    </form>
  );
}

/**
 * « Ajouter une recherche » : le formulaire vide, déplié à la demande. Après
 * l'envoi, il se referme, la liste se relit et le bouton revient (retour #273).
 */
export function NouvelleRecherche({ ouverte = false }: { ouverte?: boolean }) {
  const [ouvert, setOuvert] = useState(ouverte);
  const [n, setN] = useState(0);
  const [note, setNote] = useState("");
  if (!ouvert) {
    return (
      <>
        {note && <p className="compte-confirme">{note}</p>}
        <button type="button" className="btn btn--primary" onClick={() => { setNote(""); setOuvert(true); }}>Ajouter une recherche</button>
      </>
    );
  }
  return (
    <div className="form-shell">
      <RechercheCompte key={n} onFerme={() => setOuvert(false)}
        onFini={() => { setOuvert(false); setN((x) => x + 1); setNote("Recherche enregistrée. Votre agent la reçoit tout de suite."); }} />
    </div>
  );
}
