import { CARTE_VIEWBOX, REGIONS_FR } from "@/lib/carte-france";

/**
 * Le périmètre de la découpe (retour #179, MAV, 04/11/2026 : « trop réaliste ; juste des
 * lignes dessinées en or pour le contour et un peu plus lumineux sur la zone qu'on
 * dessert »). Les contours des régions au trait or (IGN Admin Express, Licence ouverte
 * Etalab, voir `carte-france.ts`), l'Île-de-France allumée d'un halo, Paris marqué.
 * Vectoriel, servi par le site, sans image.
 */
const PARIS = { x: 509.5, y: 236.6 };

export function CarteIdf() {
  const idf = REGIONS_FR["11"];
  return (
    <svg className="carte-idf" viewBox={CARTE_VIEWBOX} role="img" aria-label="Carte de France au trait or : l’Île-de-France et Paris en lumière">
      <defs>
        <filter id="carte-idf-halo" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <radialGradient id="carte-idf-zone" cx="50%" cy="45%" r="60%">
          <stop offset="0" className="carte-idf__st1" />
          <stop offset="1" className="carte-idf__st2" />
        </radialGradient>
      </defs>
      {Object.entries(REGIONS_FR).filter(([c]) => c !== "11").map(([code, r]) => (
        <path key={code} d={r.d} className="carte-idf__reg" />
      ))}
      <path d={idf.d} className="carte-idf__halo" filter="url(#carte-idf-halo)" />
      <path d={idf.d} className="carte-idf__idf" />
      <circle cx={PARIS.x} cy={PARIS.y} r="7" className="carte-idf__paris" />
      <circle cx={PARIS.x} cy={PARIS.y} r="16" className="carte-idf__onde" />
      <line x1={PARIS.x + 18} y1={PARIS.y - 10} x2={PARIS.x + 120} y2={PARIS.y - 70} className="carte-idf__fil" />
      <text x={PARIS.x + 128} y={PARIS.y - 74} className="carte-idf__nom">Paris</text>
      <text x={PARIS.x + 128} y={PARIS.y - 44} className="carte-idf__sous">et l’Île-de-France</text>
    </svg>
  );
}
