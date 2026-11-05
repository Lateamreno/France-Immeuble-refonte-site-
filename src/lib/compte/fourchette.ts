// Serveur uniquement.
import { marcheDuBien } from "../marche";
import { enNombre } from "../dossier/modele";
import { departementDe, type CopieEstimation } from "./immeubles";

/**
 * Une première fourchette pour un immeuble du compte, en attendant
 * l'estimation de l'agent (MAV, 05/11/2026 : « si le client a rentré toutes
 * les infos, donc s'il a déjà rempli son état locatif, il peut avoir la
 * fourchette »).
 *
 * Calcul : surface Carrez de l'état locatif × prix médian au m² des
 * appartements vendus dans la commune (DVF, comme Plein Bail, `marche.ts`),
 * à ±10 %. C'est un prix de vente à la découpe, lot par lot : la page le dit,
 * avec le rendement brut que ce prix donnerait, pour que le client voie
 * l'écart avec ce qu'attend un investisseur.
 */
export type Fourchette = {
  basse: number;
  haute: number;
  prixM2: number;
  surface: number;
  echelle: "commune" | "departement";
  fenetreMois: number | null;
  nbVentes: number | null;
  /** Loyer annuel hors charges de l'état locatif (sinon celui du formulaire). */
  loyerAnnuel: number | null;
  /** Rendement brut au prix haut et au prix bas, en %. */
  rendementBas: number | null;
  rendementHaut: number | null;
};

export type EtatFourchette =
  | { etat: "prete"; f: Fourchette }
  | { etat: "etat-locatif" }   // l'état locatif n'est pas encore envoyé
  | { etat: "sans-marche" };   // pas assez de ventes dans le secteur

const ECART = 0.1;

export async function fourchetteDe(c: CopieEstimation): Promise<EtatFourchette> {
  const lots = c.dossier?.lots ?? [];
  const carrez = lots.reduce((t, l) => t + (enNombre(l.surface) ?? 0), 0);
  if (!c.dossier_envoye_le || carrez <= 0) return { etat: "etat-locatif" };

  const dept = departementDe(c.codePostal);
  if (!dept || !c.ville) return { etat: "sans-marche" };
  const m = await marcheDuBien({ ville: c.ville, dept, codePostal: c.codePostal ?? null });
  if (!m?.prixM2 || !m.prixEchelle) return { etat: "sans-marche" };

  const centre = carrez * m.prixM2;
  const arrondi = (n: number) => Math.round(n / 10_000) * 10_000;
  const basse = arrondi(centre * (1 - ECART));
  const haute = arrondi(centre * (1 + ECART));

  const loyerLots = lots.reduce((t, l) => t + (l.statut === "libre" ? 0 : (enNombre(l.loyer) ?? 0)), 0) * 12;
  const loyerAnnuel = loyerLots > 0 ? loyerLots : (c.loyerAnnuel ?? null);
  const rdt = (prix: number) => (loyerAnnuel ? Math.round((loyerAnnuel / prix) * 1000) / 10 : null);

  return {
    etat: "prete",
    f: {
      basse, haute, prixM2: m.prixM2, surface: Math.round(carrez), echelle: m.prixEchelle,
      fenetreMois: m.prixFenetreMois, nbVentes: m.nbVentes, loyerAnnuel,
      rendementBas: rdt(haute), rendementHaut: rdt(basse),
    },
  };
}
