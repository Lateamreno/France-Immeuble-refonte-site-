"use client";

/**
 * Ce que la carte et les listes des ventes d'immeubles de Paris partagent (lots 125 et 127) : les
 * ventes chargées une seule fois depuis `/api/ventes-dvf/?code=paris` (fermée aux robots, conditions
 * de DVF), les formats et la fiche d'une vente (photo, rue, prix, lots).
 */
export type Lot = { type: string; surface: number | null; pieces: number | null; nombre: number };
export type Vente = {
  id: string;
  codeInsee: string;
  annee: number;
  date: string;
  rue: string | null;
  prix: number;
  surface: number;
  prixM2: number;
  logements: number;
  mixte: boolean;
  lots: Lot[];
  rendement: number | null;
  lat: number | null;
  lon: number | null;
  photo: { url: string; auteur: string; licence: string; date: string } | null;
};

let promesse: Promise<Vente[]> | null = null;
/** Toutes les ventes de Paris, chargées une fois pour la page. */
export function chargerVentes(): Promise<Vente[]> {
  if (!promesse) {
    promesse = fetch("/api/ventes-dvf/?code=paris")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { ventes: Vente[] }) => d.ventes)
      .catch((e) => {
        promesse = null;
        throw e;
      });
  }
  return promesse;
}

/** Ouvre une vente dans la liste de son arrondissement (depuis la carte). */
export const EVT_OUVRIR = "vdvf:ouvrir";

export const NBSP = " ";
export const euros = (n: number) => `${n.toLocaleString("fr-FR")}${NBSP}€`;
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const moisAnnee = (d: string) => `${MOIS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
export const moisCourt = (d: string) => `${MOIS_COURTS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
export const pourcent = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${NBSP}%`;
export const arrondissement = (code: string) => {
  const n = Number(code.slice(3));
  return `${n}${n === 1 ? "er" : "e"}`;
};
export const locauxDe = (v: Vente) => v.lots.filter((l) => l.type === "Local commercial").reduce((s, l) => s + l.nombre, 0);

export function lotEnClair(l: Lot): string {
  const n = l.nombre;
  const s = l.surface ? ` de ${l.surface}${NBSP}m²` : "";
  if (l.type === "Local commercial") return `${n} ${n > 1 ? "locaux commerciaux" : "local commercial"}${s}`;
  const nom = l.type === "Maison" ? `maison${n > 1 ? "s" : ""}` : `appartement${n > 1 ? "s" : ""}`;
  const p = l.pieces ? ` de ${l.pieces}${NBSP}pièce${l.pieces > 1 ? "s" : ""}` : "";
  return `${n} ${nom}${p}${s}`;
}

export function CreditPhoto({ photo }: { photo: NonNullable<Vente["photo"]> }) {
  const sa = photo.licence.startsWith("CC-BY-SA");
  return (
    <p className="vdvf__credit">
      Photo recadrée : {photo.auteur}, Panoramax,{" "}
      <a
        href={sa ? "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" : "https://www.etalab.gouv.fr/licence-ouverte-open-licence/"}
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        {sa ? "CC BY-SA 4.0" : "Licence ouverte"}
      </a>
    </p>
  );
}

/** La photo de la façade, ou sa place vide. */
export function PhotoVente({ v }: { v: Vente }) {
  return (
    <div className="vdvf__photo">
      {v.photo ? (
        // Photo servie par notre domaine (route de recadrage), d'où un <img> simple.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={v.photo.url}
          alt={`Immeuble ${v.mixte ? "mixte" : "d’habitation"} vendu ${v.rue ?? "à Paris"}, ${arrondissement(v.codeInsee)} arrondissement`}
          loading="lazy"
          decoding="async"
          width={800}
          height={600}
        />
      ) : (
        <span className="vdvf__sans-photo">Pas encore de photo de la façade</span>
      )}
    </div>
  );
}

/** Les lots de l'acte, un par ligne. */
export function LotsVente({ v }: { v: Vente }) {
  return (
    <ul className="vdvf__lots-liste">
      {v.lots.map((l, i) => (
        <li key={i}>{lotEnClair(l)}</li>
      ))}
    </ul>
  );
}
