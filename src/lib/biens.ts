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
 *   commune, département, prix, date, photo ; pour la fiche, des fourchettes,
 *   des profils et un récit validé (migration 0003).
 * Jamais le numéro, jamais un nom. La rue, sans numéro, s'affiche depuis le
 * 21/10/2026 (décision de MAV) — dans son propre champ, jamais dans un texte. Les fichiers photo d'origine
 * portaient parfois l'adresse dans leur nom (« Immeuble 47 rue des bas
 * Fossés… ») : `scripts/import-ventes.mjs` les renomme sur un identifiant neutre.
 */

export type Vente = {
  id: string;
  /** L'URL de la fiche : /immeubles-vendus/<slug>/. Figé une fois publié. */
  slug: string;
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
} & FaitsVente;

/**
 * Ce que le BO dépose en plus pour la fiche de la vente (migration 0003).
 * Tout est facultatif : une vente sans faits reste une carte et une fiche
 * courte, non indexée. Fourchettes et profils, jamais d'adresse ni de nom (§2).
 */
export type FaitsVente = {
  /** Ancienne adresse de fiche, à l'année (44 ventes de départ) : redirigée. */
  ancienSlug?: string | null;
  /** Surface exacte en m² (0006). À défaut, la tranche surfaceMin–surfaceMax. */
  surface?: number | null;
  /** Loyer annuel HC potentiel, en euros. */
  loyerPotentiel?: number | null;
  /** Meilleure offre reçue comparée à l'estimation, en % : +3 = 3 % au-dessus. */
  ecartEstimation?: number | null;
  /** Jours entre la mise en commercialisation et l'offre retenue. */
  delaiOffreJours?: number | null;
  /** « rue des Bas-Fossés » — jamais de numéro : la base refuse tout chiffre. */
  rue?: string | null;
  titre?: string | null;
  type?: string | null;
  arrondissement?: string | null;
  lots?: number | null;
  composition?: string | null;
  surfaceMin?: number | null;
  surfaceMax?: number | null;
  epoque?: string | null;
  dpe?: string | null;
  occupation?: number | null;
  rendement?: number | null;
  profilAcquereur?: string | null;
  profilVendeur?: string | null;
  modeCommercialisation?: "off_market" | "diffusion" | "mixte" | null;
  delaiSemaines?: number | null;
  acquereursSollicites?: number | null;
  visites?: number | null;
  offres?: number | null;
  chapo?: string | null;
  recit?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  recitValideLe?: string | null;
};

/** Les ventes du fichier déposé à la main — repli si la base ne répond pas. */
const VENTES_DEPOSEES: Vente[] = (ventesJson as Vente[])
  .slice()
  .sort((a, b) => b.date.localeCompare(a.date));

type LigneVente = {
  id: string; slug: string | null; ville: string; dept: string; prix: number;
  date: string; region: Vente["region"]; image: string | null;
  rue?: string | null;
  titre?: string | null; type?: string | null; arrondissement?: string | null;
  lots?: number | null; composition?: string | null;
  surface_min?: number | null; surface_max?: number | null; epoque?: string | null;
  dpe?: string | null; occupation?: number | string | null; rendement?: number | string | null;
  profil_acquereur?: string | null; profil_vendeur?: string | null;
  mode_commercialisation?: FaitsVente["modeCommercialisation"];
  delai_semaines?: number | null; acquereurs_sollicites?: number | null;
  visites?: number | null; offres?: number | null;
  chapo?: string | null; recit?: string | null;
  seo_title?: string | null; seo_desc?: string | null; recit_valide_le?: string | null;
  surface?: number | string | null;
  loyer_potentiel?: number | string | null; ecart_estimation?: number | string | null;
  delai_offre_jours?: number | null;
};

const nombre = (x: number | string | null | undefined) =>
  x === null || x === undefined ? null : Number(x);

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
      // `*` et non une liste : une base où la migration 0003 n'est pas encore
      // passée répond quand même, sans les colonnes des fiches.
      `${cfg.url}/rest/v1/ventes?select=*&order=date.desc`,
      {
        headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` },
        next: { revalidate: 600, tags: ["ventes"] },
      },
    );
    if (!res.ok) return VENTES_DEPOSEES;
    const lignes = (await res.json()) as LigneVente[];
    if (lignes.length === 0) return VENTES_DEPOSEES;
    const parId = new Map(VENTES_DEPOSEES.map((v) => [v.id, v.slug]));
    const ancien = new Map(VENTES_DEPOSEES.map((v) => [v.id, v.ancienSlug ?? null]));
    return lignes.map((l) => ({
      id: l.id,
      // Slug absent si la base date d'avant 0003 : celui de la graine, identique.
      slug: l.slug ?? parId.get(l.id) ?? l.id,
      ville: l.ville, dept: l.dept, prix: Number(l.prix),
      date: l.date, annee: Number(l.date.slice(0, 4)), region: l.region,
      image: imageVente(l.image, cfg.url),
      rue: l.rue, titre: l.titre, type: l.type, arrondissement: l.arrondissement,
      lots: l.lots, composition: l.composition,
      surfaceMin: l.surface_min, surfaceMax: l.surface_max, epoque: l.epoque, dpe: l.dpe,
      occupation: nombre(l.occupation), rendement: nombre(l.rendement),
      profilAcquereur: l.profil_acquereur, profilVendeur: l.profil_vendeur,
      modeCommercialisation: l.mode_commercialisation,
      delaiSemaines: l.delai_semaines, acquereursSollicites: l.acquereurs_sollicites,
      visites: l.visites, offres: l.offres,
      chapo: l.chapo, recit: l.recit, seoTitle: l.seo_title, seoDesc: l.seo_desc,
      // La base refuse un récit sans validation ; le site vérifie quand même.
      recitValideLe: l.recit_valide_le,
      surface: nombre(l.surface),
      loyerPotentiel: nombre(l.loyer_potentiel), ecartEstimation: nombre(l.ecart_estimation),
      delaiOffreJours: l.delai_offre_jours ?? null,
      ancienSlug: ancien.get(l.id) ?? null,
    }));
  } catch {
    return VENTES_DEPOSEES;
  }
}

export async function venteParSlug(slug: string): Promise<Vente | null> {
  const toutes = await ventes();
  return toutes.find((v) => v.slug === slug) ?? null;
}

/**
 * Les 44 fiches de départ ont porté l'année dans leur adresse quelques heures
 * (« …-pantin-2019 »). MAV ne veut aucune date de vente à l'écran, URL
 * comprise : l'ancienne adresse renvoie vers la nouvelle.
 */
export async function nouveauSlugVente(ancienSlug: string): Promise<string | null> {
  const toutes = await ventes();
  return toutes.find((v) => v.ancienSlug === ancienSlug)?.slug ?? null;
}

/**
 * Une fiche de vente n'est indexée que si elle a un récit relu et validé.
 *
 * Sans récit, la fiche tient en quatre lignes (commune, année, prix, photo) :
 * quarante pages de ce genre, identiques à un nom près, sont exactement ce que
 * Google traite en contenu mince. Elles restent consultables, et `follow` laisse
 * passer les liens, mais elles ne sont ni indexées ni dans le sitemap.
 */
export function venteIndexable(v: Vente): boolean {
  return Boolean(v.recit && v.recitValideLe && v.recit.trim().split(/\s+/).length >= 250);
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
    volume: v.reduce((s, x) => s + x.prix, 0),
    partIdf: Math.round((v.filter((x) => x.region === "idf").length / v.length) * 100),
  };
}

/**
 * Régions et départements, pour classer les ventes (retour de MAV du
 * 21/10/2026) : l'Île-de-France d'abord, département par département dans cet
 * ordre, puis les autres régions, de la plus représentée à la moins.
 * Codes de région INSEE, ceux de `REGIONS_FR` (carte-france.ts).
 */
const REGION_DES_DEPTS: Record<string, string> = {};
const DEPTS_PAR_REGION: Record<string, string[]> = {
  "11": ["75", "77", "78", "91", "92", "93", "94", "95"],
  "24": ["18", "28", "36", "37", "41", "45"],
  "27": ["21", "25", "39", "58", "70", "71", "89", "90"],
  "28": ["14", "27", "50", "61", "76"],
  "32": ["02", "59", "60", "62", "80"],
  "44": ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"],
  "52": ["44", "49", "53", "72", "85"],
  "53": ["22", "29", "35", "56"],
  "75": ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"],
  "76": ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"],
  "84": ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74"],
  "93": ["04", "05", "06", "13", "83", "84"],
  "94": ["2A", "2B", "20"],
};
for (const [r, ds] of Object.entries(DEPTS_PAR_REGION)) for (const d of ds) REGION_DES_DEPTS[d] = r;

/** L'ordre voulu par MAV pour l'Île-de-France. */
export const ORDRE_IDF = ["75", "92", "94", "93", "91", "78", "95", "77"];
export const NOMS_DEPTS_IDF: Record<string, string> = {
  "75": "Paris", "92": "Hauts-de-Seine", "94": "Val-de-Marne", "93": "Seine-Saint-Denis",
  "91": "Essonne", "78": "Yvelines", "95": "Val-d’Oise", "77": "Seine-et-Marne",
};

export function regionDuDept(dept: string): string | null {
  return REGION_DES_DEPTS[dept.toUpperCase().padStart(2, "0")] ?? null;
}

export type GroupeVentes = {
  region: string;            // code INSEE, ou "?" si inconnu
  departements: { dept: string | null; ventes: Vente[] }[];
  total: number;
};

/**
 * L'écart avec l'estimation, publié le 22/10/2026 à la demande du BO validée
 * par MAV. Ce que mesure `ecart_estimation` : la MEILLEURE OFFRE REÇUE
 * comparée à l'estimation, en %. Pas le prix de l'acte. Le libellé le dit.
 * `false` le masque partout d'un coup.
 */
export const AFFICHER_ECART_ESTIMATION = true;
export const LIBELLE_ECART = "Meilleure offre reçue comparée à l’estimation";

/** Du plus cher au moins cher : MAV veut le tri par prix, pas par date. */
const parPrix = (a: Vente, b: Vente) => b.prix - a.prix;

export function groupesVentes(v: Vente[]): GroupeVentes[] {
  const parRegion = new Map<string, Vente[]>();
  for (const x of v) {
    const r = regionDuDept(x.dept) ?? "?";
    parRegion.set(r, [...(parRegion.get(r) ?? []), x]);
  }
  const groupes: GroupeVentes[] = [...parRegion.entries()].map(([region, liste]) => {
    if (region !== "11") {
      return { region, departements: [{ dept: null, ventes: liste.sort(parPrix) }], total: liste.length };
    }
    const departements = ORDRE_IDF.map((d) => ({
      dept: d,
      ventes: liste.filter((x) => x.dept === d).sort(parPrix),
    })).filter((g) => g.ventes.length > 0);
    return { region, departements, total: liste.length };
  });
  return groupes.sort(
    (a, b) =>
      Number(b.region === "11") - Number(a.region === "11") ||
      Number(a.region === "?") - Number(b.region === "?") ||
      b.total - a.total ||
      a.region.localeCompare(b.region),
  );
}

export async function ventesEtStats() {
  const v = await ventes();
  return { ventes: v, stats: statsVentes(v) };
}

/**
 * Les ventes de la vitrine d'accueil (MAV, 22/10/2026) : toutes celles de
 * Paris d'abord, puis les plus chères, `n` en tout. Paris est classé par prix
 * lui aussi.
 */
export function vitrineAccueil(v: Vente[], n = 8): Vente[] {
  const parPrix = (a: Vente, b: Vente) => b.prix - a.prix;
  const paris = v.filter((x) => x.dept === "75").sort(parPrix);
  const autres = v.filter((x) => x.dept !== "75").sort(parPrix);
  return [...paris, ...autres].slice(0, n);
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
 * Off-market : combien d'immeubles circulent, commune par commune.
 *
 * Le BO remplace la table `offmarket` en entier à 9 h et 19 h. Elle ne porte
 * que la commune, le département, l'arrondissement (Paris, Lyon, Marseille) et
 * un nombre — ni type, ni lots, ni prix : un immeuble off-market décrit en
 * public ne l'est plus. Ne lance jamais : base injoignable → liste vide.
 */
export type CommuneOffMarket = {
  commune: string;
  dept: string;
  arrondissement: string | null;
  nombre: number;
  majLe: string;
};

export async function offMarket(): Promise<CommuneOffMarket[]> {
  const cfg = configSitePublique();
  if (!cfg) return [];
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/offmarket?select=commune,dept,arrondissement,nombre,maj_le&order=nombre.desc,commune.asc`,
      {
        headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` },
        next: { revalidate: 600, tags: ["offmarket"] },
      },
    );
    if (!res.ok) return [];
    const lignes = (await res.json()) as {
      commune: string; dept: string; arrondissement: string | null; nombre: number; maj_le: string;
    }[];
    return lignes
      .filter((l) => Number(l.nombre) > 0)
      .map((l) => ({
        commune: l.commune, dept: l.dept, arrondissement: l.arrondissement,
        nombre: Number(l.nombre), majLe: l.maj_le,
      }))
      .sort((a, b) => b.nombre - a.nombre || a.commune.localeCompare(b.commune, "fr"));
  } catch {
    return [];
  }
}

/** « Paris 18e » pour un arrondissement, la commune seule sinon. */
export function lieuOffMarket(c: CommuneOffMarket): string {
  if (!c.arrondissement) return c.commune;
  const court = c.arrondissement.replace(/\s*arrondissement\s*$/i, "").trim();
  return `${c.commune} ${court}`;
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
