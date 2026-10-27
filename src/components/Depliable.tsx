"use client";

import { useState } from "react";

/**
 * Texte dont la suite se replie au téléphone, pour qu'une section tienne sur
 * un écran (retour #56, MAV, 27/10/2026). Sur ordinateur tout est affiché et
 * le bouton n'existe pas. Le texte replié reste dans la page : Google le lit.
 */
export function Depliable({ children, suite }: { children: React.ReactNode; suite: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="depliable" data-ouvert={ouvert || undefined}>
      {children}
      <div className="depliable__suite">{suite}</div>
      {!ouvert && (
        <button type="button" className="lien-discret depliable__bouton" aria-expanded={false}
          onClick={() => setOuvert(true)}>
          Lire la suite
        </button>
      )}
    </div>
  );
}
