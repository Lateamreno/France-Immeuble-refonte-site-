import type { StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { EstimationForm } from "@/components/EstimationForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { PREUVES, SITE } from "@/lib/site";
import "@/app/annonces.css";

export type PreuveAnnonce = { picto: NomPicto; titre: string; texte: string };

/**
 * Le premier écran des pages des annonces Google (lot 140) : le texte à gauche, le formulaire
 * d'estimation à droite dès 900 px, dessous au téléphone. Le visiteur a cliqué sur une annonce :
 * il doit lire, dans cet écran, ce qu'il a cherché, pourquoi nous, et pouvoir répondre.
 *
 * Gabarit de /estimation-immeuble-paris/ (`.hero-sea`, lot 99), avec la classe `lp-hero` pour ce
 * qui est neuf (src/app/annonces.css). La note Google s'affiche sans lien : on ne fait pas sortir
 * un clic payé. `children` remplace l'accroche et les preuves (page des prix) ; `pont` ferme la
 * colonne de gauche, donc précède le formulaire au téléphone.
 */
export function HeroAnnonce({
  image, alt, surtitre, titre, accroche, preuves, note = true, preuveMobile, formulaire, pont, className = "", children,
}: {
  image: StaticImageData | string;
  alt: string;
  surtitre: string;
  /** Sans titre, `children` porte le H1 de la page (page des prix : il change avec l'arrondissement). */
  titre?: ReactNode;
  accroche?: ReactNode;
  preuves?: PreuveAnnonce[];
  note?: boolean;
  /** Une seule ligne de preuve au téléphone, où la liste des preuves est masquée. */
  preuveMobile?: string;
  formulaire: "vendre" | "estimer";
  pont?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <HeroMedia image={image} alt={alt} className={`hero-sea lp-hero ${className}`.trim()}>
      <div className="sea-grille">
        <div className="sea-texte">
          <Eyebrow>{surtitre}</Eyebrow>
          {titre != null ? <h1>{titre}</h1> : null}
          {children ?? (
            <>
              {accroche ? <p className="lead">{accroche}</p> : null}
              {preuves?.length ? (
                <ul className="sea-preuves">
                  {preuves.map((p) => (
                    <li key={p.titre}>
                      <Picto nom={p.picto} taille={26} />
                      <span>
                        <strong>{p.titre}</strong> {p.texte}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
          {note ? (
            <p className="sea-note lp-note">
              <span className="sea-note__val">{PREUVES.noteGoogle}/5</span>
              <span aria-hidden="true">★★★★★</span>
              <span>{PREUVES.nbAvis} avis Google</span>
            </p>
          ) : null}
          {preuveMobile ? <p className="lp-preuve-mob">{preuveMobile}</p> : null}
          {pont}
        </div>
        <div id="estimer" className="sea-form">
          <EstimationForm
            formulaire={formulaire}
            libelleEnvoi="Estimer mon immeuble"
            chapeau="Confidentiel et sans engagement de vente."
          />
          <p className="sea-tel">
            Vous préférez en parler ? <a href={SITE.telHref}>{SITE.tel}</a>
          </p>
        </div>
      </div>
    </HeroMedia>
  );
}
