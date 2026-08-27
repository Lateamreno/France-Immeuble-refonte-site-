"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowIcon } from "./ArrowIcon";
import { SITE, CALIBRE } from "@/lib/site";
import { router as routerDossier, type Verdict } from "@/lib/routage";

/**
 * Tunnel d'estimation — CLAUDE.md §9 + note d'architecture.
 *
 * Ordre volontairement inversé par rapport au formulaire actuel : on pose
 * d'abord les questions sur l'immeuble, les coordonnées en dernier. Ça
 * augmente le taux de complétion ET ça permet de qualifier avant de demander
 * un effort au visiteur.
 *
 * ⚠️ Les libellés « bureaux » et « commerces » sont inversés dans le
 * formulaire actuel (§9). La correspondance est vérifiée ici.
 */

type Data = {
  ville: string; codePostal: string;
  lots: string; surface: string; typologie: string;
  loyerAnnuel: string; valeurEstimee: string;
  echeance: string;
  prenom: string; nom: string; email: string; telephone: string; message: string;
};

const VIDE: Data = {
  ville: "", codePostal: "", lots: "", surface: "", typologie: "",
  loyerAnnuel: "", valeurEstimee: "", echeance: "",
  prenom: "", nom: "", email: "", telephone: "", message: "",
};

const TYPOLOGIES = ["Habitation", "Mixte", "Bureaux", "Commerces", "Activité"];
const ECHEANCES = ["Dès maintenant", "Sous 6 mois", "Sous 12 mois", "Je me renseigne"];
const ETAPES = ["L’immeuble", "Les revenus", "Vos coordonnées"];

export function EstimationForm() {
  const uid = useId();
  const [etape, setEtape] = useState(0);
  const [d, setD] = useState<Data>(VIDE);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const set = (k: keyof Data, v: string) => {
    setD((p) => ({ ...p, [k]: v }));
    setErreurs((p) => ({ ...p, [k]: "" }));
  };

  function valider(n: number) {
    const e: Record<string, string> = {};
    if (n === 0) {
      if (!d.ville.trim()) e.ville = "Indiquez la commune.";
      if (!/^\d{5}$/.test(d.codePostal.trim())) e.codePostal = "Code postal à 5 chiffres.";
      if (!d.lots.trim()) e.lots = "Même approximatif.";
    }
    if (n === 1) {
      if (!d.valeurEstimee.trim()) e.valeurEstimee = "Une fourchette suffit.";
    }
    if (n === 2) {
      if (!d.prenom.trim()) e.prenom = "Requis.";
      if (!d.nom.trim()) e.nom = "Requis.";
      if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) e.email = "E-mail invalide.";
      if (d.telephone.replace(/\D/g, "").length < 9) e.telephone = "Téléphone invalide.";
    }
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  const suivant = () => { if (valider(etape)) setEtape((n) => n + 1); };
  const precedent = () => setEtape((n) => Math.max(0, n - 1));

  async function envoyer(ev: React.FormEvent) {
    ev.preventDefault();
    if (!valider(2)) return;
    setEnvoi(true);

    const v = routerDossier({
      codePostal: d.codePostal,
      valeurEstimee: Number(d.valeurEstimee) || null,
      loyerAnnuel: Number(d.loyerAnnuel) || null,
    });

    try {
      await fetch("/api/lead/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "estimation", ...d }),
      });
    } catch {
      // On n'affiche pas d'échec au visiteur : le handler serveur trace et
      // alerte. Perdre visuellement le lead serait pire que le tracer.
    }

    // Event GTM sur soumission réussie (CLAUDE.md §9) — le tracking de
    // conversion était défaillant, c'est le point à sécuriser.
    type DL = { push: (o: Record<string, unknown>) => void };
    const w = window as unknown as { dataLayer?: DL };
    w.dataLayer?.push({ event: "form_submit_estimation", piste: v.piste });

    setVerdict(v);
    setEnvoi(false);
  }

  if (verdict) return <Resultat verdict={verdict} prenom={d.prenom} />;

  const pct = ((etape + 1) / ETAPES.length) * 100;

  return (
    <form className="form-shell" onSubmit={envoyer} noValidate>
      <div className="progress">
        <span className="progress__label">
          Étape {etape + 1}/{ETAPES.length}
        </span>
        <span className="progress__track">
          <span className="progress__fill" style={{ width: `${pct}%` }} />
        </span>
      </div>

      {etape === 0 && (
        <>
          <div className="step-head">
            <h3>{ETAPES[0]}</h3>
            <p>Où se situe-t-il, et quelle est sa taille&nbsp;?</p>
          </div>
          <div className="fields fields--2">
            <Champ id={`${uid}-ville`} label="Commune" err={erreurs.ville}>
              <input id={`${uid}-ville`} value={d.ville} onChange={(e) => set("ville", e.target.value)}
                placeholder="Paris, Boulogne-Billancourt…" autoComplete="address-level2" />
            </Champ>
            <Champ id={`${uid}-cp`} label="Code postal" err={erreurs.codePostal}>
              <input id={`${uid}-cp`} value={d.codePostal} onChange={(e) => set("codePostal", e.target.value)}
                placeholder="75018" inputMode="numeric" maxLength={5} autoComplete="postal-code" />
            </Champ>
            <Champ id={`${uid}-lots`} label="Nombre de lots" err={erreurs.lots}>
              <input id={`${uid}-lots`} value={d.lots} onChange={(e) => set("lots", e.target.value)}
                placeholder="8" inputMode="numeric" />
            </Champ>
            <Champ id={`${uid}-surface`} label="Surface totale (m²)" hint="Carrez si vous l’avez">
              <input id={`${uid}-surface`} value={d.surface} onChange={(e) => set("surface", e.target.value)}
                placeholder="420" inputMode="numeric" />
            </Champ>
            <Champ id={`${uid}-typo`} label="Typologie dominante" full>
              <div className="choices">
                {TYPOLOGIES.map((t) => (
                  <button key={t} type="button" className="choice" aria-pressed={d.typologie === t}
                    onClick={() => set("typologie", t)}>{t}</button>
                ))}
              </div>
            </Champ>
          </div>
        </>
      )}

      {etape === 1 && (
        <>
          <div className="step-head">
            <h3>{ETAPES[1]}</h3>
            <p>Ces deux chiffres suffisent à situer le rendement.</p>
          </div>
          <div className="fields fields--2">
            <Champ id={`${uid}-loyer`} label="Loyers annuels HC (€)" hint="Hors charges, tel qu’encaissé">
              <input id={`${uid}-loyer`} value={d.loyerAnnuel} onChange={(e) => set("loyerAnnuel", e.target.value)}
                placeholder="180000" inputMode="numeric" />
            </Champ>
            <Champ id={`${uid}-valeur`} label="Valeur estimée (€)" err={erreurs.valeurEstimee}
              hint="Votre estimation, même approximative">
              <input id={`${uid}-valeur`} value={d.valeurEstimee} onChange={(e) => set("valeurEstimee", e.target.value)}
                placeholder="2400000" inputMode="numeric" />
            </Champ>
            <Champ id={`${uid}-ech`} label="Échéance de vente" full>
              <div className="choices">
                {ECHEANCES.map((t) => (
                  <button key={t} type="button" className="choice" aria-pressed={d.echeance === t}
                    onClick={() => set("echeance", t)}>{t}</button>
                ))}
              </div>
            </Champ>
          </div>
        </>
      )}

      {etape === 2 && (
        <>
          <div className="step-head">
            <h3>{ETAPES[2]}</h3>
            <p>Pour vous transmettre la fourchette argumentée sous 48&nbsp;h.</p>
          </div>
          <div className="fields fields--2">
            <Champ id={`${uid}-prenom`} label="Prénom" err={erreurs.prenom}>
              <input id={`${uid}-prenom`} value={d.prenom} onChange={(e) => set("prenom", e.target.value)} autoComplete="given-name" />
            </Champ>
            <Champ id={`${uid}-nom`} label="Nom" err={erreurs.nom}>
              <input id={`${uid}-nom`} value={d.nom} onChange={(e) => set("nom", e.target.value)} autoComplete="family-name" />
            </Champ>
            <Champ id={`${uid}-email`} label="E-mail" err={erreurs.email}>
              <input id={`${uid}-email`} type="email" value={d.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
            </Champ>
            <Champ id={`${uid}-tel`} label="Téléphone" err={erreurs.telephone}>
              <input id={`${uid}-tel`} type="tel" value={d.telephone} onChange={(e) => set("telephone", e.target.value)} autoComplete="tel" />
            </Champ>
            <Champ id={`${uid}-msg`} label="Précisions (facultatif)" full>
              <textarea id={`${uid}-msg`} value={d.message} onChange={(e) => set("message", e.target.value)}
                placeholder="Occupation, travaux à prévoir, contexte de la vente…" />
            </Champ>
          </div>
        </>
      )}

      <div className="field-nav">
        {etape > 0 && (
          <button type="button" className="btn btn--ghost" onClick={precedent}>Retour</button>
        )}
        {etape < 2 ? (
          <button type="button" className="btn btn--primary" onClick={suivant}>
            Continuer <ArrowIcon />
          </button>
        ) : (
          <button type="submit" className="btn btn--primary" disabled={envoi}>
            {envoi ? "Envoi…" : "Recevoir mon estimation"} {!envoi && <ArrowIcon />}
          </button>
        )}
      </div>
    </form>
  );
}

function Champ({ id, label, hint, err, full, children }: {
  id: string; label: string; hint?: string; err?: string; full?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`field${full ? " field--full" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !err && <span className="hint">{hint}</span>}
      {err && <span className="err">{err}</span>}
    </div>
  );
}

/** Le routage s'affiche comme une orientation. Jamais comme un refus. */
function Resultat({ verdict, prenom }: { verdict: Verdict; prenom: string }) {
  const rdt = verdict.rentabilite;
  const ref = useRef<HTMLDivElement>(null);

  // Le résultat est plus court que le formulaire : sans ça, la page reste
  // scrollée là où était l'étape 3 et le message passe sous le header collant.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  if (verdict.piste === "pleinbail") {
    return (
      <div className="form-shell outcome" ref={ref}>
        <span className="outcome__badge outcome__badge--autre">Demande enregistrée</span>
        <h3>Merci {prenom}. Votre bien ira plus vite sur PleinBail.</h3>
        <p>
          Notre fichier d’investisseurs se concentre sur les immeubles à partir de{" "}
          {CALIBRE.ticketMinLabel} et sur la province au-delà de{" "}
          {CALIBRE.rentabiliteProvinceMin}&nbsp;% de rendement. Le vôtre trouvera une audience
          plus large sur <strong>PleinBail</strong>, notre plateforme dédiée aux biens loués —
          même groupe, même exigence.
        </p>
        {rdt !== null && (
          <p>Rendement brut calculé sur vos chiffres&nbsp;: <strong>{rdt.toFixed(1)} %</strong>.</p>
        )}
        <div className="btn-row">
          <a className="btn btn--primary" href={SITE.pleinbail} target="_blank" rel="noopener">
            Déposer sur PleinBail <ArrowIcon />
          </a>
          <a className="btn btn--outline" href={SITE.telHref}>{SITE.tel}</a>
        </div>
      </div>
    );
  }

  const prioritaire = verdict.piste === "prioritaire";
  return (
    <div className="form-shell outcome" ref={ref}>
      <span className="outcome__badge">
        {prioritaire ? "Dossier prioritaire" : "Dossier retenu"}
      </span>
      <h3>Merci {prenom}. Nous revenons vers vous sous 48&nbsp;h.</h3>
      <p>
        {prioritaire
          ? "Votre immeuble correspond au cœur de ce que nous traitons. Un interlocuteur vous rappelle avec une fourchette argumentée, appuyée sur nos transactions comparables."
          : "Le rendement de votre immeuble intéresse notre fichier. Un interlocuteur vous rappelle avec une fourchette argumentée."}
      </p>
      {rdt !== null && (
        <p>Rendement brut calculé sur vos chiffres&nbsp;: <strong>{rdt.toFixed(1)} %</strong>.</p>
      )}
      <p>
        Rien n’est diffusé, rien n’est publié. Votre immeuble n’apparaîtra nulle part tant que
        vous ne l’aurez pas décidé.
      </p>
      <div className="btn-row">
        <a className="btn btn--outline" href={SITE.telHref}>
          Nous joindre directement · {SITE.tel}
        </a>
      </div>
    </div>
  );
}
