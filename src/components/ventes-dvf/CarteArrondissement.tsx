import carte from "../../../public/carte/paris.json";

/**
 * Paris en filigrane, un arrondissement éclairé en bronze, dans l'en-tête de chaque arrondissement de la
 * page des ventes (MAV, 16/11/2026 : « à chaque arrondissement la carte comme pour les immeubles vendus »).
 * Mêmes contours que la carte des ventes (BD TOPO de l'IGN, `public/carte/paris.json`), dessinés au serveur.
 * Décor pur : masqué aux lecteurs d'écran, l'arrondissement est dans le titre.
 */
type Arr = { code: string; n: number; d: string; b: number[] };
const ARRONDISSEMENTS = (carte as { arr: Arr[] }).arr;
const MARGE = 120;
const X0 = Math.min(...ARRONDISSEMENTS.map((a) => a.b[0])) - MARGE;
const Y0 = Math.min(...ARRONDISSEMENTS.map((a) => a.b[1])) - MARGE;
const X1 = Math.max(...ARRONDISSEMENTS.map((a) => a.b[2])) + MARGE;
const Y1 = Math.max(...ARRONDISSEMENTS.map((a) => a.b[3])) + MARGE;
const VIEWBOX = `${X0} ${Y0} ${X1 - X0} ${Y1 - Y0}`;

export function CarteArrondissement({ code }: { code: string }) {
  return (
    <svg className="vdvf-arr__carte" viewBox={VIEWBOX} aria-hidden="true" focusable="false">
      {ARRONDISSEMENTS.map((a) => (
        <path key={a.code} d={a.d} className={a.code === code ? "is-actif" : undefined} />
      ))}
    </svg>
  );
}
