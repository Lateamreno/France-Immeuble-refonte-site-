/**
 * Accès à la base Supabase DU SITE — et à elle seule.
 *
 * ⚠️ CLAUDE.md §2 et §16 : aucune clé du BO dans l'environnement du site.
 *
 * Les variables portent un préfixe `SITE_` et ce n'est pas cosmétique. Le
 * 21/10/2026, la session de développement contenait `SUPABASE_URL` et
 * `SUPABASE_SERVICE_ROLE_KEY` pointant sur le projet du BO ; le code du site
 * lisait des variables de même nom, et un test local a écrit deux lignes dans
 * le CRM. Avec des noms distincts, une clé du BO présente dans l'environnement
 * ne peut plus être ramassée par erreur.
 *
 * Et si quelqu'un renseigne quand même l'URL du BO dans `SITE_SUPABASE_URL`,
 * `configSite()` refuse de la rendre : le site ne parlera pas au CRM, même mal
 * configuré.
 */

/** Référence du projet Supabase du BO. Le site ne doit jamais l'atteindre. */
const REF_BO = "sojtmhdrzmdbtqborxsi";

export type ConfigSite = { url: string; cle: string };

function lire(nomCle: "SITE_SUPABASE_SECRET_KEY" | "SITE_SUPABASE_PUBLISHABLE_KEY"): ConfigSite | null {
  const url = process.env.SITE_SUPABASE_URL;
  const cle = process.env[nomCle];
  if (!url || !cle) return null;
  if (url.includes(REF_BO)) {
    // Bruyant exprès : c'est une erreur de configuration grave, pas un aléa.
    console.error(
      "[supabase-site] SITE_SUPABASE_URL pointe sur le projet du BO. Refusé (§2, §16).",
    );
    return null;
  }
  return { url: url.replace(/\/+$/, ""), cle };
}

/**
 * Clé secrète : écritures et lectures non publiques. SERVEUR UNIQUEMENT —
 * jamais dans une variable `NEXT_PUBLIC_*`, jamais transmise au navigateur.
 */
export function configSite(): ConfigSite | null {
  return lire("SITE_SUPABASE_SECRET_KEY");
}

/**
 * Clé publiable : lecture des projections publiques (ventes, biens à vendre).
 * La RLS n'y autorise que la lecture. Utilisable côté serveur sans risque.
 */
export function configSitePublique(): ConfigSite | null {
  return lire("SITE_SUPABASE_PUBLISHABLE_KEY");
}
