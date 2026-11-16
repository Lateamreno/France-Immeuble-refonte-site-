// Construit src/lib/situation-paris.json : les quartiers (IRIS de l'INSEE, IGN) et les stations de métro
// (BD TOPO de l'IGN) de Paris, tous deux sous Licence ouverte, pour situer chaque vente (lot 132).
// node scripts/situation-paris-construire.mjs <dossier des données brutes>/
import fs from 'fs';
const D = process.argv[2];

// Le nom du quartier tel qu'il s'écrit après « le quartier » (« de la Roquette », « Saint-Ambroise »).
// null : un IRIS qui n'est pas un quartier habité (berges, bois).
const NOMS = {
  'Les Halles': 'des Halles', 'Palais Royal': 'du Palais-Royal', 'Place Vendôme': 'de la place Vendôme',
  "Saint-Germain l'Auxerrois": "Saint-Germain-l'Auxerrois", 'Tuileries': 'des Tuileries',
  'Bonne Nouvelle': 'de Bonne-Nouvelle', 'Gaillon': 'Gaillon', 'Mail': 'du Mail', 'Vivienne': 'Vivienne',
  'Arts et Métiers': 'des Arts-et-Métiers', 'Enfants Rouges': 'des Enfants-Rouges', 'Les Archives': 'des Archives',
  'Sainte-Avoye': 'Sainte-Avoye', 'Arsenal': "de l'Arsenal", "Bassin de l'Arsenal": "de l'Arsenal",
  'Notre-Dame': 'Notre-Dame', 'Saint-Gervais': 'Saint-Gervais', 'Saint-Merri': 'Saint-Merri',
  'Jardin des Plantes': 'du Jardin-des-Plantes', 'Saint-Victor': 'Saint-Victor', 'Sorbonne': 'de la Sorbonne',
  'Val de Grâce': 'du Val-de-Grâce', 'Jardin du Luxembourg': 'du Luxembourg', 'Monnaie': 'de la Monnaie',
  'Notre-Dame des Champs': 'Notre-Dame-des-Champs', 'Odéon': "de l'Odéon", 'Saint-Germain des Prés': 'Saint-Germain-des-Prés',
  'Champ de Mars': 'du Champ-de-Mars', 'Gros Caillou': 'du Gros-Caillou', 'Invalides': 'des Invalides',
  "Saint-Thomas d'Aquin": "Saint-Thomas-d'Aquin", 'École Militaire': "de l'École-Militaire",
  'Champs Élysées': 'des Champs-Élysées', 'Concorde Jardin Champs Élysées': 'des Champs-Élysées', 'Europe': "de l'Europe",
  'Faubourg du Roule': 'du Faubourg-du-Roule', 'Madeleine': 'de la Madeleine',
  "Chaussée d'Antin": "de la Chaussée-d'Antin", 'Faubourg Montmartre': 'du Faubourg-Montmartre',
  'Rochechouart': 'Rochechouart', 'Saint-Georges': 'Saint-Georges',
  'Canal Saint-Martin': 'du canal Saint-Martin', 'Hôpital Saint-Louis': "de l'Hôpital-Saint-Louis",
  'Porte Saint-Denis': 'de la Porte-Saint-Denis', 'Porte Saint-Martin': 'de la Porte-Saint-Martin',
  'Saint-Vincent de Paul': 'Saint-Vincent-de-Paul',
  'Folie Méricourt': 'de la Folie-Méricourt', 'Roquette': 'de la Roquette', 'Saint-Ambroise': 'Saint-Ambroise',
  'Sainte-Marguerite': 'Sainte-Marguerite',
  'Bel-Air': 'du Bel-Air', 'Bercy': 'de Bercy', 'Jardin de Bercy': 'de Bercy', 'Picpus': 'de Picpus',
  'Quinze-Vingts': 'des Quinze-Vingts',
  'Croulebarbe': 'de Croulebarbe', 'Gare': 'de la Gare', 'Maison Blanche': 'de la Maison-Blanche',
  'Salpêtrière': 'de la Salpêtrière',
  'Montparnasse': 'du Montparnasse', 'Parc de Montsouris': 'du Parc-de-Montsouris', 'Petit Montrouge': 'du Petit-Montrouge',
  'Plaisance': 'de Plaisance',
  'Grenelle': 'de Grenelle', 'Jardin Citroën-Cévennes': 'de Javel', 'Javel': 'de Javel', 'Necker': 'Necker',
  'Saint-Lambert': 'Saint-Lambert',
  'Auteuil': "d'Auteuil", 'Chaillot': 'de Chaillot', 'Muette': 'de la Muette', 'Porte Dauphine': 'de la Porte-Dauphine',
  'Batignolles': 'des Batignolles', 'Plaine Monceau': 'de la Plaine-Monceau', 'Ternes': 'des Ternes', 'Épinettes': 'des Épinettes',
  'Chapelle': 'de la Chapelle', 'Clignancourt': 'de Clignancourt', "Goutte d'Or": "de la Goutte-d'Or",
  'Grandes Carrières': 'des Grandes-Carrières',
  'Amérique': "d'Amérique", 'Bassin de la Villette': 'de la Villette', 'Buttes Chaumont': 'des Buttes-Chaumont',
  'Canal Saint-Denis': 'du canal Saint-Denis', 'Combat': 'du Combat', 'Pont de Flandre': 'du Pont-de-Flandre',
  'Villette': 'de la Villette',
  'Belleville': 'de Belleville', 'Charonne': 'de Charonne', 'Père Lachaise': 'du Père-Lachaise', 'Saint-Fargeau': 'Saint-Fargeau',
  'Seine et Berges': null, 'Bois de Vincennes': null, 'Bois de Boulogne': null,
};

const r5 = (x) => Math.round(x * 1e5) / 1e5;
// Douglas-Peucker, tolérance de 4 m environ : le quartier se lit à la parcelle près.
function simplifier(anneau, tol = 0.00004) {
  if (anneau.length < 5) return anneau;
  // Un anneau fermé : on le coupe au point le plus éloigné du premier, puis chaque moitié se simplifie.
  let loin = 1, max = 0;
  for (let i = 1; i < anneau.length - 1; i++) {
    const e = Math.hypot(anneau[i][0] - anneau[0][0], anneau[i][1] - anneau[0][1]);
    if (e > max) { max = e; loin = i; }
  }
  return [...ligne(anneau.slice(0, loin + 1), tol).slice(0, -1), ...ligne(anneau.slice(loin), tol)];
}
function ligne(pts, tol) {
  if (pts.length < 3) return pts;
  const garde = new Uint8Array(pts.length); garde[0] = garde[pts.length - 1] = 1;
  const pile = [[0, pts.length - 1]];
  while (pile.length) {
    const [a, b] = pile.pop();
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1e-12;
    let max = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / l;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol) { garde[idx] = 1; pile.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => garde[i]);
}

const iris = JSON.parse(fs.readFileSync(D + 'iris.json'));
const quartiers = [];
const inconnus = new Set();
for (const f of iris.features) {
  const brut = f.properties.nom_iris.replace(/\s+\d+$/, '');
  if (!(brut in NOMS)) inconnus.add(brut);
  const nom = NOMS[brut] ?? null;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  // Seul l'anneau extérieur compte : un IRIS de Paris n'a pas de trou habité.
  quartiers.push({ c: f.properties.code_insee, q: nom && nom.replaceAll("'", '’'), p: polys.map((p) => simplifier(p[0]).map(([x, y]) => [r5(x), r5(y)])) });
}
if (inconnus.size) { console.error('Quartiers sans nom affiché :', [...inconnus]); process.exit(1); }

const metro = JSON.parse(fs.readFileSync(D + 'metro.json'));
const stations = [];
for (const f of metro.features) {
  let sx = 0, sy = 0, n = 0;
  for (const poly of f.geometry.coordinates) for (const [x, y] of poly[0]) { sx += x; sy += y; n++; }
  const nom = f.properties.toponyme.replace(/\s*\(.*\)\s*$/, '').trim().replaceAll("'", '’');
  stations.push({ n: nom.charAt(0).toUpperCase() + nom.slice(1), x: r5(sx / n), y: r5(sy / n) });
}
const sortie = { source: 'IGN, IRIS de l’INSEE et BD TOPO, Licence ouverte', quartiers, stations };
fs.writeFileSync('src/lib/situation-paris.json', JSON.stringify(sortie));
console.log('quartiers', quartiers.length, 'stations', stations.length, 'octets', JSON.stringify(sortie).length);
