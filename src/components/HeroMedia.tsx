import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

/**
 * Hero avec visuel de fond.
 *
 * `priority` est posé sur l'image : c'est le LCP de la page, la retarder
 * dégraderait directement les Core Web Vitals. Le voile sombre est obligatoire —
 * sans lui, le texte crème devient illisible sur les zones éclairées de l'image.
 */
export function HeroMedia({
  image,
  alt,
  className = "",
  children,
}: {
  image: StaticImageData;
  alt: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`hero-media ${className}`.trim()}>
      <Image
        className="hero-media__img"
        src={image}
        alt={alt}
        fill
        priority
        sizes="100vw"
        placeholder="blur"
      />
      <span className="hero-media__voile" aria-hidden="true" />
      <div className="container">{children}</div>
    </section>
  );
}
