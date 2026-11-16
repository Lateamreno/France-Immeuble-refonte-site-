/**
 * Le nombre de niveaux d'un immeuble vendu (lot 134, MAV, 16/11/2026 : « tu peux ajouter le nombre
 * d'étages dans la description si on l'a quelque part »). Deux données de l'IGN sous Licence ouverte :
 * les parcelles du cadastre (Parcellaire Express) de l'acte DVF, puis les bâtiments de la BD TOPO posés
 * sur ces parcelles (centre du bâtiment dans la parcelle). On garde le plus haut : le bâtiment sur rue,
 * quand une cour en cache un plus bas. La BD TOPO compte les niveaux du bâtiment (attribut
 * `nombre_d_etages`, tiré des fichiers fonciers) ; le site écrit « sur N niveaux ».
 */
const WFS = "https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&OUTPUTFORMAT=application/json";

type Anneau = number[][];
type Geometrie = { type: string; coordinates: unknown };
type Entite = { geometry: Geometrie; properties: Record<string, unknown> };

const anneauxDe = (g: Geometrie): Anneau[] =>
  g.type === "Polygon"
    ? [(g.coordinates as Anneau[])[0]]
    : g.type === "MultiPolygon"
      ? (g.coordinates as Anneau[][]).map((p) => p[0])
      : [];

function dedans(x: number, y: number, a: Anneau): boolean {
  let ok = false;
  for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
    const [xi, yi] = a[i];
    const [xj, yj] = a[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ok = !ok;
  }
  return ok;
}

/** Centre de gravité de l'anneau le plus grand (formule du lacet). */
function centre(g: Geometrie): [number, number] | null {
  let meilleur: [number, number, number] | null = null;
  for (const a of anneauxDe(g)) {
    let s = 0, cx = 0, cy = 0;
    for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      const f = a[j][0] * a[i][1] - a[i][0] * a[j][1];
      s += f;
      cx += (a[j][0] + a[i][0]) * f;
      cy += (a[j][1] + a[i][1]) * f;
    }
    if (!s) continue;
    const aire = Math.abs(s / 2);
    if (!meilleur || aire > meilleur[2]) meilleur = [cx / (3 * s), cy / (3 * s), aire];
  }
  return meilleur ? [meilleur[0], meilleur[1]] : null;
}

async function lire(url: string, signal?: AbortSignal): Promise<Entite[]> {
  const r = await fetch(url, { cache: "no-store", signal });
  if (!r.ok) throw new Error(`IGN ${r.status}`);
  return ((await r.json()) as { features?: Entite[] }).features ?? [];
}

/** Le nombre de niveaux du plus haut bâtiment posé sur les parcelles, ou null. Lève une erreur si l'IGN ne répond pas. */
export async function niveauxDesParcelles(parcelles: readonly string[], signal?: AbortSignal): Promise<number | null> {
  const ids = parcelles.filter((p) => /^[0-9A-Z]{14}$/.test(p));
  if (!ids.length) return null;
  const filtre = encodeURIComponent(`idu IN (${ids.map((p) => `'${p}'`).join(",")})`);
  const geos = (await lire(`${WFS}&TYPENAMES=CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle&COUNT=100&CQL_FILTER=${filtre}`, signal)).flatMap((f) =>
    anneauxDe(f.geometry),
  );
  if (!geos.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const a of geos) for (const [x, y] of a) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const batis = await lire(
    `${WFS}&TYPENAMES=BDTOPO_V3:batiment&COUNT=500&BBOX=${x0},${y0},${x1},${y1},urn:ogc:def:crs:OGC:1.3:CRS84&PROPERTYNAME=geometrie,nombre_d_etages`,
    signal,
  );
  let max: number | null = null;
  for (const b of batis) {
    const n = Number(b.properties.nombre_d_etages);
    if (!n) continue;
    const c = centre(b.geometry);
    if (c && geos.some((a) => dedans(c[0], c[1], a))) max = Math.max(max ?? 0, n);
  }
  return max;
}
