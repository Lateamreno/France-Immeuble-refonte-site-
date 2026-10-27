import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/Eyebrow";

/**
 * Section beige d'un écran, photo fondue dans le fond (MAV, 26/10/2026).
 *
 * Deux dispositions. `fond` : la photo couvre toute la section et pâlit vers
 * le bas, surtitre, titre, cartes et bouton partagent le même fond. `coin` :
 * une image détourée, en transparence, occupe seulement le bas droit (MAV,
 * 27/10/2026), pour une section plus calme. La section tient sur un écran
 * (`.section--ecran`) ; les cartes posées dedans doivent donc rester sur une
 * ligne qui défile plutôt que s'empiler.
 */
export function SectionFondue({
  image,
  position = "center 40%",
  coin,
  surtitre,
  titre,
  children,
  className = "",
  id,
}: {
  image: StaticImageData | string;
  /** `object-position` de la photo : ce qui doit rester visible en haut. */
  position?: string;
  /** Image détourée posée en bas à droite, avec ses dimensions d'origine. */
  coin?: { width: number; height: number };
  surtitre: string;
  titre: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`section section--creme section--ecran sec-fondu ${className}`.trim()}>
      {coin ? (
        <div className="sec-fondu__coin" aria-hidden="true">
          <Image src={image} alt="" width={coin.width} height={coin.height} sizes="(max-width: 760px) 95vw, 820px" />
        </div>
      ) : (
        <div className="sec-fondu__img" aria-hidden="true">
          <Image src={image} alt="" fill sizes="100vw" style={{ objectPosition: position }} />
        </div>
      )}
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
