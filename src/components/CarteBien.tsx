import Image from "next/image";
import Link from "next/link";
import { Picto } from "./Picto";
import { prix, type BienAVendre } from "@/lib/biens";

/** « 4,1 % », « 520 m² » — formats français, espace insécable. */
const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const m2 = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} m²`;

/**
 * Vignette d'un bien à vendre — même jeu d'informations que PleinBail.
 *
 * Toute la carte est un lien : un seul arrêt de tabulation, une seule cible au
 * doigt, et le titre porte le nom accessible du lien.
 */
export function CarteBien({ b, rang = 0 }: { b: BienAVendre; rang?: number }) {
  const nouveau = Date.now() - new Date(b.publieLe).getTime() < 14 * 86_400_000;
  const image = b.images[0];

  return (
    <Link href={`/immeubles-a-vendre/${b.slug}/`} className="bien-carte">
      <span className="bien-carte__visuel">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            className="bien-carte__img"
            priority={rang < 3}
          />
        ) : (
          <span className="bien-carte__sansphoto" aria-hidden="true">
            <Picto nom="immeubles" taille={40} />
          </span>
        )}
        <span className="bien-carte__badges">
          {b.statut === "sous_offre" && <span className="badge badge--offre">Sous offre</span>}
          {b.statut === "en_vente" && nouveau && <span className="badge">Nouveau</span>}
          {b.occupation !== null && (
            <span className="badge badge--sombre">
              {b.occupation >= 99.5 ? "Occupé 100 %" : `Occupé ${pct(b.occupation)}`}
            </span>
          )}
        </span>
      </span>

      <span className="bien-carte__corps">
        {/* La ville est le titre de la carte. Le titre envoyé par le BO
            (« Immeuble de rapport — 8 lots — 381 m² — Alès (30) ») répète la
            ville et la ligne de faits juste en dessous : il reste sur la fiche,
            où il n'apparaît qu'une fois. */}
        <span className="bien-carte__titre">
          {b.ville} <span className="bien-carte__dept">({b.dept})</span>
        </span>
        <span className="bien-carte__faits">
          {[b.type, b.surface !== null ? m2(b.surface) : null, b.lots !== null ? `${b.lots} lots` : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {b.loyerHcAn !== null && (
          <span className="bien-carte__loyer">Loyer {prix(b.loyerHcAn)}/an HC</span>
        )}
        <span className="bien-carte__pied">
          <span className="bien-carte__prix">{prix(b.prixHai)}</span>
          {b.rendement !== null && (
            <span className="bien-carte__rdt">{pct(b.rendement)} brut</span>
          )}
        </span>
        {b.prixM2 !== null && (
          <span className="bien-carte__pm2">{prix(b.prixM2)}/m²</span>
        )}
      </span>
    </Link>
  );
}
