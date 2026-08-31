"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowIcon } from "./ArrowIcon";
import { SITE, CALIBRE } from "@/lib/site";
import { router as routerDossier, type Verdict } from "@/lib/routage";

/**
 * Tunnel d'estimation — CLAUDE.md §9.
 *
 * UN SEUL ÉCRAN du point de vue du visiteur. Il saisit l'essentiel — adresse,
 * surface, loyer HC, coordonnées — et valide : LE LEAD EST PARTI. Rien ne lui
 * annonce une suite : ni barre de progression, ni compteur « étape 1/2 », ni
 * bouton « continuer ». Un formulaire qui affiche trois étapes fait fuir avant
 * la première.
 *
 * Ce n'est qu'une fois sa demande confirmée qu'on lui propose d'affiner. Ces
 * champs-là sont facultatifs et le disent. S'il ferme l'onglet à cet instant,
 * nous avons déjà de quoi le rappeler et situer son immeuble.
 *
 * Les deux envois portent le même `ref` : le BO reconnaît le complément comme
 * un enrichissement du lead, pas comme un doublon.
 *
 * ⚠️ Les libellés « bureaux » et « commerces » sont inversés dans le formulaire
 * WordPress actuel (§9). La correspondance est vérifiée ici.
 */

type Data = {
  // Ce que le visiteur voit d'emblée. Tout est requis sauf le téléphone.
  adresse: string;
  codePostal: string;
  surface: string;
  loyerAnnuel: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  // Le complément, proposé seulement après confirmation. Tout est facultatif.
  lotsHabitation: string;
  lotsCommerces: string;
  lotsBureaux: string;
  lotsActivite: string;
  travaux: string;
  echeance: string;
  valeurEstimee: string;
  message: string;
};

const VIDE: Data = {
  adresse: "", codePostal: "", surface: "", loyerAnnuel: "",
  prenom: "", nom: "", email: "", telephone: "",
  lotsHabitation: "", lotsCommerces: "", lotsBureaux: "", lotsActivite: "",
  travaux: "", echeance: "", valeurEstimee: "", message: "",
};

const TRAVAUX = ["Pas de travaux", "Petits travaux", "Gros travaux", "Je ne sais pas"];
const ECHEANCES = ["Dès maintenant", "Sous 6 mois", "Sous 12 mois", "Je me renseigne"];

type Phase = "saisie" | "complement" | "fin";

export function EstimationForm() {
  const uid = useId();
  const [phase, setPhase] = useState<Phase>("saisie");
  const [d, setD] = useState<Data>(VIDE);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const ref = useRef<string>("");

  const set = (k: keyof Data, v: string) => {
    setD((p) => ({ ...p, [k]: v }));
    setErreurs((p) => ({ ...p, [k]: "" }));
  };

  function valider() {
    const e: Record<string, string> = {};
    if (!d.adresse.trim()) e.adresse = "Indiquez l’adresse de l’immeuble.";
    if (!/^\d{5}$/.test(d.codePostal.trim())) e.codePostal = "Code postal à 5 chiffres.";
    if (!d.surface.trim()) e.surface = "Même approximative.";
    if (!d.loyerAnnuel.trim()) e.loyerAnnuel = "Le loyer annuel encaissé, hors charges.";
    if (!d.prenom.trim()) e.prenom = "Requis.";
    if (!d.nom.trim()) e.nom = "Requis.";
    if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) e.email = "E-mail invalide.";
    if (d.telephone.trim() && d.telephone.replace(/\D/g, "").length < 9) {
      e.telephone = "Téléphone invalide.";
    }
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  /** Un seul point de sortie vers le BO, appelé aux deux envois. */
  async function transmettre(donnees: Data, etat: "principal" | "complement") {
    try {
      await fetch("/api/lead/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "estimation", etat, ref: ref.current, ...donnees }),
      });
    } catch {
      // On n'affiche jamais d'échec au visiteur : le handler serveur trace et
      // alerte. Perdre visuellement le lead serait pire que le tracer.
    }
  }

  async function envoyerPrincipal(ev: React.FormEvent) {
    ev.preventDefault();
    if (!valider()) return;
    setEnvoi(true);

    ref.current =
      globalThis.crypto?.randomUUID?.() ?? `fi-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const v = routerDossier({
      codePostal: d.codePostal,
      valeurEstimee: null,
      loyerAnnuel: Number(d.loyerAnnuel.replace(/\D/g, "")) || null,
    });

    await transmettre(d, "principal");

    // Event GTM sur soumission réussie (CLAUDE.md §9). Il part ICI, au premier
    // envoi : c'est là que la conversion a lieu. Le complément n'en est pas une.
    type DL = { push: (o: Record<string, unknown>) => void };
    const w = window as unknown as { dataLayer?: DL };
    w.dataLayer?.push({ event: "form_submit_estimation", piste: v.piste });

    setVerdict(v);
    setPhase("complement");
    setEnvoi(false);
  }

  async function envoyerComplement(ev: React.FormEvent) {
    ev.preventDefault();
    setEnvoi(true);
    await transmettre(d, "complement");

    // Le complément affine le routage quand le vendeur a donné une valeur.
    const valeur = Number(d.valeurEstimee.replace(/\D/g, "")) || null;
    if (valeur) {
      setVerdict(
        routerDossier({
          codePostal: d.codePostal,
          valeurEstimee: valeur,
          loyerAnnuel: Number(d.loyerAnnuel.replace(/\D/g, "")) || null,
        }),
      );
    }
    setPhase("fin");
    setEnvoi(false);
  }

  if (phase !== "saisie" && verdict) {
    return (
      <Suite
        phase={phase}
        verdict={verdict}
        d={d}
        set={set}
        uid={uid}
        envoi={envoi}
        onEnvoyer={envoyerComplement}
        onPasser={() => setPhase("fin")}
      />
    );
  }

  return (
    <form className="form-shell" onSubmit={envoyerPrincipal} noValidate>
      <div className="step-head">
        <h3>Votre immeuble</h3>
        <p>L’adresse, deux chiffres, vos coordonnées. Réponse sous 48&nbsp;h.</p>
      </div>

      <div className="fields fields--2">
        <Champ id={`${uid}-adr`} label="Adresse de l’immeuble" err={erreurs.adresse} full>
          <input id={`${uid}-adr`} value={d.adresse} onChange={(e) => set("adresse", e.target.value)}
            placeholder="12 rue de la Paix, Paris" autoComplete="street-address" />
        </Champ>
        <Champ id={`${uid}-cp`} label="Code postal" err={erreurs.codePostal}>
          <input id={`${uid}-cp`} value={d.codePostal} onChange={(e) => set("codePostal", e.target.value)}
            placeholder="75002" inputMode="numeric" maxLength={5} autoComplete="postal-code" />
        </Champ>
        <Champ id={`${uid}-surface`} label="Surface totale (m²)" err={erreurs.surface}
          hint="Carrez si vous l’avez">
          <input id={`${uid}-surface`} value={d.surface} onChange={(e) => set("surface", e.target.value)}
            placeholder="420" inputMode="numeric" />
        </Champ>
        <Champ id={`${uid}-loyer`} label="Loyers annuels HC (€)" err={erreurs.loyerAnnuel}
          hint="Hors charges, tel qu’encaissé" full>
          <input id={`${uid}-loyer`} value={d.loyerAnnuel} onChange={(e) => set("loyerAnnuel", e.target.value)}
            placeholder="180000" inputMode="numeric" />
        </Champ>

        <Champ id={`${uid}-prenom`} label="Prénom" err={erreurs.prenom}>
          <input id={`${uid}-prenom`} value={d.prenom} onChange={(e) => set("prenom", e.target.value)}
            autoComplete="given-name" />
        </Champ>
        <Champ id={`${uid}-nom`} label="Nom" err={erreurs.nom}>
          <input id={`${uid}-nom`} value={d.nom} onChange={(e) => set("nom", e.target.value)}
            autoComplete="family-name" />
        </Champ>
        <Champ id={`${uid}-email`} label="E-mail" err={erreurs.email}>
          <input id={`${uid}-email`} type="email" value={d.email} onChange={(e) => set("email", e.target.value)}
            autoComplete="email" />
        </Champ>
        <Champ id={`${uid}-tel`} label="Téléphone" err={erreurs.telephone} hint="Facultatif, mais on va plus vite">
          <input id={`${uid}-tel`} type="tel" value={d.telephone} onChange={(e) => set("telephone", e.target.value)}
            autoComplete="tel" />
        </Champ>
      </div>

      <div className="field-nav">
        <button type="submit" className="btn btn--primary" disabled={envoi}>
          {envoi ? "Envoi…" : "Estimer mon immeuble"} {!envoi && <ArrowIcon />}
        </button>
      </div>

      <p className="form-note">
        Rien n’est diffusé, rien n’est publié tant que vous ne l’avez pas décidé.
      </p>
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

/**
 * Après l'envoi : la confirmation d'abord, l'invitation à compléter ensuite.
 *
 * L'ordre compte. Le visiteur doit lire « c'est parti » avant de voir un seul
 * champ de plus, sans quoi il croit que sa demande dépend de ce qu'il lui reste
 * à remplir — exactement ce qu'on voulait éviter en découpant.
 */
function Suite({ phase, verdict, d, set, uid, envoi, onEnvoyer, onPasser }: {
  phase: Phase;
  verdict: Verdict;
  d: Data;
  set: (k: keyof Data, v: string) => void;
  uid: string;
  envoi: boolean;
  onEnvoyer: (ev: React.FormEvent) => void;
  onPasser: () => void;
}) {
  const bloc = useRef<HTMLDivElement>(null);

  // Sans ça, la page reste scrollée là où était le formulaire et la
  // confirmation passe sous le header collant.
  useEffect(() => {
    bloc.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  const rdt = verdict.rentabilite;
  const pleinbail = verdict.piste === "pleinbail";
  const prioritaire = verdict.piste === "prioritaire";

  return (
    <div className="form-shell outcome" ref={bloc}>
      <span className={`outcome__badge${pleinbail ? " outcome__badge--autre" : ""}`}>
        {pleinbail ? "Demande enregistrée" : prioritaire ? "Dossier prioritaire" : "Dossier retenu"}
      </span>

      {pleinbail ? (
        <>
          <h3>Merci {d.prenom}. Votre bien ira plus vite sur PleinBail.</h3>
          <p>
            Notre fichier d’investisseurs se concentre sur les immeubles à partir de{" "}
            {CALIBRE.ticketMinLabel} et sur la province au-delà de{" "}
            {CALIBRE.rentabiliteProvinceMin}&nbsp;% de rendement. Le vôtre trouvera une audience
            plus large sur <strong>PleinBail</strong>, notre plateforme dédiée aux biens loués —
            même groupe, même exigence.
          </p>
        </>
      ) : (
        <>
          <h3>C’est envoyé, {d.prenom}. Nous revenons vers vous sous 48&nbsp;h.</h3>
          <p>
            {prioritaire
              ? "Votre immeuble correspond au cœur de ce que nous traitons. Un interlocuteur vous rappelle avec une fourchette argumentée, appuyée sur nos transactions comparables."
              : "Le rendement de votre immeuble intéresse notre fichier. Un interlocuteur vous rappelle avec une fourchette argumentée."}
          </p>
        </>
      )}

      {rdt !== null && (
        <p>Rendement brut calculé sur vos chiffres&nbsp;: <strong>{rdt.toFixed(1)} %</strong>.</p>
      )}

      {phase === "complement" && !pleinbail && (
        <form className="complement" onSubmit={onEnvoyer} noValidate>
          <div className="complement__intro">
            <h4>Vous avez deux minutes de plus&nbsp;?</h4>
            <p>
              Ces précisions resserrent la fourchette avant même qu’on vous appelle. Elles sont
              toutes facultatives — votre demande est déjà partie.
            </p>
          </div>

          <div className="fields fields--2">
            {/* ⚠️ §9 : sur le formulaire actuel, les libellés « bureaux » et
                « commerces » ne correspondent pas aux noms de champs. Ici la
                clé porte le même mot que l'étiquette, sans exception. */}
            <Champ id={`${uid}-lh`} label="Lots d’habitation">
              <input id={`${uid}-lh`} value={d.lotsHabitation}
                onChange={(e) => set("lotsHabitation", e.target.value)} inputMode="numeric" placeholder="8" />
            </Champ>
            <Champ id={`${uid}-lc`} label="Lots de commerces">
              <input id={`${uid}-lc`} value={d.lotsCommerces}
                onChange={(e) => set("lotsCommerces", e.target.value)} inputMode="numeric" placeholder="1" />
            </Champ>
            <Champ id={`${uid}-lb`} label="Lots de bureaux">
              <input id={`${uid}-lb`} value={d.lotsBureaux}
                onChange={(e) => set("lotsBureaux", e.target.value)} inputMode="numeric" placeholder="0" />
            </Champ>
            <Champ id={`${uid}-la`} label="Lots d’activité">
              <input id={`${uid}-la`} value={d.lotsActivite}
                onChange={(e) => set("lotsActivite", e.target.value)} inputMode="numeric" placeholder="0" />
            </Champ>

            <Champ id={`${uid}-valeur`} label="Le prix que vous avez en tête (€)"
              hint="Même approximatif — ça nous dit d’où on part" full>
              <input id={`${uid}-valeur`} value={d.valeurEstimee}
                onChange={(e) => set("valeurEstimee", e.target.value)} inputMode="numeric" placeholder="2400000" />
            </Champ>

            <Champ id={`${uid}-trav`} label="Travaux à prévoir" full>
              <div className="choices">
                {TRAVAUX.map((t) => (
                  <button key={t} type="button" className="choice" aria-pressed={d.travaux === t}
                    onClick={() => set("travaux", t)}>{t}</button>
                ))}
              </div>
            </Champ>
            <Champ id={`${uid}-ech`} label="Vous souhaitez vendre" full>
              <div className="choices">
                {ECHEANCES.map((t) => (
                  <button key={t} type="button" className="choice" aria-pressed={d.echeance === t}
                    onClick={() => set("echeance", t)}>{t}</button>
                ))}
              </div>
            </Champ>
            <Champ id={`${uid}-msg`} label="Précisions" full>
              <textarea id={`${uid}-msg`} value={d.message} onChange={(e) => set("message", e.target.value)}
                placeholder="Occupation, contexte de la vente, contraintes de calendrier…" />
            </Champ>
          </div>

          <div className="field-nav">
            <button type="submit" className="btn btn--primary" disabled={envoi}>
              {envoi ? "Envoi…" : "Compléter mon dossier"} {!envoi && <ArrowIcon />}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onPasser}>
              C’est tout pour l’instant
            </button>
          </div>
        </form>
      )}

      {(phase === "fin" || pleinbail) && (
        <div className="btn-row">
          {pleinbail ? (
            <>
              <a className="btn btn--primary" href={SITE.pleinbail} target="_blank" rel="noopener">
                Déposer sur PleinBail <ArrowIcon />
              </a>
              <a className="btn btn--outline" href={SITE.telHref}>{SITE.tel}</a>
            </>
          ) : (
            <a className="btn btn--outline" href={SITE.telHref}>
              Nous joindre directement · {SITE.tel}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
