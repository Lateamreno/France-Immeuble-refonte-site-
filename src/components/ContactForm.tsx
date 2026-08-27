"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowIcon } from "./ArrowIcon";
import { SITE } from "@/lib/site";

/** Contact générique. Les demandes d'estimation passent par le tunnel dédié. */
export function ContactForm() {
  const uid = useId();
  const [d, setD] = useState({ prenom: "", nom: "", email: "", telephone: "", message: "" });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [fini, setFini] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fini) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [fini]);

  const set = (k: keyof typeof d, v: string) => {
    setD((p) => ({ ...p, [k]: v }));
    setErreurs((p) => ({ ...p, [k]: "" }));
  };

  async function envoyer(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!d.prenom.trim()) e.prenom = "Requis.";
    if (!d.nom.trim()) e.nom = "Requis.";
    if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) e.email = "E-mail invalide.";
    if (!d.message.trim()) e.message = "Dites-nous en deux mots ce qui vous amène.";
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    try {
      await fetch("/api/lead/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "contact", ...d }),
      });
    } catch {
      /* tracé côté serveur — voir /api/lead */
    }
    type DL = { push: (o: Record<string, unknown>) => void };
    (window as unknown as { dataLayer?: DL }).dataLayer?.push({ event: "form_submit_contact" });
    setEnvoi(false);
    setFini(true);
  }

  if (fini) {
    return (
      <div className="form-shell outcome" ref={ref}>
        <span className="outcome__badge">Message envoyé</span>
        <h3>Merci {d.prenom}. Nous vous répondons rapidement.</h3>
        <p>
          Si c’est urgent, le téléphone reste le plus rapide — nous décrochons entre 9 h et 19 h.
        </p>
        <div className="btn-row">
          <a className="btn btn--outline" href={SITE.telHref}>{SITE.tel}</a>
        </div>
      </div>
    );
  }

  return (
    <form className="form-shell" onSubmit={envoyer} noValidate>
      <div className="step-head">
        <h3>Nous écrire</h3>
        <p>Pour une estimation, le formulaire dédié ira plus vite.</p>
      </div>
      <div className="fields fields--2">
        <div className="field">
          <label htmlFor={`${uid}-p`}>Prénom</label>
          <input id={`${uid}-p`} value={d.prenom} onChange={(e) => set("prenom", e.target.value)} autoComplete="given-name" />
          {erreurs.prenom && <span className="err">{erreurs.prenom}</span>}
        </div>
        <div className="field">
          <label htmlFor={`${uid}-n`}>Nom</label>
          <input id={`${uid}-n`} value={d.nom} onChange={(e) => set("nom", e.target.value)} autoComplete="family-name" />
          {erreurs.nom && <span className="err">{erreurs.nom}</span>}
        </div>
        <div className="field">
          <label htmlFor={`${uid}-e`}>E-mail</label>
          <input id={`${uid}-e`} type="email" value={d.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
          {erreurs.email && <span className="err">{erreurs.email}</span>}
        </div>
        <div className="field">
          <label htmlFor={`${uid}-t`}>Téléphone (facultatif)</label>
          <input id={`${uid}-t`} type="tel" value={d.telephone} onChange={(e) => set("telephone", e.target.value)} autoComplete="tel" />
        </div>
        <div className="field field--full">
          <label htmlFor={`${uid}-m`}>Votre message</label>
          <textarea id={`${uid}-m`} value={d.message} onChange={(e) => set("message", e.target.value)} />
          {erreurs.message && <span className="err">{erreurs.message}</span>}
        </div>
      </div>
      <div className="field-nav">
        <button type="submit" className="btn btn--primary" disabled={envoi}>
          {envoi ? "Envoi…" : "Envoyer"} {!envoi && <ArrowIcon />}
        </button>
      </div>
    </form>
  );
}
