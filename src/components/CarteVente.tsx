import Image from "next/image";
import Link from "next/link";
import { Picto } from "./Picto";
import { prix, type Vente } from "@/lib/biens";

export const REGIONS: Record<Vente["region"], string> = {
  idf: "Île-de-France",
  "sud-ouest": "Sud-Ouest",
  autre: "Régions",
};

/**
 * Vignette d'une vente réalisée. Toute la carte mène à la fiche de la vente :
 * un seul arrêt de tabulation, une seule cible au doigt, et le nom de la
 * commune porte le nom accessible du lien.
 */
export function CarteVente({ v }: { v: Vente }) {
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
        <span className="vente__annee">{v.annee}</span>
      </span>
      <span className="vente__corps">
        <span className="vente__ville">
          {v.ville} <span className="vente__dept">({v.dept})</span>
        </span>
        {v.rue && <span className="vente__rue">{v.rue}</span>}
        <span className="vente__prix">{prix(v.prix)}</span>
        <span className="vente__region">
          {[v.lots ? `${v.lots} lots` : null, REGIONS[v.region]].filter(Boolean).join(" · ")}
        </span>
      </span>
    </Link>
  );
}
