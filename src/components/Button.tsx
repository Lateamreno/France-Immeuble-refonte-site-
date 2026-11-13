import Link from "next/link";
import type { ReactNode } from "react";

type Variante = "primary" | "outline" | "light" | "ghost-dark";

/**
 * Bouton — CLAUDE.md §5. Pilule stricte sur les 4 côtés, texte centré.
 * Depuis le 22/10/2026 (MAV) : or, texte noir, sans flèche. Quand deux
 * boutons sont côte à côte, seul `primary` reste or ; l'autre variante prend
 * une couleur contrastante (globals.css §20). Un bouton seul est toujours or.
 * `icone` reste accepté pour ne pas toucher chaque appel ; la flèche n'est
 * plus dessinée.
 */
export function Button({
  href,
  variant = "primary",
  icone = false,
  wide = false,
  court,
  nouvelOnglet = false,
  children,
}: {
  href: string;
  variant?: Variante;
  icone?: boolean;
  wide?: boolean;
  /** Libellé court pour le téléphone : un bouton tient sur une ligne (MAV, 04/11/2026). */
  court?: ReactNode;
  /**
   * Ouvre le lien dans un nouvel onglet : le visiteur garde la page d'où il vient
   * (retour #340, MAV, 13/11/2026 : « il faut que cela ouvre une nouvelle page »).
   */
  nouvelOnglet?: boolean;
  children: ReactNode;
}) {
  const classes = ["btn", `btn--${variant}`, wide ? "btn--wide" : ""]
    .filter(Boolean)
    .join(" ");
  // Une ancre de même page (#estimer) doit rester un <a> natif : la passer à
  // Link déclencherait une navigation là où on veut un simple défilement.
  const externe =
    href.startsWith("tel:") || href.startsWith("mailto:") ||
    href.startsWith("http") || href.startsWith("#");
  void icone;
  const contenu = court ? (
    <><span className="btn__long">{children}</span><span className="btn__court">{court}</span></>
  ) : <>{children}</>;
  const onglet = nouvelOnglet ? { target: "_blank", rel: "noopener" } : {};
  // Les lecteurs d'écran annoncent le changement de fenêtre (même convention que la fiche d'une annonce).
  const suite = nouvelOnglet ? <span className="sr-only"> (nouvel onglet)</span> : null;

  if (externe) {
    return (
      <a className={classes} href={href} {...onglet}>
        {contenu}{suite}
      </a>
    );
  }
  return (
    <Link className={classes} href={href} {...onglet}>
      {contenu}{suite}
    </Link>
  );
}
