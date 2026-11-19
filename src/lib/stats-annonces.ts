import { createHmac } from "node:crypto";
import { configSite } from "@/lib/supabase-site";

/**
 * Les statistiques d'une annonce (contrat du BO §19, lot 141) : côté serveur seulement.
 *
 * Ce qui est compté arrive par /api/stats/annonce/, envoyé par le navigateur (un robot qui n'exécute
 * pas de script n'envoie rien). Le serveur écarte encore les robots déclarés, les aperçus de liens des
 * messageries et les navigateurs de l'équipe (cookie `fi_equipe`), puis incrémente les compteurs du
 * jour dans `annonce_stats_jour` (migration 0028) par la fonction `noter_stat_annonce`.
 *
 * Aucune donnée personnelle n'est gardée : l'empreinte qui sert à dédoublonner les vues est un HMAC de
 * la date, de l'adresse IP et du navigateur, avec un secret du serveur. Elle change chaque jour, ne
 * permet pas de retrouver l'adresse IP et s'efface le lendemain (`purger_stats_annonces`).
 */

export const EVENEMENTS = ["impression", "vue", "telephone", "dossier", "partage"] as const;
export type EvenementAnnonce = (typeof EVENEMENTS)[number];

/** Le cookie qui exclut un navigateur de l'équipe des statistiques. */
export const COOKIE_EQUIPE = "fi_equipe";

/**
 * Robots, outils et aperçus de liens (WhatsApp, Messenger, iMessage, Slack, LinkedIn…). Un navigateur
 * piloté (`navigator.webdriver`) est déjà écarté par le script de la page.
 */
const ROBOTS =
  /bot\b|bot\/|crawl|spider|slurp|mediapartners|facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp|telegram|skypeuripreview|discord|slack|linkedin|pinterest|redditbot|embedly|quora link|vkshare|outbrain|bitlybot|tumblr|xing-contenttabreceiver|google-inspectiontool|googleother|apis-google|feedfetcher|lighthouse|pagespeed|gtmetrix|chrome-lighthouse|headlesschrome|phantomjs|puppeteer|playwright|python-requests|python-urllib|curl\/|wget|go-http-client|okhttp|axios|node-fetch|undici|httpclient|java\/|libwww|preview|scrapy|ahrefs|semrush|mj12|dotbot|petalbot|yandex|baiduspider|bytespider|gptbot|claudebot|perplexity|ccbot|amazonbot|applebot|duckduckbot|bingpreview|cfnetwork.*darwin(?!.*mobile)/i;

export function estRobot(agent: string | null): boolean {
  if (!agent || agent.length < 20) return true;
  return ROBOTS.test(agent);
}

/** Le jour et l'heure à Paris, qui font les lignes du rapport. */
export function jourEtHeureParis(d = new Date()): { jour: string; heure: number } {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(d);
  const v = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { jour: `${v("year")}-${v("month")}-${v("day")}`, heure: Number(v("hour")) };
}

/**
 * L'empreinte d'un visiteur pour la journée. Le secret : `STATS_SECRET` s'il est posé dans Vercel,
 * sinon la clé secrète de la base du site (serveur seulement, jamais transmise au navigateur).
 */
export function empreinteDuJour(jour: string, ip: string, agent: string): string | null {
  const secret = process.env.STATS_SECRET || process.env.SITE_SUPABASE_SECRET_KEY;
  if (!secret) return null;
  return createHmac("sha256", secret).update(`stats-annonce|${jour}|${ip}|${agent}`).digest("base64url").slice(0, 22);
}

/** Incrémente les compteurs. Ne lève jamais : une statistique perdue ne doit rien casser. */
export async function noterStat(evenement: EvenementAnnonce, biens: string[], empreinte: string | null, jour: string, heure: number): Promise<boolean> {
  const cfg = configSite();
  if (!cfg || !biens.length) return false;
  try {
    const r = await fetch(`${cfg.url}/rest/v1/rpc/noter_stat_annonce`, {
      method: "POST",
      headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}`, "content-type": "application/json" },
      body: JSON.stringify({ p_evenement: evenement, p_biens: biens, p_empreinte: empreinte, p_jour: jour, p_heure: heure }),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) console.error("[stats annonce] refus de la base", r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) {
    console.error("[stats annonce] base injoignable —", e);
    return false;
  }
}

/** Efface les empreintes des jours passés (tâche quotidienne). Renvoie le nombre de lignes effacées. */
export async function purgerStatsAnnonces(): Promise<number> {
  const cfg = configSite();
  if (!cfg) return 0;
  const r = await fetch(`${cfg.url}/rest/v1/rpc/purger_stats_annonces`, {
    method: "POST",
    headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}`, "content-type": "application/json" },
    body: "{}",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`purge des statistiques refusée (${r.status})`);
  return Number(await r.json()) || 0;
}
