import { CARTE_VIEWBOX, REGIONS_FR } from "@/lib/carte-france";

/**
 * Le périmètre de la découpe (retour #159, MAV, 04/11/2026) : les contours de la
 * France en or sur noir, l'Île-de-France en lumière et Paris marqué. Contours des
 * régions IGN Admin Express (Licence ouverte Etalab, voir `carte-france.ts`),
 * servis par le site lui-même.
 */
export function CarteIdf() {
  const idf = REGIONS_FR["11"];
  return (
    <svg className="carte-idf" viewBox={CARTE_VIEWBOX} role="img" aria-label="Carte de France : Paris et l’Île-de-France en surbrillance">
      <defs>
        <filter id="carte-idf-halo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <radialGradient id="carte-idf-fond" cx="52%" cy="24%" r="42%">
          <stop offset="0" className="carte-idf__st1" />
          <stop offset="1" className="carte-idf__st2" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="1000" height="963" fill="url(#carte-idf-fond)" />
      {Object.entries(REGIONS_FR).map(([code, r]) => (
        <path key={code} d={r.d} className={code === "11" ? "carte-idf__idf" : "carte-idf__reg"} />
      ))}
      <path d={idf.d} className="carte-idf__halo" filter="url(#carte-idf-halo)" />
      <path d={idf.d} className="carte-idf__idf carte-idf__idf--trait" />
      <circle cx="521" cy="229" r="7" className="carte-idf__paris" />
      <circle cx="521" cy="229" r="15" className="carte-idf__onde" />
      <text x="548" y="222" className="carte-idf__nom">Paris</text>
      <text x="606" y="262" className="carte-idf__sous">Île-de-France</text>
    </svg>
  );
}
