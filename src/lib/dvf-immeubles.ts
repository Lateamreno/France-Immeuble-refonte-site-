/**
 * Les ventes d'immeubles entiers repérées dans DVF (lot 100, MAV, 10/11/2026 : « les ventes dans
 * l'ancien qui ont plus de 5 lots d'habitation différents avec le même ID de vente et le même
 * prix affiché quelle que soit la surface »).
 *
 * Source : fichiers DVF géolocalisés d'Etalab (files.data.gouv.fr/geo-dvf), un fichier par
 * commune et par année civile. Règles :
 *  - une mutation de nature « Vente » : les échanges, la VEFA, les adjudications, les
 *    expropriations et les ventes de terrain à bâtir sont exclus (MAV, 13/11/2026) ;
 *  - plus de cinq logements (appartements ou maisons) et un seul prix ;
 *  - au moins 65 % de logements parmi les lots, caves et parkings exclus (MAV, 10/11/2026 :
 *    les immeubles de bureaux et les grands commerces tiraient les prix vers le haut) ;
 *  - prix d'au moins 150 000 € ;
 *  - une vente dont des lignes sont dans une autre commune suivie est écartée : son prix couvre
 *    aussi ces lignes ;
 *  - une même série de logements vendue plusieurs fois dans l'année (ventes de parts,
 *    démembrements) est écartée : on ne sait pas quel prix vaut pour l'immeuble entier ;
 *  - deux actes du même jour sur une même parcelle sont une seule vente (prix et surfaces
 *    additionnés) ;
 *  - prix au m² (sur la surface bâtie hors dépendances, commerces compris) entre 3 000 et
 *    30 000 € pour écarter les valeurs aberrantes.
 * La médiane du prix au m² n'est publiée qu'à partir de trois ventes. La fourchette laisse de côté
 * le quart des ventes le moins cher et le quart le plus cher (MAV, 13/11/2026), à partir de
 * quatre ventes.
 *
 * Lot 109 (13/11/2026) : DVF ne diffuse pas l'identifiant du local. Dans un immeuble sans numéros
 * de lot, deux appartements de même surface et de même nombre de pièces (le même plan à deux
 * étages) donnent deux lignes identiques. Les lots 100 à 108 les comptaient pour un seul logement :
 * la surface était sous-estimée et le prix au m² gonflé (13 rue Clapeyron, 8e : 613 m² au lieu de
 * 1 265 m²). Voir `locauxDe`.
 */

export const COMMUNES_SUIVIES: { code: string; nom: string }[] = [
  ...Array.from({ length: 20 }, (_, i) => ({
    code: `751${String(i + 1).padStart(2, "0")}`,
    nom: `${i + 1}${i === 0 ? "er" : "e"} arrondissement`,
  })),
  { code: "92012", nom: "Boulogne-Billancourt" },
  { code: "92044", nom: "Levallois-Perret" },
  { code: "92051", nom: "Neuilly-sur-Seine" },
  { code: "94041", nom: "Ivry-sur-Seine" },
  { code: "94067", nom: "Saint-Mandé" },
];

export const urlDvf = (annee: number, code: string) =>
  `https://files.data.gouv.fr/geo-dvf/latest/csv/${annee}/communes/${code.slice(0, 2)}/${code}.csv`;

/** Lecture d'un CSV DVF (virgules, champs éventuellement entre guillemets). */
export function lireCsv(texte: string): Record<string, string>[] {
  const lignes: string[][] = [];
  let champ = "", ligne: string[] = [], guillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemets) {
      if (c === '"') {
        if (texte[i + 1] === '"') { champ += '"'; i++; } else guillemets = false;
      } else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ",") { ligne.push(champ); champ = ""; }
    else if (c === "\n") { ligne.push(champ); lignes.push(ligne); ligne = []; champ = ""; }
    else if (c !== "\r") champ += c;
  }
  if (champ || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  const [tete, ...corps] = lignes;
  return corps.filter((l) => l.length === tete.length).map((l) => Object.fromEntries(tete.map((h, i) => [h, l[i]])));
}

/** Part minimale de logements, en nombre de lots hors dépendances (MAV, 10/11/2026). */
export const PART_HABITATION_MIN = 0.65;

export type StatsImmeubles = {
  nbVentes: number;
  prixM2Median: number | null;
  /** La fourchette : sans le quart des ventes le moins cher ni le quart le plus cher (MAV, 13/11/2026). */
  prixM2Bas: number | null;
  prixM2Haut: number | null;
  /** Le moins cher et le plus cher au m² de toutes les ventes retenues (MAV, 12/11/2026, retour #303). */
  prixM2Min: number | null;
  prixM2Max: number | null;
  prixMedian: number | null;
  surfaceMediane: number | null;
};

const mediane = (xs: number[]) => {
  if (!xs.length) return null;
  const v = [...xs].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

type Ligne = Record<string, string>;
const estLogement = (r: Ligne) => r.type_local === "Appartement" || r.type_local === "Maison";

/**
 * Les locaux d'une mutation, hors dépendances, avec le nombre de fois où chacun compte.
 * Une parcelle à plusieurs natures de culture répète chaque local une fois par nature : ces lignes
 * ne diffèrent que par la nature de culture, elles ne s'additionnent pas. Des lignes identiques sur
 * toutes les colonnes sont des locaux de mêmes caractéristiques. Avec un numéro de lot, deux cas :
 * un lot qui ne porte qu'un local répété est un doublon (il compte une fois) ; un lot qui porte
 * plusieurs locaux différents (un immeuble entier sous un seul numéro) est un contenant, ses
 * lignes identiques comptent.
 */
export function locauxDe(rows: Ligne[]): { cle: string; r: Ligne; fois: number }[] {
  const parCle = new Map<string, { r: Ligne; variantes: Map<string, number> }>();
  const clesDuLot = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.type_local || r.type_local === "Dépendance") continue;
    const cle = [r.id_parcelle, r.lot1_numero, r.type_local, r.surface_reelle_bati, r.nombre_pieces_principales].join("|");
    let g = parCle.get(cle);
    if (!g) parCle.set(cle, (g = { r, variantes: new Map() }));
    const v = Object.values(r).join("\u0001");
    g.variantes.set(v, (g.variantes.get(v) ?? 0) + 1);
    if (r.lot1_numero) {
      const lot = `${r.id_parcelle}|${r.lot1_numero}`;
      const cles = clesDuLot.get(lot);
      if (cles) cles.add(cle); else clesDuLot.set(lot, new Set([cle]));
    }
  }
  return [...parCle.entries()].map(([cle, g]) => {
    const contenant = !g.r.lot1_numero || clesDuLot.get(`${g.r.id_parcelle}|${g.r.lot1_numero}`)!.size > 1;
    return { cle, r: g.r, fois: contenant ? Math.max(...g.variantes.values()) : 1 };
  });
}

/** Part des ventes laissée de côté de chaque côté de la fourchette (MAV, 13/11/2026). */
export const PART_ECARTEE = 0.25;

/**
 * @param ailleurs identifiants des mutations qui ont aussi des lignes dans le fichier d'une autre
 *   commune : leur prix couvre des locaux qu'on ne voit pas ici.
 */
export function ventesImmeubles(lignes: Ligne[], ailleurs?: ReadonlySet<string>): StatsImmeubles {
  const parMutation = new Map<string, Ligne[]>();
  for (const l of lignes) {
    if (l.nature_mutation !== "Vente") continue;
    const g = parMutation.get(l.id_mutation);
    if (g) g.push(l); else parMutation.set(l.id_mutation, [l]);
  }
  type Candidate = { serie: string; date: string; parcelles: Set<string>; prix: number; surface: number };
  const candidats: Candidate[] = [];
  // Toute vente de plus de cinq logements compte pour repérer une série vendue plusieurs fois,
  // même si elle échoue à une autre règle (sans prix, plusieurs prix). La série, ce sont les
  // logements seuls, sans leur numéro de lot : les mêmes appartements vendus une fois avec et une
  // fois sans numéros de lot sont la même série.
  const series = new Map<string, number>();
  for (const [id, rows] of parMutation) {
    const locaux = locauxDe(rows);
    const nbLocaux = locaux.reduce((s, o) => s + o.fois, 0);
    const nbLogements = locaux.reduce((s, o) => s + (estLogement(o.r) ? o.fois : 0), 0);
    if (nbLogements <= 5) continue;
    const parPlan = new Map<string, number>();
    for (const o of locaux) {
      if (!estLogement(o.r)) continue;
      const plan = [o.r.id_parcelle, o.r.type_local, o.r.surface_reelle_bati, o.r.nombre_pieces_principales].join("|");
      parPlan.set(plan, (parPlan.get(plan) ?? 0) + o.fois);
    }
    const serie = [...parPlan].map(([plan, fois]) => `${plan}x${fois}`).sort().join(";");
    series.set(serie, (series.get(serie) ?? 0) + 1);
    const prixDistincts = new Set(rows.map((r) => r.valeur_fonciere));
    if (prixDistincts.size !== 1) continue;
    const prix = Number(rows[0].valeur_fonciere);
    if (!rows[0].valeur_fonciere || !Number.isFinite(prix) || prix < 150_000) continue;
    if (nbLogements / nbLocaux < PART_HABITATION_MIN) continue;
    const surface = locaux.reduce((s, o) => s + o.fois * (Number(o.r.surface_reelle_bati) || 0), 0);
    if (!surface) continue;
    if (ailleurs?.has(id)) continue;
    candidats.push({ serie, date: rows[0].date_mutation, parcelles: new Set(rows.map((r) => r.id_parcelle).filter(Boolean)), prix, surface });
  }
  // Deux actes du même jour sur une même parcelle : une seule vente.
  const ventes: Candidate[] = [];
  for (const c of candidats) {
    if (series.get(c.serie) !== 1) continue;
    const deja = ventes.find((v) => v.date === c.date && [...c.parcelles].some((p) => v.parcelles.has(p)));
    if (deja) {
      deja.prix += c.prix;
      deja.surface += c.surface;
      for (const p of c.parcelles) deja.parcelles.add(p);
    } else ventes.push({ ...c, parcelles: new Set(c.parcelles) });
  }
  const pm2 = ventes
    .filter((c) => c.prix / c.surface >= 3_000 && c.prix / c.surface <= 30_000)
    .map((c) => ({ ...c, pm2: c.prix / c.surface }))
    .sort((a, b) => a.pm2 - b.pm2);
  const n = pm2.length;
  // La fourchette : on laisse de côté autant de ventes en bas qu'en haut. La médiane n'en bouge pas.
  const k = Math.floor(n * PART_ECARTEE);
  return {
    nbVentes: n,
    prixM2Median: n >= 3 ? Math.round(mediane(pm2.map((c) => c.pm2))!) : null,
    prixM2Bas: k >= 1 ? Math.round(pm2[k].pm2) : null,
    prixM2Haut: k >= 1 ? Math.round(pm2[n - 1 - k].pm2) : null,
    prixM2Min: n >= 3 ? Math.round(pm2[0].pm2) : null,
    prixM2Max: n >= 3 ? Math.round(pm2[n - 1].pm2) : null,
    prixMedian: n >= 3 ? Math.round(mediane(pm2.map((c) => c.prix))!) : null,
    surfaceMediane: n >= 3 ? Math.round(mediane(pm2.map((c) => c.surface))!) : null,
  };
}

/**
 * Dernière année civile ENTIÈRE publiée par DVF. DVF paraît deux fois par an : au printemps avec
 * l'année passée complète, à l'automne avec le premier semestre de l'année en cours. Avant juin,
 * le fichier de l'année passée existe donc déjà mais ne porte que six mois : on ne le prend pas
 * (le tableau de la page Paris écrirait « en 2026 » sur un semestre de ventes).
 */
export async function derniereAnneeDvf(): Promise<number | null> {
  const maintenant = new Date();
  const an = maintenant.getFullYear();
  const essais = maintenant.getMonth() >= 5 ? [an - 1, an - 2] : [an - 2, an - 3];
  for (const a of essais) {
    try {
      const r = await fetch(urlDvf(a, "75101"), { method: "HEAD", redirect: "follow", cache: "no-store" });
      if (r.ok) return a;
    } catch { /* année suivante */ }
  }
  return null;
}
