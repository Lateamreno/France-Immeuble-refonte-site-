"use client";

import { useEffect, useId, useRef, useState } from "react";
import { envoyer } from "@/components/compte/envoyer";
import type { BienAVendre } from "@/lib/biens";
import {
  charges, classeDpe, decomposition, eur, etiquetteDpe, loyerAffiche, m2, mensualite, notairePour, pct, rendements,
} from "@/lib/annonce";
import { BoutonFavori } from "./BoutonFavori";
import { ouvrirCompte, useEtatCompte } from "./etat";

const piste = (v: number, min: number, max: number) => ({ ["--rempli" as string]: `${((v - min) / (max - min)) * 100}%` });
const lireEntier = (s: string) => { const t = s.replace(/[^\d]/g, ""); return t ? Number(t) : null; };
const signe = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "");

function Marteau() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="m13.5 4.5 6 6M11 7l6 6M12.2 5.8l-4.4 4.4 6 6 4.4-4.4zM9.8 12.2 3.5 18.5l2 2 6.3-6.3M4 21h9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Sim = {
  offre: number; setOffre: (n: number) => void;
  apportPct: number; setApportPct: (n: number) => void;
  duree: number; setDuree: (n: number) => void;
  taux: number; setTaux: (n: number) => void;
};

/**
 * La carte d'action de la fiche (spec Plein Bail §11) : identité et DPE, prix
 * HAI et honoraires, favoris, numéro, contact, puis la simulation et « Faire
 * une offre ». Sur ordinateur (≥ 900 px de large ET ≥ 660 px de haut) elle
 * colle à droite ; en dessous, une carte compacte dans le flux, une barre
 * collante en bas d'écran, et la simulation complète dans la feuille d'offre.
 */
export function CarteAction({
  b, telephone, telHref, prixM2Secteur, rentaVille = null,
}: {
  b: BienAVendre; telephone: string; telHref: string; prixM2Secteur: number | null;
  /** Rentabilité brute moyenne de la ville (Plein Bail), en %. */
  rentaVille?: number | null;
}) {
  const etat = useEtatCompte();
  const pas = 1_000;
  const min = Math.round((b.prixHai * 0.7) / pas) * pas;
  const max = Math.round((b.prixHai * 1.05) / pas) * pas;
  const [offre, setOffreBrute] = useState(b.prixHai);
  const setOffre = (n: number) => setOffreBrute(Math.min(max, Math.max(min, Math.round(n))));
  const [apportPct, setApportPct] = useState(20);
  const [duree, setDuree] = useState(20);
  const [taux, setTaux] = useState(3.5);
  const [numero, setNumero] = useState(false);
  const [feuille, setFeuille] = useState<"" | "offre" | "contact">("");
  const { honoraires } = decomposition(b);
  const deja = etat?.offres?.filter((o) => o.annonce === b.id) ?? [];
  const sim: Sim = { offre, setOffre, apportPct, setApportPct, duree, setDuree, taux, setTaux };

  // Revenu de la fenêtre de compte avec « #offre » : l'offre s'ouvre seule.
  useEffect(() => {
    if (etat?.connecte && window.location.hash === "#offre") {
      setFeuille("offre");
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [etat?.connecte]);

  const voirNumero = () => {
    setNumero(true);
    (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event: "voir_numero", bien: b.id });
  };
  const ouvrir = (f: "offre" | "contact") => {
    if (!etat?.connecte) {
      if (f === "contact") { document.getElementById("dossier")?.scrollIntoView({ behavior: "smooth" }); return; }
      ouvrirCompte({ ancre: "#offre" });
      return;
    }
    setFeuille(f);
  };
  const libelleOffre = b.statut === "sous_offre" ? "Faire une offre de second rang" : "Faire une offre";

  return (
    <>
      <div className="carte-action" id="offre">
        <p className="carte-action__identite">
          <span>{[b.type, b.lots != null ? `${b.lots} lots` : null, b.surface != null ? m2(b.surface) : null].filter(Boolean).join(" · ")}</span>
          <span className={`dpe-etiquette dpe-etiquette--${(classeDpe(b) ?? "nc").toLowerCase()}`}>
            {classeDpe(b) ? `DPE ${etiquetteDpe(b.dpeMin, b.dpe)}` : "DPE n.c."}
          </span>
        </p>
        <div className="carte-action__prix">
          <p className="carte-action__lbl">Prix</p>
          <p className="carte-action__montant">{eur(b.prixHai)} <small>HAI</small></p>
          <p className="carte-action__note">dont honoraires de {eur(honoraires)} TTC à la charge de l’acquéreur</p>
        </div>

        {/* Retour #171 (MAV, 04/11/2026) : la barrette de prix reste dans la colonne, avec
            l'écart à l'annonce, le prix au m² et les trois rendements face au marché. */}
        <div className="seulement-large">
          <Barrette b={b} sim={sim} min={min} max={max} pas={pas} prixM2Secteur={prixM2Secteur} rentaVille={rentaVille} />
        </div>

        {deja.length > 0 && (
          <p className="carte-action__deja" role="status">
            Votre offre du {new Date(deja[0].envoye_le).toLocaleDateString("fr-FR")} : <strong>{eur(deja[0].montant)}</strong>. Votre agent vous rappelle.
          </p>
        )}

        <div className="carte-action__boutons">
          {/* Retour #180 : le cœur à côté des deux boutons, la colonne tient dans l'écran. */}
          <BoutonFavori bien={b.id} libelle className="favori--plein favori--rond" />
          <div className="carte-action__duo">
            {numero ? (
              <a className="btn btn--outline carte-action__tel" href={telHref}>{telephone}</a>
            ) : (
              <button type="button" className="btn btn--outline" onClick={voirNumero}>Voir le n°</button>
            )}
            <button type="button" className="btn btn--outline" onClick={() => ouvrir("contact")}>Contacter</button>
          </div>
        </div>

        {/* L'offre avant la simulation : visible sans faire défiler la colonne. */}
        <button type="button" className="btn btn--primary btn--wide carte-action__offre" onClick={() => ouvrir("offre")}>
          <Marteau />{libelleOffre}
        </button>

        <button type="button" className="carte-action__simuler" onClick={() => ouvrir("offre")}>Simuler mon financement</button>
        <div className="carte-action__simulation seulement-large">
          <Simulation b={b} sim={sim} min={min} max={max} pas={pas} prixM2Secteur={prixM2Secteur} financementSeul />
        </div>
        {etat && !etat.connecte && (
          <p className="carte-action__note">Avec votre espace client : favoris, offres en ligne et immeubles hors annonce.</p>
        )}
      </div>

      {/* Au téléphone : toujours sous le pouce. */}
      <div className="barre-offre seulement-compact" role="group" aria-label="Contacter l’agence ou faire une offre">
        <div className="barre-offre__duo">
          {numero ? (
            <a className="btn btn--outline" href={telHref}>{telephone}</a>
          ) : (
            <button type="button" className="btn btn--outline" onClick={voirNumero}>Voir le n°</button>
          )}
          <button type="button" className="btn btn--outline" onClick={() => ouvrir("contact")}>Contacter</button>
        </div>
        <button type="button" className="btn btn--primary btn--wide" onClick={() => ouvrir("offre")}><Marteau />{libelleOffre}</button>
      </div>

      {feuille === "offre" && (
        <FeuilleOffre b={b} sim={sim} min={min} max={max} pas={pas} prixM2Secteur={prixM2Secteur}
          prenom={etat?.prenom ?? ""} nom={etat?.nom ?? ""} profil={!!etat?.profil} onFermer={() => setFeuille("")} />
      )}
      {feuille === "contact" && <FeuilleContact b={b} onFermer={() => setFeuille("")} />}
    </>
  );
}

/** Le prix de l'offre : saisie au clavier, boutons − et +, curseur. */
function SaisieOffre({ sim, min, max, pas }: { sim: Sim; min: number; max: number; pas: number }) {
  const [saisie, setSaisie] = useState<string | null>(null);
  const { offre, setOffre } = sim;
  return (
    <>
      <p className="carte-action__lbl">Prix de mon offre</p>
      <div className="offre-saisie">
        <button type="button" aria-label={`Baisser l’offre de ${eur(pas)}`} onClick={() => { setSaisie(null); setOffre(offre - pas); }}>−</button>
        <input aria-label="Prix de mon offre en euros" inputMode="numeric" value={saisie ?? eur(offre)}
          onChange={(e) => setSaisie(e.target.value)}
          onBlur={() => { const v = lireEntier(saisie ?? ""); if (v) setOffre(v); setSaisie(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
        <button type="button" aria-label={`Augmenter l’offre de ${eur(pas)}`} onClick={() => { setSaisie(null); setOffre(offre + pas); }}>+</button>
      </div>
      <input type="range" className="curseur" aria-label="Curseur du prix de mon offre" min={min} max={max} step={pas} value={offre}
        style={piste(offre, min, max)} aria-valuetext={eur(offre)} onChange={(e) => { setSaisie(null); setOffre(Number(e.target.value)); }} />
    </>
  );
}

/**
 * La barrette de la colonne (retour #171) : le prix de l'offre, puis sur une ligne le
 * prix et le prix au m², sur la suivante les trois rendements. Écarts comme Plein
 * Bail : en or quand ils sont favorables à l'acquéreur. La rentabilité de la ville
 * est brute : seul le rendement brut s'y compare.
 */
function Barrette({
  b, sim, min, max, pas, prixM2Secteur, rentaVille,
}: { b: BienAVendre; sim: Sim; min: number; max: number; pas: number; prixM2Secteur: number | null; rentaVille: number | null }) {
  const { offre } = sim;
  const ecartPrix = ((offre - b.prixHai) / b.prixHai) * 100;
  const pm2 = b.surface ? offre / b.surface : null;
  const ecartM2 = pm2 && prixM2Secteur ? ((pm2 - prixM2Secteur) / prixM2Secteur) * 100 : null;
  const r = rendements(b, offre);
  const rd = r.potentiel ?? r.actuel;
  const ecartRdt = rd && rentaVille ? ((rd.brut - rentaVille) / rentaVille) * 100 : null;
  return (
    <div className="barrette">
      <SaisieOffre sim={sim} min={min} max={max} pas={pas} />
      <dl className="kpi kpi--deux">
        <div><dt>Mon prix</dt><dd>{eur(offre)}<small className={ecartPrix < 0 ? "ecart--bien" : undefined}>{Math.round(ecartPrix * 10) === 0 ? "prix demandé" : `${signe(ecartPrix)}${pct(Math.abs(ecartPrix), 1)} vs annonce`}</small></dd></div>
        {pm2 != null && <div><dt>Prix / m²</dt><dd>{eur(pm2)}<small className={ecartM2 == null ? undefined : ecartM2 < 0 ? "ecart--bien" : "ecart--moins"}>{ecartM2 != null ? `${signe(ecartM2)}${pct(Math.abs(ecartM2), 0)} vs marché` : " "}</small></dd></div>}
      </dl>
      {rd && (
        <dl className="kpi">
          <div><dt>Brut</dt><dd>{pct(rd.brut, 2)}<small className={ecartRdt == null ? undefined : ecartRdt > 0 ? "ecart--bien" : "ecart--moins"}>{ecartRdt != null ? `${signe(ecartRdt)}${pct(Math.abs(ecartRdt), 0)} vs ville` : " "}</small></dd></div>
          <div><dt>Net</dt><dd>{pct(rd.net, 2)}<small>charges déduites</small></dd></div>
          <div><dt>Acte en main</dt><dd>{pct(rd.aem, 2)}<small>notaire compris</small></dd></div>
        </dl>
      )}
    </div>
  );
}

/** Six vignettes et trois curseurs, recalculés en direct, frais de notaire réels compris. */
function Simulation({
  b, sim, min, max, pas, prixM2Secteur, financementSeul = false,
}: { b: BienAVendre; sim: Sim; min: number; max: number; pas: number; prixM2Secteur: number | null; financementSeul?: boolean }) {
  const uid = useId();
  const { offre, apportPct, setApportPct, duree, setDuree, taux, setTaux } = sim;
  const notaire = notairePour(b, offre);
  const travaux = b.travauxTotal ?? 0;
  const cout = offre + notaire + travaux;
  const apport = (cout * apportPct) / 100;
  const credit = mensualite(cout - apport, taux, duree);
  const loyer = loyerAffiche(b);
  const nr = charges(b)?.nonRecuperables ?? 0;
  const loyerNet = loyer != null ? (loyer - nr) / 12 : null;
  const cash = loyerNet != null ? loyerNet - credit : null;
  const r = rendements(b, offre);
  const rd = r.potentiel ?? r.actuel;
  const ecartPrix = ((offre - b.prixHai) / b.prixHai) * 100;
  const pm2 = b.surface ? offre / b.surface : null;
  const ecartM2 = pm2 && prixM2Secteur ? ((pm2 - prixM2Secteur) / prixM2Secteur) * 100 : null;

  return (
    <div className="simulation">
      {!financementSeul && <SaisieOffre sim={sim} min={min} max={max} pas={pas} />}

      <dl className="kpi">
        {!financementSeul && <div><dt>Mon prix</dt><dd>{eur(offre)}<small>{ecartPrix === 0 ? "prix demandé" : `${signe(ecartPrix)}${pct(Math.abs(ecartPrix), 1)} vs annonce`}</small></dd></div>}
        {!financementSeul && pm2 != null && <div><dt>Prix / m²</dt><dd>{eur(pm2)}<small className={ecartM2 == null ? undefined : ecartM2 < 0 ? "ecart--bien" : "ecart--moins"}>{ecartM2 != null ? `${signe(ecartM2)}${pct(Math.abs(ecartM2), 0)} vs marché` : " "}</small></dd></div>}
        {!financementSeul && rd && (
          <div className="kpi--triple"><dt>Rendement</dt>
            <dd>{pct(rd.brut, 2)}<small>brut</small></dd>
            <dd className="kpi__sous">{pct(rd.net, 2)} net · {pct(rd.aem, 2)} AEM</dd>
          </div>
        )}
        {loyerNet != null && <div><dt>Loyer net</dt><dd>{eur(loyerNet)}<small>par mois</small></dd></div>}
        <div><dt>Crédit</dt><dd>{eur(credit)}<small>par mois</small></dd></div>
        {cash != null && (
          <div className={cash >= 0 ? "kpi--plus" : "kpi--moins"}><dt>Cash flow</dt><dd>{signe(cash)}{eur(Math.abs(cash))}<small>par mois</small></dd></div>
        )}
      </dl>

      <div className="reglage">
        <label htmlFor={`${uid}-a`}>Apport</label><output htmlFor={`${uid}-a`}>{apportPct} % · {eur(apport)}</output>
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
      <p className="carte-action__note">
        Coût total {eur(cout)} : prix, frais de notaire estimés de {eur(notaire)}{travaux ? `, travaux de ${eur(travaux)}` : ""}.
        Financement = coût total moins l’apport. Simulation indicative.
      </p>
    </div>
  );
}

/** Une feuille qui monte du bas au téléphone, une fenêtre au centre sur ordinateur. */
function Feuille({ titre, onFermer, children }: { titre: string; onFermer: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog ref={ref} className="feuille" aria-labelledby={`${uid}-t`} onClose={onFermer}
      onClick={(e) => { if (e.target === e.currentTarget) onFermer(); }}>
      <div className="feuille__corps">
        <div className="feuille__tete">
          <h2 id={`${uid}-t`}>{titre}</h2>
          <button type="button" className="feuille__fermer" aria-label="Fermer" onClick={onFermer}>×</button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

const VALIDITES = [7, 15, 30, 45];

function FeuilleOffre({
  b, sim, min, max, pas, prixM2Secteur, prenom: p0, nom: n0, profil, onFermer,
}: {
  b: BienAVendre; sim: Sim; min: number; max: number; pas: number; prixM2Secteur: number | null;
  prenom: string; nom: string; profil: boolean; onFermer: () => void;
}) {
  const uid = useId();
  const [prenom, setPrenom] = useState(p0);
  const [nom, setNom] = useState(n0);
  const [societe, setSociete] = useState("");
  const [validite, setValidite] = useState(15);
  const [pret, setPret] = useState(true);
  const coutEstime = sim.offre + notairePour(b, sim.offre) + (b.travauxTotal ?? 0);
  const [apport, setApport] = useState(String(Math.round((coutEstime * sim.apportPct) / 100)));
  const [finance, setFinance] = useState(String(Math.round(coutEstime - (coutEstime * sim.apportPct) / 100)));
  const [visite, setVisite] = useState(true);
  const [autre, setAutre] = useState("");
  const [joindre, setJoindre] = useState(profil);
  const [etape, setEtape] = useState<"" | "envoi" | "fait">("");
  const [erreur, setErreur] = useState("");

  async function envoyerOffre(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (!prenom.trim() || !nom.trim()) { setErreur("Indiquez votre prénom et votre nom."); return; }
    const a = lireEntier(apport), f = lireEntier(finance);
    if (pret && (a == null || !f)) { setErreur("Indiquez votre apport et le montant financé."); return; }
    setEtape("envoi");
    const res = await envoyer("/api/compte/offre/", {
      annonce: b.id, montant: sim.offre, validite_jours: validite,
      financement: !pret ? "comptant" : a ? "mixte" : "pret",
      apport: pret ? a : undefined, montant_finance: pret ? f : undefined,
      condition_pret: pret, condition_visite: visite, conditions: autre,
      prenom, nom, societe, profil_joint: joindre,
    });
    if (!res.ok) { setEtape(""); setErreur(res.erreur ?? "Envoi impossible pour le moment."); return; }
    setEtape("fait");
  }

  return (
    <Feuille titre={etape === "fait" ? "Offre envoyée" : "Faire une offre"} onFermer={onFermer}>
      {etape === "fait" ? (
        <div className="feuille__fait" role="status">
          <p className="carte-action__montant">{eur(sim.offre)}</p>
          <p>Votre agent la reprend avec vous avant de la présenter au vendeur. Vous la retrouvez dans votre espace.</p>
          <button type="button" className="btn btn--primary" onClick={onFermer}>Fermer</button>
        </div>
      ) : (
        <form className="feuille__form" onSubmit={envoyerOffre}>
          <div className="feuille__sim">
            <Simulation b={b} sim={sim} min={min} max={max} pas={pas} prixM2Secteur={prixM2Secteur} />
          </div>
          <div className="feuille__grille">
            <div className="field"><label htmlFor={`${uid}-p`}>Prénom *</label><input id={`${uid}-p`} autoComplete="given-name" value={prenom} onChange={(e) => setPrenom(e.target.value)} required /></div>
            <div className="field"><label htmlFor={`${uid}-n`}>Nom *</label><input id={`${uid}-n`} autoComplete="family-name" value={nom} onChange={(e) => setNom(e.target.value)} required /></div>
            <div className="field feuille__large"><label htmlFor={`${uid}-s`}>Société (facultatif)</label><input id={`${uid}-s`} autoComplete="organization" value={societe} onChange={(e) => setSociete(e.target.value)} /></div>
          </div>
          <p className="feuille__montant">Montant de l’offre : <strong>{eur(sim.offre)}</strong> <small>honoraires inclus</small></p>
          <fieldset className="field">
            <legend className="field__lbl">Valable pendant</legend>
            <div className="choices">
              {VALIDITES.map((j) => (
                <button key={j} type="button" className="choice" aria-pressed={validite === j} onClick={() => setValidite(j)}>{j} jours</button>
              ))}
            </div>
          </fieldset>
          <label className="feuille__case"><input type="checkbox" checked={pret} onChange={(e) => setPret(e.target.checked)} />Sous condition d’obtention d’un prêt</label>
          {pret && (
            <div className="feuille__grille">
              <div className="field"><label htmlFor={`${uid}-a`}>Apport *</label><input id={`${uid}-a`} inputMode="numeric" value={apport ? eur(Number(apport.replace(/[^\d]/g, "")) || 0) : ""} onChange={(e) => setApport(e.target.value.replace(/[^\d]/g, ""))} /></div>
              <div className="field"><label htmlFor={`${uid}-f`}>Montant financé *</label><input id={`${uid}-f`} inputMode="numeric" value={finance ? eur(Number(finance.replace(/[^\d]/g, "")) || 0) : ""} onChange={(e) => setFinance(e.target.value.replace(/[^\d]/g, ""))} /></div>
            </div>
          )}
          <label className="feuille__case"><input type="checkbox" checked={visite} onChange={(e) => setVisite(e.target.checked)} />Sous réserve d’une visite concluante</label>
          <div className="field">
            <label htmlFor={`${uid}-c`}>Autre condition (facultatif)</label>
            <textarea id={`${uid}-c`} rows={2} maxLength={500} value={autre} onChange={(e) => setAutre(e.target.value)} />
            <small className="feuille__compte">{autre.length} / 500</small>
          </div>
          {profil ? (
            <label className="feuille__case"><input type="checkbox" checked={joindre} onChange={(e) => setJoindre(e.target.checked)} />Appuyer mon offre de mon profil investisseur</label>
          ) : (
            <p className="carte-action__note feuille__gauche">
              Une offre pèse plus avec votre profil investisseur. <a className="lien-discret" href="/mon-compte/profil/#investisseur">Le remplir</a>
            </p>
          )}
          <p className="feuille__mentions">
            Cette offre est une déclaration d’intention. Elle ne vous engage pas et aucun fonds ne transite par le site.
            Votre agent la reprend avec vous avant de la présenter au vendeur, qui verra votre nom ou celui de votre société. Pour un immeuble à usage d’habitation,
            l’acquéreur non professionnel dispose d’un délai de rétractation de dix jours après la signature de
            l’avant-contrat (article L271-1 du code de la construction et de l’habitation).
          </p>
          {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
          <button type="submit" className="btn btn--primary btn--wide" disabled={etape === "envoi"}>
            <Marteau />{etape === "envoi" ? "Envoi…" : `Envoyer mon offre de ${eur(sim.offre)}`}
          </button>
        </form>
      )}
    </Feuille>
  );
}

function FeuilleContact({ b, onFermer }: { b: BienAVendre; onFermer: () => void }) {
  const uid = useId();
  const [texte, setTexte] = useState("");
  const [tel, setTel] = useState("");
  const [etape, setEtape] = useState<"" | "envoi" | "fait">("");
  const [erreur, setErreur] = useState("");
  async function envoyerMessage(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (texte.trim().length < 2) { setErreur("Écrivez votre message."); return; }
    setEtape("envoi");
    const r = await envoyer("/api/compte/message/", {
      titre: `${b.type} à ${b.ville} (${b.dept})`, annonce: b.id,
      texte: tel.trim() ? `${texte.trim()}\n\nTéléphone : ${tel.trim()}` : texte.trim(),
    });
    if (!r.ok) { setEtape(""); setErreur(r.erreur ?? "Envoi impossible pour le moment."); return; }
    setEtape("fait");
  }
  return (
    <Feuille titre="Contacter l’agence" onFermer={onFermer}>
      {etape === "fait" ? (
        <div className="feuille__fait" role="status">
          <p>Message envoyé. Votre agent vous répond dans votre espace, et par e-mail.</p>
          <a className="btn btn--primary" href="/mon-compte/messages/">Voir mes messages</a>
        </div>
      ) : (
        <form className="feuille__form" onSubmit={envoyerMessage}>
          <p className="carte-action__note feuille__gauche">Au sujet de : {b.titre}</p>
          <div className="field">
            <label htmlFor={`${uid}-m`}>Votre message *</label>
            <textarea id={`${uid}-m`} rows={5} maxLength={5000} value={texte} onChange={(e) => setTexte(e.target.value)}
              placeholder="Une question sur l’immeuble, une demande de visite ou de documents…" />
          </div>
          <div className="field">
            <label htmlFor={`${uid}-t`}>Téléphone (facultatif)</label>
            <input id={`${uid}-t`} type="tel" autoComplete="tel" value={tel} onChange={(e) => setTel(e.target.value)} />
          </div>
          {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
          <button type="submit" className="btn btn--primary btn--wide" disabled={etape === "envoi"}>{etape === "envoi" ? "Envoi…" : "Envoyer"}</button>
        </form>
      )}
    </Feuille>
  );
}
