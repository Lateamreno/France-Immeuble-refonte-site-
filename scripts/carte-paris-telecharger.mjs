// Télécharge les données IGN (BD TOPO, Licence ouverte) pour le fond de carte de Paris.
import fs from 'fs';
// node scripts/carte-paris-telecharger.mjs <dossier des données brutes>/
const D = process.argv[2];
const B = 'https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&OUTPUTFORMAT=application/json';
const BBOX = 'BBOX=2.224,48.815,2.47,48.903,urn:ogc:def:crs:OGC:1.3:CRS84';
async function tout(type, props, fichier) {
  const feats = [];
  for (let i = 0; ; i += 5000) {
    const u = `${B}&TYPENAMES=${type}&${BBOX}&COUNT=5000&STARTINDEX=${i}${props ? '&PROPERTYNAME=' + props : ''}&SORTBY=cleabs`;
    let d;
    for (let essai = 0; essai < 3; essai++) {
      try { d = await (await fetch(u, { signal: AbortSignal.timeout(120000) })).json(); break; } catch (e) { console.error('réessai', type, i, e.message); }
    }
    feats.push(...d.features);
    console.log(type, i, d.features.length);
    if (d.features.length < 5000) break;
  }
  fs.writeFileSync(D + fichier, JSON.stringify({ type: 'FeatureCollection', features: feats }));
}

await tout('BDTOPO_V3:arrondissement_municipal', null, 'arrondissements.json');
await tout('BDTOPO_V3:surface_hydrographique', 'geometrie,nature', 'eau.json');
await tout('BDTOPO_V3:troncon_de_route', 'geometrie,importance,nature,nom_collaboratif_gauche,position_par_rapport_au_sol,fictif', 'routes.json');
