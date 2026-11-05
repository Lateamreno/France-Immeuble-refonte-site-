import Link from "next/link";

/**
 * Au téléphone, l'onglet « Acheter » réunit les biens proposés et les
 * recherches (MAV, 05/11/2026) : ce sélecteur passe de l'un à l'autre. Sur
 * ordinateur, le menu de gauche suffit.
 */
export function OngletsAcheter({ actif }: { actif: "biens" | "recherches" }) {
  const liens = [
    ["biens", "/mon-compte/biens/", "Biens proposés"],
    ["recherches", "/mon-compte/recherches/", "Mes recherches"],
  ] as const;
  return (
    <nav className="onglets-acheter" aria-label="Acheter">
      {liens.map(([k, href, nom]) => (
        <Link key={k} href={href} className={`onglets-acheter__i${k === actif ? " est-actif" : ""}`}
          aria-current={k === actif ? "page" : undefined}>{nom}</Link>
      ))}
    </nav>
  );
}
