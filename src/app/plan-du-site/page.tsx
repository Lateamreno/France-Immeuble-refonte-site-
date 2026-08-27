import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/Eyebrow";

/** /plan-du-site/ — URL existante conservée (CLAUDE.md §10). */
export const metadata: Metadata = {
  title: "Plan du site",
  description: "Toutes les pages de France Immeuble.",
  alternates: { canonical: "/plan-du-site/" },
};

const SECTIONS = [
  {
    titre: "Vendre",
    liens: [
      { href: "/vendre-un-immeuble/", label: "Vendre un immeuble de rapport" },
      { href: "/vendre-a-la-decoupe/", label: "Vendre à la découpe" },
      { href: "/estimer-un-immeuble/", label: "Estimer un immeuble" },
    ],
  },
  {
    titre: "Acheter",
    liens: [{ href: "/acheter-un-immeuble/", label: "Accès investisseurs" }],
  },
  {
    titre: "L’agence",
    liens: [
      { href: "/", label: "Accueil" },
      { href: "/immeubles-vendus/", label: "Nos biens vendus" },
      { href: "/contactez-nous/", label: "Nous contacter" },
      { href: "/mentions-legales-2/", label: "Mentions légales" },
    ],
  },
];

export default function PlanDuSite() {
  return (
    <section className="section section--noir">
      <div className="container container--narrow">
        <Eyebrow>Navigation</Eyebrow>
        <h1 style={{ marginBottom: "var(--space-l)" }}>Plan du site</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-l)" }}>
          {SECTIONS.map((s) => (
            <div key={s.titre} className="railed railed--thin">
              <h3 style={{ marginBottom: "var(--space-xs)" }}>{s.titre}</h3>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {s.liens.map((l) => (
                  <li key={l.href}>
                    <Link className="link-arrow" href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="small muted" style={{ marginTop: "var(--space-xl)" }}>
          Le blog et ses articles rejoindront ce plan une fois le pipeline de contenu en place.
        </p>
      </div>
    </section>
  );
}
