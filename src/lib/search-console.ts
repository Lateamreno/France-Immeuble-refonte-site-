import { createSign } from "node:crypto";

/**
 * Lecture de la Search Console avec le compte de service de France Immeuble (MAV, 20/11/2026).
 *
 * La clé du compte (fichier JSON de Google) est dans la variable `GSC_CLE` de Vercel, côté serveur
 * seulement. Le compte n'a que l'autorisation « Restreint » de la Search Console : il lit, il ne
 * change rien. Le jeton demandé à Google ne porte que la portée de lecture.
 */

const PORTEE = "https://www.googleapis.com/auth/webmasters.readonly";
const API = "https://www.googleapis.com/webmasters/v3";
const DELAI_MS = 20_000;

type Cle = { client_email: string; private_key: string; token_uri?: string };

function lireCle(): Cle | null {
  const brut = process.env.GSC_CLE;
  if (!brut) return null;
  try {
    const c = JSON.parse(brut) as Cle;
    return c.client_email && c.private_key ? c : null;
  } catch {
    return null;
  }
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

/** Un jeton d'accès de Google, valable une heure, pour la seule lecture de la Search Console. */
export async function jetonSearchConsole(): Promise<string | null> {
  const cle = lireCle();
  if (!cle) return null;
  const uri = cle.token_uri || "https://oauth2.googleapis.com/token";
  const maintenant = Math.floor(Date.now() / 1000);
  const tete = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corps = b64url(JSON.stringify({ iss: cle.client_email, scope: PORTEE, aud: uri, iat: maintenant, exp: maintenant + 3600 }));
  const signe = createSign("RSA-SHA256").update(`${tete}.${corps}`).sign(cle.private_key);
  const r = await fetch(uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${tete}.${corps}.${b64url(signe)}` }),
    signal: AbortSignal.timeout(DELAI_MS),
  });
  if (!r.ok) return null;
  return ((await r.json()) as { access_token?: string }).access_token ?? null;
}

/**
 * La propriété Search Console du site parmi celles que le compte peut lire : la propriété de domaine
 * (`sc-domain:france-immeuble.fr`) si elle est partagée, sinon celle de l'adresse www.
 */
export async function proprieteSite(jeton: string): Promise<{ propriete: string | null; statut: number; vues: number }> {
  const r = await fetch(`${API}/sites`, { headers: { Authorization: `Bearer ${jeton}` }, signal: AbortSignal.timeout(DELAI_MS) });
  // 403 : l'API Search Console n'est pas activée dans le projet Google Cloud du compte de service.
  if (!r.ok) return { propriete: null, statut: r.status, vues: 0 };
  const sites = (((await r.json()) as { siteEntry?: { siteUrl: string; permissionLevel: string }[] }).siteEntry ?? [])
    .filter((s) => s.permissionLevel !== "siteUnverifiedUser")
    .map((s) => s.siteUrl);
  const propriete =
    sites.find((s) => s === "sc-domain:france-immeuble.fr") ??
    sites.find((s) => s === "https://www.france-immeuble.fr/") ??
    sites.find((s) => s.includes("france-immeuble.fr")) ??
    null;
  return { propriete, statut: r.status, vues: sites.length };
}

/** L'adresse du compte de service, à ajouter comme utilisateur « Restreint » dans la Search Console. */
export function adresseCompteService(): string | null {
  return lireCle()?.client_email ?? null;
}

export type LigneGsc = { keys: string[]; clicks: number; impressions: number; position: number };

/** Toutes les lignes d'un jour pour les dimensions données (pages de 25 000 lignes au plus). */
export async function lignesDuJour(jeton: string, propriete: string, jour: string, dimensions: string[]): Promise<LigneGsc[] | null> {
  const toutes: LigneGsc[] = [];
  for (let debut = 0; ; debut += 25_000) {
    const r = await fetch(`${API}/sites/${encodeURIComponent(propriete)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jeton}`, "content-type": "application/json" },
      body: JSON.stringify({ startDate: jour, endDate: jour, dimensions, rowLimit: 25_000, startRow: debut, dataState: "final", type: "web" }),
      signal: AbortSignal.timeout(DELAI_MS),
    });
    if (!r.ok) return null;
    const rows = ((await r.json()) as { rows?: LigneGsc[] }).rows ?? [];
    toutes.push(...rows);
    if (rows.length < 25_000) return toutes;
  }
}
