import { CODE_PARIS } from "./dvf-immeubles";

/**
 * Les loyers de marché des appartements d'une année, tirés de la carte des loyers de l'État (ANIL,
 * « Indicateurs de loyers d'annonce par commune », une édition par an sur data.gouv.fr). Lot 114
 * (MAV, 15/11/2026 : « pour le calcul du rendement 2023 et 2024 il faudra prendre en base les loyers
 * moyens de l'époque ») : le rendement théorique d'une année se calcule avec les loyers de cette
 * année, et non ceux d'aujourd'hui (+15 % à Paris de 2023 à 2025).
 *
 * Indicateur : « loypredm2 » du fichier « Indicateurs de loyer appartement » (toutes tailles,
 * charges comprises, €/m² par mois), le même que lit Plein Bail pour l'année en cours. Paris n'a
 * pas de ligne : son loyer est la moyenne des vingt arrondissements pondérée par le nombre
 * d'annonces observées (« nbobs_com »).
 */

export type LoyerCommune = { loyerM2: number; observations: number };

const API = "https://www.data.gouv.fr/api/1/datasets/";
const nombre = (v: string | undefined) => (v ? Number(v.replace(/"/g, "").replace(",", ".")) : NaN);

/** L'adresse du fichier des appartements de l'édition `annee`, ou `null` si elle n'est pas (encore) publiée. */
async function urlEdition(annee: number, signal?: AbortSignal): Promise<string | null> {
  const q = encodeURIComponent(`carte des loyers indicateurs de loyers d'annonce par commune en ${annee}`);
  const r = await fetch(`${API}?q=${q}&page_size=20`, { cache: "no-store", signal });
  if (!r.ok) return null;
  const d = (await r.json()) as { data?: { title: string; resources?: { title: string; url: string }[] }[] };
  const jeu = (d.data ?? []).find((x) => x.title.toLowerCase().includes(`par commune en ${annee}`));
  const res = (jeu?.resources ?? []).find((x) => {
    const t = x.title.trim().toLowerCase();
    return t.startsWith("indicateur") && t.includes("appartement") && !t.includes("pièce") && !t.includes("piece");
  });
  return res?.url ?? null;
}

/**
 * Loyers des communes demandées pour l'édition `annee`, plus Paris (75056) quand les vingt
 * arrondissements y sont. `null` si l'édition n'est pas publiée ou ne répond pas.
 */
export async function loyersAnil(annee: number, codes: readonly string[], signal?: AbortSignal): Promise<Map<string, LoyerCommune> | null> {
  try {
    const url = await urlEdition(annee, signal);
    if (!url) return null;
    const r = await fetch(url, { cache: "no-store", signal });
    if (!r.ok) return null;
    // Fichier en Latin-1, séparateur « ; », virgule décimale.
    const texte = new TextDecoder("latin1").decode(await r.arrayBuffer());
    const [tete, ...lignes] = texte.split(/\r?\n/);
    const cols = tete.split(";").map((c) => c.replace(/"/g, "").trim());
    const iCode = cols.indexOf("INSEE_C"), iLoyer = cols.indexOf("loypredm2"), iObs = cols.indexOf("nbobs_com");
    if (iCode < 0 || iLoyer < 0) return null;
    const voulus = new Set(codes);
    const out = new Map<string, LoyerCommune>();
    for (const l of lignes) {
      const c = l.split(";");
      const code = (c[iCode] ?? "").replace(/"/g, "");
      if (!voulus.has(code)) continue;
      const loyer = nombre(c[iLoyer]);
      if (Number.isFinite(loyer) && loyer > 0) out.set(code, { loyerM2: loyer, observations: iObs >= 0 ? nombre(c[iObs]) || 0 : 0 });
    }
    const arr = Array.from({ length: 20 }, (_, i) => out.get(`751${String(i + 1).padStart(2, "0")}`));
    if (arr.every(Boolean)) {
      const poids = arr.reduce((s, x) => s + (x!.observations || 1), 0);
      const loyer = arr.reduce((s, x) => s + x!.loyerM2 * (x!.observations || 1), 0) / poids;
      out.set(CODE_PARIS, { loyerM2: loyer, observations: poids });
    }
    return out.size ? out : null;
  } catch {
    return null;
  }
}
