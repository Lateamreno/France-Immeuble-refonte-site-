"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EstimationForm } from "./EstimationForm";

/**
 * Le formulaire d'estimation dans une fenêtre, sans quitter la page (retours
 * #251 et #252, MAV, 04/11/2026, page Nos ventes). Un seul exemplaire monté par
 * page ; les boutons l'ouvrent par `ouvrirEstimation()`, y compris la pilule
 * fixe du téléphone (`BoutonFixeMobile` avec `modale`).
 */
const EVENEMENT = "fi:ouvrir-estimation";

export function ouvrirEstimation() {
  window.dispatchEvent(new Event(EVENEMENT));
}

export function ModaleEstimation() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [ouverte, setOuverte] = useState(0);
  useEffect(() => {
    const ouvrir = () => { setOuverte((n) => n + 1); dialog.current?.showModal(); };
    window.addEventListener(EVENEMENT, ouvrir);
    return () => window.removeEventListener(EVENEMENT, ouvrir);
  }, []);
  return (
    <dialog ref={dialog} className="modale-compte modale-recherche modale-estimation" aria-label="Estimer mon immeuble"
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
      <div className="modale-compte__corps">
        <button type="button" className="modale-compte__fermer" aria-label="Fermer" onClick={() => dialog.current?.close()}>×</button>
        {ouverte > 0 && <EstimationForm key={ouverte} formulaire="estimer" />}
      </div>
    </dialog>
  );
}

export function BoutonEstimation({ className = "btn btn--primary", children = "Estimer mon immeuble" }: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button type="button" className={className} data-estimer="" onClick={ouvrirEstimation}>{children}</button>
  );
}
