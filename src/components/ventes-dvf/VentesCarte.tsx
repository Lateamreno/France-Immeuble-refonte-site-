"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CreditPhoto,
  EVT_OUVRIR,
  NBSP,
  PhotoVente,
  arrondissement,
  chargerVentes,
  euros,
  locauxDe,
  moisAnnee,
  pourcent,
  type Vente,
} from "./commun";

/**
 * La carte des ventes d'immeubles de Paris (lot 127, MAV, 16/11/2026 : « la carte interactive avec
 * toutes les ventes peut être intéressante. On peut même afficher une légende avec des couleurs selon
 * les prix au m² et/ou rendements. Quand on survole un lieu on a la fiche »).
 *
 * Fond de carte dessiné par nous à partir de la BD TOPO de l'IGN (Licence ouverte), servi par notre
 * domaine (`public/carte/paris.json`, `scripts/carte-paris-*.mjs`) : aucune tuile tierce, aucune
 * adresse IP de visiteur envoyée ailleurs (CLAUDE.md §4, §16). Couleurs : le bronze seul, du profond
 * au clair (dégradé monochrome, §3). Les ventes viennent de `/api/ventes-dvf/`, fermée aux robots.
 */
type Fond = {
  vb: [number, number];
  proj: { lonMin: number; latMax: number; k: number; r: number; marge: number };
  arr: { code: string; n: number; d: string; c: [number, number]; b: [number, number, number, number] }[];
  eau: string;
  grandes: string;
  rues: string;
};
type Mode = "prixM2" | "rendement";
type Boite = { x: number; y: number; w: number; h: number };

/** Du plus bas au plus haut : du bronze profond au bronze clair, lisible sur le fond sombre. */
const TEINTES = [
  "var(--color-bronze-profond)",
  "var(--color-bronze-hover)",
  "var(--color-bronze)",
  "var(--color-bronze-clair-2)",
  "var(--color-bronze-clair)",
];
const rad = (d: number) => (d * Math.PI) / 180;

/** Quatre seuils (quintiles) arrondis, pour cinq classes de couleur. */
function seuils(valeurs: number[], pas: number): number[] {
  const v = [...valeurs].sort((a, b) => a - b);
  if (!v.length) return [];
  const q = (p: number) => v[Math.min(v.length - 1, Math.floor(p * v.length))];
  const s = [0.2, 0.4, 0.6, 0.8].map((p) => Math.round(q(p) / pas) * pas);
  return s.filter((x, i) => i === 0 || x > s[i - 1]);
}
const classe = (x: number, s: number[]) => {
  let i = 0;
  while (i < s.length && x >= s[i]) i++;
  return i;
};

export function VentesCarte() {
  const boiteRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [fond, setFond] = useState<Fond | null>(null);
  const [ventes, setVentes] = useState<Vente[] | null>(null);
  const [erreur, setErreur] = useState(false);
  const [mode, setMode] = useState<Mode>("prixM2");
  const [annee, setAnnee] = useState<number | null>(null);
  const [taille, setTaille] = useState<{ w: number; h: number } | null>(null);
  const [vb, setVb] = useState<Boite | null>(null);
  const [survol, setSurvol] = useState<string | null>(null);
  const [epingle, setEpingle] = useState<string | null>(null);
  const [arrSurvol, setArrSurvol] = useState<string | null>(null);
  const [toucher, setToucher] = useState(false);

  // Chargement quand la carte approche de l'écran.
  useEffect(() => {
    const el = boiteRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => {
        if (!e.some((x) => x.isIntersecting)) return;
        io.disconnect();
        Promise.all([fetch("/carte/paris.json").then((r) => (r.ok ? r.json() : Promise.reject())), chargerVentes()])
          .then(([f, v]) => {
            setFond(f as Fond);
            setVentes(v);
          })
          .catch(() => setErreur(true));
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    setToucher(window.matchMedia("(hover: none)").matches);
    return () => io.disconnect();
  }, []);

  // La taille de la carte à l'écran ; la vue garde ses proportions.
  useEffect(() => {
    const el = boiteRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTaille({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const vueEntiere = useCallback((): Boite | null => {
    if (!fond || !taille) return null;
    const [W, H] = fond.vb;
    const a = taille.w / taille.h;
    // Au téléphone (vue haute), on montre le cœur de Paris ; sur ordinateur, tout Paris.
    if (a >= W / H) {
      const h = H, w = H * a;
      return { x: (W - w) / 2, y: 0, w, h };
    }
    // Cadre plus étroit que Paris : toute la hauteur, centré sur Paris sans ses bois (un peu à l'ouest du milieu).
    const h = H, w = H * a;
    return { x: W * 0.47 - w / 2, y: 0, w, h };
  }, [fond, taille]);

  useEffect(() => {
    const v = vueEntiere();
    if (v) setVb(v);
  }, [vueEntiere]);

  const projeter = useCallback(
    (lon: number, lat: number): [number, number] => {
      const p = fond!.proj;
      return [rad(lon - p.lonMin) * p.r * p.k + p.marge, rad(p.latMax - lat) * p.r + p.marge];
    },
    [fond],
  );

  const points = useMemo(() => {
    if (!fond || !ventes) return [];
    return ventes.filter((v) => v.lat != null && v.lon != null).map((v) => ({ v, xy: projeter(v.lon!, v.lat!) }));
  }, [fond, ventes, projeter]);

  const lesSeuils = useMemo(() => {
    const vals = (ventes ?? []).map((v) => (mode === "prixM2" ? v.prixM2 : v.rendement)).filter((x): x is number => x != null);
    return seuils(vals, mode === "prixM2" ? 500 : 0.5);
  }, [ventes, mode]);

  const visibles = points.filter((p) => annee == null || p.v.annee === annee);
  const annees = useMemo(() => [...new Set((ventes ?? []).map((v) => v.annee))].sort((a, b) => a - b), [ventes]);

  // Animation de la vue (zoom, recentrage).
  const anim = useRef<number | null>(null);
  const allerA = useCallback(
    (cible: Boite) => {
      if (!vb || !fond) return;
      const [W, H] = fond.vb;
      const a = vb.w / vb.h;
      // Mêmes proportions que l'écran ; ni trop près ni trop loin ; le centre reste dans Paris.
      let w = Math.max(500, Math.min(Math.max(W, H * a), cible.w));
      let h = w / a;
      if (cible.h > h) {
        h = Math.min(Math.max(H, W / a), cible.h);
        w = h * a;
      }
      const cx = Math.max(0, Math.min(W, cible.x + cible.w / 2));
      const cy = Math.max(0, Math.min(H, cible.y + cible.h / 2));
      const fin = { x: cx - w / 2, y: cy - h / 2, w, h };
      const debut = vb;
      const t0 = performance.now();
      if (anim.current) cancelAnimationFrame(anim.current);
      const pas = (t: number) => {
        const k = Math.min(1, (t - t0) / 260);
        const e = 1 - Math.pow(1 - k, 3);
        setVb({
          x: debut.x + (fin.x - debut.x) * e,
          y: debut.y + (fin.y - debut.y) * e,
          w: debut.w + (fin.w - debut.w) * e,
          h: debut.h + (fin.h - debut.h) * e,
        });
        if (k < 1) anim.current = requestAnimationFrame(pas);
      };
      anim.current = requestAnimationFrame(pas);
    },
    [vb, fond],
  );
  const zoomer = (f: number, cx?: number, cy?: number) => {
    if (!vb) return;
    const x0 = cx ?? vb.x + vb.w / 2, y0 = cy ?? vb.y + vb.h / 2;
    allerA({ x: x0 - (vb.w * f) / 2, y: y0 - (vb.h * f) / 2, w: vb.w * f, h: vb.h * f });
  };

  // Glisser pour déplacer, pincer pour zoomer.
  const pointeurs = useRef(new Map<number, { x: number; y: number }>());
  const geste = useRef<{ bouge: boolean; dist?: number }>({ bouge: false });
  const echelle = vb && taille ? vb.w / taille.w : 1;
  const versCarte = (cx: number, cy: number): [number, number] => {
    const r = svgRef.current!.getBoundingClientRect();
    return [vb!.x + ((cx - r.left) / r.width) * vb!.w, vb!.y + ((cy - r.top) / r.height) * vb!.h];
  };
  const surBas = (e: React.PointerEvent) => {
    if ((e.target as Element).closest(".vcarte__point")) return;
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    geste.current = { bouge: false };
  };
  const surDeplace = (e: React.PointerEvent) => {
    const avant = pointeurs.current.get(e.pointerId);
    if (!avant || !vb) return;
    const p = pointeurs.current;
    if (p.size === 2) {
      const [a, b] = [...p.values()];
      const d0 = Math.hypot(a.x - b.x, a.y - b.y);
      p.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [c, d] = [...p.values()];
      const d1 = Math.hypot(c.x - d.x, c.y - d.y);
      if (d0 > 0 && d1 > 0) {
        const [mx, my] = versCarte((c.x + d.x) / 2, (c.y + d.y) / 2);
        const f = d0 / d1;
        const [W] = fond!.vb;
        const w = Math.max(500, Math.min(W * 1.2, vb.w * f));
        const k = w / vb.w;
        setVb({ x: mx - (mx - vb.x) * k, y: my - (my - vb.y) * k, w, h: vb.h * k });
      }
      geste.current.bouge = true;
      return;
    }
    const dx = e.clientX - avant.x, dy = e.clientY - avant.y;
    if (!geste.current.bouge && Math.abs(dx) + Math.abs(dy) > 3) {
      geste.current.bouge = true;
      // On garde le pointeur pendant le glissé seulement : un simple clic reste à l'arrondissement visé.
      svgRef.current?.setPointerCapture(e.pointerId);
    }
    p.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (geste.current.bouge) setVb({ ...vb, x: vb.x - dx * echelle, y: vb.y - dy * echelle });
  };
  const surHaut = (e: React.PointerEvent) => {
    pointeurs.current.delete(e.pointerId);
  };

  // Molette : zoom avec Ctrl (ou ⌘), pour ne pas bloquer le défilement de la page.
  const [aideMolette, setAideMolette] = useState(false);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let t: ReturnType<typeof setTimeout>;
    const roue = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) {
        setAideMolette(true);
        clearTimeout(t);
        t = setTimeout(() => setAideMolette(false), 1400);
        return;
      }
      e.preventDefault();
      if (!vb || !fond) return;
      const [mx, my] = versCarte(e.clientX, e.clientY);
      const f = e.deltaY > 0 ? 1.25 : 0.8;
      const w = Math.max(500, Math.min(fond.vb[0] * 1.2, vb.w * f));
      const k = w / vb.w;
      setVb({ x: mx - (mx - vb.x) * k, y: my - (my - vb.y) * k, w, h: vb.h * k });
    };
    svg.addEventListener("wheel", roue, { passive: false });
    return () => {
      svg.removeEventListener("wheel", roue);
      clearTimeout(t);
    };
  });

  const quitter = useRef<ReturnType<typeof setTimeout> | null>(null);
  const survoler = (id: string | null) => {
    if (quitter.current) clearTimeout(quitter.current);
    if (id) setSurvol(id);
    else quitter.current = setTimeout(() => setSurvol(null), 220);
  };
  const actif = epingle ?? survol;
  const venteActive = actif ? points.find((p) => p.v.id === actif) : null;
  const ouvrirDansLaListe = (id: string) => window.dispatchEvent(new CustomEvent(EVT_OUVRIR, { detail: { id } }));

  // Position de la fiche : à côté du point, sans sortir de la carte (sur ordinateur).
  let posFiche: React.CSSProperties | undefined;
  if (venteActive && vb && taille && !toucher) {
    const sx = ((venteActive.xy[0] - vb.x) / vb.w) * taille.w;
    const sy = ((venteActive.xy[1] - vb.y) / vb.h) * taille.h;
    const L = 300;
    const gauche = sx + 16 + L > taille.w ? sx - 16 - L : sx + 16;
    posFiche = { left: Math.max(8, gauche), top: Math.max(8, Math.min(taille.h - 8 - 330, sy - 120)) };
  }

  const rPoint = (toucher ? 4.5 : 5.5) * echelle;
  const voirRues = fond && vb ? vb.w < fond.vb[0] / 2.4 : false;
  const libelleSeuil = (x: number) => (mode === "prixM2" ? `${x.toLocaleString("fr-FR")}${NBSP}€` : pourcent(x));
  const legende = lesSeuils.length
    ? [
        `moins de ${libelleSeuil(lesSeuils[0])}`,
        ...lesSeuils.slice(1).map((s, i) => `${libelleSeuil(lesSeuils[i])} à ${libelleSeuil(s)}`),
        `${libelleSeuil(lesSeuils[lesSeuils.length - 1])} et plus`,
      ]
    : [];
  const decalage = TEINTES.length - legende.length;

  // Au téléphone, la fiche se place sous la carte : le point choisi reste visible.
  const fiche = venteActive ? (
<div className={`vcarte__fiche${toucher ? " vcarte__fiche--bas" : ""}`} style={posFiche} role="dialog" aria-label="Vente"
            onPointerEnter={() => survol && survoler(survol)}
            onPointerLeave={() => !epingle && survoler(null)}>
            {epingle && (
              <button type="button" className="vcarte__fermer" aria-label="Fermer" onClick={() => setEpingle(null)}>
                ×
              </button>
            )}
            <PhotoVente v={venteActive.v} />
            <div className="vcarte__fiche-texte">
              <p className="vdvf__date">
                {moisAnnee(venteActive.v.date)} · {venteActive.v.mixte ? "Immeuble mixte" : "Immeuble d’habitation"} ·{" "}
                {arrondissement(venteActive.v.codeInsee)}
              </p>
              <p className="vcarte__rue">{venteActive.v.rue ?? "Rue non renseignée"}</p>
              <p className="vcarte__prix">{euros(venteActive.v.prix)}</p>
              <p className="vdvf__chiffres">
                {euros(venteActive.v.prixM2)} le m² · {venteActive.v.surface.toLocaleString("fr-FR")}
                {NBSP}m²
                {venteActive.v.rendement != null && <> · rendement {pourcent(venteActive.v.rendement)}</>}
              </p>
              <p className="vdvf__chiffres">
                {venteActive.v.logements} logement{venteActive.v.logements > 1 ? "s" : ""}
                {locauxDe(venteActive.v) > 1 ? ` et ${locauxDe(venteActive.v)} locaux commerciaux` : locauxDe(venteActive.v) === 1 ? " et 1 local commercial" : ""}
              </p>
              {epingle && (
                <button type="button" className="vcarte__lien" onClick={() => ouvrirDansLaListe(venteActive.v.id)}>
                  Voir le détail des lots
                </button>
              )}
              {venteActive.v.photo && <CreditPhoto photo={venteActive.v.photo} />}
            </div>
          </div>
  ) : null;

  return (
    <div className="vcarte" data-nosnippet="">
      <div className="vcarte__barre">
        <div className="vcarte__choix" role="group" aria-label="Couleur des points">
          <span className="vcarte__lib">Couleur</span>
          <button type="button" aria-pressed={mode === "prixM2"} onClick={() => setMode("prixM2")}>
            Prix au m²
          </button>
          <button type="button" aria-pressed={mode === "rendement"} onClick={() => setMode("rendement")}>
            Rendement
          </button>
        </div>
        <div className="vcarte__choix" role="group" aria-label="Année des ventes">
          <span className="vcarte__lib">Année</span>
          <button type="button" aria-pressed={annee == null} onClick={() => setAnnee(null)}>
            Toutes
          </button>
          {annees.map((a) => (
            <button key={a} type="button" aria-pressed={annee === a} onClick={() => setAnnee(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div ref={boiteRef} className="vcarte__boite">
        {erreur && <p className="vcarte__etat">La carte n’a pas pu être chargée. Rechargez la page pour réessayer.</p>}
        {!erreur && (!fond || !ventes) && <p className="vcarte__etat">Chargement de la carte…</p>}
        {fond && vb && (
          <svg
            ref={svgRef}
            className="vcarte__svg"
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            role="img"
            aria-label={`Carte de Paris : ${visibles.length} ventes d’immeubles de rapport. La liste des ventes, arrondissement par arrondissement, suit la carte.`}
            onPointerDown={surBas}
            onPointerMove={surDeplace}
            onPointerUp={surHaut}
            onPointerCancel={surHaut}
            onDoubleClick={(e) => {
              const [mx, my] = versCarte(e.clientX, e.clientY);
              zoomer(0.5, mx, my);
            }}
          >
            <defs>
              <clipPath id="vcarte-paris">
                {fond.arr.map((a) => (
                  <path key={a.code} d={a.d} />
                ))}
              </clipPath>
            </defs>
            <g className="vcarte__arr">
              {fond.arr.map((a) => (
                <path
                  key={a.code}
                  d={a.d}
                  className={arrSurvol === a.code ? "is-survol" : undefined}
                  vectorEffect="non-scaling-stroke"
                  onPointerEnter={() => setArrSurvol(a.code)}
                  onPointerLeave={() => setArrSurvol((c) => (c === a.code ? null : c))}
                  onClick={() => {
                    if (geste.current.bouge) return;
                    setEpingle(null);
                    const [x0, y0, x1, y1] = a.b;
                    const m = 0.12 * Math.max(x1 - x0, y1 - y0);
                    allerA({ x: x0 - m, y: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m });
                  }}
                />
              ))}
            </g>
            <path className="vcarte__eau" d={fond.eau} clipPath="url(#vcarte-paris)" />
            {voirRues && <path className="vcarte__rues" d={fond.rues} vectorEffect="non-scaling-stroke" />}
            <path className="vcarte__grandes" d={fond.grandes} vectorEffect="non-scaling-stroke" />
            <g className="vcarte__noms" aria-hidden="true">
              {fond.arr.map((a) => (
                <text key={a.code} x={a.c[0]} y={a.c[1]} fontSize={15 * echelle} textAnchor="middle" dominantBaseline="middle">
                  {a.n}
                </text>
              ))}
            </g>
            <g className="vcarte__points" aria-hidden="true">
              {visibles.map(({ v, xy }) => {
                const val = mode === "prixM2" ? v.prixM2 : v.rendement;
                const actifIci = v.id === actif;
                return (
                  <circle
                    key={v.id}
                    className={`vcarte__point${val == null ? " is-vide" : ""}${actifIci ? " is-actif" : ""}`}
                    cx={xy[0]}
                    cy={xy[1]}
                    r={actifIci ? rPoint * 1.6 : rPoint}
                    strokeWidth={1.5 * echelle}
                    style={val != null ? { fill: TEINTES[decalage + classe(val, lesSeuils)] } : undefined}
                    onPointerEnter={(e) => e.pointerType === "mouse" && survoler(v.id)}
                    onPointerLeave={(e) => e.pointerType === "mouse" && survoler(null)}
                    onClick={() => setEpingle((p) => (p === v.id ? null : v.id))}
                  />
                );
              })}
            </g>
          </svg>
        )}

        {fond && vb && (
          <div className="vcarte__zoom">
            <button type="button" aria-label="Zoomer" onClick={() => zoomer(0.5)}>
              +
            </button>
            <button type="button" aria-label="Dézoomer" onClick={() => zoomer(2)}>
              −
            </button>
            <button
              type="button"
              className="vcarte__tout"
              onClick={() => {
                setEpingle(null);
                const v = vueEntiere();
                if (v) allerA(v);
              }}
            >
              Paris
            </button>
          </div>
        )}
        {aideMolette && <p className="vcarte__aide">Ctrl + molette pour zoomer</p>}

        {!toucher && fiche}
      </div>
      {toucher && fiche}

      {legende.length > 0 && (
        <div className="vcarte__legende">
          <p className="vcarte__legende-titre">
            {mode === "prixM2" ? "Prix au m² de l’immeuble" : "Rendement théorique"}
            <span>
              {" "}
              · {visibles.length} vente{visibles.length > 1 ? "s" : ""}
            </span>
          </p>
          <ul>
            {legende.map((l, i) => (
              <li key={l}>
                <i style={{ background: TEINTES[decalage + i] }} />
                {l}
              </li>
            ))}
            {mode === "rendement" && (
              <li>
                <i className="is-vide" />
                sans loyer de référence
              </li>
            )}
          </ul>
          <p className="vcarte__source">
            {toucher ? "Touchez un point pour voir la vente, un arrondissement pour le rapprocher." : "Survolez un point pour voir la vente, cliquez sur un arrondissement pour le rapprocher."}{" "}
            Fond de carte : IGN, BD TOPO (Licence ouverte).
          </p>
        </div>
      )}
    </div>
  );
}
