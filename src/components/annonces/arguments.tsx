import { Button } from "@/components/Button";
import { Picto, type NomPicto } from "@/components/Picto";
import { insecable } from "@/components/SectionFaq";
import type { NoteFiabilite } from "@/lib/immeubles-dvf-lecture";

/**
 * Les briques de la page Paris (/vendre-un-immeuble/paris/), sorties de sa page au lot 140 pour
 * servir aussi aux pages des annonces Google. Leur rendu ne change pas.
 */

/**
 * Un bouton d'estimation en fin de section sur ordinateur (« des boutons réguliers »). Au téléphone,
 * la pilule fixe le remplace (`double-fixe`) : avec `.porte-action` sur chaque section, elle ne
 * s'affichait plus nulle part.
 */
export function Relance({ libelle = "Estimer mon immeuble", court }: { libelle?: string; court?: string }) {
  return (
    <div className="btn-row paris-relance">
      <Button href="#estimer" court={court}>{libelle}</Button>
    </div>
  );
}

/**
 * Une phrase d'un avis Google, reprise au mot près de `AVIS` (src/lib/accueil.ts) ; « … » marque la
 * coupe. Retours #368 et #373 (« on comprend pas que c'est une citation, mets peut-être les
 * guillemets en gros, stylisés et or ») : un grand guillemet or ouvre la citation et la détache du
 * texte qui précède, un guillemet or la ferme. Même dessin partout, y compris dans une carte.
 */
export function Citation({ texte, auteur }: { texte: string; auteur: string }) {
  return (
    <figure className="paris-citation">
      <span className="paris-citation__ouvre" aria-hidden="true">«</span>
      <blockquote>
        {texte}
        <span className="paris-citation__ferme" aria-hidden="true">&nbsp;»</span>
      </blockquote>
      <figcaption>{auteur}, avis Google</figcaption>
    </figure>
  );
}

export type Carte = { picto: NomPicto; titre: string; texte: string; citation?: { texte: string; auteur: string } };

/**
 * Une carte d'argument : picto, titre, texte. Toujours trois éléments, dans cet ordre : la rangée
 * les aligne d'une carte à l'autre (retours #338 et #339, sous-grille dans globals.css). Une
 * citation partage la case du texte et se cale en bas de la carte.
 */
export function CarteArgument({ picto, titre, texte, citation }: Carte) {
  return (
    <article className="paris-carte">
      <Picto nom={picto} taille={30} />
      <h3>{titre}</h3>
      {citation ? (
        <div className="paris-carte__corps">
          <p>{insecable(texte)}</p>
          <Citation {...citation} />
        </div>
      ) : (
        <p>{insecable(texte)}</p>
      )}
    </article>
  );
}

/**
 * La note de fiabilité d'un prix médian (retour #325, puis MAV, 13/11/2026 : « C'est moche
 * l'affichage de la fiabilité. Mets-nous soit une note sur 5 soit des étoiles 1 à 3 donc étoiles
 * vides et étoiles pleines ») : trois étoiles, pleines jusqu'à la note, vides ensuite ; « 2 étoiles
 * sur 3 » pour les lecteurs d'écran.
 */
export function Fiabilite({ note }: { note: NoteFiabilite }) {
  return (
    <>
      <span className="paris-fiab" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <svg key={i} viewBox="0 0 24 24" width="15" height="15" className={i <= note ? "est-pleine" : undefined}>
            <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" />
          </svg>
        ))}
      </span>
      <span className="sr-only">{note} {note > 1 ? "étoiles" : "étoile"} sur 3</span>
    </>
  );
}
