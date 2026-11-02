import Image from "next/image";
import Link from "next/link";
import { Picto } from "./Picto";
import type { BienAVendre } from "@/lib/biens";
import {
  classeDpe, eur, estNouveau, etiquetteDpe, libelleOccupation, loyerAffiche, m2, pct, prixBaisse, rendementAffiche,
} from "@/lib/annonce";
import { BoutonFavori } from "./biens/BoutonFavori";

/**
 * Carte d'un immeuble à vendre, sur le modèle de Plein Bail (spec §8) : sur
 * ordinateur une carte à photo 16/10 dans une grille ; au téléphone une rangée
 * compacte (vignette carrée de 96 px). Un seul code : le CSS change la mise en
 * page, pas les informations.
 *
 * Photo : badge « Nouveau » ou « Prix baissé » en haut à gauche, cœur en haut
 * à droite, rendement et occupation en bas à gauche, étiquette DPE en bas à
 * droite (affichage dû jusque dans les listes), bandeau « Sous offre ».
 * Toute la carte est un lien ; le cœur est posé à côté, deux cibles distinctes.
 */
export function CarteBien({ b, rang = 0, favori = true }: { b: BienAVendre; rang?: number; favori?: boolean }) {
  const image = b.images[0];
  const r = rendementAffiche(b);
  const loyer = loyerAffiche(b);
  const occ = libelleOccupation(b);
  const dpe = etiquetteDpe(b.dpeMin, classeDpe(b));
  const baisse = prixBaisse(b);
  const faits = [b.type, b.surface != null ? m2(Math.round(b.surface)) : null, b.lots != null ? `${b.lots} lots` : null]
    .filter(Boolean).join(" · ");

  return (
    <div className={`bien-carte-cadre${b.statut === "sous_offre" ? " est-sous-offre" : ""}`}>
      <Link href={`/immeubles-a-vendre/${b.slug}/`} className="bien-carte">
        <span className="bien-carte__visuel">
          {image ? (
            <Image src={image} alt={`${b.type} à ${b.ville}`} fill
              sizes="(max-width: 699px) 96px, (max-width: 1100px) 50vw, 380px"
              className="bien-carte__img" priority={rang < 3} />
          ) : (
            <span className="bien-carte__sansphoto" aria-hidden="true"><Picto nom="immeubles" taille={40} /></span>
          )}
          <span className="bien-carte__badges">
            {baisse ? <span className="badge badge--clair">Prix baissé</span>
              : estNouveau(b) ? <span className="badge badge--sombre">Nouveau</span> : null}
          </span>
          <span className="bien-carte__bas">
            <span className="bien-carte__bas-g">
              {r != null && <span className="badge badge--sombre">Rendement {pct(r, 1)}</span>}
              {occ && <span className="badge">{occ}</span>}
            </span>
            <span className={`dpe-etiquette dpe-etiquette--${(classeDpe(b) ?? "nc").toLowerCase()}`} title="Diagnostic de performance énergétique">
              {dpe === "DPE n.c." ? dpe : <>DPE {dpe}</>}
            </span>
          </span>
          {b.statut === "sous_offre" && <span className="bien-carte__bandeau">Sous offre</span>}
        </span>

        <span className="bien-carte__corps">
          <span className="bien-carte__ligne">
            <span className="bien-carte__titre">
              <Picto nom="secteur" taille={14} aria-hidden="true" />{b.ville} <span className="bien-carte__dept">({b.dept})</span>
            </span>
            <span className="bien-carte__prix">{eur(b.prixHai)}</span>
          </span>
          <span className="bien-carte__ligne">
            <span className="bien-carte__faits">{faits}</span>
            {r != null && <span className="bien-carte__rdt">Renta brute {pct(r, 1)}</span>}
          </span>
          <span className="bien-carte__ligne bien-carte__ligne--3">
            {loyer != null ? <span className="bien-carte__loyer">Loyer {eur(loyer)}/an HC</span> : <span />}
            {b.prixM2 != null && <span className="bien-carte__pm2">{eur(b.prixM2)}/m²</span>}
          </span>
          {/* Au téléphone : les badges passent sous le texte, la vignette garde le DPE. */}
          <span className="bien-carte__badges-mob">
            {b.statut === "sous_offre" && <span className="badge badge--clair">Sous offre</span>}
            {r != null && <span className="badge badge--sombre">Rendement {pct(r, 1)}</span>}
            {occ && <span className="badge">{occ}</span>}
          </span>
        </span>
      </Link>
      {favori && <BoutonFavori bien={b.id} className="bien-carte__favori" />}
    </div>
  );
}
