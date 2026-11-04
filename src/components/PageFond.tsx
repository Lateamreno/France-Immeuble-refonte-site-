import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

/**
 * Une page sans hero, posée sur une seule image de fond qui court sous toute
 * la page (MAV, 02/11/2026 : « c'est sur toute la page, pas juste sur la
 * première partie où il y a le titre »). Pour Immeubles à vendre et Contact.
 *
 * L'image reste en place pendant qu'on défile : elle est collée (sticky) dans
 * un calque qui couvre toute la page, ce qui marche aussi sur iPhone, où
 * `background-attachment: fixed` est ignoré. Un voile sombre garde le texte
 * lisible partout. Les sections à l'intérieur perdent leur propre fond.
 */
export function PageFond({
  image, titre, className = "", children,
}: {
  image: StaticImageData | string;
  /** Sans titre, la page place elle-même son h1 (Contact, retour #172). */
  titre?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`page-fond ${className}`.trim()}>
      <div className="page-fond__calque" aria-hidden="true">
        <div className="page-fond__colle">
          <Image src={image} alt="" fill priority sizes="100vw" className="page-fond__img"
            placeholder={typeof image === "string" ? "empty" : "blur"} />
          <span className="page-fond__voile" />
        </div>
      </div>
      {titre && (
        <div className="page-fond__tete">
          <div className="container">
            <h1>{titre}</h1>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
