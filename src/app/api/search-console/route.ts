import { NextResponse } from "next/server";
import { configSite } from "@/lib/supabase-site";
import { jetonSearchConsole, lignesDuJour, proprieteSite, type LigneGsc } from "@/lib/search-console";

/**
 * Relevé quotidien de la Search Console (MAV, 20/11/2026), tâche planifiée de Vercel (vercel.json),
 * protégée par CRON_SECRET comme /api/lead/relance/. Elle range dans `gsc_pages` et `gsc_requetes`
 * (base du site, migration 0029, aucune lecture publique) les clics, impressions et positions de
 * chaque jour, par page et par requête.
 *
 * Elle reprend au lendemain du dernier jour en base. La première fois, elle remonte aux 16 mois que
 * Google garde ; un passage a 300 secondes, la tâche reprend où elle s'est arrêtée au passage suivant.
 * Les chiffres d'un jour ne sont définitifs que deux ou trois jours après : on s'arrête trois jours
 * avant aujourd'hui.
 *
 * Sur un aperçu (preview), la protection de Vercel garde déjà tout le déploiement : la tâche y répond
 * sans CRON_SECRET, pour lancer le premier relevé avant la mise en production. Elle ne rend que des
 * compteurs de lignes, jamais les données.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LIMITE_MS = 260_000;
const JOURS_GARDES_PAR_GOOGLE = 486;
const RETARD_JOURS = 3;
const PAQUET = 1_000;

const jourIso = (d: Date) => d.toISOString().slice(0, 10);
const plusJours = (jour: string, n: number) => {
  const d = new Date(`${jour}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return jourIso(d);
};

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const surApercu = process.env.VERCEL_ENV === "preview";
  if (secret && !surApercu && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const cfg = configSite();
  if (!cfg) return NextResponse.json({ ok: false, erreur: "base du site non configurée" }, { status: 500 });
  const depart = Date.now();

  const jeton = await jetonSearchConsole();
  if (!jeton) return NextResponse.json({ ok: false, erreur: "clé GSC_CLE absente ou refusée par Google" }, { status: 502 });
  const propriete = await proprieteSite(jeton);
  if (!propriete) return NextResponse.json({ ok: false, erreur: "aucune propriété Search Console partagée avec le compte de service" }, { status: 502 });

  const entetes = { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}`, "content-type": "application/json" };
  const dernier = await fetch(`${cfg.url}/rest/v1/gsc_pages?select=jour&order=jour.desc&limit=1`, { headers: entetes, cache: "no-store" });
  if (!dernier.ok) return NextResponse.json({ ok: false, erreur: `lecture ${dernier.status}` }, { status: 502 });
  const [ligne] = (await dernier.json()) as { jour: string }[];
  const aujourdHui = jourIso(new Date());
  const fin = plusJours(aujourdHui, -RETARD_JOURS);
  let jour = ligne ? plusJours(ligne.jour, 1) : plusJours(aujourdHui, -JOURS_GARDES_PAR_GOOGLE);
  let rienEnBase = !ligne;

  const ecrire = async (table: string, conflit: string, lignes: Record<string, unknown>[]) => {
    for (let i = 0; i < lignes.length; i += PAQUET) {
      const r = await fetch(`${cfg.url}/rest/v1/${table}?on_conflict=${conflit}`, {
        method: "POST",
        headers: { ...entetes, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(lignes.slice(i, i + PAQUET)),
      });
      if (!r.ok) return false;
    }
    return true;
  };
  const chiffres = (l: LigneGsc) => ({ clics: l.clicks, impressions: l.impressions, position: Math.round(l.position * 100) / 100 });

  const jours: string[] = [];
  let lignesRequetes = 0;
  let arret = "à jour";
  while (jour <= fin) {
    if (Date.now() - depart > LIMITE_MS) { arret = "temps écoulé, reprise au prochain passage"; break; }
    const [pages, requetes] = await Promise.all([
      lignesDuJour(jeton, propriete, jour, ["page"]),
      lignesDuJour(jeton, propriete, jour, ["page", "query"]),
    ]);
    if (!pages || !requetes) { arret = `Search Console injoignable le ${jour}`; break; }
    if (!pages.length) {
      // Avant le premier jour que Google garde : on avance. Après : le jour n'est pas encore publié.
      if (rienEnBase) { jour = plusJours(jour, 1); continue; }
      arret = `pas encore de chiffres pour le ${jour}`;
      break;
    }
    const okPages = await ecrire("gsc_pages", "jour,page", pages.map((l) => ({ jour, page: l.keys[0], ...chiffres(l) })));
    const okRequetes = await ecrire("gsc_requetes", "jour,page,requete", requetes.map((l) => ({ jour, page: l.keys[0], requete: l.keys[1], ...chiffres(l) })));
    if (!okPages || !okRequetes) { arret = `écriture refusée le ${jour}`; break; }
    rienEnBase = false;
    jours.push(jour);
    lignesRequetes += requetes.length;
    jour = plusJours(jour, 1);
  }

  return NextResponse.json({
    ok: true,
    propriete,
    jours: jours.length,
    du: jours[0] ?? null,
    au: jours.at(-1) ?? null,
    lignesRequetes,
    arret,
  });
}
