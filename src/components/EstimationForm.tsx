"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PropositionCompte } from "./compte/PropositionCompte";
import { SITE, CALIBRE } from "@/lib/site";
import { router as routerDossier, type Verdict } from "@/lib/routage";
import { CATEGORIES } from "@/lib/compte/categories";

/**
 * Tunnel d'estimation (CLAUDE.md §9, retour #60 de MAV du 27/10/2026).
 *
 * Deux parties, et le visiteur ne voit que la première : rien ne lui annonce
 * une suite, ni barre de progression ni « étape 1/2 ». La première partie, ce
 * sont ses coordonnées, l'adresse de l'immeuble et quelques mots pour le
 * décrire. Dès qu'il la valide, LE LEAD EST PARTI : s'il ferme l'onglet, nous
 * avons de quoi le rappeler et situer son immeuble.
 *
 * La seconde partie apparaît alors : les lots, la surface, le loyer, les
 * travaux et le délai de vente. Ce n'est qu'après elle que l'orientation
 * s'affiche, parce qu'elle se calcule sur le loyer.
 *
 * Les deux envois portent le même `ref` : le BO reconnaît le complément comme
 * un enrichissement du lead, pas comme un doublon. Ils arrivent dans le tableau
 * de bord du BO à l'étape « 1 - FORMULAIRE » (contrat BO du 21/10/2026), avec
 * `formulaire` = "vendre" ou "estimer" pour savoir d'où vient la demande.
 *
 * ⚠️ Les libellés « bureaux » et « commerces » sont inversés dans le formulaire
 * WordPress actuel (§9). La correspondance est vérifiée ici.
 */

type Data = {
  // Première partie. L'adresse est découpée comme le BO la range.
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  numero: string;
  rue: string;
  codePostal: string;
  ville: string;
  message: string;
  // Seconde partie, proposée une fois la première envoyée.
  lotsHabitation: string;
  lotsBureaux: string;
  lotsCommerces: string;
  lotsActivite: string;
  surface: string;
  loyerAnnuel: string;
  travaux: string;
  echeance: string;
};

const VIDE: Data = {
  prenom: "", nom: "", email: "", telephone: "",
  numero: "", rue: "", codePostal: "", ville: "", message: "",
  lotsHabitation: "", lotsBureaux: "", lotsCommerces: "", lotsActivite: "",
  surface: "", loyerAnnuel: "", travaux: "", echeance: "",
};

/** Les valeurs du BO, au caractère près. */
const TRAVAUX = ["Pas de travaux", "Petits travaux", "Gros travaux", "Je ne sais pas"];
const ECHEANCES = ["Dès maintenant", "Sous 6 mois", "Sous 12 mois", "Je me renseigne"];

type Phase = "saisie" | "complement" | "fin";

export function EstimationForm({
  formulaire,
  dansLeCompte = false,
}: {
  formulaire: "vendre" | "estimer";
  /** Depuis /mon-compte/ : la proposition de créer un compte n'a plus lieu d'être. */
  dansLeCompte?: boolean;
}) {
  const uid = useId();
  const [phase, setPhase] = useState<Phase>("saisie");
  const [d, setD] = useState<Data>(VIDE);
  const [indicatif, setIndicatif] = useState("33");
  const [adresse, setAdresse] = useState<EtatAdresse>({ saisie: "", choisie: false, manuel: false });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [stocke, setStocke] = useState(true);
  const ref = useRef<string>("");
  const bloc = useRef<HTMLDivElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);

  const set = (k: keyof Data, v: string) => {
    setD((p) => ({ ...p, [k]: v }));
    setErreurs((p) => ({ ...p, [k]: "" }));
  };
  const setPlusieurs = (o: Partial<Data>) => {
    setD((p) => ({ ...p, ...o }));
    setErreurs((p) => ({ ...p, adresse: "", rue: "", codePostal: "", ville: "" }));
  };

  // À chaque changement de partie, le haut du formulaire revient sous le menu
  // et le titre prend le focus : le lecteur d'écran annonce la suite.
  const premierRendu = useRef(true);
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    const el = bloc.current;
    if (el) {
      const haut = el.getBoundingClientRect().top;
      if (haut < 64 || haut > window.innerHeight * 0.5) {
        const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "start", behavior: doux ? "smooth" : "auto" });
      }
    }
    titre.current?.focus({ preventScroll: true });
  }, [phase]);

  function validerSaisie() {
    const e: Record<string, string> = {};
    if (!d.prenom.trim()) e.prenom = "Indiquez votre prénom.";
    if (!d.nom.trim()) e.nom = "Indiquez votre nom.";
    if (!emailValide(d.email)) e.email = "Cette adresse e-mail n’est pas valide.";
    const tel = lireTelephone(indicatif, d.telephone);
    if (!d.telephone.trim()) e.telephone = "Indiquez un numéro pour que l’agent vous rappelle.";
    else if (!tel.valide) e.telephone = indicatif === "33" ? "Un numéro français compte 10 chiffres." : "Numéro incomplet.";
    if (adresse.manuel) {
      if (!d.rue.trim()) e.rue = "Indiquez la rue.";
      if (!/^\d{5}$/.test(d.codePostal.trim())) e.codePostal = "Code postal à 5 chiffres.";
      if (!d.ville.trim()) e.ville = "Indiquez la ville.";
    } else if (!adresse.choisie) {
      e.adresse = adresse.saisie.trim()
        ? "Choisissez l’adresse dans la liste, ou saisissez-la à la main."
        : "Indiquez l’adresse de l’immeuble.";
    }
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  function validerComplement() {
    const e: Record<string, string> = {};
    if (!(nombre(d.surface) > 0)) e.surface = "Même approximative.";
    if (!d.loyerAnnuel.trim() || !Number.isFinite(nombre(d.loyerAnnuel))) {
      e.loyerAnnuel = "Le total encaissé sur un an, hors charges. 0 si l’immeuble est vide.";
    }
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  /** Les montants et nombres partent en nombres (ou null), comme le BO les range. */
  const NUMERIQUES: (keyof Data)[] = [
    "surface", "loyerAnnuel", "lotsHabitation", "lotsCommerces", "lotsBureaux", "lotsActivite",
  ];
  function pourBO(donnees: Data) {
    const o: Record<string, string | number | null> = { ...donnees };
    for (const k of NUMERIQUES) {
      const n = nombre(donnees[k]);
      o[k] = donnees[k].trim() && Number.isFinite(n) ? n : null;
    }
    // Le numéro part tel qu'il s'affiche : « 06 30 76 83 81 » en France,
    // « +41 6 30 76 83 81 » ailleurs. L'indicatif est donc toujours lisible.
    o.telephone = lireTelephone(indicatif, donnees.telephone).affiche;
    return o;
  }

  /**
   * Un seul point de sortie vers le BO, appelé aux deux envois. Renvoie false
   * seulement si la demande n'est nulle part : ni au BO, ni dans la file
   * d'attente du site. Dans ce cas seulement, le visiteur est invité à appeler.
   */
  async function transmettre(donnees: Data, etat: "principal" | "complement") {
    try {
      const r = await fetch("/api/lead/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "estimation", etat, ref: ref.current, formulaire, ...pourBO(donnees) }),
      });
      return r.ok;
    } catch {
      return false;
    }
  }

  async function envoyerSaisie(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validerSaisie()) return;
    setEnvoi(true);
    // Le numéro reformaté reste dans le champ si le visiteur revient en arrière.
    set("telephone", lireTelephone(indicatif, d.telephone).affiche);

    ref.current =
      globalThis.crypto?.randomUUID?.() ?? `fi-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const ok = await transmettre(d, "principal");
    setStocke(ok);

    // Event GTM sur soumission réussie (CLAUDE.md §9). Il part ICI, au premier
    // envoi : c'est là que la conversion a lieu. Le complément n'en est pas une.
    if (ok) {
      type DL = { push: (o: Record<string, unknown>) => void };
      const w = window as unknown as { dataLayer?: DL };
      w.dataLayer?.push({ event: "form_submit_estimation", formulaire });
    }

    setPhase(ok ? "complement" : "fin");
    setEnvoi(false);
  }

  async function envoyerComplement(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validerComplement()) return;
    setEnvoi(true);
    await transmettre(d, "complement");
    setVerdict(
      routerDossier({
        codePostal: d.codePostal,
        valeurEstimee: null,
        loyerAnnuel: nombre(d.loyerAnnuel) || null,
      }),
    );
    setPhase("fin");
    setEnvoi(false);
  }

  return (
    <div className="form-bloc" ref={bloc}>
      {phase === "saisie" && (
        <form className="form-shell form-saisie" onSubmit={envoyerSaisie} noValidate>
          <div className="step-head">
            <h3>Votre immeuble</h3>
            <p>Vos coordonnées et l’adresse de l’immeuble. Réponse sous 48&nbsp;h.</p>
          </div>

          <div className="fields fields--2">
            <Champ id={`${uid}-prenom`} label="Prénom" err={erreurs.prenom}>
              <input id={`${uid}-prenom`} value={d.prenom} onChange={(e) => set("prenom", e.target.value)}
                autoComplete="given-name" aria-invalid={!!erreurs.prenom} />
            </Champ>
            <Champ id={`${uid}-nom`} label="Nom" err={erreurs.nom}>
              <input id={`${uid}-nom`} value={d.nom} onChange={(e) => set("nom", e.target.value)}
                autoComplete="family-name" aria-invalid={!!erreurs.nom} />
            </Champ>
            <ChampEmail id={`${uid}-email`} valeur={d.email} err={erreurs.email}
              onChange={(v) => set("email", v)} />
            <ChampTelephone id={`${uid}-tel`} indicatif={indicatif} valeur={d.telephone} err={erreurs.telephone}
              onIndicatif={(i) => { setIndicatif(i); setErreurs((p) => ({ ...p, telephone: "" })); }}
              onChange={(v) => set("telephone", v)} />

            <ChampAdresse uid={uid} etat={adresse} setEtat={setAdresse} d={d} set={set}
              setPlusieurs={setPlusieurs} erreurs={erreurs} />

            <Champ id={`${uid}-msg`} label="Description de l’immeuble" full>
              <textarea id={`${uid}-msg`} value={d.message} onChange={(e) => set("message", e.target.value)}
                placeholder="Époque, étages, état, commerces…" rows={2} />
            </Champ>
          </div>

          <div className="field-nav">
            <button type="submit" className="btn btn--primary" disabled={envoi}>
              {envoi ? "Envoi…" : formulaire === "vendre" ? "Vendre mon immeuble" : "Estimer mon immeuble"}
            </button>
          </div>

          <p className="form-note">
            Rien n’est diffusé ni publié sans votre accord.
          </p>
        </form>
      )}

      {phase === "complement" && (
        <form className="form-shell" onSubmit={envoyerComplement} noValidate>
          <div className="step-head">
            <span className="outcome__badge">Demande enregistrée</span>
            <h3 ref={titre} tabIndex={-1}>Parlons de votre immeuble.</h3>
            <p>
              Votre demande est bien arrivée. Ces chiffres permettent à l’agent de préparer
              l’estimation avant de vous appeler.
            </p>
          </div>

          <div className="fields fields--2">
            {/* ⚠️ §9 : sur le formulaire actuel, les libellés « bureaux » et
                « commerces » ne correspondent pas aux noms de champs. Ici la
                clé porte le même mot que l'étiquette. Seule exception, voulue :
                les entrepôts vont dans `lotsActivite`, le champ « activité »
                du BO, qui les range avec les locaux d'activité. */}
            <fieldset className="field field--full lots">
              <legend>Nombre de lots</legend>
              <div className="lots__grille">
                <Lot id={`${uid}-lh`} label="Habitation" valeur={d.lotsHabitation} onChange={(v) => set("lotsHabitation", v)} />
                <Lot id={`${uid}-lb`} label="Bureaux" valeur={d.lotsBureaux} onChange={(v) => set("lotsBureaux", v)} />
                <Lot id={`${uid}-lc`} label="Commerces" valeur={d.lotsCommerces} onChange={(v) => set("lotsCommerces", v)} />
                <Lot id={`${uid}-la`} label="Entrepôts" valeur={d.lotsActivite} onChange={(v) => set("lotsActivite", v)} />
              </div>
            </fieldset>

            <Champ id={`${uid}-surface`} label="Surface habitable totale (m²)" err={erreurs.surface}
              hint="Tous lots confondus">
              <input id={`${uid}-surface`} value={d.surface} onChange={(e) => set("surface", e.target.value)}
                placeholder="420" inputMode="numeric" aria-invalid={!!erreurs.surface} />
            </Champ>
            <Champ id={`${uid}-loyer`} label="Loyer annuel HC total (€)" err={erreurs.loyerAnnuel}
              hint="Hors charges, tel qu’encaissé sur un an">
              <input id={`${uid}-loyer`} value={d.loyerAnnuel} onChange={(e) => set("loyerAnnuel", e.target.value)}
                placeholder="180 000" inputMode="numeric" aria-invalid={!!erreurs.loyerAnnuel} />
            </Champ>

            <Choix label="Travaux à prévoir" options={TRAVAUX} valeur={d.travaux} onChange={(v) => set("travaux", v)} />
            <Choix label="Je veux vendre" options={ECHEANCES} valeur={d.echeance} onChange={(v) => set("echeance", v)} />
          </div>

          <div className="field-nav">
            <button type="submit" className="btn btn--primary" disabled={envoi}>
              {envoi ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </form>
      )}

      {phase === "fin" && (
        <Fin titre={titre} stocke={stocke} verdict={verdict} d={d} dansLeCompte={dansLeCompte} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Champs                                                              */
/* ------------------------------------------------------------------ */

function Champ({ id, label, hint, err, full, children }: {
  id: string; label: string; hint?: string; err?: string; full?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`field${full ? " field--full" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !err && <span className="hint">{hint}</span>}
      {err && <span className="err" role="alert">{err}</span>}
    </div>
  );
}

function Lot({ id, label, valeur, onChange }: {
  id: string; label: string; valeur: string; onChange: (v: string) => void;
}) {
  return (
    <div className="lot">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={valeur} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 3))}
        inputMode="numeric" placeholder="0" />
    </div>
  );
}

function Choix({ label, options, valeur, onChange }: {
  label: string; options: string[]; valeur: string; onChange: (v: string) => void;
}) {
  return (
    <fieldset className="field field--full">
      <legend>{label}</legend>
      <div className="choices">
        {options.map((t) => (
          <button key={t} type="button" className="choice" aria-pressed={valeur === t}
            onClick={() => onChange(valeur === t ? "" : t)}>{t}</button>
        ))}
      </div>
    </fieldset>
  );
}

/* --- E-mail : une adresse qui tient debout, et les fautes de frappe courantes --- */

function emailValide(v: string) {
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s) && !s.includes("..") && !/@\.|\.@/.test(s);
}

/** Les domaines les plus saisis, et leurs fautes les plus fréquentes. */
const DOMAINES = [
  "gmail.com", "hotmail.com", "hotmail.fr", "outlook.com", "outlook.fr", "yahoo.com", "yahoo.fr",
  "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr", "laposte.net", "icloud.com", "live.fr", "bbox.fr",
];
function suggestionEmail(v: string): string | null {
  const s = v.trim().toLowerCase();
  const at = s.lastIndexOf("@");
  if (at < 1) return null;
  const domaine = s.slice(at + 1);
  if (!domaine || DOMAINES.includes(domaine)) return null;
  let meilleur: string | null = null;
  let score = 3;
  for (const dom of DOMAINES) {
    const dist = distance(domaine, dom);
    if (dist > 0 && dist < score) { score = dist; meilleur = dom; }
  }
  return meilleur ? `${v.trim().slice(0, at)}@${meilleur}` : null;
}
/** Distance d'édition (Levenshtein), suffisante pour une faute de frappe. */
function distance(a: string, b: string) {
  const l = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prec = l[0];
    l[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = l[j];
      l[j] = Math.min(l[j] + 1, l[j - 1] + 1, prec + (a[i - 1] === b[j - 1] ? 0 : 1));
      prec = t;
    }
  }
  return l[b.length];
}

function ChampEmail({ id, valeur, err, onChange }: {
  id: string; valeur: string; err?: string; onChange: (v: string) => void;
}) {
  const [vu, setVu] = useState(false);
  const proposition = vu ? suggestionEmail(valeur) : null;
  const faux = vu && valeur.trim() !== "" && !emailValide(valeur);
  return (
    <div className="field field--mobile-plein">
      <label htmlFor={id}>E-mail</label>
      <input id={id} type="email" value={valeur} autoComplete="email" inputMode="email" spellCheck={false}
        onChange={(e) => onChange(e.target.value)} onBlur={() => setVu(true)}
        aria-invalid={!!err || faux} />
      {proposition && !err && (
        <span className="hint">
          Vouliez-vous dire{" "}
          <button type="button" className="lien-discret" onClick={() => onChange(proposition)}>{proposition}</button>
          &nbsp;?
        </span>
      )}
      {err ? <span className="err" role="alert">{err}</span>
        : faux && !proposition ? <span className="err">Cette adresse e-mail n’est pas valide.</span> : null}
    </div>
  );
}

/* --- Téléphone : indicatif du pays, la France par défaut, le 0 accepté --- */

const INDICATIFS = [
  { code: "33", pays: "France" },
  { code: "32", pays: "Belgique" },
  { code: "41", pays: "Suisse" },
  { code: "352", pays: "Luxembourg" },
  { code: "377", pays: "Monaco" },
  { code: "44", pays: "Royaume-Uni" },
  { code: "49", pays: "Allemagne" },
  { code: "34", pays: "Espagne" },
  { code: "39", pays: "Italie" },
  { code: "351", pays: "Portugal" },
  { code: "31", pays: "Pays-Bas" },
  { code: "1", pays: "États-Unis, Canada" },
  { code: "971", pays: "Émirats arabes unis" },
  { code: "972", pays: "Israël" },
  { code: "212", pays: "Maroc" },
  { code: "216", pays: "Tunisie" },
  { code: "213", pays: "Algérie" },
  { code: "262", pays: "La Réunion" },
  { code: "590", pays: "Guadeloupe" },
  { code: "596", pays: "Martinique" },
];

/**
 * Lit un numéro saisi n'importe comment : « 06 30 76 83 81 », « 630768381 »,
 * « +33 6 30… », « 0033 6… ». Le 0 de tête est accepté, sinon des vendeurs
 * se perdraient avant d'arriver au BO.
 */
function lireTelephone(indicatif: string, saisie: string) {
  let n = saisie.replace(/\D/g, "");
  const international = /^\s*(\+|00)/.test(saisie);
  if (international) {
    n = n.replace(/^00/, "");
    if (n.startsWith(indicatif)) n = n.slice(indicatif.length);
  }
  n = n.replace(/^0+/, "");
  const valide = indicatif === "33" ? n.length === 9 : n.length >= 6 && n.length <= 13;
  let affiche = saisie.trim();
  if (valide) {
    if (indicatif === "33") {
      affiche = `0${n}`.replace(/(\d{2})(?=\d)/g, "$1 ");
    } else {
      const tete = n.length % 2 ? n.slice(0, 1) : "";
      const reste = (n.length % 2 ? n.slice(1) : n).replace(/(\d{2})(?=\d)/g, "$1 ");
      affiche = `+${indicatif} ${tete ? `${tete} ` : ""}${reste}`;
    }
  }
  return { valide, affiche };
}

/** Un « +41 » ou un « 0041 » tapé en tête du numéro règle l'indicatif tout seul. */
function indicatifTape(saisie: string): string | null {
  const m = saisie.match(/^\s*(?:\+|00)\s*(\d{1,3})/);
  if (!m) return null;
  const chiffres = saisie.replace(/\D/g, "").replace(/^00/, "");
  const trouve = [...INDICATIFS].sort((a, b) => b.code.length - a.code.length)
    .find((i) => chiffres.startsWith(i.code));
  return trouve?.code ?? null;
}

function ChampTelephone({ id, indicatif, valeur, err, onIndicatif, onChange }: {
  id: string; indicatif: string; valeur: string; err?: string;
  onIndicatif: (i: string) => void; onChange: (v: string) => void;
}) {
  return (
    <div className="field field--mobile-plein">
      <label htmlFor={id}>Téléphone</label>
      <div className="tel">
        <span className="tel__indicatif">
          <span aria-hidden="true">+{indicatif}</span>
          <select aria-label="Indicatif du pays" value={indicatif} onChange={(e) => onIndicatif(e.target.value)}>
            {INDICATIFS.map((i) => (
              <option key={i.code + i.pays} value={i.code}>{i.pays} (+{i.code})</option>
            ))}
          </select>
        </span>
        <input id={id} type="tel" value={valeur} autoComplete="tel" inputMode="tel"
          placeholder={indicatif === "33" ? "06 12 34 56 78" : "6 12 34 56 78"}
          aria-invalid={!!err}
          onChange={(e) => {
            const i = indicatifTape(e.target.value);
            if (i && i !== indicatif) onIndicatif(i);
            onChange(e.target.value);
          }}
          onBlur={() => {
            const t = lireTelephone(indicatif, valeur);
            if (t.valide && t.affiche !== valeur) onChange(t.affiche);
          }} />
      </div>
      {err && <span className="err" role="alert">{err}</span>}
    </div>
  );
}

/* --- Adresse : la Base Adresse Nationale, saisie libre en secours --- */

type Suggestion = { label: string; numero: string; rue: string; codePostal: string; ville: string };
type EtatAdresse = { saisie: string; choisie: boolean; manuel: boolean };

function ChampAdresse({ uid, etat, setEtat, d, set, setPlusieurs, erreurs }: {
  uid: string;
  etat: EtatAdresse;
  setEtat: React.Dispatch<React.SetStateAction<EtatAdresse>>;
  d: Data;
  set: (k: keyof Data, v: string) => void;
  setPlusieurs: (o: Partial<Data>) => void;
  erreurs: Record<string, string>;
}) {
  const [liste, setListe] = useState<Suggestion[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const [indisponible, setIndisponible] = useState(false);
  const cache = useRef(new Map<string, Suggestion[]>());
  const idListe = `${uid}-adresses`;

  // Recherche au fil de la frappe, après une courte pause. La requête passe par
  // /api/adresse/ : l'adresse IP du visiteur ne part chez aucun tiers.
  useEffect(() => {
    if (etat.choisie || etat.manuel) return;
    const q = etat.saisie.trim();
    if (q.length < 3) { setListe([]); return; }
    const deja = cache.current.get(q);
    if (deja) { setListe(deja); setActif(-1); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/adresse/?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const j = (await r.json()) as { suggestions: Suggestion[]; indisponible?: boolean };
        if (j.indisponible) {
          setIndisponible(true);
          setEtat((p) => ({ ...p, manuel: true }));
          setPlusieurs({ rue: q });
          return;
        }
        cache.current.set(q, j.suggestions);
        setListe(j.suggestions);
        setActif(-1);
      } catch {
        /* frappe suivante ou réseau coupé : la saisie à la main reste possible */
      }
    }, 160);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [etat.saisie, etat.choisie, etat.manuel, setEtat]); // eslint-disable-line react-hooks/exhaustive-deps

  function choisir(s: Suggestion) {
    setEtat({ saisie: s.label, choisie: true, manuel: false });
    setPlusieurs({ numero: s.numero, rue: s.rue, codePostal: s.codePostal, ville: s.ville });
    setOuvert(false);
    setActif(-1);
  }

  function clavier(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!ouvert || liste.length === 0) {
      if (e.key === "ArrowDown" && liste.length) { setOuvert(true); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActif((a) => (a + 1) % liste.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActif((a) => (a <= 0 ? liste.length - 1 : a - 1)); }
    else if (e.key === "Enter") {
      // Entrée choisit la ligne active, ou la première : jamais d'envoi à moitié rempli.
      e.preventDefault();
      choisir(liste[actif >= 0 ? actif : 0]);
    } else if (e.key === "Escape") { setOuvert(false); }
  }

  if (etat.manuel) {
    return (
      <div className="field--full adresse-manuelle">
        {indisponible && (
          <p className="hint">La recherche d’adresse ne répond pas. Saisissez-la, nous la vérifierons.</p>
        )}
        <div className="fields fields--2">
          <div className="field--full fields-adresse">
            <Champ id={`${uid}-num`} label="N°" err={erreurs.numero}>
              <input id={`${uid}-num`} value={d.numero} onChange={(e) => set("numero", e.target.value)}
                placeholder="12" autoComplete="off" />
            </Champ>
            <Champ id={`${uid}-rue`} label="Rue" err={erreurs.rue}>
              <input id={`${uid}-rue`} value={d.rue} onChange={(e) => set("rue", e.target.value)}
                placeholder="rue de la Paix" autoComplete="address-line1" aria-invalid={!!erreurs.rue} />
            </Champ>
          </div>
          <Champ id={`${uid}-cp`} label="Code postal" err={erreurs.codePostal}>
            <input id={`${uid}-cp`} value={d.codePostal} onChange={(e) => set("codePostal", e.target.value)}
              placeholder="75002" inputMode="numeric" maxLength={5} autoComplete="postal-code"
              aria-invalid={!!erreurs.codePostal} />
          </Champ>
          <Champ id={`${uid}-ville`} label="Ville" err={erreurs.ville}>
            <input id={`${uid}-ville`} value={d.ville} onChange={(e) => set("ville", e.target.value)}
              placeholder="Paris" autoComplete="address-level2" aria-invalid={!!erreurs.ville} />
          </Champ>
        </div>
        {!indisponible && (
          <button type="button" className="lien-discret adresse__bascule"
            onClick={() => setEtat({ saisie: "", choisie: false, manuel: false })}>
            Rechercher l’adresse
          </button>
        )}
      </div>
    );
  }

  const montrer = ouvert && liste.length > 0;
  return (
    <div className="field field--full adresse">
      <div className="adresse__tete">
        <label htmlFor={`${uid}-adresse`}>Adresse de l’immeuble</label>
        <button type="button" className="lien-discret adresse__bascule"
          onClick={() => {
            setEtat((p) => ({ ...p, manuel: true }));
            if (!etat.choisie) setPlusieurs({ rue: etat.saisie.trim() });
          }}>
          Saisir à la main
        </button>
      </div>
      <div className="adresse__boite">
        <input id={`${uid}-adresse`} value={etat.saisie} autoComplete="off" spellCheck={false}
          placeholder="12 rue de la Paix, Paris"
          role="combobox" aria-autocomplete="list" aria-expanded={montrer} aria-controls={idListe}
          aria-activedescendant={montrer && actif >= 0 ? `${idListe}-${actif}` : undefined}
          aria-invalid={!!erreurs.adresse}
          onChange={(e) => {
            setEtat({ saisie: e.target.value, choisie: false, manuel: false });
            setPlusieurs({ numero: "", rue: "", codePostal: "", ville: "" });
            setOuvert(true);
          }}
          onFocus={() => setOuvert(true)}
          onBlur={() => setOuvert(false)}
          onKeyDown={clavier} />
        {etat.choisie && <span className="adresse__ok" aria-hidden="true" />}
        {montrer && (
          <ul className="adresse__liste" role="listbox" id={idListe} aria-label="Adresses proposées">
            {liste.map((s, i) => (
              <li key={s.label} id={`${idListe}-${i}`} role="option" aria-selected={i === actif}
                className={i === actif ? "est-actif" : undefined}
                // mousedown et non click : sinon le champ perd le focus et la liste se ferme avant.
                onMouseDown={(e) => { e.preventDefault(); choisir(s); }}
                onMouseEnter={() => setActif(i)}>
                <span className="adresse__rue">{[s.numero, s.rue].filter(Boolean).join(" ")}</span>
                <span className="adresse__ville">{s.codePostal} {s.ville}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {erreurs.adresse && <span className="err" role="alert">{erreurs.adresse}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fin du parcours                                                     */
/* ------------------------------------------------------------------ */

/** Les pièces à préparer : celles du compte, sans la rubrique « Autre ». */
const PIECES = CATEGORIES.filter((c) => c.cle !== "autre");

function Fin({ titre, stocke, verdict, d, dansLeCompte }: {
  titre: React.RefObject<HTMLHeadingElement | null>;
  /** false : la demande n'a pu être enregistrée nulle part. */
  stocke: boolean;
  verdict: Verdict | null;
  d: Data;
  dansLeCompte: boolean;
}) {
  /* Cas extrême : ni le BO ni la file d'attente n'ont répondu. On ne fait pas
     croire au visiteur que sa demande est partie : on lui donne le numéro. */
  if (!stocke || !verdict) {
    return (
      <div className="form-shell outcome">
        <span className="outcome__badge outcome__badge--autre">Envoi impossible</span>
        <h3 ref={titre} tabIndex={-1}>Votre demande n’a pas pu partir.</h3>
        <p>
          Un incident technique nous empêche de l’enregistrer. Appelez-nous directement&nbsp;:
          nous prenons les mêmes informations en deux minutes.
        </p>
        <div className="btn-row">
          <a className="btn btn--primary" href={SITE.telHref}>Appeler le {SITE.tel}</a>
        </div>
      </div>
    );
  }

  if (verdict.piste === "pleinbail") {
    return (
      <div className="form-shell outcome">
        <span className="outcome__badge outcome__badge--autre">Demande enregistrée</span>
        <h3 ref={titre} tabIndex={-1}>Merci. Votre bien ira plus vite sur PleinBail.</h3>
        <p>
          Notre fichier d’investisseurs se concentre sur les immeubles à partir de{" "}
          {CALIBRE.ticketMinLabel} et sur la province au-delà de{" "}
          {CALIBRE.rentabiliteProvinceMin}&nbsp;% de rendement. Le vôtre trouvera une audience
          plus large sur <strong>PleinBail</strong>, notre plateforme dédiée aux biens loués, du
          même groupe.
        </p>
        <div className="btn-row">
          <a className="btn btn--primary" href={SITE.pleinbail} target="_blank" rel="noopener">
            Déposer sur PleinBail
          </a>
          <a className="btn btn--outline" href={SITE.telHref}>{SITE.tel}</a>
        </div>
      </div>
    );
  }

  const objet = encodeURIComponent(
    `Pièces pour l’estimation : ${[d.numero, d.rue].filter(Boolean).join(" ")}, ${d.ville}`.trim(),
  );
  return (
    <div className="form-shell outcome">
      <span className="outcome__badge">
        {verdict.piste === "prioritaire" ? "Dossier prioritaire" : "Dossier retenu"}
      </span>
      <h3 ref={titre} tabIndex={-1}>C’est noté. Un agent vous appelle sous 48&nbsp;h.</h3>
      <p>
        {verdict.piste === "prioritaire"
          ? "Votre immeuble correspond au cœur de ce que nous vendons. L’agent vous rappelle avec une estimation appuyée sur nos ventes comparables."
          : "Le rendement de votre immeuble intéresse nos acquéreurs. L’agent vous rappelle avec une estimation argumentée."}
      </p>

      <div className="pieces-attendues">
        <h4>Les pièces dont nous aurons besoin</h4>
        <ul>
          {PIECES.map((c) => (
            <li key={c.cle}><strong>{c.titre}</strong> <span>{c.aide}</span></li>
          ))}
        </ul>
        {dansLeCompte ? (
          <p>
            Déposez-les dans la rubrique Pièces de votre compte, ou envoyez-les à{" "}
            <a className="lien-discret" href={`mailto:${SITE.email}?subject=${objet}`}>{SITE.email}</a>.
          </p>
        ) : (
          <p>
            Nous venons de vous envoyer cette liste par e-mail, avec l’accès à votre espace client,
            ouvert pour vous. Vous y déposerez les pièces et y retrouverez votre estimation. Vous
            pouvez aussi les envoyer à{" "}
            <a className="lien-discret" href={`mailto:${SITE.email}?subject=${objet}`}>{SITE.email}</a>.
          </p>
        )}
      </div>
    </div>
  );
}

/** « 180 000 », « 180000 », « 1 250,5 » : un nombre, ou NaN. */
function nombre(v: string): number {
  const s = v.replace(/[\s  ]/g, "").replace(",", ".");
  return s === "" ? NaN : Number(s);
}
