"use client";

/**
 * Deux pouces sur une seule piste, pour une fourchette (budget d'Acheter,
 * retour #86 ; occupation des immeubles à vendre, retour #94). La piste est
 * remplie entre les deux. Le pouce de droite poussé au bout veut dire « sans
 * limite » (`max` = null) : « 10 M€ et plus » ne borne rien au BO.
 */
export function DoubleCurseur({
  min, max, pas, de, a, onChange, libelle, valeurTexte,
}: {
  min: number;
  max: number;
  pas: number;
  /** null = au plus bas. */
  de: number | null;
  /** null = au plus haut, sans limite. */
  a: number | null;
  onChange: (de: number | null, a: number | null) => void;
  libelle: string;
  valeurTexte: (v: number) => string;
}) {
  const v1 = de ?? min;
  const v2 = a ?? max;
  const pct = (v: number) => `${((Math.min(Math.max(v, min), max) - min) / (max - min)) * 100}%`;
  return (
    <div className="double-curseur" style={{ ["--de" as string]: pct(v1), ["--rempli" as string]: pct(v2) }}>
      <input type="range" min={min} max={max} step={pas} value={Math.min(v1, max)} aria-label={`${libelle} minimum`}
        aria-valuetext={de == null ? "Pas de minimum" : valeurTexte(v1)}
        onChange={(e) => {
          const n = Math.min(Number(e.target.value), v2 - pas);
          onChange(n <= min ? null : n, a);
        }} />
      <input type="range" min={min} max={max} step={pas} value={Math.min(v2, max)} aria-label={`${libelle} maximum`}
        aria-valuetext={a == null ? "Sans limite" : valeurTexte(v2)}
        onChange={(e) => {
          const n = Math.max(Number(e.target.value), v1 + pas);
          onChange(de, n >= max ? null : n);
        }} />
    </div>
  );
}
