"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  bauxPour, DPE, ETATS, LOTS_MAX, PICTO_TYPE, lotVide, motDePasseValide, STATUTS, totaux, TYPES_LOT, TYPOLOGIES,
  type Dossier, type Lot,
} from "@/lib/dossier/modele";
import { SITE } from "@/lib/site";
import { Picto } from "@/components/Picto";

/**
 * L'état locatif du vendeur, lot par lot (retour #64 de MAV, 27/10/2026).
 *
 * Prérempli avec les lots annoncés dans le formulaire d'estimation. Chaque
 * modification est enregistrée sur le serveur après une courte pause : le
 * vendeur peut fermer la page et revenir. Rien n'est gardé dans le navigateur
 * (§16 : ni localStorage ni sessionStorage).
 *
 * À la fin, « Valider et créer mon compte » : le dossier part à l'agence, puis
 * le visiteur choisit un mot de passe et saisit le code reçu par e-mail.
 */

type Etape = "saisie" | "code" | "fini";

export function DossierForm({
  initial,
  adresse,
  connecte,
  dejaValide,
}: {
  initial: Dossier;
  adresse: string;
  /** Connecté avec une adresse vérifiée : pas de mot de passe ni de code. */
  connecte: boolean;
  /** Dossier déjà envoyé, compte pas encore ouvert : on reprend au code. */
  dejaValide: boolean;
}) {
  const uid = useId();
  const [d, setD] = useState<Dossier>(initial);
  const [etape, setEtape] = useState<Etape>(dejaValide ? "code" : "saisie");
  const [sauvegarde, setSauvegarde] = useState<"" | "attente" | "ok" | "erreur">("");
  const [motDePasse, setMotDePasse] = useState("");
  const [voir, setVoir] = useState(false);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [renvoye, setRenvoye] = useState(false);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const premier = useRef(true);
  const titreCode = useRef<HTMLHeadingElement>(null);

  // Enregistrement automatique, 1,2 s après la dernière frappe.
  useEffect(() => {
    if (premier.current) { premier.current = false; return; }
    if (etape !== "saisie") return;
    setSauvegarde("attente");
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => { void enregistrer(d); }, 1200);
    return () => { if (minuterie.current) clearTimeout(minuterie.current); };
  }, [d]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (etape === "code") titreCode.current?.focus();
  }, [etape]);

  async function enregistrer(donnees: Dossier): Promise<boolean> {
    try {
      const r = await fetch("/api/dossier/", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ donnees }),
      });
      setSauvegarde(r.ok ? "ok" : "erreur");
      return r.ok;
    } catch {
      setSauvegarde("erreur");
      return false;
    }
  }

  const majLot = (i: number, champ: keyof Lot, v: string) =>
    setD((p) => ({
      ...p,
      lots: p.lots.map((l, j) => {
        if (j !== i) return l;
        const n = { ...l, [champ]: v };
        // Un bail qui ne va pas avec le nouveau type est effacé ; un logement garde sa typologie.
        if (champ === "type") {
          if (!bauxPour(v).some((b) => b.cle === n.bail)) n.bail = "";
          if (v !== "habitation") n.typologie = "";
        }
        return n;
      }),
    }));
  const ajouter = () =>
    setD((p) => (p.lots.length >= LOTS_MAX ? p : { ...p, lots: [...p.lots, lotVide(p.lots.at(-1)?.type ?? "habitation")] }));
  const retirer = (i: number) => setD((p) => ({ ...p, lots: p.lots.filter((_, j) => j !== i) }));

  async function valider(ev: React.FormEvent) {
    ev.preventDefault();
    setErreur("");
    if (!connecte && !motDePasseValide(motDePasse)) {
      setErreur("Choisissez un mot de passe de 8 caractères au moins, avec des lettres et des chiffres.");
      return;
    }
    setEnvoi(true);
    if (minuterie.current) clearTimeout(minuterie.current);
    try {
      const r = await fetch("/api/dossier/valider/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ donnees: d, motDePasse }),
      });
      const j = (await r.json()) as { ok?: boolean; etape?: Etape; email?: string; erreur?: string };
      if (!r.ok || !j.ok) { setErreur(j.erreur ?? "Une erreur est survenue. Réessayez."); return; }
      if (j.etape === "fini") { setEtape("fini"); return; }
      setEmail(j.email ?? "");
      if (j.erreur) setErreur(j.erreur);
      setEtape("code");
    } catch {
      setErreur("La connexion a été coupée. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  async function renvoyer() {
    setErreur("");
    setEnvoi(true);
    try {
      const r = await fetch("/api/dossier/valider/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = (await r.json()) as { ok?: boolean; email?: string; erreur?: string };
      if (j.email) setEmail(j.email);
      if (!r.ok || !j.ok || j.erreur) setErreur(j.erreur ?? "Le code n’a pas pu partir. Réessayez.");
      else setRenvoye(true);
    } catch {
      setErreur("La connexion a été coupée. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  async function ouvrirCompte(ev: React.FormEvent) {
    ev.preventDefault();
    setErreur("");
    if (code.length < 6) { setErreur("Saisissez le code reçu par e-mail."); return; }
    if (!motDePasseValide(motDePasse)) {
      setErreur("Choisissez un mot de passe de 8 caractères au moins, avec des lettres et des chiffres.");
      return;
    }
    setEnvoi(true);
    try {
      const r = await fetch("/api/dossier/code/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, motDePasse }),
      });
      const j = (await r.json()) as { ok?: boolean; suite?: string; erreur?: string };
      if (!r.ok || !j.ok) { setErreur(j.erreur ?? "Une erreur est survenue. Réessayez."); return; }
      window.location.assign(j.suite ?? "/mon-compte/");
    } catch {
      setErreur("La connexion a été coupée. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  const { surface, loyerAn } = totaux(d);

  if (etape === "fini") {
    return (
      <div className="form-shell outcome dossier-fin">
        <span className="outcome__badge">Dossier envoyé</span>
        <h3 tabIndex={-1}>Merci. Votre agent a reçu votre dossier.</h3>
        <p>Il s’en sert pour préparer l’entretien et l’estimation, que vous retrouverez dans votre compte.</p>
        <div className="btn-row">
          <a className="btn btn--primary" href="/mon-compte/#vendre">Aller à mon compte</a>
        </div>
      </div>
    );
  }

  if (etape === "code") {
    return (
      <form className="form-shell dossier-code" onSubmit={ouvrirCompte} noValidate>
        <div className="step-head">
          <span className="outcome__badge">Dossier envoyé</span>
          <h3 ref={titreCode} tabIndex={-1}>Plus qu’une étape pour ouvrir votre compte</h3>
          <p>
            Nous venons d’envoyer un code{email ? <> à <strong>{email}</strong></> : null}. Il
            confirme que cette adresse est bien la vôtre.
          </p>
        </div>
        <div className="fields">
          <div className="field">
            <label htmlFor={`${uid}-code`}>Code reçu par e-mail</label>
            <input id={`${uid}-code`} className="dossier-code__champ" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric" autoComplete="one-time-code" placeholder="123456" maxLength={10} />
          </div>
          {!motDePasseValide(motDePasse) && (
            <ChampMotDePasse id={`${uid}-mdp2`} valeur={motDePasse} onChange={setMotDePasse} voir={voir} setVoir={setVoir} />
          )}
        </div>
        {erreur && <p className="err" role="alert">{erreur}</p>}
        <div className="field-nav">
          <button type="submit" className="btn btn--primary" disabled={envoi}>
            {envoi ? "Vérification…" : "Ouvrir mon compte"}
          </button>
        </div>
        <p className="form-note">
          {renvoye ? "Un nouveau code est parti. " : "Rien reçu ? Regardez dans les indésirables, ou "}
          {!renvoye && (
            <button type="button" className="lien-discret" onClick={renvoyer} disabled={envoi}>renvoyez le code</button>
          )}
          {!renvoye && "."}
        </p>
      </form>
    );
  }

  return (
    <form className="dossier" onSubmit={valider} noValidate>
      <div className="dossier__bloc">
        <div className="dossier__tete">
          <h3>L’immeuble</h3>
          {adresse && <p className="dossier__adresse">{adresse}</p>}
        </div>
        <div className="fields fields--2">
          <Nombre id={`${uid}-tf`} label="Taxe foncière annuelle (€)" valeur={d.taxeFonciere}
            onChange={(v) => setD((p) => ({ ...p, taxeFonciere: v }))} placeholder="8 400" />
          <Nombre id={`${uid}-teom`} label="Dont récupéré sur les locataires, TEOM (€)" valeur={d.teom}
            onChange={(v) => setD((p) => ({ ...p, teom: v }))} placeholder="1 200" />
        </div>
      </div>

      <div className="dossier__bloc">
        <div className="dossier__tete">
          <h3>Les lots</h3>
          <p className="dossier__total" aria-live="polite">
            {d.lots.length} lot{d.lots.length > 1 ? "s" : ""}
            {surface > 0 && <> · {surface.toLocaleString("fr-FR")} m² Carrez</>}
            {loyerAn > 0 && <> · {Math.round(loyerAn).toLocaleString("fr-FR")} € HC par an</>}
          </p>
        </div>
        <div className="lots-table" role="list">
          <div className="lots-table__entete" aria-hidden="true">
            <span>Lot</span><span>Type</span><span>Typologie</span><span>Carrez (m²)</span><span>État</span>
            <span>Occupation</span><span>Bail</span><span>Loyer HC / mois (€)</span><span>DPE</span><span />
          </div>
          {d.lots.map((l, i) => (
            <LigneLot key={i} i={i} uid={uid} l={l} onChange={(c, v) => majLot(i, c, v)}
              onRetirer={d.lots.length > 1 ? () => retirer(i) : undefined} />
          ))}
        </div>
        {d.lots.length < LOTS_MAX && (
          <button type="button" className="lien-discret dossier__ajouter" onClick={ajouter}>Ajouter un lot</button>
        )}
      </div>

      <div className="dossier__bloc">
        <div className="field">
          <label htmlFor={`${uid}-com`}>Autre chose à signaler</label>
          <textarea id={`${uid}-com`} rows={3} value={d.commentaire} maxLength={2000}
            onChange={(e) => setD((p) => ({ ...p, commentaire: e.target.value }))}
            placeholder="Travaux réalisés ou à prévoir, lots vacants, particularités…" />
        </div>
        <p className="dossier__note">
          Plans et photos&nbsp;: envoyez-les à{" "}
          <a className="lien-discret" href={`mailto:${SITE.email}`}>{SITE.email}</a>, en rappelant l’adresse
          de l’immeuble.
        </p>
      </div>

      <div className="dossier__bloc dossier__valider">
        {connecte ? (
          <h3>Votre dossier est prêt&nbsp;?</h3>
        ) : (
          <>
            <h3>Valider et créer mon compte</h3>
            <p>Votre compte est prêt. Il ne manque que votre mot de passe.</p>
            <ChampMotDePasse id={`${uid}-mdp`} valeur={motDePasse} onChange={(v) => { setMotDePasse(v); setErreur(""); }}
              voir={voir} setVoir={setVoir} />
          </>
        )}
        {erreur && <p className="err" role="alert">{erreur}</p>}
        <div className="field-nav">
          <button type="submit" className="btn btn--primary" disabled={envoi}>
            {envoi ? "Envoi…" : connecte ? "Valider mon dossier" : "Valider et créer mon compte"}
          </button>
        </div>
        <p className="dossier__etat" aria-live="polite">
          {sauvegarde === "attente" ? "Enregistrement…"
            : sauvegarde === "ok" ? "Enregistré. Vous pouvez revenir plus tard."
            : sauvegarde === "erreur" ? "Enregistrement impossible pour l’instant. Votre saisie est gardée sur cette page."
            : "Votre saisie est enregistrée au fur et à mesure."}
        </p>
      </div>
    </form>
  );
}

function LigneLot({ i, uid, l, onChange, onRetirer }: {
  i: number; uid: string; l: Lot;
  onChange: (c: keyof Lot, v: string) => void;
  onRetirer?: () => void;
}) {
  const id = (c: string) => `${uid}-l${i}-${c}`;
  const libre = l.statut === "libre";
  return (
    <div className="lot-ligne" role="listitem">
      <span className="lot-ligne__num">
        <Picto nom={PICTO_TYPE[l.type] ?? "autre"} taille={22} className="lot-ligne__picto" />
        Lot {i + 1}
      </span>
      <Choix id={id("type")} label="Type" valeur={l.type} options={TYPES_LOT} onChange={(v) => onChange("type", v)} />
      {l.type === "habitation" ? (
        <Choix id={id("typo")} label="Typologie" valeur={l.typologie} options={TYPOLOGIES} vide="Choisir"
          onChange={(v) => onChange("typologie", v)} />
      ) : (
        <span className="lot-ligne__vide" aria-hidden="true" />
      )}
      <Nombre id={id("surf")} label="Carrez (m²)" valeur={l.surface} onChange={(v) => onChange("surface", v)} />
      <Choix id={id("etat")} label="État" valeur={l.etat} options={ETATS} vide="Choisir"
        onChange={(v) => onChange("etat", v)} />
      <Choix id={id("statut")} label="Occupation" valeur={l.statut} options={STATUTS} vide="Choisir"
        onChange={(v) => onChange("statut", v)} />
      <Choix id={id("bail")} label="Bail" valeur={libre ? "" : l.bail} options={bauxPour(l.type)} vide={libre ? "Sans bail" : "Choisir"}
        onChange={(v) => onChange("bail", v)} desactive={libre} />
      <Nombre id={id("loyer")} label="Loyer HC / mois (€)" valeur={libre ? "" : l.loyer}
        onChange={(v) => onChange("loyer", v)} desactive={libre} />
      <Choix id={id("dpe")} label="DPE" valeur={l.dpe} options={DPE.map((x) => ({ cle: x, libelle: x }))} vide="?"
        onChange={(v) => onChange("dpe", v)} />
      {onRetirer ? (
        <button type="button" className="lot-ligne__retirer" onClick={onRetirer} aria-label={`Retirer le lot ${i + 1}`}>
          <span aria-hidden="true">×</span>
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

function Choix({ id, label, valeur, options, onChange, vide, desactive }: {
  id: string; label: string; valeur: string; options: { cle: string; libelle: string }[];
  onChange: (v: string) => void; vide?: string; desactive?: boolean;
}) {
  return (
    <div className="field lot-champ">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={valeur} onChange={(e) => onChange(e.target.value)} disabled={desactive}>
        {vide !== undefined && <option value="">{vide}</option>}
        {options.map((o) => <option key={o.cle} value={o.cle}>{o.libelle}</option>)}
      </select>
    </div>
  );
}

function Nombre({ id, label, valeur, onChange, placeholder, desactive }: {
  id: string; label: string; valeur: string; onChange: (v: string) => void; placeholder?: string; desactive?: boolean;
}) {
  return (
    <div className="field lot-champ">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={valeur} inputMode="decimal" placeholder={placeholder} disabled={desactive}
        onChange={(e) => onChange(e.target.value.replace(/[^\d\s,.]/g, "").slice(0, 14))} />
    </div>
  );
}

function ChampMotDePasse({ id, valeur, onChange, voir, setVoir }: {
  id: string; valeur: string; onChange: (v: string) => void; voir: boolean; setVoir: (v: boolean) => void;
}) {
  return (
    <div className="field dossier__mdp">
      <label htmlFor={id}>Mot de passe</label>
      <div className="mdp">
        <input id={id} type={voir ? "text" : "password"} value={valeur} autoComplete="new-password"
          onChange={(e) => onChange(e.target.value)} minLength={8} maxLength={72} />
        <button type="button" className="lien-discret mdp__voir" onClick={() => setVoir(!voir)}>
          {voir ? "Masquer" : "Afficher"}
        </button>
      </div>
      <span className="hint">8 caractères au moins, avec des lettres et des chiffres.</span>
    </div>
  );
}
