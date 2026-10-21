import ventesJson from "../../content/ventes.json";
import { configSitePublique } from "./supabase-site";

/**
 * Nos biens — ventes réalisées, biens à vendre, off-market.
 *
 * ⚠️ FRONTIÈRE SITE ↔ BO (CLAUDE.md §2 et §16). Le site ne lit JAMAIS le CRM.
 * Le BO dépose une copie appauvrie, le site lit cette copie. Ici, la copie est
 * un fichier du repo : je l'ai déposée à la main, une fois, à partir de données
 * déjà publiques — l'iframe Bubble affichait ces mêmes ventes. Aucune clé du BO
 * n'existe dans l'environnement du site, et aucun chemin réseau n'y mène.
 *
 * Quand le projet Supabase du site existera, `content/ventes.json` sera remplacé
 * par la projection `web.ventes` et seule la fonction de lecture changera : la
 * forme des données ci-dessous est déjà celle du contrat.
 *
 * Ce qui traverse la frontière, et rien d'autre :
 *   commune, département, prix, date, photo.
 * Jamais la rue, jamais le numéro, jamais un nom. Les fichiers photo d'origine
 * portaient parfois l'adresse dans leur nom (« Immeuble 47 rue des bas
 * Fossés… ») : `scripts/import-ventes.mjs` les renomme sur un identifiant neutre.
 */

export type Vente = {
  id: string;
  ville: string;
  /** Département sur deux caractères — « 75 », « 06 ». */
  dept: string;
  /** Prix honoraires acquéreur inclus, en euros. */
  prix: number;
  /** Date de l'acte, ISO court. */
  date: string;
  annee: number;
  region: "idf" | "sud-ouest" | "autre";
  /** Chemin servi depuis notre domaine, ou null si la photo n'a pas pu être reprise. */
  image: string | null;
};

/** Les ventes du fichier déposé à la main — repli si la base ne répond pas. */
const VENTES_DEPOSEES: Vente[] = (ventesJson as Vente[])
  .slice()
  .sort((a, b) => b.date.localeCompare(a.date));

type LigneVente = {
  id: string; ville: string; dept: string; prix: number;
  date: string; region: Vente["region"]; image: string | null;
};

/** Une image de vente : fichier local (« /media/… »), URL complète, ou chemin du coffre `ventes`. */
function imageVente(i: string | null, base: string): string | null {
  if (!i) return null;
  if (i.startsWith("/") || /^https?:\/\//.test(i)) return i;
  return `${base}/storage/v1/object/public/ventes/${i}`;
}

/**
 * Les ventes réalisées. Lues dans la base du site, où le BO les dépose ; le
 * fichier du repo ne sert que de repli si la base est vide ou injoignable.
 * Une vente que le BO publie apparaît donc sans redéploiement, sous 10 minutes.
 */
export async function ventes(): Promise<Vente[]> {
  const cfg = configSitePublique();
  if (!cfg) return VENTES_DEPOSEES;
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/ventes?select=id,ville,dept,prix,date,region,image&order=date.desc`,
      {
        headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` },
        next: { revalidate: 600, tags: ["ventes"] },
      },
    );
    if (!res.ok) return VENTES_DEPOSEES;
    const lignes = (await res.json()) as LigneVente[];
    if (lignes.length === 0) return VENTES_DEPOSEES;
    return lignes.map((l) => ({
      id: l.id, ville: l.ville, dept: l.dept, prix: Number(l.prix),
      date: l.date, annee: Number(l.date.slice(0, 4)), region: l.region,
      image: imageVente(l.image, cfg.url),
    }));
  } catch {
    return VENTES_DEPOSEES;
  }
}

/**
 * Les chiffres de preuve se CALCULENT, ils ne se saisissent pas.
 *
 * Le site annonçait « 365 immeubles » : aucune table du CRM ne produit ce
 * nombre comme un nombre de ventes. MAV a tranché le 21/10 : on aligne le
 * discours sur ce que la base prouve. Dériver ces valeurs des données plutôt
 * que de les écrire en dur garantit que l'écart ne peut pas revenir.
 */
export function statsVentes(v: Vente[]) {
  return {
    total: v.length,
    villes: new Set(v.map((x) => x.ville)).size,
    departements: new Set(v.map((x) => x.dept)).size,
    premiereAnnee: Math.min(...v.map((x) => x.annee)),
    derniereAnnee: Math.max(...v.map((x) => x.annee)),
    volume: v.reduce((s, x) => s + x.prix, 0),
    partIdf: Math.round((v.filter((x) => x.region === "idf").length / v.length) * 100),
  };
}

export async function ventesEtStats() {
  const v = await ventes();
  return { ventes: v, stats: statsVentes(v) };
}

/** Les communes les plus représentées, pour le bloc de couverture. */
export function villesFrequentes(v: Vente[], n = 8): { ville: string; n: number }[] {
  const compte = new Map<string, number>();
  for (const x of v) compte.set(x.ville, (compte.get(x.ville) ?? 0) + 1);
  return [...compte.entries()]
    .map(([ville, n]) => ({ ville, n }))
    .sort((a, b) => b.n - a.n || a.ville.localeCompare(b.ville, "fr"))
    .slice(0, n);
}

/**
 * Biens actuellement à vendre.
 *
 * TOUT PART DU BO. Son pont envoie déjà à PleinBail les fiches immeuble au
 * statut « 6 - Commercialisé (all) » qu'il retient — 14 en ligne le 21/10 sur
 * 30 à ce statut. Le même envoi dépose ces biens dans `biens_a_vendre`, la
 * table de la base DU SITE ; le site la lit avec la clé publiable, et la RLS
 * n'y autorise que la lecture. Le site ne lit ni le BO, ni PleinBail.
 *
 * Jeu d'informations de PleinBail, et comme PleinBail : pas d'adresse, pas de
 * coordonnées. Commune et département situent, la rue identifie le vendeur.
 */
export type BienAVendre = {
  id: string;
  slug: string;
  statut: "en_vente" | "sous_offre";
  titre: string;
  description: string | null;
  ville: string;
  dept: string;
  type: string;
  surface: number | null;
  lots: number | null;
  anneeConstruction: number | null;
  loyerHcAn: number | null;
  prixHai: number;
  rendement: number | null;
  occupation: number | null;
  prixM2: number | null;
  dpe: string | null;
  travaux: string | null;
  images: string[];
  publieLe: string;
};

type LigneBien = {
  id: string; slug: string; statut: BienAVendre["statut"]; titre: string;
  description: string | null; ville: string; dept: string; type: string;
  surface: number | null; lots: number | null; annee_construction: number | null;
  loyer_hc_an: number | null; prix_hai: number; rendement: number | null;
  occupation: number | null; prix_m2: number | null; dpe: string | null;
  travaux: string | null; images: string[]; publie_le: string;
};

const COLONNES =
  "id,slug,statut,titre,description,ville,dept,type,surface,lots,annee_construction," +
  "loyer_hc_an,prix_hai,rendement,occupation,prix_m2,dpe,travaux,images,publie_le";

function versBien(l: LigneBien, base: string): BienAVendre {
  return {
    id: l.id, slug: l.slug, statut: l.statut, titre: l.titre, description: l.description,
    ville: l.ville, dept: l.dept, type: l.type,
    surface: l.surface === null ? null : Number(l.surface),
    lots: l.lots, anneeConstruction: l.annee_construction,
    loyerHcAn: l.loyer_hc_an === null ? null : Number(l.loyer_hc_an),
    prixHai: Number(l.prix_hai),
    rendement: l.rendement === null ? null : Number(l.rendement),
    occupation: l.occupation === null ? null : Number(l.occupation),
    prixM2: l.prix_m2 === null ? null : Number(l.prix_m2),
    dpe: l.dpe, travaux: l.travaux,
    // Un chemin de coffre devient une URL publique de NOTRE projet ; une URL
    // complète est acceptée telle quelle. next/image ne servira que celles de
    // ce projet (next.config.mjs).
    images: (l.images ?? []).map((i) =>
      /^https?:\/\//.test(i) ? i : `${base}/storage/v1/object/public/biens/${i.replace(/^\/+/, "")}`,
    ),
    publieLe: l.publie_le,
  };
}

/**
 * Lit les biens à vendre. Ne lance jamais : une base injoignable ou une table
 * pas encore créée donnent une liste vide, et la page affiche son état vide
 * plutôt qu'une erreur. Revalidé toutes les 10 minutes.
 */
export async function biensAVendre(): Promise<BienAVendre[]> {
  const cfg = configSitePublique();
  if (!cfg) return [];
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/biens_a_vendre?select=${COLONNES}&order=publie_le.desc`,
      {
        headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` },
        next: { revalidate: 600, tags: ["biens"] },
      },
    );
    if (!res.ok) return [];
    const lignes = (await res.json()) as LigneBien[];
    return lignes.map((l) => versBien(l, cfg.url));
  } catch {
    return [];
  }
}

export async function bienAVendre(slug: string): Promise<BienAVendre | null> {
  const tous = await biensAVendre();
  return tous.find((b) => b.slug === slug) ?? null;
}

/**
 * Formate un montant à l'euro près : 1830000 → « 1 830 000 € ».
 * Arrondi toujours : un loyer calculé arrive parfois à « 180 305,856 € », et
 * des centimes sur un immeuble à plusieurs millions font brouillon.
 */
export function prix(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR").replace(/ | |\s/g, " ")} €`;
}

/** Arrondi lisible pour un volume cumulé : 48 920 000 → « 48,9 M€ ». */
export function volume(n: number): string {
  return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M€`;
}
