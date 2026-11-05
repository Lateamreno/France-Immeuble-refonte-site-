"use client";

import { useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

// Le formulaire ne se télécharge qu'à l'ouverture de la fenêtre (vitesse, 05/11/2026).
const RechercheForm = dynamic(() => import("@/components/RechercheForm").then((m) => m.RechercheForm), {
  ssr: false,
  loading: () => <p className="compte-calme">Chargement du formulaire…</p>,
});

/**
 * Un bouton qui ouvre le dépôt de recherche dans une fenêtre, sans quitter la
 * page (retour #145 pour la vignette off-market, retour #227 pour l'accueil,
 * MAV, 03 et 04/11/2026). Le formulaire est remonté à chaque ouverture : on
 * repart d'une saisie vierge.
 */
export function BoutonRecherche({
  className = "btn btn--primary",
  titre = "Déposer ma recherche",
  sous = "Décrivez votre recherche : les immeubles qui y correspondent vous sont envoyés avant toute diffusion, y compris les confidentiels.",
  children = "Déposer ma recherche",
}: {
  className?: string;
  titre?: string;
  sous?: string;
  children?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [ouverte, setOuverte] = useState(0);
  const ouvrir = () => { setOuverte((n) => n + 1); dialog.current?.showModal(); };

  return (
    <>
      <button type="button" className={className} onClick={ouvrir}>{children}</button>
      <dialog ref={dialog} className="modale-compte modale-recherche" aria-label={titre}
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <div className="modale-compte__corps">
          <button type="button" className="modale-compte__fermer" aria-label="Fermer" onClick={() => dialog.current?.close()}>×</button>
          <p className="modale-compte__titre">{titre}</p>
          <p className="modale-compte__sous">{sous}</p>
          {ouverte > 0 && <RechercheForm key={ouverte} />}
        </div>
      </dialog>
    </>
  );
}
