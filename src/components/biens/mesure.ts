"use client";

/**
 * Envoie un événement d'annonce au serveur (contrat du BO §19, lot 141). Rien n'est gardé dans le
 * navigateur : ni cookie, ni stockage. Un navigateur piloté (`navigator.webdriver`) n'envoie rien.
 * `sendBeacon` part même quand la page se ferme (un clic sur le numéro ouvre l'application Téléphone).
 */
export type EvenementAnnonce = "impression" | "vue" | "telephone" | "dossier" | "partage";

export function noterAnnonce(e: EvenementAnnonce, biens: string[]) {
  if (typeof window === "undefined" || !biens.length || navigator.webdriver) return;
  const corps = JSON.stringify({ e, biens });
  try {
    if (navigator.sendBeacon?.("/api/stats/annonce/", new Blob([corps], { type: "application/json" }))) return;
  } catch { /* on passe à fetch */ }
  fetch("/api/stats/annonce/", { method: "POST", body: corps, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
}
