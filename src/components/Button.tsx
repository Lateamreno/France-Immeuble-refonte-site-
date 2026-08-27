import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon } from "./ArrowIcon";

type Variante = "primary" | "outline" | "light" | "ghost-dark";

/**
 * Bouton — CLAUDE.md §5. Pilule stricte sur les 4 côtés, texte centré même
 * avec icône, icône à droite. Aucune variante ne doit déroger à la forme.
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
  const externe = href.startsWith("tel:") || href.startsWith("mailto:") || href.startsWith("http");
  const contenu = (
    <>
      {children}
      {icone && <ArrowIcon />}
    </>
  );

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
