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
  /** Loyer de marché des appartements de l'année, en € le m² par mois (carte des loyers de l'État). */
  loyerM2: number | null;
  lat: number | null;
  lon: number | null;
  photo: { url: string; auteur: string; licence: string; date: string } | null;
};

let promesse: Promise<Vente[]> | null = null;
let donnees: Vente[] | null = null;
const abonnes = new Set<(v: Vente[]) => void>();
/** Moment du dernier saut vers une ancre (clic dans le sommaire) ; 0 = arrivée sur la page. */
let ancreDepuis = 0;
if (typeof window !== "undefined") window.addEventListener("hashchange", () => (ancreDepuis = performance.now()));

/**
 * Toutes les ventes de Paris, chargées une fois pour la page. Dès qu'elles arrivent, toutes les listes
 * les affichent ensemble (`surVentes`) : chargées une à une, les listes du dessus grandissaient et
 * repoussaient l'arrondissement choisi dans le sommaire (« 13e » menait au 7e). Si la page visait un
 * arrondissement ou une vente (#arr-13), elle se recale dessus après l'affichage.
 */
export function chargerVentes(): Promise<Vente[]> {
  if (!promesse) {
    promesse = fetch("/api/ventes-dvf/?code=paris")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { ventes: Vente[] }) => {
        // Un saut vers une ancre il y a moins de 4 s : la page n'y est peut-être pas encore arrivée.
        const vise = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
        const recent = performance.now() - ancreDepuis < 4000;
        donnees = d.ventes;
        abonnes.forEach((f) => f(d.ventes));
        if (vise && recent) {
          // Même calcul qu'AncreStable : marge du haut de la page et de la cible, saut sans animation.
          const caler = () => {
            const ecart =
              vise.getBoundingClientRect().top -
              parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop || "0") -
              parseFloat(getComputedStyle(vise).scrollMarginTop || "0");
            if (Math.abs(ecart) > 4) window.scrollTo({ top: window.scrollY + ecart, behavior: "instant" as ScrollBehavior });
          };
          requestAnimationFrame(() => requestAnimationFrame(caler));
          window.setTimeout(caler, 400);
        }
        return d.ventes;
      })
      .catch((e) => {
        promesse = null;
        throw e;
      });
  }
  return promesse;
}

/** Reçoit les ventes dès qu'une liste ou la carte les a chargées. */
export function surVentes(f: (v: Vente[]) => void): () => void {
  if (donnees) f(donnees);
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

/** Ouvre une vente dans la liste de son arrondissement (depuis la carte). */
export const EVT_OUVRIR = "vdvf:ouvrir";

export const NBSP = " ";
export const euros = (n: number) => `${n.toLocaleString("fr-FR")}${NBSP}€`;
/** La date d'une vente en chiffres : « 12/2025 » (MAV, 16/11/2026 : « au lieu de décembre 2025 tu mets 12/2025 »). */
export const moisAnnee = (d: string) => `${d.slice(5, 7)}/${d.slice(0, 4)}`;
export const moisCourt = moisAnnee;
export const pourcent = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${NBSP}%`;
export const arrondissement = (code: string) => {
  const n = Number(code.slice(3));
  return `${n}${n === 1 ? "er" : "e"}`;
};
export const locauxDe = (v: Vente) => v.lots.filter((l) => l.type === "Local commercial").reduce((s, l) => s + l.nombre, 0);

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

/**
 * Sans photo, un immeuble dessiné au trait (MAV, 16/11/2026 : « un picto d'immeuble avec commerce quand
 * c'est mixte et avec juste de l'habitation quand ça ne l'est pas ») : façade, toit à la Mansart, fenêtres,
 * et au rez-de-chaussée une vitrine sous son store ou une porte cochère.
 */
function FacadeDessin({ mixte }: { mixte: boolean }) {
  const fenetres = [];
  for (const y of [25, 36, 47, 58]) for (const x of [42, 56, 70]) fenetres.push(<rect key={`${x}-${y}`} x={x} y={y} width="8" height="7" rx="0.6" />);
  return (
    <span className="vdvf__sans-photo" role="img" aria-label={mixte ? "Immeuble avec commerce" : "Immeuble d’habitation"}>
      <svg viewBox="0 0 120 100" aria-hidden="true" focusable="false">
        <path d="M34 18 38 9h44l4 9" />
        <path d="M32 18h56M32 21h56" />
        <rect x="34" y="21" width="52" height="71" />
        {fenetres}
        <path d="M34 70h52" />
        {mixte ? (
          <>
            {/* Store rayé au-dessus de la vitrine, vitrine et porte du commerce. */}
            <path d="M33 73h54l-4 8H37z" />
            <path d="M44 73l-1 8M52 73v8M60 73v8M68 73v8M76 73l1 8" />
            <rect x="39" y="83" width="28" height="9" />
            <rect x="71" y="82" width="10" height="10" />
          </>
        ) : (
          <>
            <path d="M54 92v-10a6 6 0 0 1 12 0v10" />
            <rect x="40" y="77" width="8" height="8" />
            <rect x="72" y="77" width="8" height="8" />
          </>
        )}
        <path d="M18 92h84" />
      </svg>
      <span className="vdvf__sans-photo-lib">{mixte ? "Immeuble mixte" : "Immeuble d’habitation"}</span>
    </span>
  );
}

/** La photo de la façade, ou l'immeuble dessiné. */
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
        <FacadeDessin mixte={v.mixte} />
      )}
    </div>
  );
}

/** Le type d'un lot, comme dans un état locatif : « T2 », « Maison T4 », « Local commercial ». */
export function typeDeLot(l: Lot): string {
  if (l.type === "Local commercial") return "Local commercial";
  const t = l.pieces ? `T${l.pieces}` : "";
  if (l.type === "Maison") return t ? `Maison ${t}` : "Maison";
  return t || "Appartement";
}

/** Loyer théorique d'un lot par mois, arrondi à la dizaine d'euros (MAV, 16/11/2026 : « un loyer par mois pour
 * que ce soit plus lisible »). */
const loyerMois = (l: Lot, loyerM2: number | null) => (loyerM2 && l.surface ? Math.round((loyerM2 * l.surface) / 10) * 10 : null);

/**
 * Les lots de l'acte en tableau, un lot par ligne (MAV, 16/11/2026 : « réunis pas les apparts dans
 * l'état loc », « un tableau directement et T2, T3 à la place de appartement 3 pièces », « loyer
 * théorique c'est bien et un total aussi ») : deux appartements identiques font deux lignes, comme
 * dans un état locatif ; loyer par mois marqué d'un astérisque, total par mois et par an. Un seul tableau, d'une hauteur fixe au plus, qui défile dans son cadre avec
 * sa ligne de titres et son total toujours visibles (MAV : « un défilement contenu à l'intérieur d'un
 * conteneur »). Le loyer théorique applique à chaque lot le loyer de marché des appartements de
 * l'année, comme le rendement théorique : le total rapporté au prix redonne ce rendement.
 */
export function LotsVente({ v }: { v: Vente }) {
  const lots = v.lots.flatMap((l) => Array.from({ length: Math.max(1, l.nombre) }, () => l));
  const avecLoyer = v.loyerM2 != null;
  const surfaceTotale = lots.reduce((s, l) => s + (l.surface ?? 0), 0);
  // Le total par an se calcule sur les loyers exacts : rapporté au prix, il redonne le rendement théorique.
  const totalAn = v.loyerM2 ? Math.round((v.loyerM2 * surfaceTotale * 12) / 10) * 10 : 0;
  const totalMois = v.loyerM2 ? Math.round((v.loyerM2 * surfaceTotale) / 10) * 10 : 0;
  const m2 = (n: number) => `${n.toLocaleString("fr-FR")}${NBSP}m²`;
  return (
    <>
      {/* Cadre qui défile : focalisable au clavier pour défiler aux flèches. */}
      <div className="vdvf__lots" tabIndex={0} role="region" aria-label={`Les ${lots.length} lots de la vente`}>
        <table className="vdvf__lots-table">
          <thead>
            <tr>
              <th scope="col">Lot</th>
              <th scope="col">Surface</th>
              {avecLoyer && (
                <th scope="col">
                  Loyer / mois<span aria-hidden="true">*</span>
                  <span className="sr-only"> (théorique)</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {lots.map((l, i) => {
              const loyer = loyerMois(l, v.loyerM2);
              return (
                <tr key={i}>
                  <td>{typeDeLot(l)}</td>
                  <td>{l.surface ? m2(l.surface) : "–"}</td>
                  {avecLoyer && <td>{loyer ? euros(loyer) : "–"}</td>}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">
                Total
                {lots.length > 1 && <span className="vdvf__lots-nb">{lots.length}{NBSP}lots</span>}
              </th>
              <td>{m2(surfaceTotale)}</td>
              {avecLoyer && (
                <td>
                  {euros(totalMois)}
                  <span className="vdvf__lots-nb">soit {euros(totalAn)} par an</span>
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
      {avecLoyer && (
        <p className="vdvf__lots-note">
          * Loyer théorique : le loyer de marché des appartements du {arrondissement(v.codeInsee)} arrondissement en {v.annee},{" "}
          {v.loyerM2!.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          {NBSP}€ le m² par mois, appliqué à chaque lot, commerces compris. Le loyer réel n’est pas connu.
        </p>
      )}
    </>
  );
}
