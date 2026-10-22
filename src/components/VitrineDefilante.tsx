"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Picto } from "./Picto";

export type FicheVitrine = {
  href: string;
  image: string | null;
  ville: string;
  dept: string;
  /** Vignette : les quatre données, le prix en dernier. */
  infos: [string, string][];
  /** Polaroid : la légende écrite à la main. */
  faits: string;
  prix: string;
};

export type FormeVitrine = "vignettes" | "polaroids";

/**
 * La vitrine des ventes de l'accueil : la vente du milieu en grand, les
 * voisines plus petites, inclinées et dans l'ombre (MAV, 22/10/2026).
 *
 * Deux formes de carte. Les vignettes de l'ancienne vitrine sont en ligne ;
 * les polaroïds (cadre blanc, légende manuscrite, tampon « VENDU » or) ont été
 * validés puis mis de côté par MAV, qui veut pouvoir y revenir : il suffit de
 * passer `forme="polaroids"`.
 *
 * - Défilement seul toutes les 4,5 s, arrêté au survol, au focus et quand
 *   l'utilisateur a demandé moins d'animations.
 * - Flèches, points, flèches du clavier, glisser à la souris ou au doigt.
 * - Un clic sur un voisin l'amène au milieu ; sur celui du milieu, il ouvre
 *   la fiche de la vente. Toutes les fiches restent des liens dans la page.
 * - Au survol, le polaroid du milieu s'incline vers la souris et son reflet
 *   suit la lumière.
 */

// Place, inclinaison, échelle, hauteur au-dessus de la table, lumière.
const POSES = [
  { x: 0, y: 0, r: -1.5, s: 1, z: 10, lift: 1.25, b: 1, gx: 50 },
  { x: 70, y: 3, r: 5.5, s: 0.84, z: 8, lift: 0.8, b: 0.82, gx: 22 },
  { x: 126, y: 6, r: 10, s: 0.7, z: 6, lift: 0.55, b: 0.62, gx: 8 },
  { x: 175, y: 8, r: 14, s: 0.55, z: 4, lift: 0.4, b: 0.45, gx: 0 },
];

function pose(d: number): CSSProperties {
  const p = POSES[Math.min(Math.abs(d), POSES.length - 1)];
  const sens = d < 0 ? -1 : 1;
  return {
    "--x": `${sens * p.x}%`,
    "--y": `${p.y}%`,
    "--r": `${d === 0 ? p.r : sens * p.r}deg`,
    "--s": p.s,
    "--z": p.z,
    "--lift": p.lift,
    "--b": p.b,
    "--gx": `${d < 0 ? 100 - p.gx : p.gx}%`,
    visibility: Math.abs(d) > 3 ? "hidden" : undefined,
  } as CSSProperties;
}

export function VitrineDefilante({ items, forme }: { items: FicheVitrine[]; forme: FormeVitrine }) {
  const n = items.length;
  const [courant, setCourant] = useState(0);
  const [pause, setPause] = useState(false);
  const [calme, setCalme] = useState(true);
  const depart = useRef<number | null>(null);
  const bouge = useRef(false);
  const papiers = useRef<(HTMLSpanElement | null)[]>([]);

  const aller = useCallback((i: number) => setCourant(((i % n) + n) % n), [n]);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setCalme(mq.matches);
    const suivre = () => setCalme(mq.matches);
    mq.addEventListener("change", suivre);
    return () => mq.removeEventListener("change", suivre);
  }, []);

  // La minuterie repart de zéro à chaque changement de carte.
  useEffect(() => {
    if (calme || pause || n < 2) return;
    const t = setTimeout(() => aller(courant + 1), 4500);
    return () => clearTimeout(t);
  }, [courant, calme, pause, n, aller]);

  const redresser = (el: HTMLSpanElement | null) => {
    el?.style.removeProperty("--rx");
    el?.style.removeProperty("--ry");
    el?.style.removeProperty("--gx-souris");
  };

  if (n === 0) return null;

  return (
    <div className={`vitr vitr--${forme}`}>
      <div
        className="vitr__scene"
        role="region"
        aria-roledescription="carrousel"
        aria-label="Immeubles vendus"
        tabIndex={0}
        onMouseEnter={() => setPause(true)}
        onMouseLeave={() => {
          setPause(false);
          redresser(papiers.current[courant]);
        }}
        onFocus={() => setPause(true)}
        onBlur={() => setPause(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") { e.preventDefault(); aller(courant - 1); }
          if (e.key === "ArrowRight") { e.preventDefault(); aller(courant + 1); }
        }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest(".vitr__fleche")) return;
          depart.current = e.clientX;
          bouge.current = false;
        }}
        onPointerMove={(e) => {
          if (depart.current !== null) {
            if (!bouge.current && Math.abs(e.clientX - depart.current) > 8) {
              bouge.current = true;
              // Capturé seulement une fois le glissement engagé : un simple
              // clic doit rester un clic sur le lien.
              e.currentTarget.setPointerCapture(e.pointerId);
            }
            return;
          }
          if (e.pointerType !== "mouse") return;
          const el = papiers.current[courant];
          if (!el) return;
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          if (px < 0 || px > 1 || py < 0 || py > 1) return redresser(el);
          el.style.setProperty("--ry", `${(px - 0.5) * 14}deg`);
          el.style.setProperty("--rx", `${2 + (0.5 - py) * 12}deg`);
          el.style.setProperty("--gx-souris", `${15 + px * 70}%`);
        }}
        onPointerUp={(e) => {
          if (depart.current === null) return;
          const dx = e.clientX - depart.current;
          depart.current = null;
          if (Math.abs(dx) > 40) aller(courant + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => { depart.current = null; }}
      >
        {items.map((it, i) => {
          let d = (((i - courant) % n) + n) % n;
          if (d > n / 2) d -= n;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`vitr__carte ${forme === "polaroids" ? "pola" : "vig"}`}
              style={pose(d)}
              data-pos={d}
              tabIndex={d === 0 ? 0 : -1}
              aria-label={`${it.ville} (${it.dept}), ${it.faits ? `${it.faits}, ` : ""}vendu ${it.prix}`}
              draggable={false}
              onClick={(e) => {
                // Un glissement n'est pas un clic ; un voisin vient au milieu.
                if (bouge.current || d !== 0) {
                  e.preventDefault();
                  if (!bouge.current) aller(i);
                }
                bouge.current = false;
              }}
            >
              {forme === "polaroids" ? (
                <span className="pola__papier" ref={(el) => { papiers.current[i] = el; }}>
                  <span className="pola__photo">
                    {it.image ? (
                      <Image src={it.image} alt="" fill sizes="300px" draggable={false} />
                    ) : (
                      <span className="pola__sansphoto" aria-hidden="true">
                        <Picto nom="immeubles" taille={40} />
                      </span>
                    )}
                  </span>
                  <span className="pola__tampon" aria-hidden="true">
                    <i>V</i><i>E</i><i>N</i><i>D</i><i>U</i>
                  </span>
                  <span className="pola__legende" aria-hidden="true">
                    <span className={`pola__ville${it.ville.length > 14 ? " pola__ville--longue" : ""}`}>
                      {it.ville} ({it.dept})
                    </span>
                    <span className="pola__faits">
                      {it.faits ? `${it.faits} · ` : ""}
                      <span className="pola__prix">{it.prix}</span>
                    </span>
                  </span>
                </span>
              ) : (
                <>
                  {it.image ? (
                    <Image className="vig__img" src={it.image} alt="" fill sizes="300px" draggable={false} />
                  ) : (
                    <span className="vig__sansphoto" aria-hidden="true">
                      <Picto nom="immeubles" taille={40} />
                    </span>
                  )}
                  <span className="vig__voile" aria-hidden="true" />
                  <span className="vig__texte" aria-hidden="true">
                    <span className="vig__ville">
                      {it.ville} <span className="vig__dept">({it.dept})</span>
                    </span>
                    <dl className="vig__infos">
                      {it.infos.map(([dt, dd]) => (
                        <div key={dt}>
                          <dt>{dt}</dt>
                          <dd>{dd}</dd>
                        </div>
                      ))}
                    </dl>
                  </span>
                </>
              )}
            </Link>
          );
        })}
        <button type="button" className="vitr__fleche vitr__fleche--avant" aria-label="Immeuble précédent"
          onClick={() => aller(courant - 1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
        </button>
        <button type="button" className="vitr__fleche vitr__fleche--apres" aria-label="Immeuble suivant"
          onClick={() => aller(courant + 1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
      <div className="vitr__points">
        {items.map((it, i) => (
          <button key={it.href} type="button" aria-current={i === courant}
            aria-label={`${it.ville}, vente ${i + 1} sur ${n}`} onClick={() => aller(i)} />
        ))}
      </div>
    </div>
  );
}
