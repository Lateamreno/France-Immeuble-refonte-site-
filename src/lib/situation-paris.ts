import donnees from "./situation-paris.json";

/**
 * Situer une vente dans Paris (lot 132, MAV, 16/11/2026 : « son adresse avec deux trois indications sur
 * l'adresse ») : le quartier (IRIS de l'INSEE, diffusés par l'IGN) et la station de métro la plus proche
 * (BD TOPO de l'IGN), tous deux sous Licence ouverte. Refaire les données : `scripts/situation-paris-telecharger.mjs`
 * puis `scripts/situation-paris-construire.mjs`.
 *
 * Rien qui désigne l'immeuble plus que sa rue : ni angle de rue ni voisin, le quartier et le métro
 * couvrent des centaines d'immeubles.
 */
type Quartier = { c: string; q: string | null; p: number[][][] };
type Station = { n: string; x: number; y: number };
const QUARTIERS = donnees.quartiers as Quartier[];
const STATIONS = donnees.stations as Station[];

export type Situation = {
  /** Le nom tel qu'il s'écrit après « le quartier » (« de la Roquette », « Saint-Ambroise »). */
  quartier: string | null;
  metro: string | null;
  /** Distance au métro, en mètres, arrondie à 50 m. */
  metroM: number | null;
};

function dedans(x: number, y: number, anneau: number[][]): boolean {
  let ok = false;
  for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
    const [xi, yi] = anneau[i];
    const [xj, yj] = anneau[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ok = !ok;
  }
  return ok;
}

const METRES_PAR_DEGRE = 111_320;
const METRO_MAX = 1000;

export function situer(lat: number | null, lon: number | null): Situation {
  if (lat == null || lon == null) return { quartier: null, metro: null, metroM: null };
  const q = QUARTIERS.find((z) => z.p.some((anneau) => dedans(lon, lat, anneau)));
  const kx = Math.cos((lat * Math.PI) / 180) * METRES_PAR_DEGRE;
  let meilleur: Station | null = null;
  let d = Infinity;
  for (const s of STATIONS) {
    const e = Math.hypot((s.x - lon) * kx, (s.y - lat) * METRES_PAR_DEGRE);
    if (e < d) {
      d = e;
      meilleur = s;
    }
  }
  const proche = meilleur && d <= METRO_MAX;
  return {
    quartier: q?.q ?? null,
    metro: proche ? meilleur!.n : null,
    metroM: proche ? Math.max(50, Math.round(d / 50) * 50) : null,
  };
}
