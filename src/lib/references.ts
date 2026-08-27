/**
 * Références anonymisées — CLAUDE.md §2.
 *
 * ⚠️ DONNÉES DE DÉMARRAGE. À remplacer par la projection `web.references`
 * déposée par le BO. Le site ne lira jamais le CRM directement.
 *
 * Règle d'anonymisation, non négociable : arrondissement et non rue,
 * fourchettes et non montants exacts, jamais de nom. On ne peut pas promettre
 * la discrétion off-market au vendeur et publier le détail ici.
 */
export type Reference = {
  id: string;
  ville: string;
  secteur: string;
  lots: number;
  surface: number;
  annee: number;
  typologie: "Habitation" | "Mixte" | "Bureaux";
  fourchette: string;
  delaiSemaines: number;
};

export const REFERENCES: Reference[] = [
  { id: "r1",  ville: "Paris",                secteur: "18e",  lots: 8,  surface: 420,  annee: 2026, typologie: "Habitation", fourchette: "2 – 3 M€",   delaiSemaines: 3 },
  { id: "r2",  ville: "Paris",                secteur: "11e",  lots: 12, surface: 610,  annee: 2026, typologie: "Mixte",      fourchette: "3 – 4 M€",   delaiSemaines: 6 },
  { id: "r3",  ville: "Boulogne-Billancourt", secteur: "Centre", lots: 10, surface: 540, annee: 2026, typologie: "Habitation", fourchette: "4 – 5 M€", delaiSemaines: 5 },
  { id: "r4",  ville: "Paris",                secteur: "10e",  lots: 6,  surface: 310,  annee: 2025, typologie: "Mixte",      fourchette: "2 – 3 M€",   delaiSemaines: 4 },
  { id: "r5",  ville: "Neuilly-sur-Seine",    secteur: "Centre", lots: 9, surface: 480, annee: 2025, typologie: "Habitation", fourchette: "5 – 7 M€",  delaiSemaines: 7 },
  { id: "r6",  ville: "Paris",                secteur: "19e",  lots: 14, surface: 720,  annee: 2025, typologie: "Habitation", fourchette: "3 – 4 M€",   delaiSemaines: 4 },
  { id: "r7",  ville: "Levallois-Perret",     secteur: "Centre", lots: 7, surface: 360, annee: 2025, typologie: "Mixte",      fourchette: "3 – 4 M€",   delaiSemaines: 8 },
  { id: "r8",  ville: "Paris",                secteur: "20e",  lots: 11, surface: 590,  annee: 2025, typologie: "Habitation", fourchette: "2 – 3 M€",   delaiSemaines: 5 },
  { id: "r9",  ville: "Saint-Ouen",           secteur: "Docks", lots: 16, surface: 880, annee: 2024, typologie: "Habitation", fourchette: "4 – 5 M€",   delaiSemaines: 9 },
  { id: "r10", ville: "Paris",                secteur: "9e",   lots: 5,  surface: 280,  annee: 2024, typologie: "Bureaux",    fourchette: "3 – 4 M€",   delaiSemaines: 6 },
  { id: "r11", ville: "Montreuil",            secteur: "Croix-de-Chavaux", lots: 13, surface: 640, annee: 2024, typologie: "Habitation", fourchette: "2 – 3 M€", delaiSemaines: 6 },
  { id: "r12", ville: "Paris",                secteur: "17e",  lots: 9,  surface: 470,  annee: 2024, typologie: "Mixte",      fourchette: "4 – 5 M€",   delaiSemaines: 4 },
];

/** Agrégats affichés — remplacés par `web.stats` dès que le BO les dépose. */
export const REFERENCES_STATS = {
  total: 365,
  villes: 42,
  delaiMedianSemaines: 5,
} as const;
