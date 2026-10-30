// Serveur uniquement.
import { createHash } from "node:crypto";
import { lirePhotoAgent, poserPhotoAgent } from "./stockage";

/**
 * La photo de l'agent attitré (MAV, 30/10/2026 : « on la charge dans le site
 * une fois, on la change jamais »). Le BO donne une adresse https (§12.4) ;
 * le site la télécharge une seule fois, la range dans son seau privé
 * `photos-agents`, puis la sert lui-même. Aucune image hors du domaine (§16).
 *
 * Le serveur va chercher une adresse qu'il n'a pas écrite : il ne suit aucune
 * redirection, refuse les adresses locales ou en IP, ne garde qu'une image
 * JPEG, PNG ou WebP de 2 Mo au plus, et vérifie ses premiers octets.
 */

const MAX = 2 * 1024 * 1024;
const TYPES: Record<string, (o: Uint8Array) => boolean> = {
  "image/jpeg": (o) => o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff,
  "image/png": (o) => o[0] === 0x89 && o[1] === 0x50 && o[2] === 0x4e && o[3] === 0x47,
  "image/webp": (o) => String.fromCharCode(...o.slice(0, 4)) === "RIFF" && String.fromCharCode(...o.slice(8, 12)) === "WEBP",
};

/** La recette locale sert la photo depuis la base simulée, en http. */
const recetteLocale = () => /^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(process.env.SITE_SUPABASE_URL ?? "");

function adresseAcceptable(brute: string): URL | null {
  let u: URL;
  try {
    u = new URL(brute);
  } catch {
    return null;
  }
  const locale = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (locale) return recetteLocale() && u.protocol === "http:" ? u : null;
  if (u.protocol !== "https:" || u.port || u.username || u.password) return null;
  // Pas d'adresse IP, pas de nom interne : un vrai nom de domaine public.
  if (/^[\d.]+$/.test(u.hostname) || u.hostname.includes(":") || !u.hostname.includes(".")) return null;
  if (/\.(local|internal|lan)$/i.test(u.hostname)) return null;
  return u;
}

export async function photoAgent(adresse: string): Promise<{ octets: Uint8Array; type: string } | null> {
  const objet = `${createHash("sha256").update(adresse).digest("hex").slice(0, 40)}`;
  const deja = await lirePhotoAgent(objet).catch(() => null);
  if (deja) return deja;

  const u = adresseAcceptable(adresse);
  if (!u) return null;
  try {
    const r = await fetch(u, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(6000) });
    const type = (r.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!r.ok || !TYPES[type] || Number(r.headers.get("content-length") ?? 0) > MAX) return null;
    const octets = new Uint8Array(await r.arrayBuffer());
    if (octets.byteLength === 0 || octets.byteLength > MAX || !TYPES[type](octets)) return null;
    await poserPhotoAgent(objet, octets, type);
    return { octets, type };
  } catch (e) {
    console.warn("[agent] photo non copiée —", e instanceof Error ? e.message : e);
    return null;
  }
}
