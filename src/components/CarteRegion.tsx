import { CARTE_VIEWBOX, REGIONS_FR } from "@/lib/carte-france";

/**
 * La France en filigrane, une région éclairée en bronze — derrière chaque
 * groupe de ventes (retour de MAV du 21/10/2026). Décor pur : masqué aux
 * lecteurs d'écran, le nom de la région est dans le titre du groupe.
 */
export function CarteRegion({ region, className = "" }: { region: string; className?: string }) {
  return (
    <svg
      className={`carte-region ${className}`}
      viewBox={CARTE_VIEWBOX}
      aria-hidden="true"
      focusable="false"
    >
      {Object.entries(REGIONS_FR).map(([code, r]) => (
        <path key={code} d={r.d} className={code === region ? "carte-region__active" : undefined} />
      ))}
    </svg>
  );
}

export function nomRegion(code: string): string {
  return REGIONS_FR[code]?.nom ?? "Autres régions";
}
