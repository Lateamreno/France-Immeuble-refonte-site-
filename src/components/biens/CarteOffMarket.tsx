"use client";

import Image from "next/image";
import Link from "next/link";
import { VISUELS } from "@/lib/visuels";
import { BoutonRecherche } from "./BoutonRecherche";

/**
 * La première vignette de la liste des immeubles à vendre (retour #74, MAV,
 * 02/11/2026) : une annonce de l'agence pour l'off-market. Une partie des
 * mandats ne passe jamais en ligne ; cette vignette ouvre la porte.
 *
 * Retour #145 (MAV, 03/11/2026) : le bouton ouvre le dépôt de recherche dans une
 * fenêtre, sans quitter la liste. Le titre mène toujours à la page off-market.
 */
export function CarteOffMarket({ nombre }: { nombre: number }) {
  return (
    <div className="bien-carte-cadre">
      <div className="bien-carte carte-offmarket">
        <span className="carte-offmarket__fond" aria-hidden="true">
          <Image src={VISUELS.fenetresHeureBleue.src} alt="" fill sizes="(max-width: 699px) 100vw, 380px" className="bien-carte__img" />
        </span>
        <span className="carte-offmarket__corps">
          <span className="carte-offmarket__surtitre">Off-market</span>
          <Link href="/immeubles-off-market/" className="carte-offmarket__titre">
            {nombre > 0 ? <><span className="accent">{nombre} immeuble{nombre > 1 ? "s" : ""}</span> à vendre hors annonce</> : <>Nos immeubles <span className="accent">hors annonce</span></>}
          </Link>
          <span className="carte-offmarket__texte">
            Une partie de nos mandats n’est jamais publiée en ligne. Déposez votre recherche pour recevoir nos offres off-market.
          </span>
          <BoutonRecherche className="btn btn--primary carte-offmarket__btn" titre="Recevoir nos offres off-market"
            sous="Décrivez votre recherche : les immeubles qui y correspondent vous sont envoyés avant toute diffusion.">
            <span className="btn__long">Recevoir les offres off-market</span><span className="btn__court">Recevoir l’off-market</span>
          </BoutonRecherche>
        </span>
      </div>

    </div>
  );
}
