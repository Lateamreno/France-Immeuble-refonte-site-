// Construit le fond de carte de Paris (public/carte/paris.json) à partir de la BD TOPO de l'IGN
// (Licence ouverte) : limites des arrondissements, Seine et canaux, grandes voies, rues.
// Coordonnées projetées en mètres (équirectangulaire autour de Paris), arrondies au mètre.
import fs from 'fs';
// node scripts/carte-paris-construire.mjs <dossier des données brutes>/ public/carte/paris.json
const D = process.argv[2];
const SORTIE = process.argv[3];
const lire = (f) => JSON.parse(fs.readFileSync(D + f, 'utf8'));
const arr = lire('arrondissements.json').features;
const eau = lire('eau.json').features;
const routes = lire('routes.json').features;

const LAT0 = 48.8566, R = 6371000, K = Math.cos((LAT0 * Math.PI) / 180);
// Emprise : les arrondissements avec une marge de 150 m.
let lonMin = 99, lonMax = -99, latMin = 99, latMax = -99;
for (const f of arr) for (const poly of f.geometry.coordinates) for (const ring of poly) for (const [lo, la] of ring) {
  lonMin = Math.min(lonMin, lo); lonMax = Math.max(lonMax, lo); latMin = Math.min(latMin, la); latMax = Math.max(latMax, la);
}
const rad = (d) => (d * Math.PI) / 180;
const px = (lo) => (rad(lo - lonMin) * R * K) + 150;
const py = (la) => (rad(latMax - la) * R) + 150;
const W = Math.ceil(px(lonMax) + 150), H = Math.ceil(py(latMin) + 150);

// Douglas-Peucker
function simplifier(pts, tol) {
  if (pts.length < 3) return pts;
  const garde = new Uint8Array(pts.length); garde[0] = garde[pts.length - 1] = 1;
  const pile = [[0, pts.length - 1]];
  while (pile.length) {
    const [a, b] = pile.pop(); let dmax = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b]; const dx = bx - ax, dy = by - ay; const l2 = dx * dx + dy * dy || 1;
    for (let i = a + 1; i < b; i++) {
      const t = Math.max(0, Math.min(1, ((pts[i][0] - ax) * dx + (pts[i][1] - ay) * dy) / l2));
      const ex = ax + t * dx - pts[i][0], ey = ay + t * dy - pts[i][1]; const d = ex * ex + ey * ey;
      if (d > dmax) { dmax = d; idx = i; }
    }
    if (dmax > tol * tol) { garde[idx] = 1; pile.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => garde[i]);
}
const proj = (coords) => coords.map(([lo, la]) => [px(lo), py(la)]);
// Chemin SVG en coordonnées relatives, entiers.
function chemin(lignes, ferme) {
  let s = '';
  for (const l of lignes) {
    const p = l.map(([x, y]) => [Math.round(x), Math.round(y)]).filter((q, i, t) => i === 0 || q[0] !== t[i - 1][0] || q[1] !== t[i - 1][1]);
    if (p.length < 2) continue;
    s += `M${p[0][0]} ${p[0][1]}`;
    let [cx, cy] = p[0];
    let rel = 'l';
    for (let i = 1; i < p.length; i++) { s += `${i === 1 ? rel : ' '}${p[i][0] - cx} ${p[i][1] - cy}`; [cx, cy] = p[i]; }
    if (ferme) s += 'z';
  }
  return s.replace(/ -/g, '-');
}
// Point dans les arrondissements (paris entier).
const anneaux = arr.flatMap((f) => f.geometry.coordinates.map((poly) => proj(poly[0])));
function dedans([x, y]) {
  for (const r of anneaux) {
    let c = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    if (c) return true;
  }
  return false;
}

const arrondissements = arr
  .map((f) => {
    const n = Number(f.properties.numero_de_l_arrondissement_municipal ?? f.properties.code_insee.slice(3));
    const polys = f.geometry.coordinates.map((poly) => simplifier(proj(poly[0]), 4));
    const tous = polys.flat();
    const xs = tous.map((p) => p[0]), ys = tous.map((p) => p[1]);
    // Centre pour l'étiquette : moyenne des sommets (suffisant pour des formes compactes).
    let cx = xs.reduce((a, b) => a + b, 0) / xs.length, cy = ys.reduce((a, b) => a + b, 0) / ys.length;
    // Le 12e et le 16e portent les bois : leur numéro va dans la partie habitée.
    const place = { 12: [2.392, 48.8405], 16: [2.2715, 48.8605] }[n];
    if (place) { cx = px(place[0]); cy = py(place[1]); }
    return {
      code: f.properties.code_insee, n,
      d: chemin(polys, true),
      c: [Math.round(cx), Math.round(cy)],
      b: [Math.round(Math.min(...xs)), Math.round(Math.min(...ys)), Math.round(Math.max(...xs)), Math.round(Math.max(...ys))],
    };
  })
  .sort((a, b) => a.n - b.n);

const eauLignes = [];
for (const f of eau) {
  if (!['Ecoulement naturel', 'Canal'].includes(f.properties.nature)) continue;
  const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  for (const poly of polys) {
    const p = proj(poly[0]);
    if (!p.some(dedans)) continue;
    eauLignes.push(simplifier(p, 3));
  }
}

const grandes = [], rues = [];
for (const f of routes) {
  const pr = f.properties;
  if (pr.fictif || Number(pr.position_par_rapport_au_sol) < 0) continue;
  if (['Sentier', 'Escalier', 'Chemin', 'Route empierrée'].includes(pr.nature)) continue;
  const imp = Number(pr.importance);
  if (imp > 5) continue;
  const p = proj(f.geometry.coordinates);
  const mid = p[Math.floor(p.length / 2)];
  if (!dedans(mid)) continue;
  (imp <= 3 ? grandes : rues).push(simplifier(p, 2));
}

const sortie = {
  source: 'IGN BD TOPO, Licence ouverte Etalab 2.0',
  vb: [W, H],
  proj: { lonMin, latMax, k: K, r: R, marge: 150 },
  arr: arrondissements,
  eau: chemin(eauLignes, true),
  grandes: chemin(grandes, false),
  rues: chemin(rues, false),
};
fs.writeFileSync(SORTIE, JSON.stringify(sortie));
const t = fs.statSync(SORTIE).size;
console.log('vb', W, H, 'arr', arrondissements.length, 'eau', eauLignes.length, 'grandes', grandes.length, 'rues', rues.length, 'taille', (t / 1024).toFixed(0), 'Ko');
