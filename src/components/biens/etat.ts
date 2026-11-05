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
  /** Pour préremplir l'offre et les formulaires ; jamais mis en cache (réponse privée). */
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  /** L'agent a appelé le client : l'accès complet est ouvert (retour #270). */
  appele?: boolean;
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

/**
 * Relit l'état après une connexion faite sans recharger la page (retour #267) :
 * tous les composants abonnés se mettent à jour.
 */
export function rechargerEtatCompte() {
  promesse = null;
  void charger().then((e) => { for (const f of abonnes) f(e); });
}

/**
 * Juste après une connexion dans la fenêtre de compte. Un formulaire en cours
 * de saisie appelle `preventDefault()` : la page ne se recharge pas, sa saisie
 * reste, et il relit l'état du compte (retour #267, MAV, 05/11/2026).
 */
export const EVENEMENT_CONNEXION = "fi:connecte";

export function useGarderALaConnexion(garder: boolean) {
  useEffect(() => {
    if (!garder) return;
    const f = (e: Event) => e.preventDefault();
    window.addEventListener(EVENEMENT_CONNEXION, f);
    return () => window.removeEventListener(EVENEMENT_CONNEXION, f);
  }, [garder]);
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

/**
 * Ouvre la fenêtre de connexion ou de création de compte sans quitter la page
 * (retour #108, MAV, 02/11/2026 : « qu'il ne parte jamais de la page dans
 * laquelle il était »). `ancre` est rejouée après la connexion (« #offre »).
 */
export function ouvrirCompte(options: { ancre?: string; onglet?: "connexion" | "creation" } = {}) {
  window.dispatchEvent(new CustomEvent("fi:compte", { detail: options }));
}
