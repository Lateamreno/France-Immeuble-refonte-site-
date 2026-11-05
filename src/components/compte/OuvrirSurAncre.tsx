"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Un panneau replié qui s'ouvre quand l'adresse vise son ancre (« #ajouter »),
 * au chargement comme après un clic sur un lien de la page.
 */
export function OuvrirSurAncre({ id, ouvert = false, children }: { id: string; ouvert?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const voir = () => {
      if (window.location.hash !== `#${id}` || !ref.current) return;
      ref.current.open = true;
      ref.current.scrollIntoView({ block: "start" });
    };
    voir();
    window.addEventListener("hashchange", voir);
    return () => window.removeEventListener("hashchange", voir);
  }, [id]);
  return (
    <details ref={ref} id={id} className="compte-panneau compte-replie" open={ouvert || undefined}>
      {children}
    </details>
  );
}
