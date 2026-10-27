/**
 * Le dossier du vendeur : l'état locatif de son immeuble, lot par lot
 * (retour #64 de MAV, 27/10/2026).
 *
 * Sans dépendance serveur : la page de saisie et les routes s'en servent.
 *
 * Les options reprennent celles des lots du groupe (table `listing_lots` de
 * Plein Bail : `type_lot`, `lot_statut`, `type_bail`, `classe_energie`), avec
 * des libellés qu'un propriétaire comprend. La clé envoyée au BO est celle de
 * Plein Bail, au caractère près.
 */

export type Option = { cle: string; libelle: string };

/**
 * Les éléments que l'agent demande pour préparer l'entretien (texte de MAV,
 * retour #64). Repris par l'écran de fin du formulaire et par l'e-mail.
 */
export const ELEMENTS_ATTENDUS = [
  "Les surfaces Carrez, les typologies et les loyers hors charges de chaque lot, avec leur lettre DPE.",
  "Le montant de la taxe foncière annuelle et, idéalement, la part récupérée sur les locataires (TEOM).",
  "Des plans, si vous en avez.",
  "Des photos, si vous en avez.",
];

/** Le type du lot. Habitation, bureaux, commerces et activité suivent la partie 2 du formulaire. */
export const TYPES_LOT: Option[] = [
  { cle: "habitation", libelle: "Habitation" },
  { cle: "bureau", libelle: "Bureau" },
  { cle: "commerce", libelle: "Commerce" },
  { cle: "local_activite", libelle: "Entrepôt, activité" },
  { cle: "parking", libelle: "Parking, box" },
  { cle: "cave", libelle: "Cave" },
  { cle: "autre", libelle: "Autre" },
];

/** La typologie d'un logement, rangée dans `type_lot` côté Plein Bail (habitation_t1…). */
export const TYPOLOGIES: Option[] = [
  { cle: "habitation_t1", libelle: "Studio, T1" },
  { cle: "habitation_t2", libelle: "T2" },
  { cle: "habitation_t3", libelle: "T3" },
  { cle: "habitation_t4", libelle: "T4" },
  { cle: "habitation_t5plus", libelle: "T5 et plus" },
  { cle: "habitation_maison", libelle: "Maison" },
];

export const STATUTS: Option[] = [
  { cle: "occupe", libelle: "Loué" },
  { cle: "libre", libelle: "Libre" },
  { cle: "conge_en_cours", libelle: "Congé en cours" },
  { cle: "procedure", libelle: "Procédure en cours" },
];

const BAUX_HABITATION: Option[] = [
  { cle: "nu_89", libelle: "Vide (loi de 1989)" },
  { cle: "meuble", libelle: "Meublé" },
  { cle: "mobilite", libelle: "Bail mobilité" },
  { cle: "nu_48", libelle: "Loi de 1948" },
  { cle: "autre", libelle: "Autre" },
];
const BAUX_PRO: Option[] = [
  { cle: "commercial_369", libelle: "Commercial 3-6-9" },
  { cle: "professionnel", libelle: "Professionnel" },
  { cle: "derogatoire", libelle: "Dérogatoire" },
  { cle: "precaire", libelle: "Précaire" },
  { cle: "civil", libelle: "Civil" },
  { cle: "autre", libelle: "Autre" },
];

/** Les baux proposés dépendent du type de lot. */
export function bauxPour(type: string): Option[] {
  if (type === "habitation") return BAUX_HABITATION;
  if (type === "bureau" || type === "commerce" || type === "local_activite") return BAUX_PRO;
  return [{ cle: "civil", libelle: "Civil" }, { cle: "autre", libelle: "Autre" }];
}

export const DPE = ["A", "B", "C", "D", "E", "F", "G"] as const;

export type Lot = {
  type: string;
  typologie: string;
  etage: string;
  surface: string;
  statut: string;
  bail: string;
  loyer: string;
  dpe: string;
};

export type Dossier = {
  lots: Lot[];
  taxeFonciere: string;
  teom: string;
  commentaire: string;
};

/** Ce que la partie 2 du formulaire a dit des lots : de quoi préremplir. */
export type Comptes = { habitation: number; bureau: number; commerce: number; local_activite: number };

export const lotVide = (type = "habitation"): Lot => ({
  type, typologie: "", etage: "", surface: "", statut: "", bail: "", loyer: "", dpe: "",
});

export const LOTS_MAX = 120;

/** Un lot par lot annoncé, dans l'ordre du formulaire. Un logement si rien n'a été dit. */
export function dossierInitial(c: Partial<Comptes>): Dossier {
  const lots: Lot[] = [];
  for (const type of ["habitation", "bureau", "commerce", "local_activite"] as const) {
    const n = Math.max(0, Math.min(LOTS_MAX - lots.length, Math.floor(Number(c[type]) || 0)));
    for (let i = 0; i < n; i++) lots.push(lotVide(type));
  }
  return { lots: lots.length ? lots : [lotVide()], taxeFonciere: "", teom: "", commentaire: "" };
}

const dans = (v: unknown, options: readonly Option[] | readonly string[]) => {
  const s = String(v ?? "");
  return options.some((o) => (typeof o === "string" ? o === s : o.cle === s)) ? s : "";
};
/** Un nombre tel que tapé (« 1 250,5 »), borné en longueur ; le reste est effacé. */
const saisieNombre = (v: unknown) => String(v ?? "").replace(/[^\d\s,. ]/g, "").slice(0, 14);

/**
 * Remet en forme un dossier venu du navigateur : options connues seulement,
 * nombres en caractères permis, longueurs bornées. Ce qui ne passe pas est vidé.
 */
export function nettoyer(v: unknown): Dossier {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const lots = (Array.isArray(o.lots) ? o.lots : []).slice(0, LOTS_MAX).map((x) => {
    const l = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const type = dans(l.type, TYPES_LOT) || "autre";
    return {
      type,
      typologie: type === "habitation" ? dans(l.typologie, TYPOLOGIES) : "",
      etage: String(l.etage ?? "").replace(/[^\dA-Za-zÀ-ÿ -]/g, "").slice(0, 12),
      surface: saisieNombre(l.surface),
      statut: dans(l.statut, STATUTS),
      bail: dans(l.bail, bauxPour(type)),
      loyer: saisieNombre(l.loyer),
      dpe: dans(l.dpe, DPE),
    };
  });
  return {
    lots,
    taxeFonciere: saisieNombre(o.taxeFonciere),
    teom: saisieNombre(o.teom),
    commentaire: String(o.commentaire ?? "").slice(0, 2000),
  };
}

/** « 1 250,5 » → 1250.5 ; vide ou illisible → null. */
export function enNombre(v: string): number | null {
  const s = v.replace(/[\s  ]/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const libelle = (options: Option[], cle: string) => options.find((o) => o.cle === cle)?.libelle ?? "";

/**
 * Le dossier tel que le BO le reçoit : nombres en nombres, clés de Plein Bail.
 * `type` vaut la typologie pour un logement (habitation_t2…), comme `type_lot`.
 */
export function pourBO(d: Dossier) {
  return {
    taxeFonciere: enNombre(d.taxeFonciere),
    teom: enNombre(d.teom),
    commentaire: d.commentaire.trim(),
    lots: d.lots.map((l, i) => ({
      numero: i + 1,
      type: l.type === "habitation" && l.typologie ? l.typologie : l.type,
      etage: l.etage.trim() || null,
      surfaceCarrez: enNombre(l.surface),
      statut: l.statut || null,
      bail: l.statut === "libre" ? null : l.bail || null,
      loyerMensuelHC: l.statut === "libre" ? null : enNombre(l.loyer),
      dpe: l.dpe || null,
    })),
  };
}

/** Toutes les options de bail, pour relire un lot reçu au format du BO. */
const TOUS_BAUX = [...BAUX_HABITATION, ...BAUX_PRO];

/**
 * Un lot au format du BO, relu en clair pour l'alerte de l'agence : une
 * colonne par information, dans l'ordre du tableau de saisie.
 */
export function lotEnClair(x: unknown): string[] {
  const l = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const surface = n(l.surfaceCarrez);
  const loyer = n(l.loyerMensuelHC);
  return [
    String(l.numero ?? ""),
    String(l.type ?? "").startsWith("habitation_")
      ? `Habitation, ${libelle(TYPOLOGIES, String(l.type))}`
      : libelle(TYPES_LOT, String(l.type ?? "")) || String(l.type ?? ""),
    String(l.etage ?? ""),
    surface != null ? `${surface.toLocaleString("fr-FR")} m²` : "",
    libelle(STATUTS, String(l.statut ?? "")),
    libelle(TOUS_BAUX, String(l.bail ?? "")),
    loyer != null ? `${Math.round(loyer).toLocaleString("fr-FR")} €` : "",
    String(l.dpe ?? ""),
  ];
}
export const COLONNES_LOT = ["Lot", "Type", "Étage", "Carrez", "Occupation", "Bail", "Loyer HC / mois", "DPE"];

/** Totaux affichés sous le tableau : surface Carrez et loyers annuels. */
export function totaux(d: Dossier) {
  let surface = 0;
  let loyerMois = 0;
  for (const l of d.lots) {
    surface += enNombre(l.surface) ?? 0;
    if (l.statut !== "libre") loyerMois += enNombre(l.loyer) ?? 0;
  }
  return { surface, loyerAn: loyerMois * 12 };
}

/** La règle de mot de passe annoncée sur tout le site : 8 caractères au moins, lettres et chiffres. */
export const motDePasseValide = (m: string) =>
  m.length >= 8 && m.length <= 72 && /[A-Za-zÀ-ÿ]/.test(m) && /\d/.test(m);
