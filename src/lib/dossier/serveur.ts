// Serveur uniquement : clé secrète du site, cookies.
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { configSite } from "../supabase-site";
import { dossierInitial, nettoyer, type Comptes, type Dossier } from "./modele";

/**
 * Le brouillon du dossier vendeur (table `dossiers_vendeurs`, migration 0010).
 *
 * Le navigateur garde un jeton aléatoire dans un cookie httpOnly ; la table
 * n'en garde que l'empreinte. Sans le cookie, on ne retrouve un dossier que
 * par le compte connecté. Rien n'est lisible depuis le navigateur.
 */

export const COOKIE_DOSSIER = "fi_dossier";
const DUREE = 60 * 60 * 24 * 30;

export type Identite = {
  formulaire?: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
  numero?: string;
  rue?: string;
  codePostal?: string;
  ville?: string;
};

export type LigneDossier = {
  empreinte: string;
  ref: string;
  compte: string | null;
  email: string;
  identite: Identite;
  donnees: Dossier;
  codes: number;
  code_envoye_le: string | null;
  code_type: string | null;
  essais: number;
  valide_le: string | null;
  cree_le: string;
  maj_le: string;
};

const empreinteDe = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

function cfg() {
  const c = configSite();
  if (!c) throw new Error("base du site non configurée (SITE_SUPABASE_SECRET_KEY)");
  return c;
}

async function sb(chemin: string, init: RequestInit = {}): Promise<Response> {
  const c = cfg();
  const r = await fetch(`${c.url}/rest/v1/${chemin}`, {
    ...init,
    headers: {
      apikey: c.cle,
      Authorization: `Bearer ${c.cle}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!r.ok) throw new Error(`dossier ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r;
}

function lire(l: Record<string, unknown>): LigneDossier {
  return { ...(l as LigneDossier), donnees: nettoyer(l.donnees), identite: (l.identite ?? {}) as Identite };
}

/**
 * Crée un dossier et pose son cookie. Renvoie la ligne créée. Depuis une page
 * (qui ne peut pas poser de cookie), `cookie: false` : le dossier se retrouve
 * alors par le compte connecté.
 */
export async function creerDossier(p: {
  ref: string;
  email: string;
  compte?: string | null;
  identite: Identite;
  comptes: Partial<Comptes>;
  cookie?: boolean;
}): Promise<LigneDossier> {
  const jeton = randomBytes(32).toString("base64url");
  const ligne = {
    empreinte: empreinteDe(jeton),
    ref: p.ref,
    compte: p.compte ?? null,
    email: p.email.trim().toLowerCase(),
    identite: p.identite,
    donnees: dossierInitial(p.comptes),
  };
  const r = await sb("dossiers_vendeurs", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(ligne),
  });
  const [cree] = (await r.json()) as Record<string, unknown>[];
  if (p.cookie !== false) (await cookies()).set(COOKIE_DOSSIER, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE,
  });
  return lire(cree);
}

/** Le dossier de ce navigateur (cookie), sinon celui du compte connecté. */
export async function dossierCourant(compte?: string | null): Promise<LigneDossier | null> {
  const jeton = (await cookies()).get(COOKIE_DOSSIER)?.value;
  if (jeton && /^[A-Za-z0-9_-]{20,80}$/.test(jeton)) {
    const r = await sb(`dossiers_vendeurs?empreinte=eq.${empreinteDe(jeton)}&select=*`);
    const [l] = (await r.json()) as Record<string, unknown>[];
    // Le dossier d'un autre compte ne s'ouvre pas, même avec son cookie.
    if (l && (!l.compte || !compte || l.compte === compte)) return lire(l);
  }
  if (compte) {
    const r = await sb(`dossiers_vendeurs?compte=eq.${compte}&valide_le=is.null&select=*&order=maj_le.desc&limit=1`);
    const [l] = (await r.json()) as Record<string, unknown>[];
    if (l) return lire(l);
  }
  return null;
}

export async function oublierCookie(): Promise<void> {
  (await cookies()).delete(COOKIE_DOSSIER);
}

export async function modifier(empreinte: string, champs: Partial<Omit<LigneDossier, "empreinte">>): Promise<void> {
  await sb(`dossiers_vendeurs?empreinte=eq.${empreinte}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...champs, maj_le: new Date().toISOString() }),
  });
}

export async function supprimer(empreinte: string): Promise<void> {
  await sb(`dossiers_vendeurs?empreinte=eq.${empreinte}`, { method: "DELETE" });
}

/**
 * Codes envoyés à une adresse sur 24 h, tous dossiers confondus : le
 * formulaire est public, il ne doit pas servir à bombarder une adresse.
 */
export async function codesRecents(email: string): Promise<number> {
  const depuis = new Date(Date.now() - 24 * 3600_000).toISOString();
  const r = await sb(
    `dossiers_vendeurs?email=eq.${encodeURIComponent(email.trim().toLowerCase())}&code_envoye_le=gt.${encodeURIComponent(depuis)}&select=codes`,
  );
  return ((await r.json()) as { codes: number }[]).reduce((s, l) => s + (l.codes || 0), 0);
}

/**
 * Tâche quotidienne : un brouillon abandonné disparaît 30 jours après sa
 * dernière saisie ; un dossier validé, deux jours après (il ne contient plus
 * que l'adresse e-mail, gardée le temps de confirmer le compte).
 */
export async function purgerDossiers(): Promise<number> {
  const mois = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  const deuxJours = new Date(Date.now() - 2 * 24 * 3600_000).toISOString();
  let n = 0;
  for (const filtre of [`maj_le=lt.${encodeURIComponent(mois)}`, `valide_le=lt.${encodeURIComponent(deuxJours)}`]) {
    const r = await sb(`dossiers_vendeurs?${filtre}`, { method: "DELETE", headers: { Prefer: "return=representation" } });
    n += ((await r.json()) as unknown[]).length;
  }
  return n;
}
