import Link from "next/link";
import type { ReactNode } from "react";

type Variante = "primary" | "outline" | "light" | "ghost-dark";

/**
 * Bouton — CLAUDE.md §5. Pilule stricte sur les 4 côtés, texte centré.
 * Depuis le 22/10/2026 (MAV) : toujours or, texte noir, sans flèche, quelle
 * que soit la variante. `variant` et `icone` restent acceptés pour ne pas
 * toucher chaque appel ; la flèche n'est plus dessinée.
 */
export function Button({
  href,
  variant = "primary",
  icone = false,
  wide = false,
  children,
}: {
  href: string;
  variant?: Variante;
  icone?: boolean;
  wide?: boolean;
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
  const contenu = <>{children}</>;

  if (externe) {
    return (
      <a className={classes} href={href}>
        {contenu}
      </a>
    );
  }
  return (
    <Link className={classes} href={href}>
      {contenu}
    </Link>
  );
}
