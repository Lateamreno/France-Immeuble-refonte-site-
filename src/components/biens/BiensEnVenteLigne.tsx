import Link from "next/link";
import { CarteBien } from "@/components/CarteBien";
import { Eyebrow } from "@/components/Eyebrow";
import { LigneDefilante } from "@/components/LigneDefilante";
import { Picto } from "@/components/Picto";
import { biensAVendre, offMarket } from "@/lib/biens";
import { CarteOffMarket } from "./CarteOffMarket";

/**
 * Les immeubles en vente, en une ligne qui glisse (MAV, 05/11/2026, page
 * Acheter) : la vignette off-market d'abord, comme dans la liste des
 * immeubles à vendre, puis huit immeubles au plus, du plus cher au moins
 * cher, et une dernière carte « Voir tous nos immeubles ».
 */
export const MAX_LIGNE = 8;

export async function BiensEnVenteLigne({ id, className = "section--noir" }: { id?: string; className?: string }) {
  const [biens, communesOff] = await Promise.all([biensAVendre(), offMarket()]);
  const nbOffMarket = communesOff.reduce((s, c) => s + c.nombre, 0);
  const choisis = [...biens].sort((a, b) => b.prixHai - a.prixHai).slice(0, MAX_LIGNE);
  if (!choisis.length) return null;
  return (
    <section id={id} className={`section ${className} est-sombre biens-ligne-sec`}>
      <div className="container">
        <div className="section__head">
          <Eyebrow>En vente en ce moment</Eyebrow>
          <h2>Nos immeubles de rapport <span className="accent">à vendre</span></h2>
          <p className="lead">
            Une partie de nos immeubles est en annonce. Les autres sont réservés aux acquéreurs
            qui ont déposé leur recherche.
          </p>
        </div>
        <LigneDefilante className="biens-ligne" marches>
          <CarteOffMarket nombre={nbOffMarket} />
          {choisis.map((b, i) => <CarteBien key={b.id} b={b} rang={i + 3} />)}
          <Link href="/immeubles-a-vendre/" className="carte-tous">
            <span className="carte-tous__picto" aria-hidden="true"><Picto nom="immeubles" taille={44} /></span>
            <span className="carte-tous__nb">
              {biens.length} immeuble{biens.length > 1 ? "s" : ""} à vendre
            </span>
            <span className="btn btn--primary carte-tous__btn">Voir tous nos immeubles</span>
          </Link>
        </LigneDefilante>
      </div>
    </section>
  );
}
