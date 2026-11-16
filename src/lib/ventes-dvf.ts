import { configSitePublique } from "./supabase-site";
import type { LotVendu } from "./dvf-immeubles";
import type { PhotoRue } from "./panoramax";

/**
 * Les ventes d'immeubles de rapport de DVF, une par une (lot 125, MAV, 15/11/2026 : « je veux qu'on
 * trouve une solution » pour l'historique des ventes par arrondissement).
 *
 * Règle de DVF : ses ventes ligne par ligne ne doivent pas être indexées par les moteurs de recherche
 * externes. La page `/ventes-immeubles-paris/` est indexée pour ses agrégats et son texte ; le détail
 * vente par vente n'arrive dans la page qu'après coup, depuis `/api/ventes-dvf/`, que robots.txt ferme
 * à tous les robots et qui répond `X-Robots-Tag: noindex`. Ce fichier ne doit donc jamais servir à
 * écrire une vente dans le HTML d'une page : seulement des comptes et des médianes.
 */
export type VenteDvf = {
  id: string;
  codeInsee: string;
  annee: number;
  date: string;
  /** La rue sans son numéro, nom officiel de la Base Adresse Nationale. */
  rue: string | null;
  prix: number;
  surface: number;
  prixM2: number;
  logements: number;
  mixte: boolean;
  lots: LotVendu[];
  photo: PhotoRue | null;
  /** Position de la parcelle (DVF géolocalisées), pour la carte. */
  lat: number | null;
  lon: number | null;
};

const num = (v: unknown) => (v == null || v === "" ? 0 : Number(v));

/** Toutes les ventes en base pour les codes demandés, les plus récentes d'abord. Vide si la base ne répond pas. */
export async function ventesDvf(codes: readonly string[]): Promise<VenteDvf[]> {
  const cfg = configSitePublique();
  if (!cfg || !codes.length) return [];
  try {
    const r = await fetch(
      `${cfg.url}/rest/v1/ventes_immeubles_dvf?select=id,code_insee,annee,date_vente,rue,prix,surface,prix_m2,logements,mixte,lots,photo,lat,lon&code_insee=in.(${codes.join(",")})&order=date_vente.desc`,
      { headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` }, next: { revalidate: 86400, tags: ["marche"] }, signal: AbortSignal.timeout(6000) },
    );
    if (!r.ok) return [];
    return ((await r.json()) as Record<string, unknown>[]).map((l) => ({
      id: String(l.id),
      codeInsee: String(l.code_insee),
      annee: num(l.annee),
      date: String(l.date_vente),
      rue: typeof l.rue === "string" ? l.rue : null,
      prix: num(l.prix),
      surface: num(l.surface),
      prixM2: num(l.prix_m2),
      logements: num(l.logements),
      mixte: l.mixte === true,
      lots: Array.isArray(l.lots) ? (l.lots as LotVendu[]) : [],
      photo: l.photo && typeof l.photo === "object" ? (l.photo as PhotoRue) : null,
      lat: l.lat == null ? null : Number(l.lat),
      lon: l.lon == null ? null : Number(l.lon),
    }));
  } catch {
    return [];
  }
}
