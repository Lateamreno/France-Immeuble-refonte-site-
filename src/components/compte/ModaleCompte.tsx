"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Le formulaire de connexion ne se télécharge qu'à l'ouverture de la fenêtre (vitesse, 05/11/2026).
const Acces = dynamic(() => import("./Acces").then((m) => m.Acces), { ssr: false });

/**
 * La fenêtre de connexion et de création de compte, ouverte par tout bouton
 * qui demande un compte (favori, offre, recherche enregistrée, fin du dépôt de
 * recherche). Le visiteur ne quitte jamais sa page (retour #108, MAV,
 * 02/11/2026) : connecté, la page se recharge sur place ; compte créé, le lien
 * de vérification le ramène ici. Montée une fois, dans la mise en page.
 */
export function ModaleCompte() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [demande, setDemande] = useState<{ n: number; ancre: string; onglet: "connexion" | "creation" }>({ n: 0, ancre: "", onglet: "connexion" });

  useEffect(() => {
    const ouvrir = (e: Event) => {
      const d = (e as CustomEvent<{ ancre?: string; onglet?: "connexion" | "creation" }>).detail ?? {};
      setDemande((x) => ({ n: x.n + 1, ancre: d.ancre ?? "", onglet: d.onglet ?? "connexion" }));
      dialog.current?.showModal();
    };
    window.addEventListener("fi:compte", ouvrir);
    return () => window.removeEventListener("fi:compte", ouvrir);
  }, []);

  const retour = typeof window === "undefined" ? undefined
    : `${window.location.pathname}${window.location.search}${demande.ancre}`;

  return (
    <dialog ref={dialog} className="modale-compte" aria-label="Se connecter ou créer un compte"
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
      <div className="modale-compte__corps">
        <button type="button" className="modale-compte__fermer" aria-label="Fermer" onClick={() => dialog.current?.close()}>×</button>
        <p className="modale-compte__titre">Votre espace France Immeuble</p>
        <p className="modale-compte__sous">Favoris, offres en ligne, recherches enregistrées et immeubles hors annonce.</p>
        {demande.n > 0 && <Acces key={demande.n} retour={retour} dansModale ongletInitial={demande.onglet} />}
      </div>
    </dialog>
  );
}
