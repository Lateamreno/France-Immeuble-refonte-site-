import type { ReactNode } from "react";

/**
 * Surtitre — mono, petites capitales espacées 0.15em, bronze (CLAUDE.md §3).
 * `as="h1"` : le surtitre porte la requête et devient le titre de la page pour
 * Google, à la même taille ; le grand titre visuel passe alors en `.hero-titre`
 * (MAV, 12/11/2026, page Découpe). `as="h2"` : même chose pour un titre de section
 * (page des ventes, en-tête de chaque arrondissement, MAV, 16/11/2026).
 */
export function Eyebrow({
  children,
  bare = false,
  as: Balise = "p",
}: {
  children: ReactNode;
  bare?: boolean;
  as?: "p" | "h1" | "h2";
}) {
  return <Balise className={bare ? "eyebrow eyebrow--bare" : "eyebrow"}>{children}</Balise>;
}
