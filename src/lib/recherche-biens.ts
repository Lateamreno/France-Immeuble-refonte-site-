import type { BienAVendre } from "./biens";
import { DEPARTEMENTS, REGIONS } from "./departements";
import { dateTri, DESTINATIONS, destinationsDe, rendementAffiche, type Destination } from "./annonce";

/**
 * Le moteur de recherche des immeubles à vendre, sur le modèle de Plein Bail
 * (spec du 30/10/2026), avec les CRITÈRES DU BO (MAV, 02/11/2026 : « il faut
 * que les critères d'affichage soient les mêmes que ceux de notre BO de telle
 * façon qu'ils puissent enregistrer leur recherche »). Une recherche du BO
 * porte : départements, villes, prix minimum et maximum, rendement minimum,
 * destinations, profil (cible) et commentaire. La barre n'offre rien d'autre :
 * tout ce qu'on cherche ici s'enregistre au BO sans rien perdre.
 *
 * Trois règles de Plein Bail gardées :
 *  - l'adresse de la page est l'état des filtres ;
 *  - une seule traduction filtres → résultats (`filtrer`), utilisée par la
 *    page, les paliers « En dehors de votre recherche » et les biens similaires ;
 *  - une valeur inconnue dans l'adresse est ignorée, la page ne casse jamais.
 */

export type Tri = "recent" | "rendement" | "prix" | "prixm2";

export type Criteres = {
  /** Zones en OU : « d:78 » département, « v:Lyon » ville. Une région s'ouvre en ses départements. */
  zones: string[];
  /** Destinations du BO ; vide = toutes. */
  destinations: Destination[];
  prixMin: number | null;
  prixMax: number | null;
  /** En % ; 0,5 ou moins = pas de filtre. */
  rendementMin: number | null;
  tri: Tri;
};

export const VIDE: Criteres = { zones: [], destinations: [], prixMin: null, prixMax: null, rendementMin: null, tri: "recent" };

export const TRIS: [Tri, string][] = [
  ["recent", "Plus récents"],
  ["rendement", "Rendement ↓"],
  ["prix", "Prix ↑"],
  ["prixm2", "Prix/m² ↑"],
];

/** Les profils d'acquéreur du BO. Plusieurs choisis = une recherche par profil, côté BO. */
export const CIBLES = ["Investisseur", "Marchand de biens", "Patrimonial", "Promoteur"] as const;

type Params = Record<string, string | string[] | undefined>;

const tous = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const un = (v: string | string[] | undefined) => tous(v)[0] ?? "";
const liste = (v: string | string[] | undefined) =>
  un(v).split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20);
const nombre = (v: string | string[] | undefined) => {
  const t = un(v).replace(/[\s  ]/g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Une zone valide et normalisée ; une région donne ses départements ; [] si le code n'existe pas. */
export function zonesDe(z: string): string[] {
  const m = /^([rdv]):(.+)$/.exec(z.trim());
  if (!m) return [];
  const [, n, code] = m;
  if (n === "r") return REGIONS[code]?.departements.map((d) => `d:${d}`) ?? [];
  if (n === "d") { const c = code.toUpperCase().padStart(2, "0"); return c in DEPARTEMENTS ? [`d:${c}`] : []; }
  const v = code.trim().slice(0, 80);
  return v ? [`v:${v}`] : [];
}

/** Anciennes adresses (lot 59) : le type dominant devient une destination. */
const DESTINATION_DU_TD: Record<string, Destination[]> = {
  habitation: ["Logement"], commercial: ["Commerce"], bureau: ["Bureau"], mixte: ["Logement", "Commerce"],
};

export function lireCriteres(p: Params): Criteres {
  const zones = [
    ...tous(p.ou).flatMap((x) => x.split(",")),
    ...liste(p.dep).map((d) => `d:${d}`),
    ...liste(p.ville).map((v) => `v:${v}`),
  ].flatMap(zonesDe);
  const dest = [
    ...liste(p.dest),
    ...liste(p.td).flatMap((t) => DESTINATION_DU_TD[t] ?? []),
  ].filter((d): d is Destination => (DESTINATIONS as string[]).includes(d));
  const rdt = nombre(p.rdt);
  const tri = un(p.tri) as Tri;
  const d = [...new Set(dest)];
  return {
    zones: [...new Set(zones)].slice(0, 40),
    // Toutes cochées ne filtrent rien.
    destinations: d.length >= DESTINATIONS.length ? [] : d,
    prixMin: nombre(p.pmin),
    prixMax: nombre(p.pmax),
    rendementMin: rdt != null && rdt > 0.5 ? Math.min(rdt, 40) : null,
    tri: TRIS.some(([k]) => k === tri) ? tri : "recent",
  };
}

const enc = (v: string) => encodeURIComponent(v).replace(/%3A/gi, ":").replace(/%2C/gi, ",");

/** Les critères en paramètres d'adresse, dans un ordre fixe, sans les valeurs par défaut. */
export function versParams(c: Partial<Criteres>): string {
  const x = { ...VIDE, ...c };
  const q: string[] = [];
  const mettre = (k: string, v: string | number | null | undefined) => {
    if (v !== null && v !== undefined && v !== "") q.push(`${k}=${enc(String(v))}`);
  };
  for (const z of x.zones) mettre("ou", z);
  if (x.destinations.length && x.destinations.length < DESTINATIONS.length) {
    mettre("dest", DESTINATIONS.filter((d) => x.destinations.includes(d)).join(","));
  }
  mettre("pmin", x.prixMin);
  mettre("pmax", x.prixMax);
  if (x.rendementMin && x.rendementMin > 0.5) mettre("rdt", x.rendementMin);
  if (x.tri !== "recent") mettre("tri", x.tri);
  return q.length ? `?${q.join("&")}` : "";
}

export const lienRecherche = (c: Partial<Criteres>) => `/immeubles-a-vendre/${versParams(c)}#resultats`;

function dansZone(b: BienAVendre, z: string): boolean {
  const code = z.slice(2);
  if (z.startsWith("d:")) return b.dept === code;
  return sansAccents(b.ville).includes(sansAccents(code));
}

/** La seule traduction filtres → résultats. Limite de 60, comme Plein Bail. */
export function filtrer(biens: BienAVendre[], c: Criteres, limite = 60): BienAVendre[] {
  const res = biens.filter((b) => {
    const r = rendementAffiche(b);
    return (
      (c.zones.length === 0 || c.zones.some((z) => dansZone(b, z))) &&
      (c.destinations.length === 0 || destinationsDe(b).some((d) => c.destinations.includes(d))) &&
      (c.prixMin == null || b.prixHai >= c.prixMin) &&
      (c.prixMax == null || b.prixHai <= c.prixMax) &&
      (!c.rendementMin || (r != null && r >= c.rendementMin))
    );
  });
  // Les valeurs absentes vont toujours en fin de liste, quel que soit le sens.
  const fin = (v: number | null, sens: 1 | -1) => (v == null ? Infinity : sens * v);
  switch (c.tri) {
    case "rendement": res.sort((a, b) => fin(rendementAffiche(a), -1) - fin(rendementAffiche(b), -1)); break;
    case "prix": res.sort((a, b) => a.prixHai - b.prixHai); break;
    case "prixm2": res.sort((a, b) => fin(a.prixM2, 1) - fin(b.prixM2, 1)); break;
    default: res.sort((a, b) => dateTri(b).localeCompare(dateTri(a)));
  }
  return res.slice(0, limite);
}

/** Le nom d'une zone : « Yvelines (78) », « Lyon ». */
export function libelleZone(z: string): string {
  const code = z.slice(2);
  if (z.startsWith("d:")) return `${DEPARTEMENTS[code] ?? code} (${code})`;
  if (z.startsWith("r:")) return REGIONS[code]?.nom ?? code;
  return code;
}

/** Les zones triées : départements par numéro, puis villes. */
export const zonesTriees = (zs: string[]) =>
  [...zs].sort((a, b) => "rdv".indexOf(a[0]) - "rdv".indexOf(b[0]) || a.slice(2).localeCompare(b.slice(2), "fr", { numeric: true }));

/** Si les départements choisis couvrent une région entière, son nom (pour l'affichage). */
export function regionsCompletes(zs: string[]): { code: string; nom: string }[] {
  const d = new Set(zs.filter((z) => z.startsWith("d:")).map((z) => z.slice(2)));
  return Object.entries(REGIONS)
    .filter(([, r]) => r.departements.length > 1 && r.departements.every((x) => d.has(x)))
    .map(([code, r]) => ({ code, nom: r.nom }));
}

/** Un libellé court de la localisation : « Île-de-France », « Nord (59) +2 ». */
export function libelleLieu(zs: string[]): string {
  if (zs.length === 0) return "";
  const regions = regionsCompletes(zs);
  if (regions.length === 1) {
    const reste = zs.filter((z) => !(z.startsWith("d:") && REGIONS[regions[0].code].departements.includes(z.slice(2))));
    return `${regions[0].nom}${reste.length ? ` +${reste.length}` : ""}`;
  }
  const [premiere, ...autres] = zonesTriees(zs);
  return `${libelleZone(premiere)}${autres.length ? ` +${autres.length}` : ""}`;
}

const eurosCourts = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

/**
 * Les critères actifs, chacun avec l'adresse qui le retire. Toutes les
 * localisations en une seule puce : six zones en six puces poussaient les
 * résultats hors de l'écran.
 */
export function puces(c: Criteres): { libelle: string; sans: string; lieu?: boolean }[] {
  const out: { libelle: string; sans: string; lieu?: boolean }[] = [];
  const sans = (m: Partial<Criteres>) => lienRecherche({ ...c, ...m });
  if (c.zones.length) out.push({ libelle: libelleLieu(c.zones), sans: sans({ zones: [] }), lieu: true });
  for (const d of c.destinations) out.push({ libelle: d, sans: sans({ destinations: c.destinations.filter((x) => x !== d) }) });
  if (c.prixMin != null) out.push({ libelle: `Dès ${eurosCourts(c.prixMin)}`, sans: sans({ prixMin: null }) });
  if (c.prixMax != null) out.push({ libelle: `Jusqu’à ${eurosCourts(c.prixMax)}`, sans: sans({ prixMax: null }) });
  if (c.rendementMin) out.push({ libelle: `Rendement ≥ ${c.rendementMin.toLocaleString("fr-FR")} %`, sans: sans({ rendementMin: null }) });
  return out;
}

/**
 * Peu de résultats (moins de 6) : six annonces à critères élargis, par paliers,
 * sans jamais répéter une annonce déjà affichée : (1) mêmes destinations et
 * même zone, (2) mêmes destinations partout, (3) tout le site.
 */
export function horsRecherche(biens: BienAVendre[], c: Criteres, affiches: BienAVendre[]) {
  if (affiches.length >= 6 || puces(c).length === 0) return null;
  const deja = new Set(affiches.map((b) => b.id));
  const paliers: Criteres[] = [
    { ...VIDE, zones: c.zones, destinations: c.destinations },
    { ...VIDE, destinations: c.destinations },
    VIDE,
  ];
  for (const p of paliers) {
    if (versParams(p) === versParams({ ...c, tri: "recent" })) continue;
    const tous = filtrer(biens, p, 1000);
    const nouveaux = tous.filter((b) => !deja.has(b.id));
    if (nouveaux.length > 0) {
      return { biens: nouveaux.slice(0, 6), lien: tous.length > 6 ? lienRecherche(p) : null };
    }
  }
  return null;
}

/** Biens similaires d'une fiche : même département, prix ± 40 %, 4 au plus ; la région à défaut. */
export function similaires(biens: BienAVendre[], b: BienAVendre, n = 4): BienAVendre[] {
  const proche = (x: BienAVendre) => x.id !== b.id && x.prixHai >= b.prixHai * 0.6 && x.prixHai <= b.prixHai * 1.4;
  const region = Object.entries(REGIONS).find(([, r]) => r.departements.includes(b.dept))?.[0];
  const dept = biens.filter((x) => proche(x) && x.dept === b.dept);
  const reg = region ? biens.filter((x) => proche(x) && x.dept !== b.dept && REGIONS[region].departements.includes(x.dept)) : [];
  return [...dept, ...reg].slice(0, n);
}

/** La recherche de la barre, au format d'une recherche du BO (§6, `recherche_compte`). */
export function versRechercheCompte(c: Criteres, biens: BienAVendre[]) {
  const departements = new Set<string>();
  const villes: string[] = [];
  for (const z of c.zones) {
    const code = z.slice(2);
    if (z.startsWith("d:")) departements.add(code);
    else {
      villes.push(code);
      // Une ville apporte son département : le BO exige au moins un département.
      const d = biens.find((b) => sansAccents(b.ville) === sansAccents(code))?.dept;
      if (d) departements.add(d);
    }
  }
  return {
    departements: [...departements].slice(0, 20),
    villes,
    prixMin: c.prixMin,
    prixMax: c.prixMax,
    rendementMin: c.rendementMin,
    destinations: c.destinations,
  };
}
