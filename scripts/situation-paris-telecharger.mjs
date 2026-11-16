// Télécharge les IRIS de Paris (INSEE, diffusés par l'IGN) et les stations de métro (BD TOPO de l'IGN),
// tous deux sous Licence ouverte, pour situer chaque vente (lot 132).
// node scripts/situation-paris-telecharger.mjs <dossier des données brutes>/
import fs from 'fs';
const D = process.argv[2];
const B = 'https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&OUTPUTFORMAT=application/json';
async function lire(u) {
  for (let essai = 0; essai < 3; essai++) {
    try { return await (await fetch(u, { signal: AbortSignal.timeout(120000) })).json(); } catch (e) { console.error('réessai', e.message); }
  }
  throw new Error('IGN ne répond pas');
}
const iris = await lire(`${B}&TYPENAMES=STATISTICALUNITS.IRIS:contours_iris&COUNT=5000&CQL_FILTER=code_insee%20LIKE%20'751%25'`);
console.log('IRIS', iris.features.length);
fs.writeFileSync(D + 'iris.json', JSON.stringify(iris));
const metro = await lire(`${B}&TYPENAMES=BDTOPO_V3:equipement_de_transport&COUNT=5000&BBOX=2.20,48.80,2.50,48.92,urn:ogc:def:crs:OGC:1.3:CRS84&PROPERTYNAME=geometrie,nature,toponyme`);
const stations = metro.features.filter((f) => f.properties.nature === 'Station de métro');
console.log('stations', stations.length);
fs.writeFileSync(D + 'metro.json', JSON.stringify({ type: 'FeatureCollection', features: stations }));
