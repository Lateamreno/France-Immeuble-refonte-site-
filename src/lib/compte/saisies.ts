// Serveur uniquement : clé secrète du site.
import { configSite } from "../supabase-site";

/**
 * La copie de ce que le client vient d'envoyer (migration 0012). Elle ne sert
 * qu'à le lui remontrer tant que le BO ne l'a pas redéposé : la source qui
 * fait foi reste le BO (contrat §12.2). Une copie ratée ne bloque jamais
 * l'envoi : le lead, lui, est déjà parti ou en file.
 */

export type TypeSaisie = "message" | "rendez_vous" | "offre_acquereur" | "profil_investisseur";

async function sb(chemin: string, init: RequestInit = {}) {
  const cfg = configSite();
  if (!cfg) throw new Error("base du site non configurée");
  const r = await fetch(`${cfg.url}/rest/v1/${chemin}`, {
    ...init,
    headers: {
      apikey: cfg.cle,
      Authorization: `Bearer ${cfg.cle}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r;
}

export async function noterSaisie(compte: string, ref: string, type: TypeSaisie, donnees: Record<string, unknown>): Promise<void> {
  try {
    // Un seul profil investisseur par compte : le nouvel envoi remplace le précédent (§13).
    if (type === "profil_investisseur") {
      await sb(`compte_saisies?compte=eq.${compte}&type=eq.profil_investisseur`, { method: "DELETE" });
    }
    await sb("compte_saisies", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ compte, ref, type, donnees }),
    });
  } catch (e) {
    console.error("[compte] copie de la saisie non gardée —", e instanceof Error ? e.message : e);
  }
}

/**
 * Ménage quotidien : un message revenu dans le fil du BO, une demande de
 * rendez-vous passée, une offre de plus de 90 jours n'ont plus à être montrés
 * depuis la copie. Le profil investisseur reste : c'est celui du client.
 */
export async function purgerSaisies(): Promise<void> {
  if (!configSite()) return;
  const jours = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  try {
    await sb(`compte_saisies?type=eq.message&envoye_le=lt.${jours(30)}`, { method: "DELETE" });
    await sb(`compte_saisies?type=eq.rendez_vous&envoye_le=lt.${jours(60)}`, { method: "DELETE" });
    await sb(`compte_saisies?type=eq.offre_acquereur&envoye_le=lt.${jours(90)}`, { method: "DELETE" });
  } catch (e) {
    console.error("[compte] ménage des saisies —", e instanceof Error ? e.message : e);
  }
}

/** Accès brut pour `avis.ts` (même clé, même base). */
export { sb as requeteSite };
