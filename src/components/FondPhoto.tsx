import Image, { type StaticImageData } from "next/image";

/**
 * Une photo fondue dans le fond d'une section sombre (MAV, 02/11/2026 : « la
 * page Vendre manque de photos sur quelques sections »). Elle occupe un côté
 * et s'efface vers l'autre, où se trouve le formulaire ; au téléphone, elle
 * passe derrière le titre et s'efface vers le bas. C'est la seule couche
 * d'image de la section (§5).
 */
export function FondPhoto({
  image, cote = "gauche", position = "center",
}: {
  image: StaticImageData | string;
  cote?: "gauche" | "droite";
  /** object-position de la photo, pour garder son sujet dans la partie visible. */
  position?: string;
}) {
  return (
    <div className={`fond-photo fond-photo--${cote}`} aria-hidden="true">
      <Image src={image} alt="" fill sizes="(max-width: 900px) 100vw, 60vw" style={{ objectPosition: position }}
        placeholder={typeof image === "string" ? "empty" : "blur"} />
    </div>
  );
}
