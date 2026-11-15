"use client";

import { useEffect, useRef, useState } from "react";
import { Picto } from "./Picto";

/**
 * Les ventes d'immeubles d'un arrondissement, une par une (lot 125). Elles se chargent après la page,
 * quand la section approche de l'écran, depuis `/api/ventes-dvf/` : robots.txt ferme cette adresse
 * à tous les robots, les moteurs de recherche n'indexent donc pas ce détail (conditions de DVF).
 * `data-nosnippet` en plus : aucun extrait de ces lignes dans les résultats de Google.
 */
type Lot = { type: string; surface: number | null; pieces: number | null; nombre: number };
type Vente = {
  id: string;
  date: string;
  rue: string | null;
  prix: number;
  surface: number;
  prixM2: number;
  logements: number;
  mixte: boolean;
  lots: Lot[];
  rendement: number | null;
  photo: { url: string; auteur: string; licence: string; date: string } | null;
};

const NBSP = " ";
const euros = (n: number) => `${n.toLocaleString("fr-FR")}${NBSP}€`;
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const moisAnnee = (d: string) => `${MOIS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
/** Les ventes montrées d'abord ; les autres derrière un bouton. */
const D_ABORD = 6;

function lotEnClair(l: Lot): string {
  const n = l.nombre;
  const s = l.surface ? ` de ${l.surface}${NBSP}m²` : "";
  if (l.type === "Local commercial") return `${n} ${n > 1 ? "locaux commerciaux" : "local commercial"}${s}`;
  const nom = l.type === "Maison" ? `maison${n > 1 ? "s" : ""}` : `appartement${n > 1 ? "s" : ""}`;
  const p = l.pieces ? ` de ${l.pieces}${NBSP}pièce${l.pieces > 1 ? "s" : ""}` : "";
  return `${n} ${nom}${p}${s}`;
}

function CarteVenteDvf({ v }: { v: Vente }) {
  const locaux = v.lots.filter((l) => l.type === "Local commercial").reduce((s, l) => s + l.nombre, 0);
  return (
    <li className="vdvf">
      <div className="vdvf__photo">
        {v.photo ? (
          // Photo servie par notre domaine (route de recadrage), d'où un <img> simple.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.photo.url} alt={v.rue ? `Immeuble vendu ${v.rue}` : "Immeuble vendu"} loading="lazy" decoding="async" width={800} height={600} />
        ) : (
          <span className="vdvf__sans-photo">
            <Picto nom="immeubles" taille={34} />
            <span>Photo à venir</span>
          </span>
        )}
      </div>
      <div className="vdvf__texte">
        <p className="vdvf__date">
          {moisAnnee(v.date)} · {v.mixte ? "Immeuble mixte" : "Immeuble d’habitation"}
        </p>
        <h3 className="vdvf__rue">{v.rue ?? "Rue non renseignée"}</h3>
        <p className="vdvf__prix">{euros(v.prix)}</p>
        <p className="vdvf__chiffres">
          {euros(v.prixM2)} le m² · {v.surface.toLocaleString("fr-FR")}{NBSP}m²
          {v.rendement != null && (
            <>
              {" "}· rendement théorique {v.rendement.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{NBSP}%
            </>
          )}
        </p>
        <details className="vdvf__lots">
          <summary>
            {v.logements} logement{v.logements > 1 ? "s" : ""}
            {locaux ? ` et ${locaux} ${locaux > 1 ? "locaux commerciaux" : "local commercial"}` : ""}
          </summary>
          <ul>
            {v.lots.map((l, i) => (
              <li key={i}>{lotEnClair(l)}</li>
            ))}
          </ul>
        </details>
        {v.photo && (
          <p className="vdvf__credit">
            Photo recadrée : {v.photo.auteur}, Panoramax,{" "}
            <a href={v.photo.licence.startsWith("CC-BY-SA") ? "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" : "https://www.etalab.gouv.fr/licence-ouverte-open-licence/"} target="_blank" rel="noopener noreferrer nofollow">
              {v.photo.licence.startsWith("CC-BY-SA") ? "CC BY-SA 4.0" : "Licence ouverte"}
            </a>
          </p>
        )}
      </div>
    </li>
  );
}

export function VentesDvf({ code, nom }: { code: string; nom: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ventes, setVentes] = useState<Vente[] | null>(null);
  const [erreur, setErreur] = useState(false);
  const [tout, setTout] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let fini = false;
    const charger = () => {
      if (fini) return;
      fini = true;
      fetch(`/api/ventes-dvf/?code=${code}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d: { ventes: Vente[] }) => setVentes(d.ventes))
        .catch(() => setErreur(true));
    };
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && (charger(), io.disconnect()), { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [code]);

  const montrees = ventes ? (tout ? ventes : ventes.slice(0, D_ABORD)) : [];
  return (
    <div ref={ref} className="vdvf-liste" data-nosnippet="">
      {erreur && <p className="vdvf-liste__etat">Le détail des ventes n’a pas pu être chargé. Rechargez la page pour réessayer.</p>}
      {!ventes && !erreur && <p className="vdvf-liste__etat">Chargement des ventes du {nom}…</p>}
      {ventes && (
        <>
          <ul className="vdvf-grille">
            {montrees.map((v) => (
              <CarteVenteDvf key={v.id} v={v} />
            ))}
          </ul>
          {ventes.length > D_ABORD && !tout && (
            <div className="btn-row">
              <button type="button" className="btn btn--primary" onClick={() => setTout(true)}>
                Voir les {ventes.length - D_ABORD} autres ventes
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
