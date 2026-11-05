import type { DonneesCompte, Saisie } from "./donnees";
import type { Dossier } from "../dossier/modele";

/**
 * Les immeubles que le client a fait estimer, avant que le BO ne les dépose
 * (retours #261 et #274, MAV, 05/11/2026 : « dès le moment où j'ai rempli un
 * formulaire d'estimation »). C'est la copie gardée par le site (`compte_saisies`,
 * type `estimation`, migration 0017). Dès que le BO dépose l'immeuble avec la
 * même `ref`, sa fiche prend la place de la copie.
 *
 * Pas de numéro de rue dans la copie : la rue, le code postal et la ville
 * suffisent au client pour reconnaître son immeuble.
 */
export type CopieEstimation = {
  formulaire?: string;
  rue?: string;
  codePostal?: string;
  ville?: string;
  lots?: { habitation?: number; bureau?: number; commerce?: number; local_activite?: number };
  surface?: number | null;
  loyerAnnuel?: number | null;
  travaux?: string;
  echeance?: string;
  /** L'état locatif en cours de saisie, ou le dernier envoyé. */
  dossier?: Dossier;
  dossier_envoye_le?: string;
  /** Les pièces envoyées depuis le compte, en attendant `compte_documents`. */
  pieces?: { nom: string; categorie: string; recu_le: string }[];
  /** Immeuble déjà déposé par le BO, sans `ref` : l'état locatif lui est rattaché. */
  bien?: string;
};

export type DemandeEstimation = { ref: string; envoye_le: string; c: CopieEstimation };

const copie = (s: Saisie): DemandeEstimation => ({ ref: s.ref, envoye_le: s.envoye_le, c: s.donnees as CopieEstimation });

/** Les estimations envoyées dont le BO n'a pas encore déposé l'immeuble. */
export function demandesEnCours(d: DonneesCompte): DemandeEstimation[] {
  const deposees = new Set(d.biens.map((b) => b.ref).filter(Boolean));
  return d.saisies
    .filter((s) => s.type === "estimation" && !deposees.has(s.ref) && !(s.donnees as CopieEstimation).bien)
    .map(copie);
}

/** La copie rattachée à un immeuble du BO (par sa `ref`, ou par l'état locatif saisi). */
export function copieDuBien(d: DonneesCompte, b: { cle: string; ref?: string | null }): DemandeEstimation | null {
  const s = d.saisies.find((x) => x.type === "estimation" && (x.ref === b.ref || (x.donnees as CopieEstimation).bien === b.cle));
  return s ? copie(s) : null;
}

export const nomDemande = (c: CopieEstimation) =>
  [c.rue, c.ville].filter(Boolean).join(", ") || "Mon immeuble";

export const lotsDemande = (c: CopieEstimation) =>
  Object.values(c.lots ?? {}).reduce<number>((t, n) => t + (Number(n) || 0), 0);

/** « 6 lots · 420 m² » */
export function resumeDemande(c: CopieEstimation): string {
  const n = c.dossier?.lots.length || lotsDemande(c);
  return [
    n ? `${n} lot${n > 1 ? "s" : ""}` : null,
    c.surface ? `${Math.round(c.surface).toLocaleString("fr-FR")} m²` : null,
    c.codePostal ? `${c.codePostal}` : null,
  ].filter(Boolean).join(" · ");
}

/** Le département d'un code postal : 75, 92, 2A, 971… */
export function departementDe(cp: string | undefined): string | null {
  const s = String(cp ?? "").trim();
  if (!/^\d{5}$/.test(s)) return null;
  if (s.startsWith("97")) return s.slice(0, 3);
  if (s.startsWith("20")) return Number(s) < 20200 ? "2A" : "2B";
  return s.slice(0, 2);
}

/** « 12 bis, rue de la Paix » → « rue de la Paix » : la copie ne garde jamais le numéro. */
export const rueSansNumero = (rue: unknown) =>
  String(rue ?? "").trim().replace(/^\d+\s*(bis|ter|quater|[a-d])?\b[\s,]*/i, "").slice(0, 160);

/** Ce que l'estimation envoyée garde pour le compte : rien d'autre que l'immeuble. */
export function copieDepuisLead(b: Record<string, unknown>): CopieEstimation {
  const n = (v: unknown) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
  const t = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const c: CopieEstimation = {
    formulaire: t(b.formulaire, 20),
    rue: rueSansNumero(b.rue),
    codePostal: t(b.codePostal, 10),
    ville: t(b.ville, 80),
  };
  if (b.etat === "complement") {
    c.lots = {
      habitation: n(b.lotsHabitation) ?? 0, bureau: n(b.lotsBureaux) ?? 0,
      commerce: n(b.lotsCommerces) ?? 0, local_activite: n(b.lotsActivite) ?? 0,
    };
    c.surface = n(b.surface);
    c.loyerAnnuel = n(b.loyerAnnuel);
    c.travaux = t(b.travaux, 40);
    c.echeance = t(b.echeance, 40);
  }
  return c;
}
