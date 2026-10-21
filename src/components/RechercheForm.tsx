"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowIcon } from "./ArrowIcon";
import { SITE } from "@/lib/site";

/**
 * Dépôt de recherche acquéreur.
 *
 * C'est l'acquéreur qui règle les honoraires : un acquéreur sans capacité de
 * financement ne fait pas perdre du temps, il fait échouer la vente. Ce
 * formulaire qualifie donc sur le budget et le financement — il ne collecte
 * pas des adresses e-mail.
 *
 * Contrat BO du 21/10/2026 : un contact, et une ou plusieurs recherches. Le BO
 * crée (ou retrouve par e-mail) le contact, puis une recherche au statut D par
 * entrée du tableau `recherches`. Les valeurs de `cible` et de `destinations`
 * sont celles du BO, au caractère près : une valeur qu'il ne connaît pas ne
 * correspond à rien chez lui.
 */

const CIBLES = ["Investisseur", "Marchand de biens", "Patrimonial", "Promoteur"] as const;
const DESTINATIONS = ["Logement", "Commerce", "Bureau", "Logistique", "Hôtel", "Parking"] as const;
const DEPTS_COURANTS = ["75", "92", "93", "94", "78", "91", "95", "77"];
/** Budget en fourchettes, converties en euros pour le BO. */
const BUDGETS: { label: string; min: number | null; max: number | null }[] = [
  { label: "< 1 M€", min: null, max: 1_000_000 },
  { label: "1 – 2 M€", min: 1_000_000, max: 2_000_000 },
  { label: "2 – 4 M€", min: 2_000_000, max: 4_000_000 },
  { label: "4 – 7 M€", min: 4_000_000, max: 7_000_000 },
  { label: "> 7 M€", min: 7_000_000, max: null },
];
const FINANCEMENTS = ["Fonds propres", "Crédit à obtenir", "Accord bancaire en place", "Mixte"];

type Recherche = {
  cible: string;
  departements: string[];
  autresDepts: string;
  villes: string;
  budget: string;
  rendementMin: string;
  destinations: string[];
  commentaire: string;
};
const RECHERCHE_VIDE: Recherche = {
  cible: "", departements: [], autresDepts: "", villes: "", budget: "",
  rendementMin: "", destinations: [], commentaire: "",
};

type Contact = { prenom: string; nom: string; email: string; telephone: string; financement: string };
const CONTACT_VIDE: Contact = { prenom: "", nom: "", email: "", telephone: "", financement: "" };

/** « 69, 13 » → ["69", "13"] ; « 2A » accepté pour la Corse. */
function codesDepts(r: Recherche): string[] {
  const autres = r.autresDepts
    .split(/[\s,;/]+/)
    .map((x) => x.trim().toUpperCase())
    .filter((x) => /^(\d{2,3}|2A|2B)$/.test(x));
  return [...new Set([...r.departements, ...autres])];
}

/** Ce qui part au BO pour une recherche — les noms de champs du contrat. */
function versBO(r: Recherche, financement: string) {
  const b = BUDGETS.find((x) => x.label === r.budget);
  const rdt = Number(r.rendementMin.replace(",", "."));
  const commentaire = [financement ? `Financement : ${financement}.` : "", r.commentaire.trim()]
    .filter(Boolean)
    .join(" ");
  return {
    cible: r.cible,
    departements: codesDepts(r),
    villes: r.villes.split(/[,;]+/).map((v) => v.trim()).filter(Boolean),
    prixMin: b?.min ?? null,
    prixMax: b?.max ?? null,
    rendementMin: Number.isFinite(rdt) && rdt > 0 ? rdt : null,
    destinations: r.destinations,
    commentaire,
  };
}

export function RechercheForm() {
  const uid = useId();
  const [c, setC] = useState<Contact>(CONTACT_VIDE);
  const [rs, setRs] = useState<Recherche[]>([RECHERCHE_VIDE]);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [fini, setFini] = useState<null | "ok" | "echec">(null);
  const refFini = useRef<HTMLDivElement>(null);

  // Idem estimation : l'écran de confirmation doit revenir dans le champ de vision.
  useEffect(() => {
    if (fini) refFini.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [fini]);

  const setContact = (k: keyof Contact, v: string) => {
    setC((p) => ({ ...p, [k]: v }));
    setErreurs((p) => ({ ...p, [k]: "" }));
  };
  const setR = <K extends keyof Recherche>(i: number, k: K, v: Recherche[K]) => {
    setRs((p) => p.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
    setErreurs((p) => ({ ...p, [`${i}.${k}`]: "", [`${i}.zone`]: "" }));
  };
  const basculer = (i: number, k: "departements" | "destinations", v: string) =>
    setR(i, k, rs[i][k].includes(v) ? rs[i][k].filter((x) => x !== v) : [...rs[i][k], v]);

  async function envoyer(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    rs.forEach((r, i) => {
      if (!r.cible) e[`${i}.cible`] = "Choisissez un profil.";
      if (codesDepts(r).length === 0 && !r.villes.trim())
        e[`${i}.zone`] = "Indiquez au moins un département ou une ville.";
      if (!r.budget) e[`${i}.budget`] = "Requis — c’est ce qui nous permet de filtrer.";
    });
    if (!c.financement) e.financement = "Requis.";
    if (!c.prenom.trim()) e.prenom = "Requis.";
    if (!c.nom.trim()) e.nom = "Requis.";
    if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) e.email = "E-mail invalide.";
    if (c.telephone.replace(/\D/g, "").length < 9) e.telephone = "Téléphone invalide.";
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    let ok = false;
    try {
      const r = await fetch("/api/lead/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "recherche_acquereur",
          ref: globalThis.crypto?.randomUUID?.() ?? `fi-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          prenom: c.prenom.trim(),
          nom: c.nom.trim(),
          email: c.email.trim(),
          telephone: c.telephone.trim(),
          recherches: rs.map((r) => versBO(r, c.financement)),
        }),
      });
      ok = r.ok;
    } catch {
      ok = false;
    }
    if (ok) {
      type DL = { push: (o: Record<string, unknown>) => void };
      (window as unknown as { dataLayer?: DL }).dataLayer?.push({
        event: "form_submit_recherche",
        recherches: rs.length,
      });
    }
    setEnvoi(false);
    setFini(ok ? "ok" : "echec");
  }

  if (fini === "echec") {
    return (
      <div className="form-shell outcome" ref={refFini}>
        <span className="outcome__badge outcome__badge--autre">Envoi impossible</span>
        <h3>Votre recherche n’a pas pu partir, {c.prenom}.</h3>
        <p>
          Un incident technique nous empêche de l’enregistrer. Appelez-nous&nbsp;: nous la
          prenons en deux minutes.
        </p>
        <div className="btn-row">
          <a className="btn btn--primary" href={SITE.telHref}>
            Appeler · {SITE.tel} <ArrowIcon />
          </a>
        </div>
      </div>
    );
  }

  if (fini === "ok") {
    return (
      <div className="form-shell outcome" ref={refFini}>
        <span className="outcome__badge">
          {rs.length > 1 ? `${rs.length} recherches enregistrées` : "Recherche enregistrée"}
        </span>
        <h3>Merci {c.prenom}. Vous êtes dans notre fichier.</h3>
        <p>
          Pour l’instant, vous y figurez comme acquéreur que nous ne connaissons pas encore. Les
          meilleurs dossiers partent d’abord aux acquéreurs avec qui nous avons échangé&nbsp;:
          demandez à être rappelé, ou appelez-nous, pour y avoir accès.
        </p>
        <div className="btn-row">
          <a className="btn btn--primary" href={SITE.telHref}>
            Appeler · {SITE.tel} <ArrowIcon />
          </a>
          <a className="btn btn--outline" href="/contactez-nous/">
            Être rappelé
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

      {rs.map((r, i) => (
        <fieldset key={i} className="recherche">
          {rs.length > 1 && (
            <legend className="recherche__titre">
              Recherche {i + 1}
              <button
                type="button"
                className="recherche__retirer"
                onClick={() => setRs((p) => p.filter((_, j) => j !== i))}
              >
                Retirer
              </button>
            </legend>
          )}
          <div className="fields fields--2">
            <Champ id={`${uid}-${i}-cible`} label="Profil d’acquéreur" err={erreurs[`${i}.cible`]} full>
              <div className="choices">
                {CIBLES.map((t) => (
                  <button key={t} type="button" className="choice" aria-pressed={r.cible === t}
                    onClick={() => setR(i, "cible", t)}>{t}</button>
                ))}
              </div>
            </Champ>

            <Champ id={`${uid}-${i}-dep`} label="Départements" err={erreurs[`${i}.zone`]} full>
              <div className="choices">
                {DEPTS_COURANTS.map((t) => (
                  <button key={t} type="button" className="choice" aria-pressed={r.departements.includes(t)}
                    onClick={() => basculer(i, "departements", t)}>{t}</button>
                ))}
              </div>
            </Champ>
            <Champ id={`${uid}-${i}-autres`} label="Autres départements" hint="Codes, séparés par une virgule">
              <input id={`${uid}-${i}-autres`} value={r.autresDepts}
                onChange={(e) => setR(i, "autresDepts", e.target.value)} placeholder="69, 13, 33" />
            </Champ>
            <Champ id={`${uid}-${i}-villes`} label="Villes (facultatif)" hint="Séparées par une virgule">
              <input id={`${uid}-${i}-villes`} value={r.villes}
                onChange={(e) => setR(i, "villes", e.target.value)} placeholder="Montreuil, Saint-Ouen" />
            </Champ>

            <Champ id={`${uid}-${i}-budget`} label="Budget d’acquisition" err={erreurs[`${i}.budget`]} full>
              <div className="choices">
                {BUDGETS.map((t) => (
                  <button key={t.label} type="button" className="choice" aria-pressed={r.budget === t.label}
                    onClick={() => setR(i, "budget", t.label)}>{t.label}</button>
                ))}
              </div>
            </Champ>

            <Champ id={`${uid}-${i}-dest`} label="Destinations" hint="Une ou plusieurs, facultatif" full>
              <div className="choices">
                {DESTINATIONS.map((t) => (
                  <button key={t} type="button" className="choice" aria-pressed={r.destinations.includes(t)}
                    onClick={() => basculer(i, "destinations", t)}>{t}</button>
                ))}
              </div>
            </Champ>

            <Champ id={`${uid}-${i}-rdt`} label="Rendement brut minimum (%)" hint="Facultatif">
              <input id={`${uid}-${i}-rdt`} value={r.rendementMin}
                onChange={(e) => setR(i, "rendementMin", e.target.value)} placeholder="7" inputMode="decimal" />
            </Champ>
            <Champ id={`${uid}-${i}-com`} label="Précisions (facultatif)">
              <input id={`${uid}-${i}-com`} value={r.commentaire}
                onChange={(e) => setR(i, "commentaire", e.target.value)}
                placeholder="Travaux acceptés, horizon de détention…" />
            </Champ>
          </div>
        </fieldset>
      ))}

      <button type="button" className="btn btn--ghost recherche__ajouter"
        onClick={() => setRs((p) => [...p, RECHERCHE_VIDE])}>
        + Ajouter une autre recherche
      </button>

      <div className="fields fields--2">
        <Champ id={`${uid}-fin`} label="Financement" err={erreurs.financement} full>
          <div className="choices">
            {FINANCEMENTS.map((t) => (
              <button key={t} type="button" className="choice" aria-pressed={c.financement === t}
                onClick={() => setContact("financement", t)}>{t}</button>
            ))}
          </div>
        </Champ>
        <Champ id={`${uid}-prenom`} label="Prénom" err={erreurs.prenom}>
          <input id={`${uid}-prenom`} value={c.prenom} onChange={(e) => setContact("prenom", e.target.value)} autoComplete="given-name" />
        </Champ>
        <Champ id={`${uid}-nom`} label="Nom" err={erreurs.nom}>
          <input id={`${uid}-nom`} value={c.nom} onChange={(e) => setContact("nom", e.target.value)} autoComplete="family-name" />
        </Champ>
        <Champ id={`${uid}-email`} label="E-mail" err={erreurs.email}>
          <input id={`${uid}-email`} type="email" value={c.email} onChange={(e) => setContact("email", e.target.value)} autoComplete="email" />
        </Champ>
        <Champ id={`${uid}-tel`} label="Téléphone" err={erreurs.telephone}>
          <input id={`${uid}-tel`} type="tel" value={c.telephone} onChange={(e) => setContact("telephone", e.target.value)} autoComplete="tel" />
        </Champ>
      </div>

      <div className="field-nav">
        <button type="submit" className="btn btn--primary" disabled={envoi}>
          {envoi ? "Envoi…" : rs.length > 1 ? "Déposer mes recherches" : "Déposer ma recherche"}{" "}
          {!envoi && <ArrowIcon />}
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
