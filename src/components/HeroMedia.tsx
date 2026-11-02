import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

/**
 * Hero avec visuel de fond — le modèle de TOUTES les pages (MAV, 22/10/2026,
 * sur la page Acheter) : image pleine largeur et pleine hauteur d'écran,
 * surtitre or clair, titre blanc avec les mots importants en or
 * (`<span className="accent">`), courte description blanche, puis une petite
 * flèche or, discrète, qui invite à défiler.
 *
 * `priority` est posé sur l'image : c'est le LCP de la page, la retarder
 * dégraderait directement les Core Web Vitals. Le voile sombre est obligatoire :
 * sans lui, le texte crème devient illisible sur les zones éclairées de l'image.
 */
export function HeroMedia({
  image,
  alt,
  className = "",
  compact = false,
  children,
}: {
  /** Visuel importé (flou de chargement) ou chemin servi par le site. */
  image: StaticImageData | string;
  alt: string;
  className?: string;
  /**
   * Bandeau court : le titre et l'image de fond, sans flèche ni pleine hauteur.
   * Pour les pages qui doivent montrer leur contenu tout de suite (MAV,
   * 02/11/2026 : Immeubles à vendre, retour #72 sur Contact).
   */
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`hero-media${compact ? " hero-media--compact" : ""} ${className}`.trim()}>
      <Image
        className="hero-media__img"
        src={image}
        alt={alt}
        fill
        priority
        sizes="100vw"
        placeholder={typeof image === "string" ? "empty" : "blur"}
      />
      <span className="hero-media__voile" aria-hidden="true" />
      <div className="container">{children}</div>
      {!compact && <a className="hero-media__suite" href="#apres-hero" aria-label="Faire défiler vers la suite">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </a>}
      <span id="apres-hero" className="hero-media__ancre" aria-hidden="true" />
    </section>
  );
}
