import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/Eyebrow";

/**
 * ⚠️ PROVISOIRE — sommaire de staging, PAS la homepage.
 *
 * La vraie homepage arrive en M7, et son title/meta sont gelés au caractère
 * près (CLAUDE.md §10). Cette page doit impérativement être remplacée avant
 * toute bascule DNS : sinon c'est elle qui serait servie sur `/`.
 */
export const metadata: Metadata = {
  title: "Staging visuel",
  robots: { index: false, follow: false },
};

const PAGES = [
  { href: "/design-system/", label: "Design system", lot: "M1" },
  { href: "/vendre-un-immeuble/", label: "/vendre-un-immeuble/", lot: "M1" },
];

export default function StagingIndex() {
  return (
    <section className="section section--noir" style={{ minHeight: "70vh" }}>
      <div className="container">
        <Eyebrow>Staging visuel &middot; non indexé</Eyebrow>
        <h1>Refonte France&nbsp;Immeuble</h1>
        <p className="lead" style={{ marginTop: "var(--space-s)", maxWidth: "56ch" }}>
          Environnement de validation. Cette page est un sommaire provisoire —
          la homepage définitive arrive en M7.
        </p>

        <div style={{ marginTop: "var(--space-l)", maxWidth: 640 }}>
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "var(--space-s)",
                padding: "var(--space-s) 0",
                borderTop: "1px solid var(--color-ligne)",
              }}
            >
              <strong style={{ fontSize: "1.05rem" }}>{p.label}</strong>
              <span
                className="mono"
                style={{
                  fontSize: "var(--fs-eyebrow)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--color-bronze)",
                }}
              >
                {p.lot}
              </span>
            </Link>
          ))}
          <div style={{ borderTop: "1px solid var(--color-ligne)" }} />
        </div>
      </div>
    </section>
  );
}
