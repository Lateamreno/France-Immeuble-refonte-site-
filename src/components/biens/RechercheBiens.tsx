"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Picto } from "@/components/Picto";
import { envoyer } from "@/components/compte/envoyer";
import { DoubleCurseur } from "@/components/DoubleCurseur";
import { ChoixLieux } from "./ChoixLieux";
import { DESTINATIONS, LIBELLE_DESTINATION, type Destination } from "@/lib/annonce";
import {
  CIBLES, LIBELLE_OPERATION, lienRecherche, type Cible, type Criteres,
} from "@/lib/recherche-biens";
import { lienConnexion, useEtatCompte } from "./etat";

const PAS_PRIX = 10_000;
const milliers = (n: number) => n.toLocaleString("fr-FR").replace(/\s/g, " ");
const enEuros = (n: number | null) => (n == null ? "" : `${milliers(n)} €`);
const lireEntier = (s: string) => {
  const t = s.replace(/[^\d]/g, "");
  return t ? Number(t) : null;
};

/**
 * La barre de recherche des immeubles à vendre : la mise en page de Plein Bail,
 * les critères du BO (MAV, 02/11/2026). Localisation (départements et villes
 * de toute la France ; une région s'ouvre en ses départements), destinations,
 * prix minimum et maximum, rendement minimum ; en plus (retour #94),
 * l'occupation et le type d'opération, qui devient le profil enregistré. « Enregistrer la recherche » ajoute le profil
 * (plusieurs possibles : une recherche par profil au BO) et un commentaire.
 * Rien ne se lance tout seul : on remplit, puis on cherche. La page remonte ce
 * composant à chaque changement d'adresse : la barre reflète la recherche affichée.
 */
export function RechercheBiens({
  criteres, villes, departementsPresents, bornesPrix, pourCompte,
}: {
  criteres: Criteres;
  villes: { nom: string; dept: string; n: number }[];
  departementsPresents: Record<string, number>;
  bornesPrix: { min: number; max: number } | null;
  pourCompte: {
    departements: string[]; villes: string[]; prixMin: number | null; prixMax: number | null; rendementMin: number | null;
    occupationMin: number | null; occupationMax: number | null; destinations: Destination[];
  };
}) {
  const uid = useId();
  const router = useRouter();
  const etat = useEtatCompte();
  const [zones, setZones] = useState(criteres.zones);
  const [dest, setDest] = useState<Destination[]>(criteres.destinations);
  const [menuDest, setMenuDest] = useState(false);
  const [pmin, setPmin] = useState<number | null>(criteres.prixMin);
  const [pmax, setPmax] = useState<number | null>(criteres.prixMax);
  const [rdt, setRdt] = useState(criteres.rendementMin ?? 0);
  const [occMin, setOccMin] = useState<number | null>(criteres.occupationMin);
  const [occMax, setOccMax] = useState<number | null>(criteres.occupationMax);
  const [plus, setPlus] = useState(criteres.occupationMin != null || criteres.occupationMax != null || criteres.operations.length > 0);
  const [enregistrer, setEnregistrer] = useState<"" | "choix" | "envoi" | "ok">("");
  const [cibles, setCibles] = useState<Cible[]>(criteres.operations);
  const [commentaire, setCommentaire] = useState("");
  const [erreur, setErreur] = useState("");
  const destRef = useRef<HTMLDivElement>(null);

  // Le menu des destinations se ferme au clic dehors et à Échap.
  useEffect(() => {
    if (!menuDest) return;
    const dehors = (e: MouseEvent) => { if (!destRef.current?.contains(e.target as Node)) setMenuDest(false); };
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuDest(false); };
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    return () => { document.removeEventListener("mousedown", dehors); document.removeEventListener("keydown", echap); };
  }, [menuDest]);


  const libelleDest = dest.length === 0 || dest.length === DESTINATIONS.length ? "Tous les types" : DESTINATIONS.filter((d) => dest.includes(d)).map((d) => LIBELLE_DESTINATION[d]).join(" · ");

  const criteresSaisis = (): Partial<Criteres> => ({
    zones, destinations: dest, prixMin: pmin, prixMax: pmax, rendementMin: rdt > 0.5 ? rdt : null,
    occupationMin: occMin, occupationMax: occMax, operations: cibles, tri: criteres.tri,
  });

  const lancer = (e?: React.FormEvent) => {
    e?.preventDefault();
    router.push(lienRecherche(criteresSaisis()), { scroll: false });
    document.getElementById("resultats")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Prix : ±10 000 € aux flèches ; la première adopte le prix réel le plus bas ou le plus haut.
  const pas = (v: number | null, sens: 1 | -1, borne: number | undefined) =>
    v == null ? (borne ?? 0) : Math.max(0, v + sens * PAS_PRIX);

  async function enregistrerRecherche() {
    setErreur("");
    if (!etat?.connecte) { window.location.assign(lienConnexion()); return; }
    if (pourCompte.departements.length === 0) {
      setErreur("Choisissez au moins un département ou une ville, puis lancez la recherche.");
      return;
    }
    if (enregistrer !== "choix") { setEnregistrer("choix"); return; }
    if (cibles.length === 0) { setErreur("Choisissez au moins un type d’opération."); return; }
    setEnregistrer("envoi");
    const r = await envoyer("/api/compte/recherche/", { ...pourCompte, cibles, commentaire });
    if (!r.ok) { setEnregistrer("choix"); setErreur(r.erreur ?? ""); return; }
    setEnregistrer("ok");
  }

  const champPrix = (id: string, libelle: string, v: number | null, set: (n: number | null) => void, borne: number | undefined) => (
    <div className="recherche-biens__champ recherche-biens__champ--prix">
      <label htmlFor={id} className="recherche-biens__lbl"><Picto nom="euro" taille={15} />{libelle}</label>
      <div className="prix-fleches">
        <input id={id} inputMode="numeric" autoComplete="off" value={enEuros(v)} placeholder={borne != null ? enEuros(borne) : "Indifférent"}
          onChange={(e) => set(lireEntier(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); set(pas(v, e.key === "ArrowUp" ? 1 : -1, borne)); }
          }} />
        <span className="prix-fleches__btn">
          <button type="button" tabIndex={-1} aria-label={`${libelle} : plus 10 000 €`} onClick={() => set(pas(v, 1, borne))}>▴</button>
          <button type="button" tabIndex={-1} aria-label={`${libelle} : moins 10 000 €`} onClick={() => set(pas(v, -1, borne))}>▾</button>
        </span>
      </div>
    </div>
  );

  return (
    <form className="recherche-biens" onSubmit={lancer} role="search" aria-label="Rechercher un immeuble">
      <div className="recherche-biens__barre">
        <div className="recherche-biens__champ recherche-biens__champ--lieu">
          <label htmlFor={`${uid}-lieu`} className="recherche-biens__lbl"><Picto nom="secteur" taille={15} />Localisation</label>
          <ChoixLieux id={`${uid}-lieu`} zones={zones} setZones={setZones} variante="barre"
            villesLocales={villes} departementsPresents={departementsPresents} />
        </div>

        <div className="recherche-biens__champ recherche-biens__champ--type" ref={destRef}>
          <span className="recherche-biens__lbl" id={`${uid}-dest-lbl`}><Picto nom="immeubles" taille={15} />Type</span>
          <button type="button" className="recherche-biens__menu" aria-haspopup="true" aria-expanded={menuDest}
            aria-labelledby={`${uid}-dest-lbl ${uid}-dest-val`} onClick={() => setMenuDest((x) => !x)}>
            <span id={`${uid}-dest-val`}>{libelleDest}</span><span aria-hidden="true">⌄</span>
          </button>
          {menuDest && (
            <div className="recherche-biens__deroulant" role="group" aria-label="Type d’immeuble">
              {DESTINATIONS.map((d) => (
                <label key={d} className="recherche-biens__case">
                  <input type="checkbox" checked={dest.length === 0 || dest.includes(d)}
                    onChange={(e) => {
                      const base = dest.length === 0 ? DESTINATIONS : dest;
                      const n = e.target.checked ? [...base, d] : base.filter((x) => x !== d);
                      setDest(n.length === DESTINATIONS.length ? [] : n);
                    }} />
                  {LIBELLE_DESTINATION[d]}
                </label>
              ))}
              <p className="recherche-biens__aide">Un immeuble ressort s’il contient au moins un lot du type choisi : un immeuble mixte ressort dans plusieurs types.</p>
            </div>
          )}
        </div>

        <div className="recherche-biens__prix">
          {champPrix(`${uid}-pmin`, "Prix min", pmin, setPmin, bornesPrix?.min)}
          {champPrix(`${uid}-pmax`, "Prix max", pmax, setPmax, bornesPrix?.max)}
        </div>

        <div className="recherche-biens__champ recherche-biens__champ--rdt">
          <label htmlFor={`${uid}-rdt`} className="recherche-biens__lbl">
            <Picto nom="stats" taille={15} />Rendement <b>{rdt > 0.5 ? `≥ ${rdt.toLocaleString("fr-FR")} %` : "Tous"}</b>
          </label>
          {/* Plancher visuel à 0,5 % : la piste est toujours un peu remplie, c'est une jauge. */}
          <input id={`${uid}-rdt`} type="range" className="curseur" min={0} max={15} step={0.5} value={Math.max(rdt, 0.5)}
            style={{ ["--rempli" as string]: `${(Math.max(rdt, 0.5) / 15) * 100}%` }}
            aria-valuetext={rdt > 0.5 ? `${rdt} % minimum` : "Tous les rendements"}
            onChange={(e) => setRdt(Number(e.target.value))} />
        </div>

        <div className="recherche-biens__actions">
          <button type="submit" className="btn btn--primary"><Picto nom="loupe" taille={17} />Rechercher</button>
        </div>
      </div>

      <button type="button" className="recherche-biens__basculer" aria-expanded={plus} onClick={() => setPlus((x) => !x)}>
        {plus ? "Moins de critères" : "Plus de critères : occupation, type d’opération"}
      </button>
      {plus && (
        <div className="recherche-biens__ligne recherche-biens__plus-ligne">
          <div className="recherche-biens__champ recherche-biens__champ--occ">
            <span className="recherche-biens__lbl"><Picto nom="profil" taille={15} />Occupation <b>{occMin == null && occMax == null ? "Toutes" : `${occMin ?? 0} à ${occMax ?? 100} %`}</b></span>
            <DoubleCurseur min={0} max={100} pas={10} de={occMin} a={occMax} libelle="Occupation"
              valeurTexte={(v) => `${v} %`} onChange={(d, a) => { setOccMin(d); setOccMax(a); }} />
          </div>
          <div className="recherche-biens__champ recherche-biens__champ--op">
            <span className="recherche-biens__lbl" id={`${uid}-op`}><Picto nom="business" taille={15} />Type d’opération</span>
            <div className="choices" role="group" aria-labelledby={`${uid}-op`}>
              {CIBLES.map((c) => (
                <button key={c} type="button" className="choice" aria-pressed={cibles.includes(c)}
                  onClick={() => setCibles((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}>{LIBELLE_OPERATION[c]}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="recherche-biens__enregistrer">
        {enregistrer === "ok" ? (
          <p className="compte-confirme" role="status">
            Recherche enregistrée{cibles.length > 1 ? `, une par profil (${cibles.length})` : ""}. Votre agent vous propose les immeubles qui y correspondent, y compris hors annonce.{" "}
            <a className="lien-discret" href="/mon-compte/recherches/">Mes recherches</a>
          </p>
        ) : (
          <>
            {enregistrer === "choix" && (
              <div className="recherche-biens__profil">
                <p className="recherche-biens__lbl">Type d’opération (un ou les deux : une recherche par type)</p>
                <div className="choices" role="group" aria-label="Type d’opération">
                  {CIBLES.map((c) => (
                    <button key={c} type="button" className="choice" aria-pressed={cibles.includes(c)}
                      onClick={() => setCibles((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}>{LIBELLE_OPERATION[c]}</button>
                  ))}
                </div>
                <label className="sr-only" htmlFor={`${uid}-com`}>Précisions pour votre agent</label>
                <textarea id={`${uid}-com`} className="recherche-biens__commentaire" rows={2} maxLength={1000} value={commentaire}
                  placeholder="Précisions pour votre agent (facultatif)" onChange={(e) => setCommentaire(e.target.value)} />
              </div>
            )}
            <button type="button" className="enregistrer-recherche" onClick={enregistrerRecherche} disabled={enregistrer === "envoi"}>
              <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
              {enregistrer === "envoi" ? "Enregistrement…" : enregistrer === "choix" ? "Confirmer et enregistrer" : "Enregistrer la recherche"}
            </button>
            {erreur && <p className="compte-erreur" role="alert">{erreur}</p>}
          </>
        )}
      </div>

    </form>
  );
}

/** Le tri en menu natif, au téléphone (une ligne, le geste du système). */
export function TriMobile({ options, actif }: { options: { cle: string; nom: string; lien: string }[]; actif: string }) {
  const router = useRouter();
  return (
    <label className="tri-mobile">
      <span className="sr-only">Trier les résultats</span>
      <select value={actif} onChange={(e) => {
        const o = options.find((x) => x.cle === e.target.value);
        if (o) router.push(o.lien, { scroll: false });
      }}>
        {options.map((o) => <option key={o.cle} value={o.cle}>{o.nom}</option>)}
      </select>
    </label>
  );
}
