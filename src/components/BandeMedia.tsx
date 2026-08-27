import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

/** Bande pleine largeur : une respiration visuelle entre deux sections denses. */
export function BandeMedia({
  image,
  alt,
  children,
}: {
  image: StaticImageData;
  alt: string;
  children: ReactNode;
}) {
  return (
    <section className="bande">
      <Image
        className="bande__img"
        src={image}
        alt={alt}
        fill
        sizes="100vw"
        placeholder="blur"
      />
      <span className="bande__voile" aria-hidden="true" />
      <div className="container">
        <div className="bande__contenu">{children}</div>
      </div>
    </section>
  );
}
