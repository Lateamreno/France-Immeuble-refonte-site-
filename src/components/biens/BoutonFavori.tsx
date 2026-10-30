"use client";

import { useState } from "react";
import { envoyer } from "@/components/compte/envoyer";
import { lienConnexion, majFavori, useEtatCompte } from "./etat";

/**
 * Le cœur « Ajouter aux favoris » (MAV, 31/10/2026, comme Plein Bail). Sans
 * compte, il mène à la connexion puis revient sur la page.
 */
export function BoutonFavori({ bien, libelle = false, className = "" }: { bien: string; libelle?: boolean; className?: string }) {
  const etat = useEtatCompte();
  const [envoi, setEnvoi] = useState(false);
  const actif = !!etat?.favoris?.includes(bien);
  const texte = actif ? "Retirer des favoris" : "Ajouter aux favoris";

  return (
    <button type="button" className={`favori${actif ? " est-actif" : ""}${libelle ? " favori--libelle" : ""} ${className}`}
      aria-pressed={actif} aria-label={libelle ? undefined : texte} title={texte} disabled={envoi}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!etat?.connecte) { window.location.assign(lienConnexion()); return; }
        setEnvoi(true);
        majFavori(bien, !actif);
        const r = await envoyer("/api/compte/favori/", { bien, actif: !actif });
        if (!r.ok) majFavori(bien, actif);
        setEnvoi(false);
      }}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"
          fill={actif ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      {libelle && <span>{actif ? "Dans vos favoris" : "Ajouter aux favoris"}</span>}
    </button>
  );
}
