import { isValidElement, type ReactNode } from "react";

/**
 * Le texte brut d'une réponse écrite en JSX, pour les données FAQPage de Google (MAV,
 * 09/11/2026 : FAQ de la Découpe). Suit les enfants et déroule les petits composants sans
 * état (liens Plein Bail, Team Reno) ; chaque paragraphe est séparé d'une espace.
 */
export function texteDe(n: ReactNode): string {
  if (n == null || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(texteDe).join(" ");
  if (isValidElement(n)) {
    const { type, props } = n as { type: unknown; props: { children?: ReactNode } };
    if (typeof type === "function") return texteDe((type as (p: unknown) => ReactNode)(props));
    return texteDe(props.children);
  }
  return "";
}

/** Espaces resserrées, et pas d'espace avant un point ou une virgule. */
export const texteFaq = (n: ReactNode) =>
  texteDe(n).replace(/\s+/g, " ").replace(/ ([.,])/g, "$1").trim();
