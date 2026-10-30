"use client";

import { useEffect, useState } from "react";

/**
 * L'état du visiteur sur les pages publiques des immeubles à vendre : connecté
 * ou non, ses favoris, ses offres. Lu une seule fois par page, partagé par
 * tous les boutons ; les pages elles-mêmes restent en cache pour tout le monde.
 */
export type EtatCompte = {
  connecte: boolean;
  favoris?: string[];
  offres?: { annonce: string; montant: number; envoye_le: string }[];
  profil?: boolean;
};

let promesse: Promise<EtatCompte> | null = null;
let courant: EtatCompte | null = null;
const abonnes = new Set<(e: EtatCompte) => void>();

function charger(): Promise<EtatCompte> {
  promesse ??= fetch("/api/compte/etat-biens/", { credentials: "same-origin", cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { connecte: false }))
    .catch(() => ({ connecte: false }))
    .then((e: EtatCompte) => (courant = e));
  return promesse;
}

export function useEtatCompte(): EtatCompte | null {
  const [e, setE] = useState<EtatCompte | null>(courant);
  useEffect(() => {
    abonnes.add(setE);
    charger().then(setE);
    return () => { abonnes.delete(setE); };
  }, []);
  return e;
}

/** Après un clic sur un cœur : tous les boutons de la page se mettent à jour. */
export function majFavori(bien: string, actif: boolean) {
  if (!courant) return;
  const favoris = new Set(courant.favoris ?? []);
  if (actif) favoris.add(bien); else favoris.delete(bien);
  courant = { ...courant, favoris: [...favoris] };
  for (const f of abonnes) f(courant);
}

/** La connexion, puis retour sur la page où l'on était. */
export const lienConnexion = (ancre = "") =>
  `/mon-compte/?retour=${encodeURIComponent(`${window.location.pathname}${window.location.search}${ancre}`)}`;
