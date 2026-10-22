import { prix, type Vente } from "@/lib/biens";
import { surfaceVente } from "./CarteVente";
import { VitrineDefilante, type FicheVitrine, type FormeVitrine } from "./VitrineDefilante";

const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

const montant = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M€`
    : prix(n);

/**
 * Les quatre données d'une vignette. Ce sont celles de l'ancienne vitrine
 * (surface, destination, occupation, prix) quand le BO les dépose ; à défaut,
 * le rendement et le loyer potentiel prennent la place laissée vide, pour que
 * la vignette reste pleine.
 */
function infos(v: Vente): [string, string][] {
  const candidats: [string, string | null][] = [
    ["Surface", surfaceVente(v)],
    ["Destination", v.type ?? null],
    ["Occupation", v.occupation != null ? pct(v.occupation) : null],
    ["Rendement brut", v.rendement != null ? pct(v.rendement) : null],
    ["Loyer potentiel", v.loyerPotentiel != null ? `${prix(v.loyerPotentiel)}/an` : null],
  ];
  const pleins = candidats.filter((c): c is [string, string] => c[1] != null).slice(0, 3);
  return [...pleins, ["Prix de vente", prix(v.prix)]];
}

/**
 * La vitrine des ventes de l'accueil. Les textes sont préparés ici, côté
 * serveur : le composant client ne reçoit que du texte et ne touche pas aux
 * données du BO. Vignettes en ligne ; `forme="polaroids"` pour la version
 * polaroïd gardée de côté (MAV, 22/10/2026).
 */
export function VitrineAccueil({ ventes, forme = "vignettes" }: { ventes: Vente[]; forme?: FormeVitrine }) {
  const items: FicheVitrine[] = ventes.map((v) => ({
    href: `/immeubles-vendus/${v.slug}/`,
    image: v.image,
    ville: v.ville,
    dept: v.dept,
    infos: infos(v),
    faits: [surfaceVente(v), v.rendement != null ? pct(v.rendement) : null]
      .filter((x): x is string => x != null)
      .join(" · "),
    prix: montant(v.prix),
  }));
  return <VitrineDefilante items={items} forme={forme} />;
}
