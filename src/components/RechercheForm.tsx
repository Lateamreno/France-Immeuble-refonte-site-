"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowIcon } from "./ArrowIcon";
import { SITE } from "@/lib/site";

/**
 * Dépôt de recherche acquéreur.
 *
 * C'est l'acquéreur qui règle les honoraires : un acquéreur sans capacité de
 * financement ne fait pas perdre du temps, il fait échouer la vente. Ce
 * formulaire qualifie donc sur le ticket et le financement — il ne collecte
 * pas des adresses e-mail.
 */

type Data = {
  zones: string; ticket: string; rendement: string; financement: string;
  profil: string; prenom: string; nom: string; email: string; telephone: string; message: string;
};

const VIDE: Data = {
  zones: "", ticket: "", rendement: "", financement: "",
  profil: "", prenom: "", nom: "", email: "", telephone: "", message: "",
};

const TICKETS = ["< 1 M€", "1 – 2 M€", "2 – 4 M€", "4 – 7 M€", "> 7 M€"];
const FINANCEMENTS = ["Fonds propres", "Crédit à obtenir", "Accord bancaire en place", "Mixte"];
const PROFILS = ["Particulier", "Marchand de biens", "SCI patrimoniale", "Family office", "Foncière"];

export function RechercheForm() {
  const uid = useId();
  const [d, setD] = useState<Data>(VIDE);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [fini, setFini] = useState(false);
  const refFini = useRef<HTMLDivElement>(null);

  // Idem estimation : l'écran de confirmation doit revenir dans le champ de vision.
  useEffect(() => {
    if (fini) refFini.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [fini]);

  const set = (k: keyof Data, v: string) => {
    setD((p) => ({ ...p, [k]: v }));
    setErreurs((p) => ({ ...p, [k]: "" }));
  };

  async function envoyer(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!d.zones.trim()) e.zones = "Indiquez au moins une zone.";
    if (!d.ticket) e.ticket = "Requis — c’est ce qui nous permet de filtrer.";
    if (!d.financement) e.financement = "Requis.";
    if (!d.prenom.trim()) e.prenom = "Requis.";
    if (!d.nom.trim()) e.nom = "Requis.";
    if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) e.email = "E-mail invalide.";
    if (d.telephone.replace(/\D/g, "").length < 9) e.telephone = "Téléphone invalide.";
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    try {
      await fetch("/api/lead/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "recherche_acquereur", ...d }),
      });
    } catch {
      /* tracé côté serveur — voir /api/lead */
    }
    type DL = { push: (o: Record<string, unknown>) => void };
    (window as unknown as { dataLayer?: DL }).dataLayer?.push({
      event: "form_submit_recherche",
      ticket: d.ticket,
    });
    setEnvoi(false);
    setFini(true);
  }

  if (fini) {
    return (
      <div className="form-shell outcome" ref={refFini}>
        <span className="outcome__badge">Recherche enregistrée</span>
        <h3>Merci {d.prenom}. Vous êtes dans le fichier.</h3>
        <p>
          Dès qu’un immeuble correspond à vos critères, vous le recevez avant qu’il ne soit
          présenté à qui que ce soit d’autre. Pas de newsletter, pas d’envoi de masse : uniquement
          des dossiers qui collent à ce que vous venez de nous dire.
        </p>
        <div className="btn-row">
          <a className="btn btn--outline" href={SITE.telHref}>
            Nous joindre · {SITE.tel}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="form-shell" onSubmit={envoyer} noValidate>
      <div className="step-head">
        <h3>Déposer votre recherche</h3>
        <p>Plus vos critères sont précis, plus ce que vous recevrez sera pertinent.</p>
      </div>

      <div className="fields fields--2">
        <Champ id={`${uid}-zones`} label="Zones recherchées" err={erreurs.zones} full
          hint="Communes, arrondissements ou départements">
          <input id={`${uid}-zones`} value={d.zones} onChange={(e) => set("zones", e.target.value)}
            placeholder="Paris 11e, 18e, 20e — Montreuil, Saint-Ouen" />
        </Champ>

        <Champ id={`${uid}-ticket`} label="Budget d’acquisition" err={erreurs.ticket} full>
          <div className="choices">
            {TICKETS.map((t) => (
              <button key={t} type="button" className="choice" aria-pressed={d.ticket === t}
                onClick={() => set("ticket", t)}>{t}</button>
            ))}
          </div>
        </Champ>

        <Champ id={`${uid}-fin`} label="Financement" err={erreurs.financement} full>
          <div className="choices">
            {FINANCEMENTS.map((t) => (
              <button key={t} type="button" className="choice" aria-pressed={d.financement === t}
                onClick={() => set("financement", t)}>{t}</button>
            ))}
          </div>
        </Champ>

        <Champ id={`${uid}-profil`} label="Vous êtes" full>
          <div className="choices">
            {PROFILS.map((t) => (
              <button key={t} type="button" className="choice" aria-pressed={d.profil === t}
                onClick={() => set("profil", t)}>{t}</button>
            ))}
          </div>
        </Champ>

        <Champ id={`${uid}-rdt`} label="Rendement brut visé (%)" hint="Facultatif">
          <input id={`${uid}-rdt`} value={d.rendement} onChange={(e) => set("rendement", e.target.value)}
            placeholder="7" inputMode="decimal" />
        </Champ>
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
            placeholder="Typologie recherchée, tolérance aux travaux, horizon de détention…" />
        </Champ>
      </div>

      <div className="field-nav">
        <button type="submit" className="btn btn--primary" disabled={envoi}>
          {envoi ? "Envoi…" : "Déposer ma recherche"} {!envoi && <ArrowIcon />}
        </button>
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
