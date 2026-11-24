"use client";

import { useId, useState } from "react";
import type { LignePrix } from "@/lib/prix-paris";
import "@/app/annonces.css";

/** « 1er », « 2e » … « 20e » : l'adresse d'un arrondissement, /prix-immeuble-paris/16e/. */
export const adresseArrondissement = (n: number | null) =>
  n == null ? "/prix-immeuble-paris/" : `/prix-immeuble-paris/${n}${n === 1 ? "er" : "e"}/`;

const rang = (n: number) => `${n}${n === 1 ? "er" : "e"}`;
const nombre = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[   ]/g, " ");
const pc = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * L'outil de la page des annonces « prix » (lot 140) : le titre, la liste des arrondissements et
 * la carte du prix médian. Le serveur rend l'arrondissement de l'adresse (le bon chiffre est dans
 * le HTML) ; choisir un autre arrondissement change le titre et la carte sur place, sans changer
 * de page : le formulaire voisin garde ce que le visiteur y a déjà saisi. L'adresse suit, pour
 * qu'un lien copié mène au bon arrondissement. Le choix part dans GTM (`choix_arrondissement`).
 *
 * Agrégats seulement : les vingt lignes du tableau, déjà publiées plus bas dans la page.
 */
export function OutilPrix({ initial, annee, lignes, paris, rendementParis, titre = true, suivreAdresse = true }: {
  initial: number | null;
  /** Le titre de la page des annonces (H1) ; ailleurs (baromètre), la section porte le sien. */
  titre?: boolean;
  /** Sur la page des annonces, l'adresse suit l'arrondissement choisi ; ailleurs, elle ne bouge pas. */
  suivreAdresse?: boolean;
  annee: number;
  lignes: LignePrix[];
  paris: { prix: number; ventes: number; decote: number | null } | null;
  rendementParis: string;
}) {
  const id = useId();
  const [arr, setArr] = useState<number | null>(initial);
  const ligne = arr ? lignes[arr - 1] : null;
  const prix = arr ? (ligne?.prix ?? null) : (paris?.prix ?? null);
  const decote = arr ? (ligne?.decote ?? null) : (paris?.decote ?? null);
  const avecDecote = decote != null && decote < 0;

  return (
    <>
      {titre && (
        <h1>
          Prix au&nbsp;m² des <span className="accent">immeubles à Paris{arr ? ` ${rang(arr)}` : ""}</span>
        </h1>
      )}
      <div className="lp-prix">
        <div className="lp-prix__choix">
          <label htmlFor={id}>Votre arrondissement</label>
          <span className="lp-prix__select">
            <select
              id={id}
              value={arr ?? ""}
              onChange={(e) => {
                const n = e.target.value ? Number(e.target.value) : null;
                setArr(n);
                if (suivreAdresse) window.history.replaceState(null, "", adresseArrondissement(n) + window.location.search);
                const w = window as unknown as { dataLayer?: { push: (o: Record<string, unknown>) => void } };
                w.dataLayer?.push({ event: "choix_arrondissement", arrondissement: n ?? "paris" });
              }}
            >
              <option value="">Tout Paris</option>
              {lignes.map((l) => (
                <option key={l.n} value={l.n}>
                  {rang(l.n)} arrondissement
                </option>
              ))}
            </select>
          </span>
        </div>
        <div className="lp-prix__carte" aria-live="polite">
          {prix != null ? (
            <>
              <p className="lp-prix__val">{nombre(prix)}&nbsp;€ <span>le&nbsp;m²</span></p>
              <p className="lp-prix__quoi">
                {arr
                  ? `prix médian des ventes d’immeubles en bloc en ${annee}, d’après DVF`
                  : `prix médian de ${nombre(paris?.ventes ?? 0)} ventes d’immeubles de plus de cinq logements à Paris en ${annee}, d’après DVF`}
              </p>
              {/* Au téléphone, seule la décote s'affiche : sans elle, la liste s'efface (pas de filet vide). */}
              <ul className={`lp-prix__faits${avecDecote ? "" : " lp-prix__plus"}`}>
                {avecDecote ? (
                  <li>
                    <strong>{-(decote as number)}&nbsp;%</strong> sous le prix des appartements
                  </li>
                ) : null}
                {arr && ligne?.fiabilite != null ? (
                  <li className="lp-prix__plus">
                    Fiabilité
                    <span className="lp-prix__etoiles" aria-hidden="true">
                      {[1, 2, 3].map((i) => (
                        <svg key={i} viewBox="0 0 24 24" width="15" height="15" className={i <= (ligne.fiabilite as number) ? "est-pleine" : undefined}>
                          <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" />
                        </svg>
                      ))}
                    </span>
                    <span className="sr-only">{ligne.fiabilite} {ligne.fiabilite > 1 ? "étoiles" : "étoile"} sur 3</span>
                  </li>
                ) : null}
                {arr && ligne?.rdt != null ? (
                  <li className="lp-prix__plus">
                    Rendement théorique <strong>{pc(ligne.rdt)}&nbsp;%</strong>
                  </li>
                ) : null}
                {!arr ? (
                  <li className="lp-prix__plus">
                    Rendement de <strong>{rendementParis}</strong> en général
                  </li>
                ) : null}
              </ul>
              {/* Une étoile : peu de ventes (moins de cinq) ou des prix très dispersés. On dit lequel. */}
              {arr && ligne?.fiabilite === 1 ? (
                <p className="lp-prix__prudence">
                  {ligne.ventes < 5 ? "Peu de ventes" : "Prix très dispersés"}&nbsp;: à lire avec prudence.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="lp-prix__sans">
                {ligne?.connu ? `Moins de trois ventes en ${annee}` : `Chiffres de ${annee} non disponibles`}
              </p>
              {paris ? (
                <p className="lp-prix__quoi">
                  À Paris, le prix médian est de {nombre(paris.prix)}&nbsp;€ le&nbsp;m².
                </p>
              ) : null}
            </>
          )}
        </div>
        <p className="lp-prix__mention">
          Chiffres DVF non vérifiés&nbsp;: nous ne connaissons ni l’état ni le niveau des loyers des
          immeubles vendus.
        </p>
      </div>
      <p className="lp-pont">
        {prix != null ? (
          <>
            <strong>Et le vôtre&nbsp;?</strong> Un immeuble sur deux s’est vendu plus cher
            <span className="lp-long">&nbsp;: tout dépend de ses baux et de son état</span>.
          </>
        ) : (
          <>
            <strong>Et le vôtre&nbsp;?</strong> Une médiane ne connaît ni vos baux ni l’état de votre
            immeuble.
          </>
        )}
      </p>
    </>
  );
}
