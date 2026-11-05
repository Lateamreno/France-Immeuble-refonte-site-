// Serveur uniquement.
import { marcheDuBien } from "../marche";
import { enNombre } from "../dossier/modele";
import { departementDe, type CopieEstimation } from "./immeubles";

/**
 * Une première fourchette pour un immeuble du compte, en attendant
 * l'estimation de l'agent, une fois l'état locatif envoyé avec ses surfaces
 * Carrez (MAV, 05/11/2026).
 *
 * Règle de MAV (05/11/2026) : « estimation au rendement du secteur avec
 * +/- 15 %, et il ne faut jamais dépasser le prix au m² secteur (souvent on
 * est 10/15 % en dessous). On ne se met pas au rendement secteur si on est à
 * plus de 25/30 % de décote au m². Quand on atteint ces valeurs on met
 * vraiment une alerte : le passage d'un agent est nécessaire. »
 *
 * - valeur = loyer annuel hors charges ÷ rendement brut de la ville
 *   (Plein Bail, `marche.ts`), à ±15 % ;
 * - plafond = surface Carrez × prix médian au m² des appartements vendus
 *   (DVF) : la fourchette ne le dépasse jamais ;
 * - décote au m² de plus de 25 %, ou plus d'un tiers de la surface en bureaux,
 *   commerces ou locaux d'activité (le rendement de la ville est celui des
 *   appartements) : la fourchette reste affichée, avec une alerte en grand
 *   « passage d'un agent nécessaire » (MAV, 05/11/2026 : « laisse-leur le prix
 *   affiché mais mets quand même l'alerte en gros »).
 * - sans loyer (immeuble libre) : le rendement ne dit rien, pas de chiffre,
 *   l'alerte seule (état `agent`).
 */
export type Fourchette = {
  basse: number;
  haute: number;
  /** La fourchette touche le plafond du prix au m² du secteur. */
  plafonnee: boolean;
  /** Surface Carrez × prix médian au m² : le prix au-delà duquel on ne va pas. */
  plafond: number;
  prixM2: number;
  /** Prix au m² de la fourchette, au milieu. */
  prixM2Obtenu: number;
  surface: number;
  echelle: "commune" | "departement";
  fenetreMois: number | null;
  nbVentes: number | null;
  rendementSecteur: number;
  loyerAnnuel: number;
  /** Les raisons de faire venir un agent, s'il y en a. */
  alertes: Alerte[];
  /** Décote au m² face au secteur, en %, et part des bureaux et commerces dans la surface. */
  decote: number;
  partPro: number;
};

export type Alerte = "decote" | "mixte";

export type EtatFourchette =
  | { etat: "prete"; f: Fourchette }
  | { etat: "agent"; raison: "sans-loyer"; prixM2: number; rendementSecteur: number | null }
  | { etat: "etat-locatif" }   // l'état locatif n'est pas encore envoyé
  | { etat: "sans-marche" };   // pas assez de données dans le secteur

const ECART = 0.15;
const DECOTE_MAX = 0.25;
const PART_PRO_MAX = 1 / 3;
const PRO = new Set(["bureau", "commerce", "local_activite"]);

const arrondi = (n: number) => Math.round(n / 10_000) * 10_000;

export async function fourchetteDe(c: CopieEstimation): Promise<EtatFourchette> {
  const lots = c.dossier?.lots ?? [];
  const carrez = lots.reduce((t, l) => t + (enNombre(l.surface) ?? 0), 0);
  if (!c.dossier_envoye_le || carrez <= 0) return { etat: "etat-locatif" };

  const dept = departementDe(c.codePostal);
  if (!dept || !c.ville) return { etat: "sans-marche" };
  const m = await marcheDuBien({ ville: c.ville, dept, codePostal: c.codePostal ?? null });
  if (!m?.prixM2 || !m.prixEchelle) return { etat: "sans-marche" };

  const loyerLots = lots.reduce((t, l) => t + (l.statut === "libre" ? 0 : (enNombre(l.loyer) ?? 0)), 0) * 12;
  const loyerAnnuel = loyerLots > 0 ? loyerLots : (c.loyerAnnuel ?? 0);
  const rendementSecteur = m.rentaVille && !m.rentaAVerifier ? m.rentaVille : null;
  const surfacePro = lots.reduce((t, l) => t + (PRO.has(l.type) ? (enNombre(l.surface) ?? 0) : 0), 0);
  if (loyerAnnuel <= 0) {
    return { etat: "agent", raison: "sans-loyer", prixM2: m.prixM2, rendementSecteur };
  }
  if (!rendementSecteur) return { etat: "sans-marche" };

  const plafond = carrez * m.prixM2;
  const valeur = loyerAnnuel / (rendementSecteur / 100);
  const decote = 1 - valeur / plafond;
  const alertes: Alerte[] = [];
  if (decote > DECOTE_MAX) alertes.push("decote");
  if (surfacePro / carrez > PART_PRO_MAX) alertes.push("mixte");

  const haute = Math.min(valeur * (1 + ECART), plafond);
  const basse = Math.min(valeur * (1 - ECART), haute * (1 - ECART));
  const milieu = (basse + haute) / 2;

  return {
    etat: "prete",
    f: {
      basse: arrondi(basse), haute: arrondi(haute), plafonnee: valeur * (1 + ECART) > plafond, plafond: arrondi(plafond),
      prixM2: m.prixM2, prixM2Obtenu: Math.round(milieu / carrez), surface: Math.round(carrez),
      echelle: m.prixEchelle, fenetreMois: m.prixFenetreMois, nbVentes: m.nbVentes,
      rendementSecteur, loyerAnnuel,
      alertes, decote: Math.round(decote * 100), partPro: Math.round((surfacePro / carrez) * 100),
    },
  };
}
