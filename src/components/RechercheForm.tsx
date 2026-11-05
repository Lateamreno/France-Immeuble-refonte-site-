"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LIBELLE_DESTINATION } from "@/lib/annonce";
import { LIBELLE_OPERATION, libelleLieu, villeDe, type Cible } from "@/lib/recherche-biens";
import { SITE } from "@/lib/site";
import { ChoixLieux } from "./biens/ChoixLieux";
import { DoubleCurseur } from "./DoubleCurseur";
import { CurseurMinimum } from "./CurseurMinimum";
import { Picto } from "./Picto";
import { ouvrirCompte, useEtatCompte, useGarderALaConnexion } from "./biens/etat";

/**
 * Dépôt de recherche acquéreur.
 *
 * C'est l'acquéreur qui règle les honoraires : un acquéreur sans capacité de
 * financement ne fait pas perdre du temps, il fait échouer la vente. Ce
 * formulaire qualifie donc sur le budget ; il ne collecte pas des adresses
 * e-mail. Le financement n'est plus demandé (retour #89 : le BO ne le garde pas).
 *
 * Contrat BO du 21/10/2026 : un contact, et une ou plusieurs recherches. Le BO
 * crée (ou retrouve par e-mail) le contact, puis une recherche au statut D par
 * entrée du tableau `recherches`. Les valeurs de `cible` et de `destinations`
 * sont celles du BO, au caractère près : une valeur qu'il ne connaît pas ne
 * correspond à rien chez lui.
 */

// Les deux types d'opération proposés (retour #84 : patrimonial et promoteur retirés),
// valeurs de `cible` au BO.
const CIBLES = ["Investisseur", "Marchand de biens"] as const;
// Les quatre types d'immeuble de l'agence (MAV, 02/11/2026), valeurs des destinations du BO.
const DESTINATIONS = ["Logement", "Commerce", "Bureau", "Logistique"] as const;
/** Le budget au curseur : de 0 à 10 M€, le bout droit veut dire « 10 M€ et plus », sans limite au BO (retour #86). */
const BUDGET_MAX = 10_000_000;
const BUDGET_PAS = 100_000;

type Recherche = {
  /** Un ou deux types d'opération : deux deviennent deux recherches identiques (retour #88). */
  cibles: string[];
  zones: string[];
  prixMin: number | null;
  prixMax: number | null;
  rendementMin: string;
  destinations: string[];
  commentaire: string;
};
const RECHERCHE_VIDE: Recherche = {
  cibles: [], zones: [], prixMin: null, prixMax: null, rendementMin: "", destinations: [], commentaire: "",
};

type Contact = { societe: string; prenom: string; nom: string; email: string; telephone: string };
const CONTACT_VIDE: Contact = { societe: "", prenom: "", nom: "", email: "", telephone: "" };

const milliers = (n: number) => n.toLocaleString("fr-FR").replace(/\s/g, "\u202f");
const enEuros = (n: number | null) => (n == null ? "" : `${milliers(n)} €`);
const lireEntier = (s: string) => {
  const t = s.replace(/[^\d]/g, "");
  return t ? Number(t) : null;
};
const court = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M€` : `${milliers(n)} €`);
const libelleBudget = (r: Recherche) =>
  r.prixMin == null && r.prixMax == null ? "" :
    r.prixMax == null ? `${court(r.prixMin ?? 0)} et plus` : `${court(r.prixMin ?? 0)} à ${court(r.prixMax)}`;

/** Les départements et les villes d'une recherche, au format du BO (une ville apporte son département). */
function lieuxBO(r: Recherche) {
  const departements = new Set<string>();
  const villes: string[] = [];
  for (const z of r.zones) {
    if (z.startsWith("d:")) departements.add(z.slice(2));
    else {
      const v = villeDe(z);
      villes.push(v.nom);
      if (v.dept) departements.add(v.dept);
    }
  }
  return { departements: [...departements], villes };
}

/** Ce qui part au BO pour une recherche, une par type d'opération : les noms de champs du contrat (§6). */
function versBO(r: Recherche, societe: string) {
  const rdt = Number(r.rendementMin.replace(",", "."));
  const commentaire = [societe.trim() ? `Société : ${societe.trim()}.` : "", r.commentaire.trim()]
    .filter(Boolean)
    .join(" ");
  return r.cibles.map((cible) => ({
    cible,
    ...lieuxBO(r),
    prixMin: r.prixMin,
    prixMax: r.prixMax,
    rendementMin: Number.isFinite(rdt) && rdt > 0 ? rdt : null,
    destinations: r.destinations,
    commentaire,
  }));
}

/** Une recherche à deux types d'opération devient deux recherches, tout le reste à l'identique (retour #88). */
const deplier = (rs: Recherche[]) => rs.flatMap((r) => (r.cibles.length > 1 ? r.cibles.map((c) => ({ ...r, cibles: [c] })) : [r]));

export function RechercheForm({ contact, commentaire, refContact }: {
  /** Suite d'un message de contact (retour #120) : coordonnées et message déjà saisis. */
  contact?: Partial<Contact>;
  commentaire?: string;
  /** Référence du message de contact qui précède : le BO regroupe les deux. */
  refContact?: string;
} = {}) {
  const uid = useId();
  const [c, setC] = useState<Contact>(() => ({ ...CONTACT_VIDE, ...contact }));
  const [rs, setRs] = useState<Recherche[]>(() => [{ ...RECHERCHE_VIDE, commentaire: commentaire?.trim() ?? "" }]);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [fini, setFini] = useState<null | "ok" | "echec">(null);
  /** Trois étapes courtes (MAV, 27/10/2026 : une section, un écran). */
  const [etape, setEtape] = useState<0 | 1 | 2>(0);
  /** La recherche en cours de saisie aux étapes 1 et 2. */
  const [courante, setCourante] = useState(0);
  const refFini = useRef<HTMLDivElement>(null);
  const refForm = useRef<HTMLFormElement>(null);
  const premier = useRef(true);

  /* Connecté : les coordonnées viennent du compte, sans les redemander
     (retour #262, MAV, 05/11/2026). Un clic les rouvre. */
  const etatCompte = useEtatCompte();
  const connecte = !!etatCompte?.connecte;
  const [coordonneesOuvertes, setCoordonneesOuvertes] = useState(false);
  useEffect(() => {
    if (!etatCompte?.connecte) return;
    setC((p) => ({
      ...p,
      prenom: p.prenom || etatCompte.prenom || "",
      nom: p.nom || etatCompte.nom || "",
      email: p.email || etatCompte.email || "",
      telephone: p.telephone || etatCompte.telephone || "",
    }));
  }, [etatCompte]);
  const coordonneesCompletes = connecte && !!c.prenom.trim() && !!c.nom.trim() &&
    /^\S+@\S+\.\S+$/.test(c.email.trim()) && c.telephone.replace(/\D/g, "").length >= 9;
  const coordonneesCachees = coordonneesCompletes && !coordonneesOuvertes;
  // Se connecter dans la fenêtre pendant la saisie ne recharge pas la page (retour #267).
  useGarderALaConnexion(etape > 0 || rs[0].zones.length > 0 || rs[0].cibles.length > 0);

  // À chaque étape, le haut du formulaire revient sous le menu s'il en est sorti.
  useEffect(() => {
    if (premier.current) { premier.current = false; return; }
    const el = refForm.current;
    if (el && el.getBoundingClientRect().top < 64) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [etape, courante]);

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
    setErreurs((p) => ({ ...p, [`${i}.${k}`]: "" }));
  };
  const basculer = (i: number, k: "cibles" | "destinations", v: string) =>
    setR(i, k, rs[i][k].includes(v) ? rs[i][k].filter((x) => x !== v) : [...rs[i][k], v]);
  const setZones = (i: number): React.Dispatch<React.SetStateAction<string[]>> => (v) => {
    setRs((p) => p.map((r, j) => (j === i ? { ...r, zones: typeof v === "function" ? v(r.zones) : v } : r)));
    setErreurs((p) => ({ ...p, [`${i}.zones`]: "" }));
  };

  /** Erreurs d'une étape de critères pour la recherche `i`. */
  function erreursCriteres(i: number, quelle: 0 | 1): Record<string, string> {
    const r = rs[i];
    const e: Record<string, string> = {};
    if (quelle === 0) {
      if (r.cibles.length === 0) e[`${i}.cibles`] = "Choisissez au moins un type d’opération.";
      if (lieuxBO(r).departements.length === 0) e[`${i}.zones`] = "Ajoutez au moins une région, un département ou une ville.";
    } else if (r.prixMin == null && r.prixMax == null) {
      e[`${i}.budget`] = "Indiquez votre budget : c’est ce qui nous permet de filtrer.";
    } else if (r.prixMin != null && r.prixMax != null && r.prixMin > r.prixMax) {
      e[`${i}.budget`] = "Le minimum dépasse le maximum.";
    }
    return e;
  }

  function continuer() {
    const e = erreursCriteres(courante, etape === 0 ? 0 : 1);
    setErreurs(e);
    if (Object.keys(e).length) return;
    if (etape === 0) { setEtape(1); return; }
    // Deux types d'opération font deux recherches, mais seulement à l'écran et à
    // l'envoi : revenir en arrière et en retirer un ne laisse plus de recherche
    // cachée (retour #269, MAV, 05/11/2026).
    setEtape(2);
  }

  async function envoyer(ev: React.FormEvent) {
    ev.preventDefault();
    if (etape < 2) { continuer(); return; }
    const e: Record<string, string> = {};
    rs.forEach((_, i) => Object.assign(e, erreursCriteres(i, 0), erreursCriteres(i, 1)));
    const fautive = rs.findIndex((_, i) => Object.keys(e).some((k) => k.startsWith(`${i}.`)));
    if (fautive >= 0) {
      setErreurs(e);
      setCourante(fautive);
      setEtape(e[`${fautive}.cibles`] || e[`${fautive}.zones`] ? 0 : 1);
      return;
    }
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
          ...(refContact ? { refContact } : {}),
          prenom: c.prenom.trim(),
          nom: c.nom.trim(),
          email: c.email.trim(),
          telephone: c.telephone.trim(),
          // Facultative (retour #90) ; recopiée dans le commentaire de chaque recherche
          // tant que le BO ne lit pas ce champ (docs/PROMPT-BO-RECHERCHE.md).
          societe: c.societe.trim() || undefined,
          recherches: deplier(rs).flatMap((r) => versBO(r, c.societe)),
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
        recherches: deplier(rs).length,
      });
    }
    setEnvoi(false);
    setFini(ok ? "ok" : "echec");
  }

  if (fini === "echec") {
    return (
      <div className="form-shell outcome" ref={refFini}>
        <span className="outcome__badge outcome__badge--autre">Envoi impossible</span>
        <h3>Votre recherche n’a pas pu partir.</h3>
        <p>
          Un incident technique nous empêche de l’enregistrer. Appelez-nous&nbsp;: nous la
          prenons en deux minutes.
        </p>
        <div className="btn-row">
          <a className="btn btn--primary" href={SITE.telHref}>
            Appeler · {SITE.tel}
          </a>
        </div>
      </div>
    );
  }

  if (fini === "ok" && connecte) {
    // Retour #270 : connecté, ni création de compte ni connexion. L'accès se
    // valide par un appel tant que l'agent n'a pas appelé ; ensuite, plus rien à valider.
    return (
      <div className="form-shell outcome outcome--centre" ref={refFini}>
        <span className="outcome__badge">
          {deplier(rs).length > 1 ? `${deplier(rs).length} recherches enregistrées` : "Recherche enregistrée"}
        </span>
        <h3>Votre recherche est dans votre compte.</h3>
        {etatCompte?.appele ? (
          <p>Votre agent la reçoit. Les immeubles qui y correspondent arrivent dans votre compte et par e-mail, y compris les off-market.</p>
        ) : (
          <>
            {/* MAV, 05/11/2026 : ni « Voir mes recherches » ni demande d'appel, notre numéro. */}
            <p>Pour recevoir les dossiers off-market, un appel de quelques minutes avec un agent ouvre votre accès.</p>
            <div className="btn-row">
              <a className="btn btn--primary" href={SITE.telHref}>Appeler le {SITE.tel}</a>
            </div>
          </>
        )}
      </div>
    );
  }

  if (fini === "ok") {
    // Le rappel est acquis (retour #91) : la suite, c'est le compte, mis en avant.
    return (
      <div className="form-shell outcome outcome--centre" ref={refFini}>
        <span className="outcome__badge">
          {deplier(rs).length > 1 ? `${deplier(rs).length} recherches enregistrées` : "Recherche enregistrée"}
        </span>
        {/* Retour #101 (MAV, 02/11/2026) : la recherche est enregistrée, mais
            l'accès à l'off-market se valide par un appel. Pas de promesse de rappel. */}
        <h3>Votre recherche est enregistrée.</h3>
        <p>
          Pour recevoir les dossiers off-market, votre accès doit être validé : appelez-nous au{" "}
          {SITE.tel}, quelques minutes suffisent. En attendant, créez votre espace&nbsp;:
        </p>
        <ul className="outcome__atouts">
          <li><Picto nom="immeubles" taille={20} />Les immeubles que nous vous envoyons, avec leurs documents</li>
          <li><Picto nom="loupe" taille={20} />Vos recherches, à modifier quand vous voulez</li>
          <li><Picto nom="euro" taille={20} />Une offre en ligne, au curseur, transmise à votre agent</li>
        </ul>
        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={() => ouvrirCompte({ onglet: "creation" })}>Créer mon compte</button>
          <a className="btn btn--outline" href={SITE.telHref}>Valider mon accès · {SITE.tel}</a>
        </div>
        <p className="form-note">Déjà un compte&nbsp;? <button type="button" className="lien-discret" onClick={() => ouvrirCompte()}>Me connecter</button></p>
      </div>
    );
  }

  const i = courante;
  const r = rs[i];
  const TITRES = ["Ce que vous cherchez", "Votre budget", coordonneesCachees ? "Votre récapitulatif" : "Vos coordonnées"];

  return (
    <form className="form-shell form-recherche" onSubmit={envoyer} noValidate ref={refForm}>
      <div className="step-head">
        <span className="form-recherche__etape">Étape {etape + 1} sur 3</span>
        <h3>{TITRES[etape]}</h3>
        {etape === 0 && <p>Plus vos critères sont précis, plus ce que vous recevrez sera pertinent.</p>}
      </div>
      <div className="form-recherche__barre" aria-hidden="true"><span style={{ width: `${((etape + 1) / 3) * 100}%` }} /></div>

      {etape === 0 && (
        <div className="fields fields--2">
          {rs.length > 1 && <p className="form-recherche__quelle field--full">Recherche {i + 1}</p>}
          <Champ id={`${uid}-${i}-cible`} label="Type d’opération" hint="Un ou les deux" err={erreurs[`${i}.cibles`]} full>
            <div className="choices">
              {CIBLES.map((t) => (
                <button key={t} type="button" className="choice" aria-pressed={r.cibles.includes(t)}
                  onClick={() => basculer(i, "cibles", t)}>{LIBELLE_OPERATION[t]}</button>
              ))}
            </div>
          </Champ>
          <Champ id={`${uid}-${i}-lieux`} label="Où cherchez-vous ?" hint="Régions, départements, villes : tapez un nom ou ajoutez avec +" err={erreurs[`${i}.zones`]} full>
            <div className="lieux-champ">
              <ChoixLieux id={`${uid}-${i}-lieux`} zones={r.zones} setZones={setZones(i)} variante="formulaire" invalide={!!erreurs[`${i}.zones`]} />
            </div>
          </Champ>
        </div>
      )}

      {etape === 1 && (
        <div className="fields fields--2">
          <div className="field field--full">
            <span className="field__lbl" id={`${uid}-${i}-budget`}>Budget d’acquisition <b className="budget__valeur">{libelleBudget(r) || "à indiquer"}</b></span>
            <div className="budget">
              <label className="budget__champ">
                <span>Minimum</span>
                <input inputMode="numeric" autoComplete="off" value={enEuros(r.prixMin)} placeholder="0 €"
                  aria-describedby={`${uid}-${i}-budget`}
                  onChange={(e) => setR(i, "prixMin", lireEntier(e.target.value))} />
              </label>
              <label className="budget__champ">
                <span>Maximum</span>
                <input inputMode="numeric" autoComplete="off" value={enEuros(r.prixMax)} placeholder="Sans limite"
                  aria-describedby={`${uid}-${i}-budget`}
                  onChange={(e) => setR(i, "prixMax", lireEntier(e.target.value))} />
              </label>
            </div>
            <DoubleCurseur min={0} max={BUDGET_MAX} pas={BUDGET_PAS} de={r.prixMin} a={r.prixMax} libelle="Budget"
              valeurTexte={(v) => (v >= BUDGET_MAX ? "10 millions d’euros et plus" : enEuros(v))}
              onChange={(d, a) => { setR(i, "prixMin", d); setR(i, "prixMax", a); }} />
            <div className="curseur__bornes" aria-hidden="true"><span>0 €</span><span>10 M€ et plus</span></div>
            {erreurs[`${i}.budget`] && <span className="err">{erreurs[`${i}.budget`]}</span>}
          </div>
          <Champ id={`${uid}-${i}-dest`} label="Type d’immeuble" hint="Un ou plusieurs, facultatif" full>
            <div className="choices">
              {DESTINATIONS.map((t) => (
                <button key={t} type="button" className="choice" aria-pressed={r.destinations.includes(t)}
                  onClick={() => basculer(i, "destinations", t)}>{LIBELLE_DESTINATION[t]}</button>
              ))}
            </div>
          </Champ>
          <div className="field field--full">
            <label htmlFor={`${uid}-${i}-rdt`}>
              Rendement brut minimum : {Number(r.rendementMin.replace(",", ".")) > 0 ? `${r.rendementMin.replace(".", ",")} % et plus` : "tous"}
            </label>
            {/* Retour #272 (MAV, 05/11/2026) : au curseur, de 0 à 12 %. */}
            <CurseurMinimum id={`${uid}-${i}-rdt`} min={0} max={12} pas={0.5}
              valeur={Number(r.rendementMin.replace(",", ".")) > 0 ? Number(r.rendementMin.replace(",", ".")) : null}
              onChange={(v) => setR(i, "rendementMin", v == null ? "" : String(v))} libelle="Rendement brut minimum" />
          </div>
          <Champ id={`${uid}-${i}-com`} label="Précisions (facultatif)" full>
            <textarea id={`${uid}-${i}-com`} rows={4} maxLength={1000} value={r.commentaire}
              onChange={(e) => setR(i, "commentaire", e.target.value)}
              placeholder="Travaux acceptés, horizon de détention, quartiers à éviter…" />
          </Champ>
        </div>
      )}

      {etape === 2 && (
        <>
          <ul className="recherche-resume">
            {rs.flatMap((x, k) => x.cibles.map((cible) => ({ x, k, cible }))).map(({ x, k, cible }, n, tout) => (
              <li key={`${k}-${cible}`}>
                <span>{[LIBELLE_OPERATION[cible as Cible] ?? cible, libelleLieu(x.zones), libelleBudget(x)].filter(Boolean).join(" · ")}</span>
                <button type="button" className="recherche__retirer" onClick={() => { setCourante(k); setEtape(0); }}>
                  Modifier
                </button>
                {tout.length > 1 && (
                  <button type="button" className="recherche__retirer"
                    onClick={() => {
                      setRs((p) => (x.cibles.length > 1
                        ? p.map((r, j) => (j === k ? { ...r, cibles: r.cibles.filter((t) => t !== cible) } : r))
                        : p.filter((_, j) => j !== k)));
                      setCourante(0);
                    }}>
                    Retirer
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button type="button" className="lien-discret recherche__ajouter"
            onClick={() => { setRs((p) => [...p, RECHERCHE_VIDE]); setCourante(rs.length); setEtape(0); }}>
            + Ajouter une autre recherche
          </button>
          {coordonneesCachees ? (
            <p className="identite-compte">
              <span className="identite-compte__qui">
                <Picto nom="profil" taille={18} />
                {[c.societe.trim(), `${c.prenom} ${c.nom}`, c.email, c.telephone].filter(Boolean).join(" · ")}
              </span>
              <button type="button" className="lien-discret" onClick={() => setCoordonneesOuvertes(true)}>Modifier</button>
            </p>
          ) : (
          <div className="fields fields--2">
            <Champ id={`${uid}-societe`} label="Société (facultatif)" full>
              <input id={`${uid}-societe`} value={c.societe} onChange={(e) => setContact("societe", e.target.value)} autoComplete="organization" />
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
          )}
        </>
      )}

      <div className="field-nav">
        {etape > 0 && (
          <button type="button" className="btn btn--outline" onClick={() => setEtape(etape === 2 ? 1 : 0)}>
            Retour
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={envoi}>
          {etape < 2 ? "Continuer" : envoi ? "Envoi…" : deplier(rs).length > 1 ? "Déposer mes recherches" : "Déposer ma recherche"}
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
