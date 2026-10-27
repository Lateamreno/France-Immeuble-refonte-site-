// Serveur uniquement : lit les cookies de session et la clé secrète du site.
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { configSite, configSitePublique, type ConfigSite } from "../supabase-site";

/**
 * Le compte client — contrat BO §9.1.
 *
 * Supabase Auth DU SITE gère l'e-mail, le mot de passe, la vérification de
 * l'adresse et le mot de passe oublié. Le BO ne voit jamais un mot de passe.
 *
 * Aucune bibliothèque cliente : le navigateur ne parle qu'à nos routes, qui
 * appellent l'API d'authentification côté serveur. La session vit dans deux
 * cookies httpOnly (inaccessibles au JavaScript de la page, donc à une faille
 * XSS), jamais dans localStorage (§16).
 */

export const COOKIE_AT = "fi_at";
export const COOKIE_RT = "fi_rt";
export const COOKIE_PKCE = "fi_pkce";

/** Durée de vie du cookie de rafraîchissement : 30 jours. */
const DUREE_RT = 60 * 60 * 24 * 30;

export type Utilisateur = {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
  user_metadata?: { prenom?: string; nom?: string; telephone?: string };
  app_metadata?: { rattache_le?: string };
};

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: Utilisateur;
};

export class ErreurAuth extends Error {
  constructor(public code: string, message: string, public statut = 400) {
    super(message);
  }
}

/** Messages en français pour les codes de Supabase Auth. */
const MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou mot de passe incorrect.",
  invalid_grant: "E-mail ou mot de passe incorrect.",
  email_not_confirmed:
    "Confirmez d’abord votre adresse : nous vous avons envoyé un lien par e-mail.",
  user_already_exists: "Un compte existe déjà avec cet e-mail. Connectez-vous.",
  email_exists: "Un compte existe déjà avec cet e-mail. Connectez-vous.",
  weak_password: "Mot de passe trop faible : 8 caractères au moins, avec des lettres et des chiffres.",
  same_password: "Le nouveau mot de passe doit être différent de l’ancien.",
  over_email_send_rate_limit: "Trop d’e-mails envoyés à cette adresse. Réessayez dans une heure.",
  over_request_rate_limit: "Trop de tentatives. Réessayez dans quelques minutes.",
  flow_state_expired: "Ce lien a expiré. Demandez-en un nouveau.",
  flow_state_not_found: "Ce lien a déjà servi ou a expiré.",
  bad_code_verifier: "Ce lien a été ouvert sur un autre appareil.",
  refresh_token_not_found: "Votre session a expiré. Reconnectez-vous.",
  session_not_found: "Votre session a expiré. Reconnectez-vous.",
};

function cfgPublique(): ConfigSite {
  const cfg = configSitePublique();
  if (!cfg) throw new ErreurAuth("config", "Le compte n’est pas encore disponible.", 503);
  return cfg;
}

async function gotrue<T>(
  chemin: string,
  init: RequestInit & { cle?: ConfigSite; jeton?: string } = {},
): Promise<T> {
  const cfg = init.cle ?? cfgPublique();
  const r = await fetch(`${cfg.url}/auth/v1/${chemin}`, {
    ...init,
    headers: {
      apikey: cfg.cle,
      "Content-Type": "application/json",
      ...(init.jeton ? { Authorization: `Bearer ${init.jeton}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const texte = await r.text();
  const corps = texte ? (JSON.parse(texte) as Record<string, unknown>) : {};
  if (!r.ok) {
    const code = String(corps.error_code ?? corps.code ?? corps.error ?? r.status);
    console.warn(`[compte] Auth ${r.status} ${code}`);
    throw new ErreurAuth(code, MESSAGES[code] ?? "Une erreur est survenue. Réessayez.", r.status);
  }
  return corps as T;
}

/* --- PKCE ------------------------------------------------------------------
   Le lien reçu par e-mail revient sur le site avec un code à usage unique ;
   on l'échange contre une session avec le vérificateur gardé en cookie. Ouvert
   sur un autre appareil, l'échange échoue mais l'adresse est vérifiée quand
   même : il suffit de se connecter. */

const b64url = (b: Buffer) => b.toString("base64url");

export function nouveauPkce(): { verifier: string; challenge: string } {
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

/* --- Opérations ------------------------------------------------------------ */

export async function inscrire(p: {
  email: string;
  motDePasse: string;
  prenom: string;
  nom: string;
  telephone: string;
  retour: string;
  challenge: string;
}): Promise<void> {
  await gotrue(`signup?redirect_to=${encodeURIComponent(p.retour)}`, {
    method: "POST",
    body: JSON.stringify({
      email: p.email,
      password: p.motDePasse,
      data: { prenom: p.prenom, nom: p.nom, telephone: p.telephone },
      code_challenge: p.challenge,
      code_challenge_method: "s256",
    }),
  });
}

export function connecter(email: string, motDePasse: string): Promise<Session> {
  return gotrue<Session>("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password: motDePasse }),
  });
}

export function rafraichir(refreshToken: string): Promise<Session> {
  return gotrue<Session>("token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function echangerCode(code: string, verifier: string): Promise<Session> {
  return gotrue<Session>("token?grant_type=pkce", {
    method: "POST",
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  });
}

export async function motDePasseOublie(email: string, retour: string, challenge: string): Promise<void> {
  await gotrue(`recover?redirect_to=${encodeURIComponent(retour)}`, {
    method: "POST",
    body: JSON.stringify({ email, code_challenge: challenge, code_challenge_method: "s256" }),
  });
}

export async function changerMotDePasse(jeton: string, motDePasse: string): Promise<void> {
  await gotrue("user", { method: "PUT", jeton, body: JSON.stringify({ password: motDePasse }) });
}

/** L'utilisateur du jeton, vérifié par Supabase (signature et expiration). */
export function lireUtilisateur(jeton: string): Promise<Utilisateur> {
  return gotrue<Utilisateur>("user", { jeton });
}

export async function deconnecterServeur(jeton: string): Promise<void> {
  try {
    await gotrue("logout?scope=local", { method: "POST", jeton });
  } catch {
    /* la session est effacée de notre côté quoi qu'il arrive */
  }
}

/** Opérations d'administration : clé secrète du site, serveur uniquement. */
function cfgSecrete(): ConfigSite {
  const cfg = configSite();
  if (!cfg) throw new ErreurAuth("config", "Le compte n’est pas encore disponible.", 503);
  return cfg;
}

export async function marquerRattache(id: string): Promise<void> {
  const cfg = cfgSecrete();
  await gotrue(`admin/users/${id}`, {
    method: "PUT",
    cle: cfg,
    jeton: cfg.cle,
    body: JSON.stringify({ app_metadata: { rattache_le: new Date().toISOString() } }),
  });
}

/**
 * Un lien d'accès au compte, fabriqué par le serveur (MAV, 27/10/2026 : le
 * compte est créé tout seul après une estimation). Sans compte pour cette
 * adresse, Supabase en crée un, sans mot de passe (« invite ») ; s'il existe,
 * c'est un lien de connexion (« magiclink »). Supabase n'envoie rien : c'est
 * notre e-mail qui porte le lien.
 *
 * On ne garde que l'empreinte du jeton (`hashed_token`) : le lien pointe sur
 * NOTRE domaine et c'est notre serveur qui la vérifie (`verifierJeton`).
 */
export async function lienDAcces(
  email: string,
  meta: { prenom?: string; nom?: string; telephone?: string },
): Promise<{ type: "invite" | "magiclink"; empreinte: string }> {
  const cfg = cfgSecrete();
  type Reponse = { id?: string; hashed_token?: string; properties?: { hashed_token?: string } };
  const lire = (r: Reponse) => r.hashed_token ?? r.properties?.hashed_token ?? "";
  try {
    const r = await gotrue<Reponse>("admin/generate_link", {
      method: "POST",
      cle: cfg,
      jeton: cfg.cle,
      body: JSON.stringify({ type: "invite", email, data: meta }),
    });
    // Le compte porte son origine dans les métadonnées d'administration, que
    // le client ne peut pas modifier : un compte vendeur jamais ouvert est
    // supprimé au bout de 30 jours (`purge.ts`), un compte acquéreur jamais.
    if (r.id) {
      try {
        await gotrue(`admin/users/${r.id}`, {
          method: "PUT",
          cle: cfg,
          jeton: cfg.cle,
          body: JSON.stringify({ app_metadata: { origine: "estimation" } }),
        });
      } catch (e) {
        console.error("[compte] origine non notée —", e instanceof Error ? e.message : e);
      }
    }
    return { type: "invite", empreinte: lire(r) };
  } catch (e) {
    if (!(e instanceof ErreurAuth) || !["email_exists", "user_already_exists", "422"].includes(e.code)) throw e;
    const r = await gotrue<Reponse>("admin/generate_link", {
      method: "POST",
      cle: cfg,
      jeton: cfg.cle,
      body: JSON.stringify({ type: "magiclink", email }),
    });
    return { type: "magiclink", empreinte: lire(r) };
  }
}

/** Échange l'empreinte d'un lien d'accès contre une session (une seule fois). */
export function verifierJeton(type: "invite" | "magiclink", empreinte: string): Promise<Session> {
  return gotrue<Session>("verify", {
    method: "POST",
    body: JSON.stringify({ type, token_hash: empreinte }),
  });
}

export type UtilisateurAdmin = Utilisateur & {
  created_at?: string;
  last_sign_in_at?: string | null;
  app_metadata?: { rattache_le?: string; origine?: string };
};

/** Une page de la liste des comptes (administration, clé secrète du site). */
export async function listerUtilisateurs(page: number, parPage = 200): Promise<UtilisateurAdmin[]> {
  const cfg = cfgSecrete();
  const r = await gotrue<{ users?: UtilisateurAdmin[] }>(`admin/users?page=${page}&per_page=${parPage}`, {
    cle: cfg,
    jeton: cfg.cle,
  });
  return r.users ?? [];
}

export async function supprimerUtilisateur(id: string): Promise<void> {
  const cfg = cfgSecrete();
  await gotrue(`admin/users/${id}`, { method: "DELETE", cle: cfg, jeton: cfg.cle });
}

/* --- Cookies --------------------------------------------------------------- */

const options = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function poserSession(s: Session): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_AT, s.access_token, options(s.expires_in || 3600));
  c.set(COOKIE_RT, s.refresh_token, options(DUREE_RT));
}

export async function effacerSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_AT);
  c.delete(COOKIE_RT);
}

export async function poserPkce(verifier: string): Promise<void> {
  (await cookies()).set(COOKIE_PKCE, verifier, options(60 * 60 * 24));
}

/** Expiration d'un jeton, lue sans le vérifier : sert seulement à décider d'un rafraîchissement. */
export function expirationJeton(jeton: string): number {
  try {
    const charge = JSON.parse(Buffer.from(jeton.split(".")[1], "base64url").toString());
    return Number(charge.exp) || 0;
  } catch {
    return 0;
  }
}

export type Connecte = { jeton: string; utilisateur: Utilisateur };

/**
 * La session de la requête en cours, vérifiée auprès de Supabase. Le
 * rafraîchissement du jeton est fait en amont, par `proxy.ts` ; une page n'a
 * donc qu'à lire. `null` si personne n'est connecté.
 */
export async function sessionCourante(): Promise<Connecte | null> {
  const c = await cookies();
  const jeton = c.get(COOKIE_AT)?.value;
  if (!jeton) return null;
  try {
    const utilisateur = await lireUtilisateur(jeton);
    return { jeton, utilisateur };
  } catch {
    return null;
  }
}

/** UUID stable dérivé d'un texte : la `ref` d'un dépôt qu'on peut rejouer sans doublon. */
export function uuidDe(texte: string): string {
  const h = createHash("sha1").update(texte).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
