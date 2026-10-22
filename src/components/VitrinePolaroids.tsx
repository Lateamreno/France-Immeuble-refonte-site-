import { prix, type Vente } from "@/lib/biens";
import { surfaceVente } from "./CarteVente";
import { Polaroids, type Polaroid } from "./Polaroids";

const montant = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M€`
    : prix(n);

/**
 * La vitrine des ventes de l'accueil, en polaroïds (MAV, 22/10/2026). Les
 * légendes sont préparées ici, côté serveur : le composant client ne reçoit
 * que du texte et ne touche pas aux données du BO.
 */
export function VitrinePolaroids({ ventes }: { ventes: Vente[] }) {
  const items: Polaroid[] = ventes.map((v) => {
    const faits = [
      surfaceVente(v),
      v.rendement != null ? `${v.rendement.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : null,
    ].filter((x): x is string => x != null);
    return {
      href: `/immeubles-vendus/${v.slug}/`,
      image: v.image,
      ville: v.ville,
      dept: v.dept,
      faits: faits.join(" · "),
      prix: montant(v.prix),
    };
  });
  return <Polaroids items={items} />;
}
