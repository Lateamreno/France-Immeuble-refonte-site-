"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { envoyer } from "./envoyer";

const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
const pct = (n: number, d = 1) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })} %`;
const pas = (prix: number) => (prix >= 2_000_000 ? 10_000 : prix >= 500_000 ? 5_000 : 1_000);

/** Le pourcentage qui colore la piste du curseur, jusqu'au pouce. */
const piste = (v: number, min: number, max: number) => ({ ["--rempli" as string]: `${((v - min) / (max - min)) * 100}%` });

/**
 * L'offre d'achat en ligne, au curseur (MAV, 30/10/2026, « comme Plein Bail »).
 * Le rendement se recalcule sur le prix offert. L'offre part à l'agent, qui la
 * confirme avec l'acquéreur avant de la transmettre.
 */
export function OffreAuCurseur({ proposition, prix, rendement }: { proposition: string; prix: number | null; rendement: number | null }) {
  const uid = useId();
  const router = useRouter();
  const p = pas(prix ?? 1_000_000);
  const min = prix ? Math.round((prix * 0.7) / p) * p : 0;
  const max = prix ? Math.round((prix * 1.05) / p) * p : 0;
  const [montant, setMontant] = useState(prix ? Math.round((prix * 0.95) / p) * p : 0);
  const [saisie, setSaisie] = useState("");
  const [financement, setFinancement] = useState<"comptant" | "pret" | "mixte" | "">("");
  const [apport, setApport] = useState("");
  const [validite, setValidite] = useState(10);
  const [conditions, setConditions] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState(false);

  const valeur = prix ? montant : Number(saisie.replace(/[^\d]/g, "")) || 0;
  const rdt = prix && rendement ? (rendement * prix) / valeur : null;

  if (fait) {
    return (
      <div className="compte-panneau outcome">
        <span className="outcome__badge">Offre envoyée</span>
        <h3>{euros(valeur)}</h3>
        <p>Votre agent la reprend avec vous, puis la transmet au vendeur. Vous la retrouvez ici.</p>
      </div>
    );
  }

  return (
    <form className="compte-panneau curseur-offre" noValidate onSubmit={async (e) => {
      e.preventDefault();
      setErreur("");
      setEnvoi(true);
      const r = await envoyer("/api/compte/offre/", {
        proposition, montant: valeur, financement, apport, validite_jours: validite, conditions,
      });
      setEnvoi(false);
      if (!r.ok) return setErreur(r.erreur ?? "");
      setFait(true);
      router.refresh();
    }}>
      <p className="compte-form__titre">Faire une offre</p>
      {prix ? (
        <>
          <div className="curseur__valeur">
            <output htmlFor={`${uid}-c`} className="curseur__montant">{euros(montant)}</output>
            <span className="curseur__note">
              {pct((montant / prix) * 100, 0)} du prix demandé{rdt ? ` · ${pct(rdt)} brut` : ""}
            </span>
          </div>
          <label htmlFor={`${uid}-c`} className="sr-only">Montant de l’offre</label>
          <input id={`${uid}-c`} className="curseur" type="range" min={min} max={max} step={p} value={montant}
            style={piste(montant, min, max)} onChange={(e) => setMontant(Number(e.target.value))}
            aria-valuetext={euros(montant)} />
          <div className="curseur__bornes"><span>{euros(min)}</span><span>Prix : {euros(prix)}</span><span>{euros(max)}</span></div>
        </>
      ) : (
        <div className="field">
          <label htmlFor={`${uid}-m`}>Montant de votre offre (€)</label>
          <input id={`${uid}-m`} inputMode="numeric" value={saisie} onChange={(e) => setSaisie(e.target.value)} />
        </div>
      )}

      <fieldset className="field">
        <legend className="field__lbl">Financement</legend>
        <div className="choices">
          {([["comptant", "Comptant"], ["pret", "Prêt"], ["mixte", "Apport et prêt"]] as const).map(([k, v]) => (
            <button key={k} type="button" className="choice" aria-pressed={financement === k} onClick={() => setFinancement(k)}>{v}</button>
          ))}
        </div>
      </fieldset>
      {financement && financement !== "comptant" && (
        <div className="field">
          <label htmlFor={`${uid}-a`}>Apport (€)</label>
          <input id={`${uid}-a`} inputMode="numeric" value={apport} onChange={(e) => setApport(e.target.value)} />
        </div>
      )}
      <fieldset className="field">
        <legend className="field__lbl">Validité de l’offre</legend>
        <div className="choices">
          {[7, 10, 15].map((j) => (
            <button key={j} type="button" className="choice" aria-pressed={validite === j} onClick={() => setValidite(j)}>{j} jours</button>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor={`${uid}-k`}>Conditions (facultatif)</label>
        <textarea id={`${uid}-k`} rows={3} maxLength={1500} value={conditions}
          placeholder={financement === "comptant" ? "Sans condition suspensive de prêt" : "Sous condition suspensive d’obtention de prêt"}
          onChange={(e) => setConditions(e.target.value)} />
      </div>
      {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
      <button type="submit" className="btn btn--primary" disabled={envoi || !financement || valeur < 10_000}>
        {envoi ? "Envoi…" : "Envoyer mon offre à l’agent"}
      </button>
      <p className="compte-form__aide">Votre profil investisseur l’accompagne, s’il est rempli.</p>
    </form>
  );
}

/**
 * L'estimation détaillée, au curseur (MAV, 30/10/2026) : le vendeur fait
 * glisser le prix et voit le rendement, le prix au m² et son net vendeur.
 * Les honoraires de l'agence sont de 5 % du net vendeur (CLAUDE.md §10).
 */
export function EstimationAuCurseur({ valeur, prixM2, rendement }: { valeur: number; prixM2: number | null; rendement: number | null }) {
  const uid = useId();
  const p = pas(valeur);
  const min = Math.round((valeur * 0.85) / p) * p;
  const max = Math.round((valeur * 1.15) / p) * p;
  const [prix, setPrix] = useState(Math.round(valeur / p) * p);
  const surface = prixM2 ? valeur / prixM2 : null;
  const loyer = rendement ? (valeur * rendement) / 100 : null;
  const ecart = ((prix - valeur) / valeur) * 100;
  return (
    <div className="compte-panneau curseur-estimation">
      <div className="curseur__valeur">
        <output htmlFor={`${uid}-c`} className="curseur__montant">{euros(prix)}</output>
        <span className="curseur__note">
          {Math.abs(ecart) < 0.5 ? "Notre estimation" : `${ecart > 0 ? "+" : ""}${pct(ecart, 0)} par rapport à l’estimation`}
        </span>
      </div>
      <label htmlFor={`${uid}-c`} className="sr-only">Prix de mise en vente</label>
      <input id={`${uid}-c`} className="curseur" type="range" min={min} max={max} step={p} value={prix}
        style={piste(prix, min, max)} onChange={(e) => setPrix(Number(e.target.value))} aria-valuetext={euros(prix)} />
      <div className="curseur__bornes"><span>{euros(min)}</span><span>{euros(max)}</span></div>
      <dl className="compte-chiffres">
        <div><dt>Net vendeur</dt><dd>{euros(prix / 1.05)}</dd></div>
        {surface && <div><dt>Prix au m²</dt><dd>{euros(prix / surface)}</dd></div>}
        {loyer && <div><dt>Rendement brut</dt><dd>{pct((loyer / prix) * 100, 2)}</dd></div>}
        <div><dt>Honoraires</dt><dd>{euros(prix - prix / 1.05)}</dd></div>
      </dl>
      <p className="compte-form__aide">
        {ecart > 6
          ? "Au-dessus de l’estimation, les acquéreurs sont moins nombreux et la vente prend plus de temps."
          : ecart < -6
            ? "En dessous de l’estimation, la vente va plus vite, mais vous laissez de la valeur."
            : "Autour de l’estimation, le prix attire les acquéreurs sérieux sans rien laisser sur la table."}
      </p>
    </div>
  );
}
