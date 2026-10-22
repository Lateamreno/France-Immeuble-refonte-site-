// Serveur uniquement.
import { NextResponse } from "next/server";
import { ErreurAuth, sessionCourante, type Connecte, type Utilisateur } from "./auth";

/** Les coordonnées du compte, pour l'alerte de l'agence (le dépôt au BO ne porte que la clé). */
export const contexteDe = (u: Utilisateur) => ({
  email: u.email,
  prenom: u.user_metadata?.prenom,
  nom: u.user_metadata?.nom,
  telephone: u.user_metadata?.telephone,
});

/**
 * Une écriture du compte ne vient que de nos propres pages. Les cookies sont
 * en `SameSite=Lax`, ce qui bloque déjà l'envoi depuis un autre site ; on
 * vérifie en plus l'origine, pour ne dépendre d'aucun réglage de navigateur.
 */
export function memeOrigine(req: Request): boolean {
  const origine = req.headers.get("origin");
  const hote = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origine) {
    try {
      return new URL(origine).host === hote;
    } catch {
      return false;
    }
  }
  // Sans en-tête Origin : on n'accepte que ce que le navigateur dit venir du site.
  return req.headers.get("sec-fetch-site") === "same-origin";
}

/** L'adresse publique du site pour cette requête (sert aux liens des e-mails). */
export function origineSite(req: Request): string {
  const hote = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "www.france-immeuble.fr";
  const proto = req.headers.get("x-forwarded-proto") ?? (hote.startsWith("localhost") || hote.startsWith("127.") ? "http" : "https");
  return `${proto}://${hote}`;
}

export const refus = (message: string, statut = 400) =>
  NextResponse.json({ ok: false, erreur: message }, { status: statut });

export function erreurEnReponse(e: unknown) {
  if (e instanceof ErreurAuth) return refus(e.message, e.statut >= 500 ? 503 : e.statut === 429 ? 429 : 400);
  console.error("[compte]", e);
  return refus("Une erreur est survenue. Réessayez.", 500);
}

/**
 * Exige une session vérifiée ET une adresse e-mail vérifiée. Sans adresse
 * vérifiée, rien ne part au BO au nom du compte (§9.1).
 */
export async function exigerCompte(req: Request): Promise<Connecte | NextResponse> {
  if (!memeOrigine(req)) return refus("Origine refusée.", 403);
  const s = await sessionCourante();
  if (!s) return refus("Votre session a expiré. Reconnectez-vous.", 401);
  if (!s.utilisateur.email_confirmed_at) return refus("Confirmez d’abord votre adresse e-mail.", 403);
  return s;
}

export async function lireJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const t = await req.text();
    if (t.length > 20_000) return null;
    const v = JSON.parse(t);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const texte = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
