import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export type ImageTete = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Visuel détouré (fond transparent) : posé tel quel, sans cadre. */
  libre?: boolean;
};

/**
 * En-tête de section avec une image à côté du texte.
 *
 * Retour de MAV du 22/10/2026 : les sections crème enchaînaient titre, texte
 * et cartes sans une image, et la page devenait monotone. Une photo
 * d'immeuble (ou un immeuble détouré) à droite du titre casse cette monotonie
 * sans ajouter de texte. Sous 900 px, l'image passe sous le texte, plus basse.
 */
export function TeteMedia({ image, children }: { image: ImageTete; children: ReactNode }) {
  return (
    <div className="tete-media">
      <Reveal className="section__head tete-media__texte">{children}</Reveal>
      <Reveal delayIndex={1} className={`tete-media__visuel${image.libre ? " tete-media__visuel--libre" : ""}`}>
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(max-width: 900px) 100vw, 520px"
        />
      </Reveal>
    </div>
  );
}
