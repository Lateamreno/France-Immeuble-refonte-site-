"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Picto } from "@/components/Picto";
import { envoyer } from "@/components/compte/envoyer";
import { DEPARTEMENTS, REGIONS } from "@/lib/departements";
import { TYPES_DOMINANTS, type TypeDominant } from "@/lib/annonce";
import {
  lienRecherche, libelleZone, PLAGES_DPE, sansAccents, TYPES_VILLE, zonesTriees,
  type Criteres, type Lettre, type TypeVille,
} from "@/lib/recherche-biens";
import { lienConnexion, useEtatCompte } from "./etat";

type Lieu = { cle: string; libelle: string; nature: string; n: number };

const CIBLES = ["Investisseur", "Marchand de biens", "Patrimonial", "Promoteur"];
const PAS_PRIX = 10_000;
const milliers = (n: number) => n.toLocaleString("fr-FR").replace(/\s/g, " ");
const enEuros = (n: number | null) => (n == null ? "" : `${milliers(n)} €`);
const lireEntier = (s: string) => {
  const t = s.replace(/[^\d]/g, "");
  return t ? Number(t) : null;
};
const piste = (de: number, a: number) => ({ ["--de" as string]: `${de}%`, ["--rempli" as string]: `${a}%` });

/** Picto d'une nature de zone, pour la liste « Mes zones de recherche ». */
const PICTO_NATURE = { r: "france", d: "secteur", v: "immeubles" } as const;
const NATURE = { r: "Région", d: "Département", v: "Ville" } as const;

/**
 * La barre de recherche des immeubles à vendre, sur le modèle de Plein Bail
 * (spec du 30/10/2026) : Localisation · Type · Prix min · Prix max ·
 * Rendement, le bouton Rechercher, puis « Plus de filtres ». Rien ne se lance
 * tout seul : on remplit, puis on cherche, ce qui écrit l'adresse de la page.
 * La page remonte ce composant à chaque changement d'adresse (clé), donc la
 * barre reflète toujours la recherche affichée.
 */
export function RechercheBiens({
  criteres, villes, departementsPresents, bornesPrix, avecPopulation, pourCompte,
}: {
  criteres: Criteres;
  villes: { nom: string; dept: string; n: number }[];
  departementsPresents: Record<string, number>;
  bornesPrix: { min: number; max: number } | null;
  avecPopulation: boolean;
  pourCompte: { departements: string[]; villes: string[]; prixMin: number | null; prixMax: number | null; rendementMin: number | null };
}) {
  const uid = useId();
  const router = useRouter();
  const etat = useEtatCompte();
  const [zones, setZones] = useState(criteres.zones);
  const [saisie, setSaisie] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(0);
  const [td, setTd] = useState<TypeDominant[]>(criteres.td);
  const [menuType, setMenuType] = useState(false);
  const [pmin, setPmin] = useState<number | null>(criteres.prixMin);
  const [pmax, setPmax] = useState<number | null>(criteres.prixMax);
  const [rdt, setRdt] = useState(criteres.rendementMin ?? 0);
  const plusDansAdresse = !!(criteres.surfaceMin != null || criteres.surfaceMax != null || criteres.dpeMin || criteres.dpeMax ||
    criteres.travaux || criteres.occMin != null || criteres.occMax != null || criteres.lotsMin || criteres.tv.length || criteres.sansOffre);
  const [plus, setPlus] = useState(plusDansAdresse);
  const [smin, setSmin] = useState(criteres.surfaceMin != null ? String(criteres.surfaceMin) : "");
  const [smax, setSmax] = useState(criteres.surfaceMax != null ? String(criteres.surfaceMax) : "");
  const [dpe, setDpe] = useState(criteres.dpeMin || criteres.dpeMax ? `${criteres.dpeMin ?? "A"}${criteres.dpeMax ?? "G"}` : "");
  const [travaux, setTravaux] = useState(criteres.travaux ?? "");
  const [omin, setOmin] = useState(criteres.occMin ?? 0);
  const [omax, setOmax] = useState(criteres.occMax ?? 100);
  const [lots, setLots] = useState(criteres.lotsMin ? String(criteres.lotsMin) : "");
  const [tv, setTv] = useState<TypeVille[]>(criteres.tv);
  const [dispo, setDispo] = useState(criteres.sansOffre);
  const [enregistrer, setEnregistrer] = useState<"" | "choix" | "envoi" | "ok">("");
  const [cible, setCible] = useState("Investisseur");
  const [erreur, setErreur] = useState("");
  const zonesDialog = useRef<HTMLDialogElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  // Le menu des types se ferme au clic dehors et à Échap.
  useEffect(() => {
    if (!menuType) return;
    const dehors = (e: MouseEvent) => { if (!typeRef.current?.contains(e.target as Node)) setMenuType(false); };
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuType(false); };
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    return () => { document.removeEventListener("mousedown", dehors); document.removeEventListener("keydown", echap); };
  }, [menuType]);

  // Suggestions : dès 2 lettres, ou 1 chiffre pour un département ; 8 au plus.
  const suggestions = useMemo<Lieu[]>(() => {
    const brut = saisie.trim();
    const q = sansAccents(brut);
    if (!q || (q.length < 2 && !/^\d$/.test(q))) return [];
    const pris = new Set(zones);
    const numero = /^\d[\dab]?$/i.test(q);
    const ds: Lieu[] = Object.entries(DEPARTEMENTS)
      .filter(([code, nom]) => (numero ? code.toLowerCase().startsWith(q) : sansAccents(nom).includes(q)) && !pris.has(`d:${code}`))
      .map(([code, nom]) => ({ cle: `d:${code}`, libelle: `${nom} (${code})`, nature: "Département", n: departementsPresents[code] ?? 0 }))
      .sort((a, b) => Number(b.cle === `d:${q.toUpperCase().padStart(2, "0")}`) - Number(a.cle === `d:${q.toUpperCase().padStart(2, "0")}`) || b.n - a.n);
    const rs: Lieu[] = numero ? [] : Object.entries(REGIONS)
      .filter(([code, r]) => sansAccents(r.nom).includes(q) && !pris.has(`r:${code}`))
      .map(([code, r]) => ({ cle: `r:${code}`, libelle: r.nom, nature: "Région", n: r.departements.reduce((s, d) => s + (departementsPresents[d] ?? 0), 0) }));
    const vs: Lieu[] = numero ? [] : villes
      .filter((v) => sansAccents(v.nom).includes(q) && !pris.has(`v:${v.nom}`))
      .map((v) => ({ cle: `v:${v.nom}`, libelle: v.nom, nature: `Ville · ${DEPARTEMENTS[v.dept] ?? v.dept} (${v.dept})`, n: v.n }));
    return [...vs, ...ds, ...rs].slice(0, 8);
  }, [saisie, villes, zones, departementsPresents]);

  const choisir = (l: Lieu) => {
    setZones((x) => [...x, l.cle]);
    setSaisie("");
    setOuvert(false);
    setActif(0);
  };
  const retirer = (z: string) => setZones((x) => x.filter((y) => y !== z));
  const ordonnees = zonesTriees(zones);

  const libelleTypes = td.length === 0 || td.length === TYPES_DOMINANTS.length
    ? "Tous les types"
    : TYPES_DOMINANTS.filter(([k]) => td.includes(k)).map(([, v]) => v).join(" · ");

  const criteresSaisis = (): Partial<Criteres> => {
    const [dmin, dmax] = dpe ? [dpe[0] as Lettre, dpe[1] as Lettre] : [null, null];
    return {
      zones, td,
      prixMin: pmin, prixMax: pmax,
      rendementMin: rdt > 0.5 ? rdt : null,
      surfaceMin: lireEntier(smin), surfaceMax: lireEntier(smax),
      dpeMin: dmin, dpeMax: dmax,
      travaux: travaux === "avec" || travaux === "sans" ? travaux : null,
      occMin: omin > 0 ? omin : null, occMax: omax < 100 ? omax : null,
      lotsMin: lireEntier(lots), tv, sansOffre: dispo, tri: criteres.tri,
    };
  };

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
    setEnregistrer("envoi");
    const r = await envoyer("/api/compte/recherche/", { ...pourCompte, cible });
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
          <div className="lieux">
            {ordonnees.length > 0 && (
              <span className="lieu">{libelleZone(ordonnees[0])}
                <button type="button" aria-label={`Retirer ${libelleZone(ordonnees[0])}`} onClick={() => retirer(ordonnees[0])}>×</button>
              </span>
            )}
            {ordonnees.length > 1 && (
              <button type="button" className="lieu lieu--plus" onClick={() => zonesDialog.current?.showModal()}
                aria-label={`Voir les ${ordonnees.length} zones choisies`}>+{ordonnees.length - 1}</button>
            )}
            <input id={`${uid}-lieu`} role="combobox" aria-expanded={ouvert && suggestions.length > 0} aria-controls={`${uid}-liste`}
              aria-autocomplete="list" aria-activedescendant={ouvert && suggestions[actif] ? `${uid}-s${actif}` : undefined}
              autoComplete="off" value={saisie}
              placeholder={zones.length ? "Ajouter…" : "Ville, département, région"}
              onChange={(e) => { setSaisie(e.target.value); setOuvert(true); setActif(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && suggestions.length) { e.preventDefault(); setActif((a) => (a + 1) % suggestions.length); }
                else if (e.key === "ArrowUp" && suggestions.length) { e.preventDefault(); setActif((a) => (a - 1 + suggestions.length) % suggestions.length); }
                else if (e.key === "Enter" && suggestions[actif]) { e.preventDefault(); choisir(suggestions[actif]); }
                else if (e.key === "Escape") setOuvert(false);
                else if (e.key === "Backspace" && !saisie && zones.length) retirer(ordonnees[ordonnees.length - 1]);
              }}
              onBlur={() => setTimeout(() => setOuvert(false), 150)} />
            <button type="button" className="lieux__ajout" aria-label="Mes zones de recherche" title="Mes zones de recherche"
              onClick={() => zonesDialog.current?.showModal()}>+</button>
          </div>
          {ouvert && suggestions.length > 0 && (
            <ul id={`${uid}-liste`} role="listbox" className="lieux__liste">
              {suggestions.map((l, i) => (
                <li key={l.cle} id={`${uid}-s${i}`} role="option" aria-selected={i === actif} className={i === actif ? "est-actif" : undefined}
                  onMouseDown={(e) => { e.preventDefault(); choisir(l); }} onMouseEnter={() => setActif(i)}>
                  <span>{l.libelle}</span>
                  <small>{l.nature}{l.n ? ` · ${l.n} en vente` : ""}</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="recherche-biens__champ recherche-biens__champ--type" ref={typeRef}>
          <span className="recherche-biens__lbl" id={`${uid}-type-lbl`}><Picto nom="immeubles" taille={15} />Type</span>
          <button type="button" className="recherche-biens__menu" aria-haspopup="true" aria-expanded={menuType}
            aria-labelledby={`${uid}-type-lbl ${uid}-type-val`} onClick={() => setMenuType((x) => !x)}>
            <span id={`${uid}-type-val`}>{libelleTypes}</span><span aria-hidden="true">⌄</span>
          </button>
          {menuType && (
            <div className="recherche-biens__deroulant" role="group" aria-label="Type dominant de l’immeuble">
              <p className="recherche-biens__deroulant-titre">Immeubles</p>
              {TYPES_DOMINANTS.map(([k, v]) => (
                <label key={k} className="recherche-biens__case">
                  <input type="checkbox" checked={td.length === 0 || td.includes(k)}
                    onChange={(e) => {
                      const base = td.length === 0 ? TYPES_DOMINANTS.map(([x]) => x) : td;
                      const n = e.target.checked ? [...base, k] : base.filter((x) => x !== k);
                      setTd(n.length === TYPES_DOMINANTS.length ? [] : n);
                    }} />
                  {v}
                </label>
              ))}
              <p className="recherche-biens__aide">Type dominant : plus de 70 % de la surface. Mixtes : plusieurs usages.</p>
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
          <button type="button" className="lien-discret recherche-biens__plus-lien" aria-expanded={plus} aria-controls={`${uid}-plus`}
            onClick={() => setPlus((x) => !x)}>
            {plus ? "Moins de filtres" : "Plus de filtres"} <span aria-hidden="true">{plus ? "⌃" : "⌄"}</span>
          </button>
        </div>
      </div>

      {plus && (
        <div className="recherche-biens__plus" id={`${uid}-plus`}>
          {avecPopulation && (
            <fieldset className="recherche-biens__villes">
              <legend className="recherche-biens__lbl">Type de ville, dans les zones choisies</legend>
              <div className="tuiles-ville">
                <button type="button" className="tuile-ville" aria-pressed={tv.length === 0} onClick={() => setTv([])}>
                  <strong>Indifférent</strong>
                </button>
                {TYPES_VILLE.map(([k, nom, detail]) => (
                  <button key={k} type="button" className="tuile-ville" aria-pressed={tv.includes(k)}
                    onClick={() => setTv((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]))}>
                    <strong>{nom}</strong><small>{detail}</small>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="recherche-biens__ligne">
            <div className="recherche-biens__champ recherche-biens__champ--court">
              <span className="recherche-biens__lbl" id={`${uid}-surf`}>Surface (m²)</span>
              <div className="recherche-biens__paire">
                <input aria-labelledby={`${uid}-surf`} aria-label="Surface minimum" inputMode="numeric" placeholder="Min" value={smin}
                  onChange={(e) => setSmin(e.target.value.replace(/[^\d]/g, ""))} />
                <input aria-label="Surface maximum" inputMode="numeric" placeholder="Max" value={smax}
                  onChange={(e) => setSmax(e.target.value.replace(/[^\d]/g, ""))} />
              </div>
            </div>
            <div className="recherche-biens__champ recherche-biens__champ--court">
              <label htmlFor={`${uid}-dpe`} className="recherche-biens__lbl">DPE</label>
              <select id={`${uid}-dpe`} value={dpe} onChange={(e) => setDpe(e.target.value)}>
                <option value="">Indifférent</option>
                {PLAGES_DPE.map(([a, b, l]) => <option key={a + b} value={a + b}>{`${a} → ${b} · ${l}`}</option>)}
              </select>
            </div>
            <div className="recherche-biens__champ recherche-biens__champ--court">
              <label htmlFor={`${uid}-trav`} className="recherche-biens__lbl">Travaux</label>
              <select id={`${uid}-trav`} value={travaux} onChange={(e) => setTravaux(e.target.value)}>
                <option value="">Indifférent</option>
                <option value="sans">Sans travaux</option>
                <option value="avec">Avec travaux</option>
              </select>
            </div>
            <div className="recherche-biens__champ recherche-biens__champ--court">
              <label htmlFor={`${uid}-lots`} className="recherche-biens__lbl">Lots min</label>
              <input id={`${uid}-lots`} inputMode="numeric" placeholder="Indifférent" value={lots}
                onChange={(e) => setLots(e.target.value.replace(/[^\d]/g, ""))} />
            </div>
          </div>

          <div className="recherche-biens__ligne">
            <div className="recherche-biens__champ recherche-biens__champ--occ">
              <span className="recherche-biens__lbl" id={`${uid}-occ`}>
                Occupation <b>{omin === 0 && omax === 100 ? "Indifférent" : `${omin} – ${omax} %`}</b>
              </span>
              <div className="double-curseur" style={piste(omin, omax)}>
                <input type="range" min={0} max={100} step={5} value={omin} aria-label="Occupation minimum, en %"
                  aria-valuetext={`${omin} %`} onChange={(e) => setOmin(Math.min(Number(e.target.value), omax))} />
                <input type="range" min={0} max={100} step={5} value={omax} aria-label="Occupation maximum, en %"
                  aria-valuetext={`${omax} %`} onChange={(e) => setOmax(Math.max(Number(e.target.value), omin))} />
              </div>
            </div>
            <label className="recherche-biens__case recherche-biens__case--seule">
              <input type="checkbox" checked={dispo} onChange={(e) => setDispo(e.target.checked)} />
              Masquer les biens sous offre
            </label>
          </div>
        </div>
      )}

      <div className="recherche-biens__enregistrer">
        {enregistrer === "ok" ? (
          <p className="compte-confirme" role="status">
            Recherche enregistrée. Votre agent vous propose les immeubles qui y correspondent, y compris hors annonce.{" "}
            <a className="lien-discret" href="/mon-compte/recherches/">Mes recherches</a>
          </p>
        ) : (
          <>
            {enregistrer === "choix" && (
              <div className="choices" role="group" aria-label="Votre profil d’acquéreur">
                {CIBLES.map((c) => (
                  <button key={c} type="button" className="choice" aria-pressed={cible === c} onClick={() => setCible(c)}>{c}</button>
                ))}
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

      <MesZones dialog={zonesDialog} zones={zones} setZones={setZones} villes={villes} />
    </form>
  );
}

/**
 * « Mes zones de recherche » : ajout à la main par menus (régions par ordre
 * alphabétique, départements par numéro, ville choisie dans la liste des
 * communes trouvées), puis la liste de tout ce qui est choisi.
 */
function MesZones({
  dialog, zones, setZones, villes,
}: {
  dialog: React.RefObject<HTMLDialogElement | null>;
  zones: string[];
  setZones: React.Dispatch<React.SetStateAction<string[]>>;
  villes: { nom: string; dept: string; n: number }[];
}) {
  const uid = useId();
  const [region, setRegion] = useState("");
  const [dept, setDept] = useState("");
  const [filtre, setFiltre] = useState("");
  const [ville, setVille] = useState("");
  const ajouter = (z: string) => { if (z && !zones.includes(z)) setZones((x) => [...x, z]); };
  const regions = Object.entries(REGIONS).sort((a, b) => a[1].nom.localeCompare(b[1].nom, "fr"));
  const depts = Object.entries(DEPARTEMENTS).sort((a, b) => a[0].localeCompare(b[0], "fr", { numeric: true }));
  const trouvees = villes
    .filter((v) => !filtre.trim() || sansAccents(v.nom).includes(sansAccents(filtre.trim())))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  return (
    <dialog ref={dialog} className="mes-zones" aria-labelledby={`${uid}-t`}
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
      <div className="mes-zones__corps">
        <div className="mes-zones__tete">
          <h2 id={`${uid}-t`}>Mes zones de recherche</h2>
          <button type="button" className="mes-zones__fermer" aria-label="Fermer" onClick={() => dialog.current?.close()}>×</button>
        </div>

        <div className="mes-zones__ajout">
          <label htmlFor={`${uid}-r`}>Région</label>
          <select id={`${uid}-r`} value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">Choisir une région</option>
            {regions.map(([c, r]) => <option key={c} value={c}>{r.nom}</option>)}
          </select>
          <button type="button" className="btn btn--outline" disabled={!region} onClick={() => { ajouter(`r:${region}`); setRegion(""); }}>Ajouter</button>

          <label htmlFor={`${uid}-d`}>Département</label>
          <select id={`${uid}-d`} value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">Choisir un département</option>
            {depts.map(([c, n]) => <option key={c} value={c}>{`${c} - ${n}`}</option>)}
          </select>
          <button type="button" className="btn btn--outline" disabled={!dept} onClick={() => { ajouter(`d:${dept}`); setDept(""); }}>Ajouter</button>

          <label htmlFor={`${uid}-v`}>Ville</label>
          <div className="mes-zones__ville">
            <input id={`${uid}-v`} placeholder="Filtrer les villes" value={filtre} autoComplete="off"
              onChange={(e) => { setFiltre(e.target.value); setVille(""); }} />
            <select aria-label="Villes trouvées" value={ville} onChange={(e) => setVille(e.target.value)}>
              <option value="">{trouvees.length ? `${trouvees.length} ville${trouvees.length > 1 ? "s" : ""} avec un immeuble en vente` : "Aucune ville en vente"}</option>
              {trouvees.map((v) => <option key={v.nom} value={v.nom}>{`${v.nom} (${v.dept})`}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn--outline" disabled={!ville} onClick={() => { ajouter(`v:${ville}`); setVille(""); setFiltre(""); }}>Ajouter</button>
        </div>

        {zones.length > 0 ? (
          <ul className="mes-zones__liste">
            {zonesTriees(zones).map((z) => (
              <li key={z}>
                <Picto nom={PICTO_NATURE[z[0] as "r" | "d" | "v"]} taille={18} />
                <span>{libelleZone(z)}<small>{NATURE[z[0] as "r" | "d" | "v"]}</small></span>
                <button type="button" aria-label={`Retirer ${libelleZone(z)}`} onClick={() => setZones((x) => x.filter((y) => y !== z))}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mes-zones__vide">Aucune zone : la recherche porte sur toute la France.</p>
        )}

        <button type="button" className="btn btn--primary btn--wide" onClick={() => dialog.current?.close()}>Valider</button>
      </div>
    </dialog>
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
