"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Picto } from "@/components/Picto";
import { envoyer } from "@/components/compte/envoyer";
import { DEPARTEMENTS } from "@/lib/departements";
import { sansAccents, versParams, type Criteres } from "@/lib/recherche-biens";
import { lienConnexion, useEtatCompte } from "./etat";

type Lieu = { cle: string; libelle: string; detail: string; n: number };

const CIBLES = ["Investisseur", "Marchand de biens", "Patrimonial", "Promoteur"];
const euros = (n: number) => n.toLocaleString("fr-FR");
const lireEuros = (s: string) => {
  const n = Number(s.replace(/[^\d]/g, ""));
  return s.trim() && Number.isFinite(n) ? n : null;
};

/**
 * La barre de recherche des immeubles à vendre (MAV, 31/10/2026, sur le modèle
 * de Plein Bail) : localisation, type, prix minimum et maximum, rendement
 * minimum, puis surface, lots et biens sans offre dans « Plus de filtres ».
 * « Enregistrer la recherche » la range dans le compte et l'envoie au BO.
 */
export function RechercheBiens({
  criteres,
  villes,
  types,
  departementsPresents,
  pourCompte,
}: {
  criteres: Criteres;
  villes: { nom: string; dept: string; n: number }[];
  types: string[];
  departementsPresents: Record<string, number>;
  pourCompte: { departements: string[]; villes: string[]; prixMin: number | null; prixMax: number | null; rendementMin: number | null };
}) {
  const uid = useId();
  const router = useRouter();
  const etat = useEtatCompte();
  const [deps, setDeps] = useState(criteres.departements);
  const [vls, setVls] = useState(criteres.villes);
  const [tps, setTps] = useState(criteres.types);
  const [saisie, setSaisie] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [pmin, setPmin] = useState(criteres.prixMin != null ? euros(criteres.prixMin) : "");
  const [pmax, setPmax] = useState(criteres.prixMax != null ? euros(criteres.prixMax) : "");
  const [rdt, setRdt] = useState(criteres.rendementMin ?? 0);
  const [plus, setPlus] = useState(!!(criteres.surfaceMin || criteres.lotsMin || criteres.sansOffre));
  const [smin, setSmin] = useState(criteres.surfaceMin ? String(criteres.surfaceMin) : "");
  const [lmin, setLmin] = useState(criteres.lotsMin ? String(criteres.lotsMin) : "");
  const [dispo, setDispo] = useState(criteres.sansOffre);
  const [enregistrer, setEnregistrer] = useState<"" | "choix" | "envoi" | "ok">("");
  const [cible, setCible] = useState("Investisseur");
  // Au téléphone, la barre est repliée : la localisation et un bouton « Filtres ».
  const [deplie, setDeplie] = useState(false);
  const nbFiltres = [criteres.types.length, criteres.prixMin != null, criteres.prixMax != null, criteres.rendementMin,
    criteres.surfaceMin, criteres.lotsMin, criteres.sansOffre].filter(Boolean).length;
  const [erreur, setErreur] = useState("");

  // Les suggestions : les villes où un immeuble est en vente, puis tous les départements.
  const suggestions = useMemo<Lieu[]>(() => {
    const q = sansAccents(saisie.trim());
    if (!q) return [];
    const vs: Lieu[] = villes
      .filter((v) => sansAccents(v.nom).includes(q) && !vls.includes(v.nom))
      .map((v) => ({ cle: `v:${v.nom}`, libelle: v.nom, detail: `${DEPARTEMENTS[v.dept] ?? v.dept} (${v.dept})`, n: v.n }));
    const ds: Lieu[] = Object.entries(DEPARTEMENTS)
      .filter(([code, nom]) => (sansAccents(nom).includes(q) || code.toLowerCase() === q) && !deps.includes(code))
      .map(([code, nom]) => ({ cle: `d:${code}`, libelle: `${nom} (${code})`, detail: "Département", n: departementsPresents[code] ?? 0 }));
    return [...vs, ...ds.sort((a, b) => b.n - a.n)].slice(0, 8);
  }, [saisie, villes, vls, deps, departementsPresents]);

  const choisir = (l: Lieu) => {
    if (l.cle.startsWith("v:")) setVls((x) => [...x, l.cle.slice(2)]);
    else setDeps((x) => [...x, l.cle.slice(2)]);
    setSaisie("");
    setOuvert(false);
  };

  const criteresSaisis = (): Partial<Criteres> => ({
    departements: deps, villes: vls, types: tps,
    prixMin: lireEuros(pmin), prixMax: lireEuros(pmax), rendementMin: rdt || null,
    surfaceMin: lireEuros(smin), lotsMin: lireEuros(lmin), sansOffre: dispo, tri: criteres.tri,
  });

  const lancer = (e?: React.FormEvent) => {
    e?.preventDefault();
    router.push(`/immeubles-a-vendre/${versParams(criteresSaisis())}#resultats`, { scroll: false });
    document.getElementById("resultats")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  return (
    <form className={`recherche-biens${deplie ? " est-deplie" : ""}`} onSubmit={lancer} role="search" aria-label="Rechercher un immeuble">
      <div className="recherche-biens__barre">
        <div className="recherche-biens__champ recherche-biens__champ--lieu">
          <label htmlFor={`${uid}-lieu`} className="recherche-biens__lbl"><Picto nom="secteur" taille={15} />Localisation</label>
          <div className="lieux">
            {deps.map((d) => (
              <span key={d} className="lieu">{DEPARTEMENTS[d]} ({d})
                <button type="button" aria-label={`Retirer ${DEPARTEMENTS[d]}`} onClick={() => setDeps((x) => x.filter((y) => y !== d))}>×</button>
              </span>
            ))}
            {vls.map((v) => (
              <span key={v} className="lieu">{v}
                <button type="button" aria-label={`Retirer ${v}`} onClick={() => setVls((x) => x.filter((y) => y !== v))}>×</button>
              </span>
            ))}
            <input id={`${uid}-lieu`} role="combobox" aria-expanded={ouvert && suggestions.length > 0} aria-controls={`${uid}-liste`}
              aria-autocomplete="list" autoComplete="off" value={saisie}
              placeholder={deps.length + vls.length ? "Ajouter…" : "Ville, département…"}
              onChange={(e) => { setSaisie(e.target.value); setOuvert(true); }}
              onKeyDown={(e) => { if (e.key === "Enter" && suggestions[0]) { e.preventDefault(); choisir(suggestions[0]); } }}
              onBlur={() => setTimeout(() => setOuvert(false), 150)} />
          </div>
          {ouvert && suggestions.length > 0 && (
            <ul id={`${uid}-liste`} role="listbox" className="lieux__liste">
              {suggestions.map((l) => (
                <li key={l.cle} role="option" aria-selected="false" onMouseDown={(e) => { e.preventDefault(); choisir(l); }}>
                  <span>{l.libelle}</span>
                  <small>{l.detail}{l.n ? ` · ${l.n} en vente` : ""}</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        {types.length > 1 && (
          <div className="recherche-biens__champ">
            <label htmlFor={`${uid}-type`} className="recherche-biens__lbl"><Picto nom="immeubles" taille={15} />Type</label>
            <select id={`${uid}-type`} value={tps[0] ?? ""} onChange={(e) => setTps(e.target.value ? [e.target.value] : [])}>
              <option value="">Tous</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        <div className="recherche-biens__champ">
          <label htmlFor={`${uid}-pmin`} className="recherche-biens__lbl"><Picto nom="euro" taille={15} />Prix min</label>
          <input id={`${uid}-pmin`} inputMode="numeric" placeholder="300 000" value={pmin}
            onChange={(e) => setPmin(e.target.value)} onBlur={() => { const n = lireEuros(pmin); setPmin(n != null ? euros(n) : ""); }} />
        </div>
        <div className="recherche-biens__champ">
          <label htmlFor={`${uid}-pmax`} className="recherche-biens__lbl"><Picto nom="euro" taille={15} />Prix max</label>
          <input id={`${uid}-pmax`} inputMode="numeric" placeholder="5 000 000" value={pmax}
            onChange={(e) => setPmax(e.target.value)} onBlur={() => { const n = lireEuros(pmax); setPmax(n != null ? euros(n) : ""); }} />
        </div>
        <div className="recherche-biens__champ recherche-biens__champ--rdt">
          <label htmlFor={`${uid}-rdt`} className="recherche-biens__lbl">
            <Picto nom="stats" taille={15} />Rendement <b>{rdt ? `≥ ${rdt.toLocaleString("fr-FR")} %` : "tous"}</b>
          </label>
          <input id={`${uid}-rdt`} type="range" className="curseur" min={0} max={12} step={0.5} value={rdt}
            style={{ ["--rempli" as string]: `${(rdt / 12) * 100}%` }} aria-valuetext={rdt ? `${rdt} % minimum` : "Tous"}
            onChange={(e) => setRdt(Number(e.target.value))} />
        </div>

        <div className="recherche-biens__actions">
          <button type="button" className="recherche-biens__filtres-mob" aria-expanded={deplie} onClick={() => setDeplie((x) => !x)}>
            <Picto nom="reglages" taille={17} />{deplie ? "Masquer les filtres" : `Filtres${nbFiltres ? ` (${nbFiltres})` : ""}`}
          </button>
          <button type="submit" className="btn btn--primary"><Picto nom="loupe" taille={17} />Rechercher</button>
          <button type="button" className="lien-discret" aria-expanded={plus} onClick={() => setPlus((x) => !x)}>
            {plus ? "Moins de filtres" : "Plus de filtres"}
          </button>
        </div>
      </div>

      {plus && (
        <div className="recherche-biens__plus">
          <div className="recherche-biens__champ">
            <label htmlFor={`${uid}-smin`} className="recherche-biens__lbl">Surface min (m²)</label>
            <input id={`${uid}-smin`} inputMode="numeric" placeholder="200" value={smin} onChange={(e) => setSmin(e.target.value)} />
          </div>
          <div className="recherche-biens__champ">
            <label htmlFor={`${uid}-lmin`} className="recherche-biens__lbl">Lots min</label>
            <input id={`${uid}-lmin`} inputMode="numeric" placeholder="4" value={lmin} onChange={(e) => setLmin(e.target.value)} />
          </div>
          <label className="recherche-biens__case">
            <input type="checkbox" checked={dispo} onChange={(e) => setDispo(e.target.checked)} />
            Masquer les biens sous offre
          </label>
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
    </form>
  );
}
