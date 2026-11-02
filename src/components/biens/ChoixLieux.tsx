"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Picto } from "@/components/Picto";
import { DEPARTEMENTS, REGIONS } from "@/lib/departements";
import { libelleLieu, libelleZone, regionsCompletes, sansAccents, zonesTriees } from "@/lib/recherche-biens";

/**
 * Le choix des lieux d'une recherche, comme dans le BO (retours #83, #85 et
 * #94, MAV, 02/11/2026) : départements, régions et villes de toute la France,
 * pas seulement là où nous avons un immeuble en vente. Une région ajoute ses
 * départements (le BO ne connaît que départements et villes). On tape pour
 * avoir des suggestions, ou « + » ouvre l'ajout par menus, comme au BO.
 *
 * Servi à la barre des immeubles à vendre (`barre` : un résumé « Île-de-France
 * +2 ») et au dépôt de recherche d'Acheter (`formulaire` : chaque lieu en
 * pastille qu'on retire d'un geste).
 */

export type VilleLocale = { nom: string; dept: string; n: number };
type Lieu = { cles: string[]; libelle: string; nature: string; n: number };
type Commune = { nom: string; dept: string; codePostal: string; population: number };

const PICTO_NATURE = { d: "secteur", v: "immeubles" } as const;
const NATURE = { d: "Département", v: "Ville" } as const;

/** Les communes de France qui commencent par la saisie (route serveur, cache d'un jour). */
function useCommunes(q: string): Commune[] {
  const [res, setRes] = useState<Commune[]>([]);
  useEffect(() => {
    const t = q.trim();
    if (t.length < 2 || /^\d/.test(t)) { setRes([]); return; }
    const ctrl = new AbortController();
    const minuteur = setTimeout(() => {
      fetch(`/api/communes/?${new URLSearchParams({ q: t })}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { communes: [] }))
        .then((j: { communes?: Commune[] }) => setRes(j.communes ?? []))
        .catch(() => {});
    }, 180);
    return () => { clearTimeout(minuteur); ctrl.abort(); };
  }, [q]);
  return res;
}

export function ChoixLieux({
  id, zones, setZones, villesLocales = [], departementsPresents = {}, variante, invalide,
}: {
  id: string;
  zones: string[];
  setZones: React.Dispatch<React.SetStateAction<string[]>>;
  villesLocales?: VilleLocale[];
  departementsPresents?: Record<string, number>;
  variante: "barre" | "formulaire";
  invalide?: boolean;
}) {
  const [saisie, setSaisie] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const communes = useCommunes(saisie);

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
    const rs: Lieu[] = numero ? [] : Object.values(REGIONS)
      .filter((r) => sansAccents(r.nom).includes(q) && r.departements.some((d) => !pris.has(`d:${d}`)))
      .map((r) => ({ cles: r.departements.map((d) => `d:${d}`), libelle: r.nom, nature: `Région · ses ${r.departements.length} départements`, n: r.departements.reduce((s, d) => s + (departementsPresents[d] ?? 0), 0) }));
    // Les villes où nous vendons d'abord, puis toutes les communes de France.
    const vues = new Set<string>();
    const vs: Lieu[] = [];
    const ville = (nom: string, dept: string, n: number) => {
      const cle = `v:${nom} (${dept})`;
      const k = sansAccents(cle);
      if (vues.has(k) || pris.has(cle) || pris.has(`v:${nom}`)) return;
      vues.add(k);
      vs.push({ cles: [cle], libelle: nom, nature: `Ville · ${DEPARTEMENTS[dept] ?? dept} (${dept})`, n });
    };
    if (!numero) {
      villesLocales.filter((v) => sansAccents(v.nom).includes(q)).forEach((v) => ville(v.nom, v.dept, v.n));
      const enVente = (c: Commune) => villesLocales.find((v) => v.dept === c.dept && sansAccents(v.nom) === sansAccents(c.nom))?.n ?? 0;
      communes.forEach((c) => ville(c.nom, c.dept, enVente(c)));
    }
    // Une région ou un département dont le nom commence par la saisie passe devant les villes.
    const debut = (l: Lieu) => numero || sansAccents(l.libelle).startsWith(q);
    const tete = [...rs.filter(debut), ...ds.filter(debut)];
    const reste = [...rs.filter((l) => !debut(l)), ...ds.filter((l) => !debut(l)).slice(0, 3)];
    return [...tete, ...vs.slice(0, 5), ...reste, ...vs.slice(5)].slice(0, 8);
  }, [saisie, villesLocales, zones, departementsPresents, communes]);

  const ajouter = (cles: string[]) => setZones((x) => [...new Set([...x, ...cles])]);
  const retirer = (z: string) => setZones((x) => x.filter((y) => y !== z));
  const choisir = (l: Lieu) => { ajouter(l.cles); setSaisie(""); setOuvert(false); setActif(0); };
  const ordonnees = zonesTriees(zones);
  const regions = regionsCompletes(zones);
  const dansRegion = new Set(regions.flatMap((r) => REGIONS[r.code].departements.map((d) => `d:${d}`)));

  return (
    <>
      <div className={`lieux lieux--${variante}${invalide ? " est-invalide" : ""}`}>
        {variante === "barre" && ordonnees.length > 0 && (
          <button type="button" className="lieu lieu--resume" onClick={() => dialog.current?.showModal()}
            aria-label={`${ordonnees.length} zone${ordonnees.length > 1 ? "s" : ""} choisie${ordonnees.length > 1 ? "s" : ""} : ${libelleLieu(zones)}. Modifier`}>
            {libelleLieu(zones)}
          </button>
        )}
        {/* Une région entière tient dans une pastille ; la retirer retire ses départements. */}
        {variante === "formulaire" && regions.map((r) => (
          <span key={`r:${r.code}`} className="lieu">
            {r.nom}
            <button type="button" aria-label={`Retirer ${r.nom}`}
              onClick={() => setZones((x) => x.filter((z) => !(z.startsWith("d:") && REGIONS[r.code].departements.includes(z.slice(2)))))}>×</button>
          </span>
        ))}
        {variante === "formulaire" && ordonnees.filter((z) => !dansRegion.has(z)).map((z) => (
          <span key={z} className="lieu">
            {libelleZone(z)}
            <button type="button" aria-label={`Retirer ${libelleZone(z)}`} onClick={() => retirer(z)}>×</button>
          </span>
        ))}
        <input id={id} role="combobox" aria-expanded={ouvert && suggestions.length > 0} aria-controls={`${id}-liste`}
          aria-autocomplete="list" aria-activedescendant={ouvert && suggestions[actif] ? `${id}-s${actif}` : undefined}
          aria-invalid={invalide || undefined}
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
        <button type="button" className="lieux__ajout" aria-label="Ajouter une région, un département ou une ville" title="Ajouter une région, un département ou une ville"
          onClick={() => dialog.current?.showModal()}>+</button>
      </div>
      {ouvert && suggestions.length > 0 && (
        <ul id={`${id}-liste`} role="listbox" className="lieux__liste">
          {suggestions.map((l, i) => (
            <li key={l.cles.join()} id={`${id}-s${i}`} role="option" aria-selected={i === actif} className={i === actif ? "est-actif" : undefined}
              onMouseDown={(e) => { e.preventDefault(); choisir(l); }} onMouseEnter={() => setActif(i)}>
              <span>{l.libelle}</span>
              <small>{l.nature}{l.n ? ` · ${l.n} en vente` : ""}</small>
            </li>
          ))}
        </ul>
      )}
      <MesZones dialog={dialog} zones={zones} setZones={setZones} ajouter={ajouter} villesLocales={villesLocales} />
    </>
  );
}

/**
 * « Mes zones de recherche » : l'ajout par menus du BO (une région ajoute ses
 * départements, un département par son numéro, une ville parmi toutes les
 * communes de France), puis la liste de tout ce qui est choisi.
 */
function MesZones({
  dialog, zones, setZones, ajouter, villesLocales,
}: {
  dialog: React.RefObject<HTMLDialogElement | null>;
  zones: string[];
  setZones: React.Dispatch<React.SetStateAction<string[]>>;
  ajouter: (cles: string[]) => void;
  villesLocales: VilleLocale[];
}) {
  const uid = useId();
  const [region, setRegion] = useState("");
  const [dept, setDept] = useState("");
  const [filtre, setFiltre] = useState("");
  const [ville, setVille] = useState("");
  const communes = useCommunes(filtre);
  const regions = Object.entries(REGIONS).sort((a, b) => a[1].nom.localeCompare(b[1].nom, "fr"));
  const depts = Object.entries(DEPARTEMENTS).sort((a, b) => a[0].localeCompare(b[0], "fr", { numeric: true }));
  const trouvees = useMemo(() => {
    const f = sansAccents(filtre.trim());
    const m = new Map<string, { nom: string; dept: string }>();
    if (f.length >= 2) {
      villesLocales.filter((v) => sansAccents(v.nom).includes(f)).forEach((v) => m.set(sansAccents(`${v.nom}|${v.dept}`), v));
      communes.forEach((c) => { const k = sansAccents(`${c.nom}|${c.dept}`); if (!m.has(k)) m.set(k, c); });
    }
    return [...m.values()];
  }, [filtre, villesLocales, communes]);

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
            onClick={() => { ajouter(REGIONS[region].departements.map((d) => `d:${d}`)); setRegion(""); }}>+ Ajouter</button>

          <label htmlFor={`${uid}-d`}>Département</label>
          <select id={`${uid}-d`} value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">Choisir un département</option>
            {depts.map(([c, n]) => <option key={c} value={c}>{`${c} - ${n}`}</option>)}
          </select>
          <button type="button" className="btn btn--outline" disabled={!dept} onClick={() => { ajouter([`d:${dept}`]); setDept(""); }}>+ Ajouter</button>

          <label htmlFor={`${uid}-v`}>Ville</label>
          <div className="mes-zones__ville">
            <input id={`${uid}-v`} placeholder="Tapez le nom d’une commune" value={filtre} autoComplete="off"
              onChange={(e) => { setFiltre(e.target.value); setVille(""); }} />
            <select aria-label="Communes trouvées" value={ville} onChange={(e) => setVille(e.target.value)}>
              <option value="">{filtre.trim().length < 2 ? "Deux lettres au moins" : trouvees.length ? `${trouvees.length} commune${trouvees.length > 1 ? "s" : ""} trouvée${trouvees.length > 1 ? "s" : ""}` : "Aucune commune trouvée"}</option>
              {trouvees.map((v) => <option key={`${v.nom}-${v.dept}`} value={`${v.nom} (${v.dept})`}>{`${v.nom} (${v.dept})`}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn--outline" disabled={!ville} onClick={() => { ajouter([`v:${ville}`]); setVille(""); setFiltre(""); }}>+ Ajouter</button>
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
          <p className="mes-zones__vide">Aucune zone choisie pour l’instant.</p>
        )}

        <button type="button" className="btn btn--primary btn--wide" onClick={() => dialog.current?.close()}>Valider</button>
      </div>
    </dialog>
  );
}
