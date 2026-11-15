/**
 * Photos de façade libres de droits pour les ventes d'immeubles (lot 125, MAV, 15/11/2026).
 *
 * Panoramax est la banque publique de photos de rue soutenue par l'IGN et OpenStreetMap France :
 * photos sous licence CC BY-SA 4.0 ou Licence ouverte, réutilisables en citant l'auteur. Les photos de
 * Google Street View et d'Apple Plans ne peuvent pas être reprises (leurs conditions l'interdisent).
 *
 * Aucune dépendance : la tâche mensuelle et les scripts de recette l'utilisent tels quels.
 */
export const API_PANORAMAX = "https://api.panoramax.xyz/api";

/** Licences acceptées : celles qui permettent la réutilisation commerciale avec mention de l'auteur. */
const LICENCES = new Set(["CC-BY-SA-4.0", "CC-BY-4.0", "etalab-2.0", "LO-2.0"]);

export type PhotoRue = {
  /** Identifiant de la photo chez Panoramax. */
  id: string;
  auteur: string;
  licence: string;
  /** Date de la prise de vue (AAAA-MM-JJ). */
  date: string;
  /** Direction de l'immeuble vue depuis la photo, en degrés (0 = nord). */
  cap: number;
};

const rad = (d: number) => (d * Math.PI) / 180;
/** Cap de A vers B, en degrés de 0 à 359. */
export function cap(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(rad(lon2 - lon1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lon2 - lon1));
  return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
}

type Item = {
  id: string;
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, unknown>;
  providers?: { name?: string; roles?: string[] }[];
};

/**
 * La photo la plus récente qui regarde l'immeuble, prise à moins de 30 m, ou null. Panoramax choisit
 * lui-même les photos orientées vers le point (`place_position`).
 */
export async function chercherPhoto(lat: number, lon: number, signal?: AbortSignal): Promise<PhotoRue | null> {
  const url = `${API_PANORAMAX}/search?place_position=${lon},${lat}&place_distance=3-30&place_fov_tolerance=60&limit=20`;
  const r = await fetch(url, { signal, headers: { accept: "application/geo+json" } });
  if (!r.ok) return null;
  const d = (await r.json()) as { features?: Item[] };
  // Une photo à 360° se recadre vers l'immeuble : on la préfère. Une photo ordinaire n'est gardée
  // que si elle regarde l'immeuble (à 25° près), sinon elle montre la rue et pas la façade.
  const champ = (f: Item) => Number((f.properties?.["pers:interior_orientation"] as { field_of_view?: number } | undefined)?.field_of_view ?? 0);
  const visee = (f: Item) => {
    const [plon, plat] = f.geometry!.coordinates!;
    const ecart = Math.abs(((cap(plat, plon, lat, lon) - Number(f.properties?.["view:azimuth"] ?? 0) + 540) % 360) - 180);
    return champ(f) >= 360 || ecart <= 25;
  };
  const choix = (d.features ?? [])
    .filter((f) => LICENCES.has(String(f.properties?.license ?? "")) && f.geometry?.coordinates && visee(f))
    .sort(
      (a, b) =>
        Number(champ(b) >= 360) - Number(champ(a) >= 360) ||
        String(b.properties?.datetime ?? "").localeCompare(String(a.properties?.datetime ?? "")),
    );
  const f = choix[0];
  if (!f) return null;
  const [plon, plat] = f.geometry!.coordinates!;
  const auteur =
    f.providers?.find((p) => p.roles?.includes("producer") && p.name)?.name ?? String(f.properties?.["geovisio:producer"] ?? "Panoramax");
  return {
    id: f.id,
    auteur,
    licence: String(f.properties?.license),
    date: String(f.properties?.datetime ?? "").slice(0, 10),
    cap: cap(plat, plon, lat, lon),
  };
}

/** Le libellé de la licence, pour la mention sous la photo. */
export const libelleLicence = (l: string) => (l.startsWith("CC-BY-SA") ? "CC BY-SA" : l.startsWith("CC-BY") ? "CC BY" : "Licence ouverte");

/** Les abréviations de DVF (« AV », « BD », « FBG ST ») en toutes lettres. */
const ABREVIATIONS: Record<string, string> = {
  av: "avenue", bd: "boulevard", pas: "passage", vla: "villa", pl: "place", sq: "square", crs: "cours",
  imp: "impasse", fbg: "faubourg", st: "Saint", ste: "Sainte", all: "allée", che: "chemin", cite: "cité",
  r: "rue", qu: "quai", gal: "galerie", hle: "halle", rte: "route", sen: "sente", ham: "hameau",
};

/**
 * Le nom de rue officiel (avec ses accents) donné par la Base Adresse Nationale, ou null. DVF écrit
 * « RUE BERANGER » ; la BAN répond « Rue Béranger ». On garde la minuscule du type de voie.
 */
export async function rueOfficielle(rueDvf: string, codePostal: string, signal?: AbortSignal): Promise<string | null> {
  const mots = rueDvf.split(" ").map((m) => ABREVIATIONS[m.toLowerCase()] ?? m);
  const q = encodeURIComponent(mots.join(" "));
  const r = await fetch(`https://data.geopf.fr/geocodage/search?q=${q}&postcode=${codePostal}&type=street&limit=1`, { signal });
  if (!r.ok) return null;
  const d = (await r.json()) as { features?: { properties?: { name?: string; score?: number; postcode?: string } }[] };
  const p = d.features?.[0]?.properties;
  if (!p?.name || (p.score ?? 0) < 0.6 || p.postcode !== codePostal) return null;
  return p.name.replace(/^(\p{Lu})(\p{Ll}+)\s/u, (_, a: string, b: string) => (a + b).toLowerCase() + " ");
}

/** Repli sans la BAN : abréviations développées, majuscules aux noms propres. */
export function rueLisible(rueDvf: string): string {
  const petits = new Set(["de", "du", "des", "la", "le", "les", "et", "aux", "au", "en", "sur", "sous"]);
  return rueDvf
    .split(" ")
    .map((m, i) => {
      const a = ABREVIATIONS[m.toLowerCase()];
      if (a) return i === 0 ? a.toLowerCase() : a;
      const b = m.toLowerCase();
      if (i > 0 && petits.has(b)) return b;
      return b.replace(/(^|[-'’])(\p{L})/gu, (_, x: string, y: string) => x + y.toUpperCase());
    })
    .join(" ");
}
