import type { BienAVendre } from "./biens";
import { DEPARTEMENTS, REGIONS } from "./departements";
import {
  dateTri, dominanteDe, estMixte, rendementAffiche, TYPES_DOMINANTS, type TypeDominant,
} from "./annonce";

/**
 * Le moteur de recherche des immeubles à vendre, sur le modèle de Plein Bail
 * (spec du 30/10/2026, MAV). Trois règles :
 *  - l'adresse de la page est l'état des filtres : une recherche se partage,
 *    se recharge, s'enregistre ;
 *  - une seule traduction filtres → résultats (`filtrer`), utilisée par la
 *    page, les paliers « En dehors de votre recherche » et les biens similaires ;
 *  - une valeur inconnue dans l'adresse est ignorée, la page ne casse jamais.
 * Sans dépendance serveur : la barre de recherche s'en sert aussi.
 */

export type Tri = "recent" | "rendement" | "prix" | "prixm2";
export type Lettre = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type TypeVille = "grandes" | "moyennes" | "petites";

export type Criteres = {
  /** Zones en OU : « r:11 » région, « d:78 » département, « v:Lyon » ville. */
  zones: string[];
  /** Types dominants ; vide = tous. */
  td: TypeDominant[];
  prixMin: number | null;
  prixMax: number | null;
  surfaceMin: number | null;
  surfaceMax: number | null;
  /** En % ; 0,5 ou moins = pas de filtre. */
  rendementMin: number | null;
  dpeMin: Lettre | null;
  dpeMax: Lettre | null;
  travaux: "avec" | "sans" | null;
  occMin: number | null;
  occMax: number | null;
  lotsMin: number | null;
  tv: TypeVille[];
  sansOffre: boolean;
  tri: Tri;
};

export const VIDE: Criteres = {
  zones: [], td: [], prixMin: null, prixMax: null, surfaceMin: null, surfaceMax: null,
  rendementMin: null, dpeMin: null, dpeMax: null, travaux: null, occMin: null, occMax: null,
  lotsMin: null, tv: [], sansOffre: false, tri: "recent",
};

export const TRIS: [Tri, string][] = [
  ["recent", "Plus récents"],
  ["rendement", "Rendement ↓"],
  ["prix", "Prix ↑"],
  ["prixm2", "Prix/m² ↑"],
];

export const LETTRES: Lettre[] = ["A", "B", "C", "D", "E", "F", "G"];

/** Les plages DPE de Plein Bail. Les échéances valent pour les logements. */
export const PLAGES_DPE: [Lettre, Lettre, string][] = [
  ["A", "D", "louable sans limite"],
  ["A", "E", "louable jusqu’en 2034"],
  ["A", "F", "louable jusqu’en 2028"],
  ["E", "G", "passoires énergétiques"],
];

export const TYPES_VILLE: [TypeVille, string, string][] = [
  ["grandes", "Grandes villes", "plus de 100 000 hab."],
  ["moyennes", "Villes moyennes", "20 000 à 100 000 hab."],
  ["petites", "Petites villes", "moins de 20 000 hab."],
];

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
const lettre = (v: string | string[] | undefined) => {
  const l = un(v).toUpperCase();
  return (LETTRES as string[]).includes(l) ? (l as Lettre) : null;
};

export const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Une zone valide, normalisée ; null si son code n'existe pas. */
export function zoneValide(z: string): string | null {
  const m = /^([rdv]):(.+)$/.exec(z.trim());
  if (!m) return null;
  const [, n, code] = m;
  if (n === "r") return code in REGIONS ? `r:${code}` : null;
  if (n === "d") { const c = code.toUpperCase().padStart(2, "0"); return c in DEPARTEMENTS ? `d:${c}` : null; }
  const v = code.trim().slice(0, 80);
  return v ? `v:${v}` : null;
}

export function lireCriteres(p: Params): Criteres {
  const zones = [
    ...tous(p.ou).flatMap((x) => x.split(",")),
    // Anciennes adresses du lot 58 : ?dep=92,93&ville=Melun
    ...liste(p.dep).map((d) => `d:${d}`),
    ...liste(p.ville).map((v) => `v:${v}`),
  ].map(zoneValide).filter((z): z is string => !!z);
  const td = liste(p.td).filter((t): t is TypeDominant => TYPES_DOMINANTS.some(([k]) => k === t));
  const rdt = nombre(p.rdt);
  const omin = nombre(p.omin), omax = nombre(p.omax);
  let dpeMin = lettre(p.dpemin), dpeMax = lettre(p.dpemax) ?? lettre(p.dpe);
  if (dpeMin === "A") dpeMin = null;
  if (dpeMax === "G") dpeMax = null;
  const trav = un(p.trav);
  const tri = un(p.tri) as Tri;
  return {
    zones: [...new Set(zones)].slice(0, 20),
    // Les quatre cochés ne filtrent rien : un immeuble sans dominante calculée resterait dehors.
    td: new Set(td).size >= TYPES_DOMINANTS.length ? [] : [...new Set(td)],
    prixMin: nombre(p.pmin),
    prixMax: nombre(p.pmax),
    surfaceMin: nombre(p.smin),
    surfaceMax: nombre(p.smax),
    rendementMin: rdt != null && rdt > 0.5 ? Math.min(rdt, 40) : null,
    dpeMin, dpeMax,
    travaux: trav === "avec" || trav === "sans" ? trav : null,
    occMin: omin != null && omin > 0 ? Math.min(omin, 100) : null,
    occMax: omax != null && omax < 100 ? omax : null,
    lotsMin: nombre(p.lots) ?? nombre(p.lmin),
    tv: [...new Set(liste(p.tv))].filter((t): t is TypeVille => TYPES_VILLE.some(([k]) => k === t)),
    sansOffre: un(p.dispo) === "1",
    tri: TRIS.some(([k]) => k === tri) ? tri : "recent",
  };
}

const enc = (v: string) => encodeURIComponent(v).replace(/%3A/gi, ":").replace(/%2C/gi, ",");

/**
 * Les critères en paramètres d'adresse, dans un ordre fixe et sans les valeurs
 * par défaut : deux recherches identiques donnent la même adresse.
 */
export function versParams(c: Partial<Criteres>): string {
  const x = { ...VIDE, ...c };
  const q: string[] = [];
  const mettre = (k: string, v: string | number | null | undefined | false) => {
    if (v !== null && v !== undefined && v !== false && v !== "") q.push(`${k}=${enc(String(v))}`);
  };
  for (const z of x.zones) mettre("ou", z);
  if (x.td.length && x.td.length < TYPES_DOMINANTS.length) mettre("td", x.td.join(","));
  mettre("pmin", x.prixMin);
  mettre("pmax", x.prixMax);
  mettre("smin", x.surfaceMin);
  mettre("smax", x.surfaceMax);
  if (x.rendementMin && x.rendementMin > 0.5) mettre("rdt", x.rendementMin);
  if (x.dpeMin && x.dpeMin !== "A") mettre("dpemin", x.dpeMin);
  if (x.dpeMax && x.dpeMax !== "G") mettre("dpemax", x.dpeMax);
  mettre("trav", x.travaux);
  if (x.occMin && x.occMin > 0) mettre("omin", x.occMin);
  if (x.occMax != null && x.occMax < 100) mettre("omax", x.occMax);
  if (x.lotsMin) mettre("lots", x.lotsMin);
  if (x.tv.length) mettre("tv", x.tv.join(","));
  if (x.sansOffre) mettre("dispo", "1");
  if (x.tri !== "recent") mettre("tri", x.tri);
  return q.length ? `?${q.join("&")}` : "";
}

export const lienRecherche = (c: Partial<Criteres>) => `/immeubles-a-vendre/${versParams(c)}#resultats`;

/** Les biens dans une zone. */
function dansZone(b: BienAVendre, z: string): boolean {
  const code = z.slice(2);
  if (z.startsWith("d:")) return b.dept === code;
  if (z.startsWith("r:")) return REGIONS[code]?.departements.includes(b.dept) ?? false;
  return sansAccents(b.ville).includes(sansAccents(code));
}

function bandeVille(pop: number): TypeVille {
  return pop >= 100_000 ? "grandes" : pop >= 20_000 ? "moyennes" : "petites";
}

/** La seule traduction filtres → résultats. Limite de 60, comme Plein Bail. */
export function filtrer(biens: BienAVendre[], c: Criteres, limite = 60): BienAVendre[] {
  const rang = (l: string | null) => (l ? LETTRES.indexOf(l as Lettre) : -1);
  const res = biens.filter((b) => {
    const r = rendementAffiche(b);
    const avecTravaux = b.travauxTotal != null ? b.travauxTotal > 0 : !!b.travaux?.trim();
    return (
      (c.zones.length === 0 || c.zones.some((z) => dansZone(b, z))) &&
      (c.td.length === 0 || c.td.some((t) => (t === "mixte" ? estMixte(b) : dominanteDe(b) === t))) &&
      (c.prixMin == null || b.prixHai >= c.prixMin) &&
      (c.prixMax == null || b.prixHai <= c.prixMax) &&
      (c.surfaceMin == null || (b.surface != null && b.surface >= c.surfaceMin)) &&
      (c.surfaceMax == null || (b.surface != null && b.surface <= c.surfaceMax)) &&
      (!c.rendementMin || (r != null && r >= c.rendementMin)) &&
      (!c.dpeMin || rang(b.dpe) >= rang(c.dpeMin)) &&
      (!c.dpeMax || (b.dpe != null && rang(b.dpe) <= rang(c.dpeMax))) &&
      (!c.travaux || (c.travaux === "avec") === avecTravaux) &&
      (c.occMin == null || (b.occupation != null && b.occupation >= c.occMin)) &&
      (c.occMax == null || (b.occupation != null && b.occupation <= c.occMax)) &&
      (!c.lotsMin || (b.lots != null && b.lots >= c.lotsMin)) &&
      (c.tv.length === 0 || (b.communePopulation != null && c.tv.includes(bandeVille(b.communePopulation)))) &&
      (!c.sansOffre || b.statut === "en_vente")
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

/** Le nom d'une zone : « Île-de-France », « Yvelines (78) », « Lyon ». */
export function libelleZone(z: string): string {
  const code = z.slice(2);
  if (z.startsWith("r:")) return REGIONS[code]?.nom ?? code;
  if (z.startsWith("d:")) return `${DEPARTEMENTS[code] ?? code} (${code})`;
  return code;
}

/** Les zones triées par nature : régions, départements, villes. */
export const zonesTriees = (zs: string[]) =>
  [...zs].sort((a, b) => "rdv".indexOf(a[0]) - "rdv".indexOf(b[0]) || libelleZone(a).localeCompare(libelleZone(b), "fr", { numeric: true }));

const eurosCourts = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

/**
 * Les critères actifs, chacun avec l'adresse qui le retire. Toutes les
 * localisations en une seule puce (« Nord (59) +2 ») : six zones en six
 * puces poussaient les résultats hors de l'écran.
 */
export function puces(c: Criteres): { libelle: string; sans: string; lieu?: boolean }[] {
  const out: { libelle: string; sans: string; lieu?: boolean }[] = [];
  const sans = (m: Partial<Criteres>) => lienRecherche({ ...c, ...m });
  if (c.zones.length) {
    const [premiere, ...autres] = zonesTriees(c.zones);
    out.push({ libelle: `${libelleZone(premiere)}${autres.length ? ` +${autres.length}` : ""}`, sans: sans({ zones: [] }), lieu: true });
  }
  for (const t of c.td) out.push({ libelle: TYPES_DOMINANTS.find(([k]) => k === t)![1], sans: sans({ td: c.td.filter((x) => x !== t) }) });
  if (c.prixMin != null) out.push({ libelle: `Dès ${eurosCourts(c.prixMin)}`, sans: sans({ prixMin: null }) });
  if (c.prixMax != null) out.push({ libelle: `Jusqu’à ${eurosCourts(c.prixMax)}`, sans: sans({ prixMax: null }) });
  if (c.rendementMin) out.push({ libelle: `Rendement ≥ ${c.rendementMin.toLocaleString("fr-FR")} %`, sans: sans({ rendementMin: null }) });
  if (c.surfaceMin != null || c.surfaceMax != null) {
    const l = c.surfaceMin != null && c.surfaceMax != null ? `${c.surfaceMin} à ${c.surfaceMax} m²`
      : c.surfaceMin != null ? `≥ ${c.surfaceMin} m²` : `≤ ${c.surfaceMax} m²`;
    out.push({ libelle: l, sans: sans({ surfaceMin: null, surfaceMax: null }) });
  }
  if (c.dpeMin || c.dpeMax) out.push({ libelle: `DPE ${c.dpeMin ?? "A"} → ${c.dpeMax ?? "G"}`, sans: sans({ dpeMin: null, dpeMax: null }) });
  if (c.travaux) out.push({ libelle: c.travaux === "avec" ? "Avec travaux" : "Sans travaux", sans: sans({ travaux: null }) });
  if (c.occMin != null || c.occMax != null) out.push({ libelle: `Occupé ${c.occMin ?? 0} – ${c.occMax ?? 100} %`, sans: sans({ occMin: null, occMax: null }) });
  if (c.lotsMin) out.push({ libelle: `≥ ${c.lotsMin} lots`, sans: sans({ lotsMin: null }) });
  for (const t of c.tv) out.push({ libelle: TYPES_VILLE.find(([k]) => k === t)![1], sans: sans({ tv: c.tv.filter((x) => x !== t) }) });
  if (c.sansOffre) out.push({ libelle: "Sans offre en cours", sans: sans({ sansOffre: false }) });
  return out;
}

/** Combien de critères hors localisation et tri : sert au bouton « Filtres (n) ». */
export const nbCriteres = (c: Criteres) => puces(c).filter((p) => !p.lieu).length;

/**
 * Peu de résultats (moins de 6) : six annonces à critères élargis, par paliers,
 * sans jamais répéter une annonce déjà affichée : (1) mêmes types et même zone,
 * (2) mêmes types partout, (3) tout le site.
 */
export function horsRecherche(biens: BienAVendre[], c: Criteres, affiches: BienAVendre[]) {
  if (affiches.length >= 6 || puces(c).length === 0) return null;
  const deja = new Set(affiches.map((b) => b.id));
  const paliers: Criteres[] = [
    { ...VIDE, zones: c.zones, td: c.td },
    { ...VIDE, td: c.td },
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

/** Les critères de la barre en recherche de compte (§9.4, `recherche_compte`). */
export function versRechercheCompte(c: Criteres, biens: BienAVendre[]) {
  const departements = new Set<string>();
  const villes: string[] = [];
  for (const z of c.zones) {
    const code = z.slice(2);
    if (z.startsWith("d:")) departements.add(code);
    else if (z.startsWith("r:")) REGIONS[code]?.departements.forEach((d) => departements.add(d));
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
  };
}
