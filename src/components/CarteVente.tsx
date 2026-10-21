import Image from "next/image";
import Link from "next/link";
import { Picto } from "./Picto";
import { prix, type Vente } from "@/lib/biens";

/** « 4,1 % », « +3 % » — formats français. */
const pct = (n: number, signe = false) =>
  `${signe && n > 0 ? "+" : ""}${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** « 400 à 500 m² » : la surface reste en tranche (§2). */
export const surfaceVente = (v: Vente) =>
  v.surfaceMin && v.surfaceMax
    ? `${v.surfaceMin.toLocaleString("fr-FR")} à ${v.surfaceMax.toLocaleString("fr-FR")} m²`
    : null;

/** « Offre en 3 semaines » ; moins de 14 jours : en jours. */
export const delaiOffre = (j: number) =>
  j < 14 ? `${j} jour${j > 1 ? "s" : ""}` : `${Math.round(j / 7)} semaines`;

/**
 * Vignette d'une vente réalisée. Toute la carte mène à la fiche de la vente :
 * un seul arrêt de tabulation, une seule cible au doigt, et le nom de la
 * commune porte le nom accessible du lien.
 *
 * Ce que MAV veut lire d'un coup d'œil (retour du 21/10/2026) : la ville, la
 * surface, le loyer potentiel, le rendement et le prix. Aucune date de vente.
 * L'écart à l'estimation et le délai avant l'offre suivent sur une ligne quand
 * le BO les a déposés, et sur la fiche dans tous les cas.
 */
export function CarteVente({ v }: { v: Vente }) {
  const surface = surfaceVente(v);
  const suite = [
    v.delaiOffreJours != null ? `Offre en ${delaiOffre(v.delaiOffreJours)}` : null,
    v.ecartEstimation != null ? `${pct(v.ecartEstimation, true)}\u00a0vs\u00a0estimation` : null,
  ].filter(Boolean);

  return (
    <Link href={`/immeubles-vendus/${v.slug}/`} className="vente__lien">
      <span className="vente__visuel">
        {v.image ? (
          <Image
            src={v.image}
            alt=""
            width={1200}
            height={900}
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            className="vente__img"
          />
        ) : (
          /* Trois photos n'ont pas pu être reprises de l'ancien outil (son
             serveur répond 401 depuis la coupure). La carte reste complète :
             le picto tient la place, rien ne se casse. */
          <span className="vente__sansphoto" aria-hidden="true">
            <Picto nom="immeubles" taille={40} />
          </span>
        )}
      </span>
      <span className="vente__corps">
        <span className="vente__ville">
          {v.ville} <span className="vente__dept">({v.dept})</span>
        </span>
        {v.rue && <span className="vente__rue">{v.rue}</span>}
        {/* Une ligne chacun : réunis, « €/an » partait seul à la ligne. */}
        {surface && <span className="vente__faits">{surface}</span>}
        {v.loyerPotentiel != null && (
          <span className="vente__faits">Loyer potentiel {prix(v.loyerPotentiel)}/an</span>
        )}
        <span className="vente__pied">
          <span className="vente__prix">{prix(v.prix)}</span>
          {v.rendement != null && <span className="vente__rdt">{pct(v.rendement)} brut</span>}
        </span>
        {suite.length > 0 && <span className="vente__suite">{suite.join(" · ")}</span>}
      </span>
    </Link>
  );
}
