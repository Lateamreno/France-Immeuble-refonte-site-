"use client";

/**
 * Un minimum au curseur (rendement d'une recherche, retour #272, MAV,
 * 05/11/2026) : la partie retenue part du pouce et va vers la droite, « 7 % et
 * plus ». Tout à gauche : pas de minimum.
 */
export function CurseurMinimum({ id, min, max, pas, valeur, onChange, libelle, unite = "%" }: {
  id: string;
  min: number;
  max: number;
  pas: number;
  /** null = pas de minimum. */
  valeur: number | null;
  onChange: (v: number | null) => void;
  libelle: string;
  unite?: string;
}) {
  const v = valeur ?? min;
  const position = `${((Math.min(Math.max(v, min), max) - min) / (max - min)) * 100}%`;
  return (
    <>
      <input id={id} type="range" className="curseur curseur--droite" min={min} max={max} step={pas} value={v}
        style={{ ["--pos" as string]: position }}
        aria-label={libelle}
        aria-valuetext={valeur == null ? "Pas de minimum" : `${v.toLocaleString("fr-FR")} ${unite} et plus`}
        onChange={(e) => { const n = Number(e.target.value); onChange(n <= min ? null : n); }} />
      <div className="curseur__bornes" aria-hidden="true">
        <span>{min} {unite}</span><span>{max} {unite}</span>
      </div>
    </>
  );
}
