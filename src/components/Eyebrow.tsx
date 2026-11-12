import type { ReactNode } from "react";

/**
 * Surtitre — mono, petites capitales espacées 0.15em, bronze (CLAUDE.md §3).
 * `as="h1"` : le surtitre porte la requête et devient le titre de la page pour
 * Google, à la même taille ; le grand titre visuel passe alors en `.hero-titre`
 * (MAV, 12/11/2026, page Découpe).
 */
export function Eyebrow({
  children,
  bare = false,
  as: Balise = "p",
}: {
  children: ReactNode;
  bare?: boolean;
  as?: "p" | "h1";
}) {
  return <Balise className={bare ? "eyebrow eyebrow--bare" : "eyebrow"}>{children}</Balise>;
}
