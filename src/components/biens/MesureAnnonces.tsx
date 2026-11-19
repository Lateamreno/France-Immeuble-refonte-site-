"use client";

import { useEffect, useRef } from "react";
import { noterAnnonce } from "./mesure";

/**
 * Une impression par annonce et par chargement de liste (contrat du BO §19, lot 141), dans l'ordre
 * affiché : le rang sert au BO à calculer la position moyenne. Les pages sont en cache : c'est le
 * navigateur qui compte, une fois la liste montée.
 */
export function MesureImpressions({ biens }: { biens: string[] }) {
  const fait = useRef("");
  const cle = biens.join("|");
  useEffect(() => {
    if (!cle || fait.current === cle) return;
    fait.current = cle;
    noterAnnonce("impression", cle.split("|"));
  }, [cle]);
  return null;
}

/**
 * La fiche d'une annonce : une vue à l'ouverture (le serveur dédoublonne par visiteur et par heure),
 * puis les clics qui comptent pour le propriétaire, repérés sur toute la page : un lien `tel:` (le
 * numéro, y compris celui de la barre de menu), et tout élément marqué `data-stat` (« telephone »
 * pour « Voir le n° », « dossier » pour « Contacter », « partage » pour le menu de partage).
 */
export function MesureFiche({ bien }: { bien: string }) {
  const fait = useRef("");
  useEffect(() => {
    if (fait.current !== bien) {
      fait.current = bien;
      noterAnnonce("vue", [bien]);
    }
    const clic = (ev: MouseEvent) => {
      const cible = ev.target instanceof Element ? ev.target : null;
      const marque = cible?.closest<HTMLElement>("[data-stat]");
      const s = marque?.dataset.stat;
      if (s === "telephone" || s === "dossier" || s === "partage") return noterAnnonce(s, [bien]);
      if (cible?.closest('a[href^="tel:"]')) noterAnnonce("telephone", [bien]);
    };
    document.addEventListener("click", clic, true);
    return () => document.removeEventListener("click", clic, true);
  }, [bien]);
  return null;
}
