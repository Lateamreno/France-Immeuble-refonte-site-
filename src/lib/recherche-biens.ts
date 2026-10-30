import type { BienAVendre } from "./biens";
import { DEPARTEMENTS } from "./departements";

/**
 * La recherche de la page Immeubles à vendre (MAV, 31/10/2026 : « le même
 * système de recherche que Plein Bail »). Les critères vivent dans l'adresse
 * de la page : une recherche se partage et se retrouve. Sans dépendance
 * serveur : la barre de recherche s'en sert aussi.
 */

export type Tri = "recent" | "rendement" | "prix" | "prixm2";

export type Criteres = {
  departements: string[];
  villes: string[];
  types: string[];
  prixMin: number | null;
  prixMax: number | null;
  rendementMin: number | null;
  surfaceMin: number | null;
  lotsMin: number | null;
  sansOffre: boolean;
  tri: Tri;
};

export const TRIS: [Tri, string][] = [
  ["recent", "Plus récents"],
  ["rendement", "Rendement ↓"],
  ["prix", "Prix ↑"],
  ["prixm2", "Prix/m² ↑"],
];

type Params = Record<string, string | string[] | undefined>;

const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const liste = (v: string | string[] | undefined) =>
  un(v).split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20);
const nombre = (v: string | string[] | undefined) => {
  const t = un(v).replace(/\s/g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export function lireCriteres(p: Params): Criteres {
  const tri = un(p.tri) as Tri;
  return {
    departements: liste(p.dep).filter((d) => d in DEPARTEMENTS),
    villes: liste(p.ville).map((v) => v.slice(0, 80)),
    types: liste(p.type).map((v) => v.slice(0, 60)),
    prixMin: nombre(p.pmin),
    prixMax: nombre(p.pmax),
    rendementMin: nombre(p.rdt),
    surfaceMin: nombre(p.smin),
    lotsMin: nombre(p.lmin),
    sansOffre: un(p.dispo) === "1",
    tri: TRIS.some(([k]) => k === tri) ? tri : "recent",
  };
}

/** Les critères en paramètres d'adresse (vides omis). */
export function versParams(c: Partial<Criteres>): string {
  const q = new URLSearchParams();
  if (c.departements?.length) q.set("dep", c.departements.join(","));
  if (c.villes?.length) q.set("ville", c.villes.join(","));
  if (c.types?.length) q.set("type", c.types.join(","));
  if (c.prixMin != null) q.set("pmin", String(c.prixMin));
  if (c.prixMax != null) q.set("pmax", String(c.prixMax));
  if (c.rendementMin) q.set("rdt", String(c.rendementMin));
  if (c.surfaceMin) q.set("smin", String(c.surfaceMin));
  if (c.lotsMin) q.set("lmin", String(c.lotsMin));
  if (c.sansOffre) q.set("dispo", "1");
  if (c.tri && c.tri !== "recent") q.set("tri", c.tri);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filtrer(biens: BienAVendre[], c: Criteres): BienAVendre[] {
  const lieu = c.departements.length > 0 || c.villes.length > 0;
  const villes = c.villes.map(sansAccents);
  const res = biens.filter((b) =>
    (!lieu || c.departements.includes(b.dept) || villes.includes(sansAccents(b.ville))) &&
    (c.types.length === 0 || c.types.includes(b.type)) &&
    (c.prixMin == null || b.prixHai >= c.prixMin) &&
    (c.prixMax == null || b.prixHai <= c.prixMax) &&
    (!c.rendementMin || (b.rendement != null && b.rendement >= c.rendementMin)) &&
    (!c.surfaceMin || (b.surface != null && b.surface >= c.surfaceMin)) &&
    (!c.lotsMin || (b.lots != null && b.lots >= c.lotsMin)) &&
    (!c.sansOffre || b.statut === "en_vente"),
  );
  const derniers = (v: number | null, sens: 1 | -1) => (v == null ? Infinity : sens * v);
  switch (c.tri) {
    case "rendement": return res.sort((a, b) => derniers(a.rendement, -1) - derniers(b.rendement, -1));
    case "prix": return res.sort((a, b) => a.prixHai - b.prixHai);
    case "prixm2": return res.sort((a, b) => derniers(a.prixM2, 1) - derniers(b.prixM2, 1));
    default: return res.sort((a, b) => b.publieLe.localeCompare(a.publieLe));
  }
}

const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

/** Les critères actifs, chacun avec l'adresse qui le retire (« puces » au-dessus des résultats). */
export function puces(c: Criteres): { libelle: string; sans: string }[] {
  const out: { libelle: string; sans: string }[] = [];
  const sans = (m: Partial<Criteres>) => `/immeubles-a-vendre/${versParams({ ...c, ...m })}#resultats`;
  for (const d of c.departements) out.push({ libelle: `${DEPARTEMENTS[d]} (${d})`, sans: sans({ departements: c.departements.filter((x) => x !== d) }) });
  for (const v of c.villes) out.push({ libelle: v, sans: sans({ villes: c.villes.filter((x) => x !== v) }) });
  for (const t of c.types) out.push({ libelle: t, sans: sans({ types: c.types.filter((x) => x !== t) }) });
  if (c.prixMin != null) out.push({ libelle: `Dès ${euros(c.prixMin)}`, sans: sans({ prixMin: null }) });
  if (c.prixMax != null) out.push({ libelle: `Jusqu’à ${euros(c.prixMax)}`, sans: sans({ prixMax: null }) });
  if (c.rendementMin) out.push({ libelle: `Rendement ≥ ${c.rendementMin.toLocaleString("fr-FR")} %`, sans: sans({ rendementMin: null }) });
  if (c.surfaceMin) out.push({ libelle: `≥ ${c.surfaceMin} m²`, sans: sans({ surfaceMin: null }) });
  if (c.lotsMin) out.push({ libelle: `≥ ${c.lotsMin} lots`, sans: sans({ lotsMin: null }) });
  if (c.sansOffre) out.push({ libelle: "Sans offre en cours", sans: sans({ sansOffre: false }) });
  return out;
}

/** Les critères de la barre en recherche de compte (§9.4, `recherche_compte`). */
export function versRechercheCompte(c: Criteres, biens: BienAVendre[]) {
  // Une ville choisie apporte son département : le BO exige au moins un département.
  const deptsDesVilles = c.villes
    .map((v) => biens.find((b) => sansAccents(b.ville) === sansAccents(v))?.dept)
    .filter((d): d is string => !!d);
  return {
    departements: [...new Set([...c.departements, ...deptsDesVilles])],
    villes: c.villes,
    prixMin: c.prixMin,
    prixMax: c.prixMax,
    rendementMin: c.rendementMin,
  };
}
