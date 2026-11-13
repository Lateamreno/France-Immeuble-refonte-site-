import Image from "next/image";
import Link from "next/link";
import { Picto } from "./Picto";
import { prix, AFFICHER_ECART_ESTIMATION, type Vente } from "@/lib/biens";

/** « 4,1 % », « +3 % » — formats français. */
const pct = (n: number, signe = false) =>
  `${signe && n > 0 ? "+" : ""}${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}\u00a0%`;

/**
 * « 538 m² » : la surface exacte, choisie par MAV le 21/10/2026. À défaut, la
 * tranche « 500 à 600 m² » quand le BO n'a déposé que celle-ci.
 */
export const surfaceVente = (v: Vente) =>
  v.surface
    ? `${Math.round(v.surface).toLocaleString("fr-FR")} m²`
    : v.surfaceMin && v.surfaceMax
      ? `${v.surfaceMin.toLocaleString("fr-FR")} à ${v.surfaceMax.toLocaleString("fr-FR")} m²`
      : null;

/**
 * Ce qui se publie (retour #144, MAV, 03 et 04/11/2026) : l'écart à l'estimation
 * ne s'affiche que s'il reste entre −8 % et +8 %. Au-delà, dans un sens comme
 * dans l'autre, il dit que l'estimation était loin du prix obtenu. Un délai
 * avant l'offre de plus de trois mois ne s'affiche pas non plus. Valable sur
 * les cartes et sur les fiches.
 */
export const ECART_MAX = 8;
export const DELAI_MAX_JOURS = 92;
export const ecartPublie = (v: Pick<Vente, "ecartEstimation">) =>
  v.ecartEstimation != null && Math.abs(v.ecartEstimation) <= ECART_MAX ? v.ecartEstimation : null;
export const delaiPublie = (v: Pick<Vente, "delaiOffreJours">) =>
  v.delaiOffreJours != null && v.delaiOffreJours <= DELAI_MAX_JOURS ? v.delaiOffreJours : null;

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
 *
 * Les options `libelleLoyer`, `avecType` et `prixAuM2` ne servent qu'à la page
 * Paris (lot 110) : sans elles, la carte reste celle des autres pages.
 */
export function CarteVente({
  v,
  sansDelai = false,
  libelleLoyer = "Loyer potentiel",
  avecType = false,
  prixAuM2 = false,
}: {
  v: Vente;
  /** Page Paris : aucun délai affiché (MAV, 12/11/2026). */
  sansDelai?: boolean;
  /** Page Paris (retour #341, MAV, 13/11/2026) : « Loyer » ; le chiffre reste le loyer potentiel. */
  libelleLoyer?: string;
  /** Page Paris (#341) : le type devant la rue, « Immeuble mixte rue Mouffetard » ; l'un des deux seul si l'autre manque. */
  avecType?: boolean;
  /** Page Paris (#341) : sous le prix, le prix au m² (prix ÷ surface exacte) à la place du délai et de l'écart à l'estimation. */
  prixAuM2?: boolean;
}) {
  const surface = surfaceVente(v);
  const delai = delaiPublie(v);
  const ecart = ecartPublie(v);
  const lieu = avecType ? [v.type ?? "Immeuble de rapport", v.rue].filter(Boolean).join(" ") : v.rue;
  const suite = (
    prixAuM2
      ? [v.surface ? `${prix(v.prix / v.surface).replace(/ /g, "\u00a0")}/m²` : null]
      : [
          delai != null && !sansDelai ? `Offre en ${delaiOffre(delai)}` : null,
          // « 0 % vs estimation » se lisait comme une erreur : l'offre est arrivée au prix estimé, on le dit.
          AFFICHER_ECART_ESTIMATION && ecart != null
            ? Math.abs(ecart) < 0.05
              ? "Meilleure offre au prix estimé"
              : `Meilleure offre ${pct(ecart, true)}\u00a0vs\u00a0estimation`
            : null,
        ]
  ).filter(Boolean);

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
        {lieu && <span className="vente__rue">{lieu}</span>}
        {/* Une ligne chacun : réunis, « €/an » partait seul à la ligne. */}
        {surface && <span className="vente__faits">{surface}</span>}
        {v.loyerPotentiel != null && (
          <span className="vente__faits">{`${libelleLoyer} `}{prix(v.loyerPotentiel)}/an</span>
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
