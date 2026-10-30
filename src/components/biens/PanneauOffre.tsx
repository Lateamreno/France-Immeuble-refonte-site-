"use client";

import { useId, useState } from "react";
import { envoyer } from "@/components/compte/envoyer";
import { BoutonFavori } from "./BoutonFavori";
import { lienConnexion, useEtatCompte } from "./etat";

const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
const pct = (n: number, d = 1) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })}\u00a0%`;
const piste = (v: number, min: number, max: number) => ({ ["--rempli" as string]: `${((v - min) / (max - min)) * 100}%` });

/** Frais de notaire estimés pour un immeuble ancien. */
const NOTAIRE = 0.075;

/**
 * Le panneau de la fiche d'un immeuble à vendre (MAV, 31/10/2026, sur le
 * modèle de Plein Bail) : le prix, les favoris, l'appel, puis l'offre au
 * curseur avec la simulation de crédit. L'offre part à l'agent par le compte
 * (`offre_acquereur`, avec l'annonce) ; sans compte, on se connecte d'abord.
 */
export function PanneauOffre({
  annonce, prix, surface, loyerAn, statut, telephone, telHref,
}: {
  annonce: string; prix: number; surface: number | null; loyerAn: number | null;
  statut: "en_vente" | "sous_offre"; telephone: string; telHref: string;
}) {
  const uid = useId();
  const etat = useEtatCompte();
  const pas = prix >= 2_000_000 ? 10_000 : prix >= 500_000 ? 5_000 : 1_000;
  const min = Math.round((prix * 0.7) / pas) * pas;
  const max = Math.round((prix * 1.05) / pas) * pas;
  const [offre, setOffre] = useState(prix);
  const [saisie, setSaisie] = useState<string | null>(null);
  const [apportPct, setApportPct] = useState(20);
  const [duree, setDuree] = useState(20);
  const [taux, setTaux] = useState(3.6);
  const [numero, setNumero] = useState(false);
  const [etape, setEtape] = useState<"" | "details" | "envoi" | "fait">("");
  const [financement, setFinancement] = useState<"comptant" | "pret" | "mixte">("mixte");
  const [validite, setValidite] = useState(10);
  const [conditions, setConditions] = useState("");
  const [erreur, setErreur] = useState("");

  const borne = (n: number) => Math.min(max, Math.max(min, n));
  const honoraires = prix - prix / 1.05;
  const cout = offre * (1 + NOTAIRE);
  const apport = (cout * apportPct) / 100;
  const emprunt = Math.max(0, cout - apport);
  const r = taux / 100 / 12;
  const n = duree * 12;
  const mensualite = emprunt === 0 ? 0 : r === 0 ? emprunt / n : (emprunt * r) / (1 - (1 + r) ** -n);
  const loyerMois = loyerAn ? loyerAn / 12 : null;
  const cashFlow = loyerMois != null ? loyerMois - mensualite : null;
  const deja = etat?.offres?.filter((o) => o.annonce === annonce) ?? [];

  async function envoyerOffre() {
    setErreur("");
    setEtape("envoi");
    const res = await envoyer("/api/compte/offre/", {
      annonce, montant: offre, financement, validite_jours: validite, conditions,
      apport: financement === "comptant" ? undefined : Math.round(apport),
    });
    if (!res.ok) { setEtape("details"); setErreur(res.erreur ?? ""); return; }
    setEtape("fait");
  }

  return (
    <div className="panneau-offre" id="offre">
      <div className="panneau-offre__prix">
        <p className="panneau-offre__lbl">Prix</p>
        <p className="panneau-offre__montant">{euros(prix)} <small>HAI</small></p>
        <p className="panneau-offre__note">dont honoraires de {euros(honoraires)} TTC à la charge de l’acquéreur, 5 % du prix net vendeur</p>
      </div>

      <div className="panneau-offre__boutons">
        <BoutonFavori bien={annonce} libelle className="favori--plein" />
        {numero ? (
          <a className="btn btn--outline panneau-offre__tel" href={telHref}>{telephone}</a>
        ) : (
          <button type="button" className="btn btn--outline" onClick={() => setNumero(true)}>Voir le numéro</button>
        )}
        <a className="lien-discret" href="#dossier">Demander le dossier complet</a>
      </div>

      {deja.length > 0 && (
        <p className="panneau-offre__deja" role="status">
          Votre offre du {new Date(deja[0].envoye_le).toLocaleDateString("fr-FR")} : <strong>{euros(deja[0].montant)}</strong>. Votre agent vous rappelle.
        </p>
      )}

      {etape === "fait" ? (
        <div className="panneau-offre__fait" role="status">
          <p className="panneau-offre__lbl">Offre envoyée</p>
          <p className="panneau-offre__montant">{euros(offre)}</p>
          <p className="panneau-offre__note">Votre agent la reprend avec vous avant de la présenter au vendeur. Vous la retrouvez dans votre espace.</p>
        </div>
      ) : (
        <div className="panneau-offre__simulation">
          <p className="panneau-offre__lbl">Prix de mon offre</p>
          <div className="offre-saisie">
            <button type="button" aria-label={`Baisser l’offre de ${euros(pas)}`} onClick={() => { setSaisie(null); setOffre((x) => borne(x - pas)); }}>−</button>
            <input aria-label="Prix de mon offre en euros" inputMode="numeric" value={saisie ?? euros(offre)}
              onChange={(e) => setSaisie(e.target.value)}
              onBlur={() => { const v = Number((saisie ?? "").replace(/[^\d]/g, "")); if (v) setOffre(borne(v)); setSaisie(null); }} />
            <button type="button" aria-label={`Augmenter l’offre de ${euros(pas)}`} onClick={() => { setSaisie(null); setOffre((x) => borne(x + pas)); }}>+</button>
          </div>
          <input type="range" className="curseur" aria-label="Curseur du prix de mon offre" min={min} max={max} step={pas} value={offre}
            style={piste(offre, min, max)} aria-valuetext={euros(offre)} onChange={(e) => { setSaisie(null); setOffre(Number(e.target.value)); }} />

          <dl className="kpi">
            <div><dt>Mon prix</dt><dd>{euros(offre)}<small>{pct(((offre - prix) / prix) * 100, 0)}</small></dd></div>
            {surface ? <div><dt>Prix / m²</dt><dd>{euros(offre / surface)}</dd></div> : null}
            {loyerAn ? <div><dt>Rendement brut</dt><dd>{pct((loyerAn / offre) * 100)}<small>{pct((loyerAn / (offre * (1 + NOTAIRE))) * 100)} acte en main</small></dd></div> : null}
            {loyerMois != null && <div><dt>Loyer</dt><dd>{euros(loyerMois)}<small>par mois HC</small></dd></div>}
            <div><dt>Crédit</dt><dd>{euros(mensualite)}<small>par mois</small></dd></div>
            {cashFlow != null && (
              <div className={cashFlow >= 0 ? "kpi--plus" : "kpi--moins"}><dt>Cash-flow</dt><dd>{cashFlow >= 0 ? "+" : "−"}{euros(Math.abs(cashFlow))}<small>avant charges et impôts</small></dd></div>
            )}
          </dl>

          <div className="reglage">
            <label htmlFor={`${uid}-a`}>Apport</label><output htmlFor={`${uid}-a`}>{apportPct} % · {euros(apport)}</output>
            <input id={`${uid}-a`} type="range" className="curseur" min={0} max={100} step={5} value={apportPct} style={piste(apportPct, 0, 100)} onChange={(e) => setApportPct(Number(e.target.value))} />
          </div>
          <div className="reglage">
            <label htmlFor={`${uid}-d`}>Durée</label><output htmlFor={`${uid}-d`}>{duree} ans</output>
            <input id={`${uid}-d`} type="range" className="curseur" min={5} max={25} step={1} value={duree} style={piste(duree, 5, 25)} onChange={(e) => setDuree(Number(e.target.value))} />
          </div>
          <div className="reglage">
            <label htmlFor={`${uid}-t`}>Taux</label><output htmlFor={`${uid}-t`}>{pct(taux, 2)}</output>
            <input id={`${uid}-t`} type="range" className="curseur" min={1} max={6} step={0.05} value={taux} style={piste(taux, 1, 6)} onChange={(e) => setTaux(Number(e.target.value))} />
          </div>
          <p className="panneau-offre__note">
            Coût total estimé {euros(cout)}, frais de notaire de {pct(NOTAIRE * 100, 1)} compris. Simulation indicative.
          </p>

          {etape === "details" || etape === "envoi" ? (
            <div className="panneau-offre__details">
              <fieldset className="field">
                <legend className="field__lbl">Financement</legend>
                <div className="choices">
                  {([["comptant", "Comptant"], ["pret", "Prêt"], ["mixte", "Apport et prêt"]] as const).map(([k, v]) => (
                    <button key={k} type="button" className="choice" aria-pressed={financement === k} onClick={() => setFinancement(k)}>{v}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="field">
                <legend className="field__lbl">Validité de l’offre</legend>
                <div className="choices">
                  {[7, 10, 15].map((j) => (
                    <button key={j} type="button" className="choice" aria-pressed={validite === j} onClick={() => setValidite(j)}>{j} jours</button>
                  ))}
                </div>
              </fieldset>
              <div className="field">
                <label htmlFor={`${uid}-c`}>Conditions (facultatif)</label>
                <textarea id={`${uid}-c`} rows={2} maxLength={1500} value={conditions}
                  placeholder={financement === "comptant" ? "Sans condition suspensive de prêt" : "Sous condition suspensive d’obtention de prêt"}
                  onChange={(e) => setConditions(e.target.value)} />
              </div>
              {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
              <button type="button" className="btn btn--primary btn--wide" disabled={etape === "envoi"} onClick={envoyerOffre}>
                {etape === "envoi" ? "Envoi…" : `Envoyer mon offre de ${euros(offre)}`}
              </button>
              {!etat?.profil && (
                <p className="panneau-offre__note">
                  Une offre pèse plus avec votre profil investisseur. <a className="lien-discret" href="/mon-compte/profil/#investisseur">Le remplir</a>
                </p>
              )}
            </div>
          ) : (
            <button type="button" className="btn btn--primary btn--wide"
              onClick={() => (etat?.connecte ? setEtape("details") : window.location.assign(lienConnexion("#offre")))}>
              {statut === "sous_offre" ? "Faire une offre de second rang" : "Faire une offre"}
            </button>
          )}
          {etat && !etat.connecte && (
            <p className="panneau-offre__note">Avec votre espace client : favoris, offres en ligne et immeubles hors annonce.</p>
          )}
        </div>
      )}
    </div>
  );
}
