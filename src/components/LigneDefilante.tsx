"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Une ligne de cartes qui défile sans barre de défilement (MAV, 22/10/2026).
 *
 * - Deux flèches discrètes sur les côtés, visibles seulement quand il reste
 *   quelque chose à voir de ce côté.
 * - À la souris : on clique, on garde le bouton enfoncé et on tire à gauche
 *   ou à droite. Au doigt, le glissement natif du navigateur suffit.
 * - Au clavier : les flèches sont de vrais boutons, et chaque carte reste
 *   atteignable par tabulation (le navigateur fait défiler jusqu'à elle).
 *
 * Quand tout tient à l'écran, il n'y a ni flèche ni glissement : la ligne
 * reste une simple rangée.
 */
export function LigneDefilante({ className = "", children }: { className?: string; children: ReactNode }) {
  const piste = useRef<HTMLDivElement>(null);
  const [avant, setAvant] = useState(false);
  const [apres, setApres] = useState(false);
  const glisse = useRef<{ x: number; depart: number; bouge: boolean } | null>(null);

  const mesurer = useCallback(() => {
    const el = piste.current;
    if (!el) return;
    setAvant(el.scrollLeft > 4);
    setApres(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = piste.current;
    if (!el) return;
    mesurer();
    el.addEventListener("scroll", mesurer, { passive: true });
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", mesurer);
      ro.disconnect();
    };
  }, [mesurer]);

  const defiler = (sens: 1 | -1) => {
    const el = piste.current;
    if (!el) return;
    const carte = el.firstElementChild as HTMLElement | null;
    const pas = carte ? carte.getBoundingClientRect().width + 12 : el.clientWidth * 0.8;
    el.scrollBy({ left: sens * pas, behavior: "smooth" });
  };

  return (
    <div className="ligne">
      <div
        ref={piste}
        className={`ligne-cartes ${className}`.trim()}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button !== 0 || !piste.current) return;
          glisse.current = { x: e.clientX, depart: piste.current.scrollLeft, bouge: false };
        }}
        onPointerMove={(e) => {
          const g = glisse.current;
          const el = piste.current;
          if (!g || !el) return;
          const dx = e.clientX - g.x;
          if (!g.bouge && Math.abs(dx) > 5) {
            g.bouge = true;
            el.classList.add("is-glisse");
            el.setPointerCapture(e.pointerId);
          }
          if (g.bouge) el.scrollLeft = g.depart - dx;
        }}
        onPointerUp={(e) => {
          const el = piste.current;
          if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
          el?.classList.remove("is-glisse");
          // Un glissement n'est pas un clic : on l'empêche d'ouvrir un lien.
          if (glisse.current?.bouge) {
            const bloquer = (ev: MouseEvent) => { ev.preventDefault(); ev.stopPropagation(); };
            el?.addEventListener("click", bloquer, { capture: true, once: true });
            setTimeout(() => el?.removeEventListener("click", bloquer, { capture: true }), 0);
          }
          glisse.current = null;
        }}
        onPointerCancel={() => {
          piste.current?.classList.remove("is-glisse");
          glisse.current = null;
        }}
      >
        {children}
      </div>
      <button type="button" className="ligne__fleche ligne__fleche--avant" aria-label="Cartes précédentes"
        hidden={!avant} onClick={() => defiler(-1)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
      </button>
      <button type="button" className="ligne__fleche ligne__fleche--apres" aria-label="Cartes suivantes"
        hidden={!apres} onClick={() => defiler(1)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
      </button>
    </div>
  );
}
