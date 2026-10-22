import Image from "next/image";
import Link from "next/link";
import { Picto } from "./Picto";
import { prix, type Vente } from "@/lib/biens";
import { surfaceVente } from "./CarteVente";

const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/**
 * Les quatre données d'une vignette. Ce sont celles de l'ancienne vitrine
 * (surface, destination, occupation, prix) quand le BO les dépose ; à défaut,
 * le rendement et le loyer potentiel prennent la place laissée vide, pour que
 * la vignette reste pleine.
 */
function infos(v: Vente): [string, string][] {
  const surface = surfaceVente(v);
  const candidats: [string, string | null][] = [
    ["Surface", surface],
    ["Destination", v.type ?? null],
    ["Occupation", v.occupation != null ? pct(v.occupation) : null],
    ["Rendement brut", v.rendement != null ? pct(v.rendement) : null],
    ["Loyer potentiel", v.loyerPotentiel != null ? `${prix(v.loyerPotentiel)}/an` : null],
  ];
  const pleins = candidats.filter((c): c is [string, string] => c[1] != null).slice(0, 3);
  return [...pleins, ["Prix de vente", prix(v.prix)]];
}

function Vignette({ v, double = false }: { v: Vente; double?: boolean }) {
  return (
    <li className="defile__item" aria-hidden={double || undefined}>
      <Link
        href={`/immeubles-vendus/${v.slug}/`}
        className="bien bien--lien"
        tabIndex={double ? -1 : undefined}
      >
        {v.image ? (
          <Image
            className="bien__img"
            src={v.image}
            alt=""
            width={520}
            height={650}
            sizes="320px"
          />
        ) : (
          <span className="bien__sansphoto" aria-hidden="true">
            <Picto nom="immeubles" taille={40} />
          </span>
        )}
        <span className="bien__voile" aria-hidden="true" />
        <span className="bien__texte">
          <span className="bien__ville">
            {v.ville} <span className="bien__dept">({v.dept})</span>
          </span>
          <dl className="bien__infos">
            {infos(v).map(([dt, dd]) => (
              <div key={dt}>
                <dt>{dt}</dt>
                <dd>{dd}</dd>
              </div>
            ))}
          </dl>
        </span>
      </Link>
    </li>
  );
}

/**
 * Vitrine d'accueil : une seule ligne d'immeubles vendus qui défile.
 *
 * Sans JavaScript : la piste contient la liste deux fois et glisse d'une
 * demi-longueur en boucle, ce qui raccorde la fin au début sans saut. La
 * seconde copie est cachée aux lecteurs d'écran et sortie de la tabulation.
 * Le défilement s'arrête au survol et au focus, et laisse place à une ligne
 * qu'on fait glisser au doigt quand l'utilisateur a demandé moins
 * d'animations.
 */
export function CarrouselVentes({ ventes }: { ventes: Vente[] }) {
  return (
    <div className="defile">
      <ul className="defile__piste" style={{ ["--n" as string]: ventes.length }}>
        {ventes.map((v) => <Vignette key={v.id} v={v} />)}
        {ventes.map((v) => <Vignette key={`${v.id}-bis`} v={v} double />)}
      </ul>
    </div>
  );
}
