"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Picto } from "@/components/Picto";
import { envoyer } from "@/components/compte/envoyer";
import { DEPARTEMENTS, REGIONS } from "@/lib/departements";
import { DESTINATIONS, LIBELLE_DESTINATION, type Destination } from "@/lib/annonce";
import {
  CIBLES, libelleLieu, libelleZone, lienRecherche, sansAccents, zonesTriees, type Criteres,
} from "@/lib/recherche-biens";
import { lienConnexion, useEtatCompte } from "./etat";

type Lieu = { cles: string[]; libelle: string; nature: string; n: number };

const PAS_PRIX = 10_000;
const milliers = (n: number) => n.toLocaleString("fr-FR").replace(/\s/g, " ");
const enEuros = (n: number | null) => (n == null ? "" : `${milliers(n)} €`);
const lireEntier = (s: string) => {
  const t = s.replace(/[^\d]/g, "");
  return t ? Number(t) : null;
};

const PICTO_NATURE = { d: "secteur", v: "immeubles" } as const;
const NATURE = { d: "Département", v: "Ville" } as const;

/**
 * La barre de recherche des immeubles à vendre : la mise en page de Plein Bail,
 * les critères du BO (MAV, 02/11/2026). Localisation (départements et villes ;
 * une région s'ouvre en ses départements), destinations, prix minimum et
 * maximum, rendement minimum. « Enregistrer la recherche » ajoute le profil
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
  pourCompte: { departements: string[]; villes: string[]; prixMin: number | null; prixMax: number | null; rendementMin: number | null; destinations: Destination[] };
}) {
  const uid = useId();
  const router = useRouter();
  const etat = useEtatCompte();
  const [zones, setZones] = useState(criteres.zones);
  const [saisie, setSaisie] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(0);
  const [dest, setDest] = useState<Destination[]>(criteres.destinations);
  const [menuDest, setMenuDest] = useState(false);
  const [pmin, setPmin] = useState<number | null>(criteres.prixMin);
  const [pmax, setPmax] = useState<number | null>(criteres.prixMax);
  const [rdt, setRdt] = useState(criteres.rendementMin ?? 0);
  const [enregistrer, setEnregistrer] = useState<"" | "choix" | "envoi" | "ok">("");
  const [cibles, setCibles] = useState<string[]>(["Investisseur"]);
  const [commentaire, setCommentaire] = useState("");
  const [erreur, setErreur] = useState("");
  const zonesDialog = useRef<HTMLDialogElement>(null);
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

  // Suggestions : dès 2 lettres, ou 1 chiffre pour un département ; 8 au plus.
  const suggestions = useMemo<Lieu[]>(() => {
    const q = sansAccents(saisie.trim());
    if (!q || (q.length < 2 && !/^\d$/.test(q))) return [];
    const pris = new Set(zones);
    const numero = /^\d[\dab]?$/i.test(q);
    const exact = `d:${q.toUpperCase().padStart(2, "0")}`;
    const ds: Lieu[] = Object.entries(DEPARTEMENTS)
      .filter(([code, nom]) => (numero ? code.toLowerCase().startsWith(q) : sansAccents(nom).includes(q)) && !pris.has(`d:${code}`))
      .map(([code, nom]) => ({ cles: [`d:${code}`], libelle: `${nom} (${code})`, nature: "Département", n: departementsPresents[code] ?? 0 }))
      .sort((a, b) => Number(b.cles[0] === exact) - Number(a.cles[0] === exact) || b.n - a.n);
    // Une région n'est pas un critère du BO : elle ajoute ses départements.
    const rs: Lieu[] = numero ? [] : Object.values(REGIONS)
      .filter((r) => sansAccents(r.nom).includes(q) && r.departements.some((d) => !pris.has(`d:${d}`)))
      .map((r) => ({ cles: r.departements.map((d) => `d:${d}`), libelle: r.nom, nature: `Région · ses ${r.departements.length} départements`, n: r.departements.reduce((s, d) => s + (departementsPresents[d] ?? 0), 0) }));
    const vs: Lieu[] = numero ? [] : villes
      .filter((v) => sansAccents(v.nom).includes(q) && !pris.has(`v:${v.nom}`))
      .map((v) => ({ cles: [`v:${v.nom}`], libelle: v.nom, nature: `Ville · ${DEPARTEMENTS[v.dept] ?? v.dept} (${v.dept})`, n: v.n }));
    return [...vs, ...ds, ...rs].slice(0, 8);
  }, [saisie, villes, zones, departementsPresents]);

  const ajouter = (cles: string[]) => setZones((x) => [...new Set([...x, ...cles])]);
  const choisir = (l: Lieu) => {
    ajouter(l.cles);
    setSaisie("");
    setOuvert(false);
    setActif(0);
  };
  const ordonnees = zonesTriees(zones);

  const libelleDest = dest.length === 0 || dest.length === DESTINATIONS.length ? "Tous les types" : DESTINATIONS.filter((d) => dest.includes(d)).map((d) => LIBELLE_DESTINATION[d]).join(" · ");

  const criteresSaisis = (): Partial<Criteres> => ({
    zones, destinations: dest, prixMin: pmin, prixMax: pmax, rendementMin: rdt > 0.5 ? rdt : null, tri: criteres.tri,
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
    if (cibles.length === 0) { setErreur("Choisissez au moins un profil."); return; }
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
          <div className="lieux">
            {ordonnees.length > 0 && (
              <button type="button" className="lieu lieu--resume" onClick={() => zonesDialog.current?.showModal()}
                aria-label={`${ordonnees.length} zone${ordonnees.length > 1 ? "s" : ""} choisie${ordonnees.length > 1 ? "s" : ""} : ${libelleLieu(zones)}. Modifier`}>
                {libelleLieu(zones)}
              </button>
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
                else if (e.key === "Backspace" && !saisie && zones.length) setZones((x) => x.filter((z) => z !== ordonnees[ordonnees.length - 1]));
              }}
              onBlur={() => setTimeout(() => setOuvert(false), 150)} />
            <button type="button" className="lieux__ajout" aria-label="Mes zones de recherche" title="Mes zones de recherche"
              onClick={() => zonesDialog.current?.showModal()}>+</button>
          </div>
          {ouvert && suggestions.length > 0 && (
            <ul id={`${uid}-liste`} role="listbox" className="lieux__liste">
              {suggestions.map((l, i) => (
                <li key={l.cles.join()} id={`${uid}-s${i}`} role="option" aria-selected={i === actif} className={i === actif ? "est-actif" : undefined}
                  onMouseDown={(e) => { e.preventDefault(); choisir(l); }} onMouseEnter={() => setActif(i)}>
                  <span>{l.libelle}</span>
                  <small>{l.nature}{l.n ? ` · ${l.n} en vente` : ""}</small>
                </li>
              ))}
            </ul>
          )}
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
                <p className="recherche-biens__lbl">Votre profil (un ou plusieurs)</p>
                <div className="choices" role="group" aria-label="Votre profil d’acquéreur">
                  {CIBLES.map((c) => (
                    <button key={c} type="button" className="choice" aria-pressed={cibles.includes(c)}
                      onClick={() => setCibles((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}>{c}</button>
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

      <MesZones dialog={zonesDialog} zones={zones} setZones={setZones} ajouter={ajouter} villes={villes} />
    </form>
  );
}

/**
 * « Mes zones de recherche » : ajout à la main par menus (une région ajoute ses
 * départements, départements par numéro, ville choisie dans la liste des
 * communes trouvées), puis la liste de tout ce qui est choisi.
 */
function MesZones({
  dialog, zones, setZones, ajouter, villes,
}: {
  dialog: React.RefObject<HTMLDialogElement | null>;
  zones: string[];
  setZones: React.Dispatch<React.SetStateAction<string[]>>;
  ajouter: (cles: string[]) => void;
  villes: { nom: string; dept: string; n: number }[];
}) {
  const uid = useId();
  const [region, setRegion] = useState("");
  const [dept, setDept] = useState("");
  const [filtre, setFiltre] = useState("");
  const [ville, setVille] = useState("");
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
            <option value="">Ajouter ses départements</option>
            {regions.map(([c, r]) => <option key={c} value={c}>{r.nom}</option>)}
          </select>
          <button type="button" className="btn btn--outline" disabled={!region}
            onClick={() => { ajouter(REGIONS[region].departements.map((d) => `d:${d}`)); setRegion(""); }}>Ajouter</button>

          <label htmlFor={`${uid}-d`}>Département</label>
          <select id={`${uid}-d`} value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">Choisir un département</option>
            {depts.map(([c, n]) => <option key={c} value={c}>{`${c} - ${n}`}</option>)}
          </select>
          <button type="button" className="btn btn--outline" disabled={!dept} onClick={() => { ajouter([`d:${dept}`]); setDept(""); }}>Ajouter</button>

          <label htmlFor={`${uid}-v`}>Ville</label>
          <div className="mes-zones__ville">
            <input id={`${uid}-v`} placeholder="Filtrer les villes" value={filtre} autoComplete="off"
              onChange={(e) => { setFiltre(e.target.value); setVille(""); }} />
            <select aria-label="Villes trouvées" value={ville} onChange={(e) => setVille(e.target.value)}>
              <option value="">{trouvees.length ? `${trouvees.length} ville${trouvees.length > 1 ? "s" : ""} avec un immeuble en vente` : "Aucune ville en vente"}</option>
              {trouvees.map((v) => <option key={v.nom} value={v.nom}>{`${v.nom} (${v.dept})`}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn--outline" disabled={!ville} onClick={() => { ajouter([`v:${ville}`]); setVille(""); setFiltre(""); }}>Ajouter</button>
        </div>

        {zones.length > 0 ? (
          <>
            <ul className="mes-zones__liste">
              {zonesTriees(zones).map((z) => (
                <li key={z}>
                  <Picto nom={PICTO_NATURE[z[0] as "d" | "v"]} taille={18} />
                  <span>{libelleZone(z)}<small>{NATURE[z[0] as "d" | "v"]}</small></span>
                  <button type="button" aria-label={`Retirer ${libelleZone(z)}`} onClick={() => setZones((x) => x.filter((y) => y !== z))}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="lien-discret mes-zones__vider" onClick={() => setZones([])}>Tout retirer</button>
          </>
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
