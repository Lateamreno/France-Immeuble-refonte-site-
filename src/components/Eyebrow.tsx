import type { ReactNode } from "react";

/** Surtitre — mono, petites capitales espacées 0.15em, bronze (CLAUDE.md §3). */
export function Eyebrow({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  return <p className={bare ? "eyebrow eyebrow--bare" : "eyebrow"}>{children}</p>;
}
