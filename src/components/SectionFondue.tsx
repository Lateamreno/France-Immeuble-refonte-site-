import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/Eyebrow";

/**
 * Section beige d'un écran, photo fondue dans le fond (MAV, 26/10/2026).
 *
 * La photo couvre toute la section et pâlit vers le bas : surtitre, titre,
 * cartes et bouton partagent le même fond. La section tient sur un écran
 * (`.section--ecran`) ; les cartes posées dedans doivent donc rester sur une
 * ligne qui défile plutôt que s'empiler.
 */
export function SectionFondue({
  image,
  position = "center 40%",
  surtitre,
  titre,
  children,
  className = "",
  id,
}: {
  image: StaticImageData | string;
  /** `object-position` de la photo : ce qui doit rester visible en haut. */
  position?: string;
  surtitre: string;
  titre: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`section section--creme section--ecran sec-fondu ${className}`.trim()}>
      <div className="sec-fondu__img" aria-hidden="true">
        <Image src={image} alt="" fill sizes="100vw" style={{ objectPosition: position }} />
      </div>
      <div className="container">
        <div className="section__head sec-fondu__tete">
          <Eyebrow>{surtitre}</Eyebrow>
          <h2>{titre}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}
