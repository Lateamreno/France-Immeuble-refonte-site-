import { Picto, type NomPicto } from "./Picto";

/**
 * Un chiffre de preuve : picto, valeur en or, libellé (MAV, 22/10/2026 :
 * « on ne voit pas assez les chiffres » ; le picto dit l'intention avant même
 * qu'on lise le libellé). Utilisé dans les heros et partout où un chiffre est
 * annoncé.
 */
export function Chiffre({ picto, valeur, libelle }: { picto: NomPicto; valeur: string | number; libelle: string }) {
  return (
    <span className="hero-proof__item">
      <span className="hero-proof__picto" aria-hidden="true">
        <Picto nom={picto} taille={28} />
      </span>
      <span className="hero-proof__val">{valeur}</span>
      <span className="hero-proof__lbl">{libelle}</span>
    </span>
  );
}
