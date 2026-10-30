/**
 * Les repères communs à l'espace client (MAV, 30/10/2026) : la frise d'une
 * vente, les formats d'affichage, et ce que le compte montre selon le profil.
 * Sans dépendance serveur.
 */

/** Les sept étapes de la frise, dans l'ordre validé par MAV. */
export const ETAPES_VENTE = ["Estimation", "Mandat", "Commercialisation", "Visites", "Offres", "Compromis", "Acte"] as const;

/**
 * L'étape déposée par le BO (`compte_biens.etape`, texte libre : « estimation »,
 * « mandat signé », « en commercialisation », « sous offre », « vendu »…)
 * ramenée à un rang de la frise, de 1 à 7. Les visites et les offres déjà
 * reçues font avancer la frise même si l'étape écrite n'a pas bougé.
 */
export function rangEtape(etape: string | null, visites?: number | null, offres?: number | null): number {
  const e = (etape ?? "").toLowerCase();
  let r = 1;
  if (/mandat/.test(e)) r = 2;
  if (/commerciali|en vente|diffus/.test(e)) r = 3;
  if (/visite/.test(e)) r = 4;
  if (/offre/.test(e)) r = 5;
  if (/compromis|promesse/.test(e)) r = 6;
  if (/acte|vendu|sign[ée]/.test(e) && !/mandat/.test(e)) r = 7;
  if (r === 3 && (visites ?? 0) > 0) r = 4;
  if (r <= 4 && r >= 3 && (offres ?? 0) > 0) r = 5;
  return r;
}

export const euros = (n: number | null | undefined) =>
  n == null || !Number.isFinite(Number(n)) ? null : `${Math.round(Number(n)).toLocaleString("fr-FR")} €`;

export const pct = (n: number | null | undefined) =>
  n == null ? null : `${Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

export const dateCourte = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }) : null;

export const dateLongue = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }) : null;

export const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export const STATUTS_OFFRE: Record<string, string> = {
  en_cours: "À l’étude", contre_offre: "Contre-offre", acceptee: "Acceptée", refusee: "Refusée",
  compromis: "Compromis", vendu: "Vendu",
};

/** Le nom d'un immeuble du vendeur : sa commune et son département. */
export const nomImmeuble = (b: { commune: string | null; dept: string | null }) =>
  [b.commune ?? "Votre immeuble", b.dept ? `(${b.dept})` : null].filter(Boolean).join(" ");
