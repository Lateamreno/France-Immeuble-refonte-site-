"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { envoyer } from "./envoyer";

type Profil = {
  achat_en?: string; societe?: string; siren?: string; immeubles_detenus?: number | null;
  budget?: number | null; apport?: number | null; financement?: string; presentation?: string;
};

const nombre = (n: number | null | undefined) => (n == null ? "" : n.toLocaleString("fr-FR"));

/**
 * Le profil investisseur, facultatif (MAV, 30/10/2026) : une présentation de
 * soi qui accompagne les offres. Il part au BO à chaque enregistrement.
 */
export function ProfilInvestisseur({ actuel, envoyeLe }: { actuel: Profil | null; envoyeLe: string | null }) {
  const uid = useId();
  const router = useRouter();
  const [achatEn, setAchatEn] = useState(actuel?.achat_en === "societe" ? "societe" : "nom_propre");
  const [societe, setSociete] = useState(actuel?.societe ?? "");
  const [siren, setSiren] = useState(actuel?.siren ?? "");
  const [detenus, setDetenus] = useState(nombre(actuel?.immeubles_detenus));
  const [budget, setBudget] = useState(nombre(actuel?.budget));
  const [apport, setApport] = useState(nombre(actuel?.apport));
  const [financement, setFinancement] = useState(actuel?.financement ?? "");
  const [presentation, setPresentation] = useState(actuel?.presentation ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState(false);

  return (
    <form className="compte-form" noValidate onSubmit={async (e) => {
      e.preventDefault();
      setErreur("");
      setFait(false);
      setEnvoi(true);
      const r = await envoyer("/api/compte/profil/", {
        achat_en: achatEn, societe, siren, immeubles_detenus: detenus, budget, apport, financement, presentation,
      });
      setEnvoi(false);
      if (!r.ok) return setErreur(r.erreur ?? "");
      setFait(true);
      router.refresh();
    }}>
      <fieldset className="field">
        <legend className="field__lbl">J’achète</legend>
        <div className="choices">
          <button type="button" className="choice" aria-pressed={achatEn === "nom_propre"} onClick={() => setAchatEn("nom_propre")}>En nom propre</button>
          <button type="button" className="choice" aria-pressed={achatEn === "societe"} onClick={() => setAchatEn("societe")}>En société</button>
        </div>
      </fieldset>
      {achatEn === "societe" && (
        <div className="fields fields--2">
          <div className="field">
            <label htmlFor={`${uid}-so`}>Société</label>
            <input id={`${uid}-so`} value={societe} maxLength={120} onChange={(e) => setSociete(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={`${uid}-si`}>SIREN</label>
            <input id={`${uid}-si`} inputMode="numeric" value={siren} maxLength={11} onChange={(e) => setSiren(e.target.value)} />
          </div>
        </div>
      )}
      <div className="fields fields--3">
        <div className="field">
          <label htmlFor={`${uid}-d`}>Immeubles détenus</label>
          <input id={`${uid}-d`} inputMode="numeric" value={detenus} onChange={(e) => setDetenus(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-b`}>Budget (€)</label>
          <input id={`${uid}-b`} inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-a`}>Apport (€)</label>
          <input id={`${uid}-a`} inputMode="numeric" value={apport} onChange={(e) => setApport(e.target.value)} />
        </div>
      </div>
      <fieldset className="field">
        <legend className="field__lbl">Financement</legend>
        <div className="choices">
          {([["comptant", "Comptant"], ["pret", "Prêt"], ["mixte", "Apport et prêt"]] as const).map(([k, v]) => (
            <button key={k} type="button" className="choice" aria-pressed={financement === k} onClick={() => setFinancement(k)}>{v}</button>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor={`${uid}-p`}>Votre présentation</label>
        <textarea id={`${uid}-p`} rows={5} maxLength={3000} value={presentation}
          placeholder="Votre parcours d’investisseur, ce que vous cherchez, vos délais de décision…"
          onChange={(e) => setPresentation(e.target.value)} />
      </div>
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
      {fait && <p className="compte-confirme" role="status">Profil enregistré. Il accompagnera vos prochaines offres.</p>}
      <div className="compte-form__actions">
        <button type="submit" className="btn btn--primary" disabled={envoi}>{envoi ? "Enregistrement…" : "Enregistrer mon profil"}</button>
        {envoyeLe && !fait && <span className="compte-form__aide">Dernier envoi le {new Date(envoyeLe).toLocaleDateString("fr-FR")}</span>}
      </div>
    </form>
  );
}

const TYPES = [
  ["messages", "Un message de mon agent"],
  ["biens", "Un immeuble qui m’est proposé"],
  ["offres", "Une offre sur mon immeuble"],
] as const;

/** Les e-mails de notification, à garder ou couper un par un. */
export function Preferences({ actuelles }: { actuelles: { messages?: boolean; biens?: boolean; offres?: boolean } }) {
  const [p, setP] = useState({
    messages: actuelles.messages !== false, biens: actuelles.biens !== false, offres: actuelles.offres !== false,
  });
  const [etat, setEtat] = useState<"" | "envoi" | "ok" | "erreur">("");
  const changer = async (cle: keyof typeof p) => {
    const suivant = { ...p, [cle]: !p[cle] };
    setP(suivant);
    setEtat("envoi");
    const r = await envoyer("/api/compte/preferences/", suivant);
    if (!r.ok) setP(p);
    setEtat(r.ok ? "ok" : "erreur");
  };
  return (
    <div className="preferences">
      <p className="compte-form__aide">Recevoir un e-mail quand arrive :</p>
      <ul>
        {TYPES.map(([cle, libelle]) => (
          <li key={cle}>
            <span>{libelle}</span>
            <button type="button" role="switch" aria-checked={p[cle]} className="interrupteur" aria-label={libelle}
              disabled={etat === "envoi"} onClick={() => changer(cle)}>
              <span />
            </button>
          </li>
        ))}
      </ul>
      <p className="compte-form__aide" role="status">
        {etat === "ok" ? "Enregistré." : etat === "erreur" ? "Enregistrement impossible. Réessayez." : ""}
      </p>
    </div>
  );
}
