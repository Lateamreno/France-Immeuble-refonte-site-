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
 *  - lot 114 (MAV, 15/11/2026, après l'audit de 2023 et 2024) : un portefeuille qui prend des lots
 *    d'une autre copropriété est écarté ; une vente payée en deux actes le même jour est réunie quand
 *    la somme des deux prix est ronde ; un acte sans prix ne compte pas comme une deuxième vente ; un
 *    immeuble sans numéros de lot vendu deux fois à deux dates garde son dernier acte ;
 *  - prix au m² (sur la surface bâtie hors dépendances, commerces compris) entre 3 000 et
 *    30 000 € pour écarter les valeurs aberrantes.
 * La médiane du prix au m² n'est publiée qu'à partir de trois ventes. La fourchette laisse de côté
 * le quart des ventes le moins cher et le quart le plus cher (MAV, 13/11/2026) : elle va du premier
 * au troisième quartile, à partir de cinq ventes (à quatre, elle ne tiendrait qu'à deux ventes).
 *
 * Lot 109 (13/11/2026) : DVF ne diffuse pas l'identifiant du local. Dans un immeuble sans numéros
 * de lot, deux appartements de même surface et de même nombre de pièces (le même plan à deux
 * étages) donnent deux lignes identiques. Les lots 100 à 108 les comptaient pour un seul logement :
 * la surface était sous-estimée et le prix au m² gonflé (13 rue Clapeyron, 8e : 613 m² au lieu de
 * 1 265 m²). Voir `locauxDe`.
 *
 * Lot 110 (MAV, 13/11/2026) : les appartements vendus seuls du même fichier, pour la décote des
 * immeubles vendus en bloc. Voir `ventesAppartements`.
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

/** Code INSEE de la commune de Paris : la ligne « tout Paris » de la table, ventes des vingt arrondissements réunies (lot 113). */
export const CODE_PARIS = "75056";

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

/** Bornes du prix au m² : en dehors, la valeur est tenue pour aberrante (immeubles et appartements). */
export const PRIX_M2_MIN = 3_000;
export const PRIX_M2_MAX = 30_000;
const dansLesBornes = (pm2: number) => pm2 >= PRIX_M2_MIN && pm2 <= PRIX_M2_MAX;

/** Les lignes des mutations de nature « Vente », rangées par mutation. */
function ventesParMutation(lignes: Ligne[]): Map<string, Ligne[]> {
  const parMutation = new Map<string, Ligne[]>();
  for (const l of lignes) {
    if (l.nature_mutation !== "Vente") continue;
    const g = parMutation.get(l.id_mutation);
    if (g) g.push(l); else parMutation.set(l.id_mutation, [l]);
  }
  return parMutation;
}

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
/** Sous ce nombre de ventes, la fourchette ne s'affiche pas : le prix médian reste seul. */
export const VENTES_MIN_FOURCHETTE = 5;

/**
 * Quantile d'une liste triée, par interpolation entre deux ventes voisines (la fonction QUARTILE des
 * tableurs). Une borne « partie entière de n/4 » donnait une fourchette en dents de scie : trop
 * étroite quand le nombre de ventes est un multiple de quatre.
 */
export const quantile = (tries: number[], p: number) => {
  const h = (tries.length - 1) * p;
  const i = Math.floor(h);
  return tries[i] + (h - i) * ((tries[i + 1] ?? tries[i]) - tries[i]);
};

/** Part de surface au-delà de laquelle des lots d'une autre copropriété font écarter une vente (lot 114). */
export const PART_AUTRE_COPRO_MAX = 0.1;
/** Un prix « rond » : multiple de 10 000 €, pour reconnaître une vente payée en deux actes (lot 114). */
const estRond = (prix: number) => prix > 0 && prix % 10_000 === 0;
/** Un seul prix, positif, pour toute la mutation ; sinon `null`. */
function prixUnique(rows: Ligne[]): number | null {
  if (new Set(rows.map((r) => r.valeur_fonciere)).size !== 1 || !rows[0].valeur_fonciere) return null;
  const prix = Number(rows[0].valeur_fonciere);
  return Number.isFinite(prix) && prix > 0 ? prix : null;
}
const sansNumerosDeLot = (locaux: { r: Ligne }[]) => locaux.every((o) => !o.r.lot1_numero);
const lotsDe = (rows: Ligne[]) => new Set(rows.filter((r) => r.lot1_numero).map((r) => `${r.id_parcelle}|${r.lot1_numero}`));

/**
 * Lot 114 (MAV, 15/11/2026, après l'audit de 2023 et 2024) : un portefeuille qui mêle un immeuble
 * sans numéros de lot et des lots numérotés d'une autre copropriété (« oui on écarte quand ça prend
 * des lots d'autres copro »). Une parcelle n'a que des locaux sans numéro, une autre n'a que des
 * locaux numérotés, et cette autre part dépasse 10 % de la surface. Dix immeubles entiers bâtis sur
 * plusieurs parcelles voisines (sans numéros partout) ne sont pas touchés.
 */
function prendDesLotsDAutresCopros(locaux: { r: Ligne; fois: number }[]): boolean {
  const parParcelle = new Map<string, { r: Ligne; fois: number }[]>();
  for (const o of locaux) {
    const g = parParcelle.get(o.r.id_parcelle);
    if (g) g.push(o); else parParcelle.set(o.r.id_parcelle, [o]);
  }
  if (parParcelle.size < 2) return false;
  const surf = (xs: { r: Ligne; fois: number }[]) => xs.reduce((s, o) => s + o.fois * (Number(o.r.surface_reelle_bati) || 0), 0);
  const groupes = [...parParcelle.values()];
  const immeuble = groupes.some((g) => g.every((o) => !o.r.lot1_numero));
  const enLots = groupes.filter((g) => g.every((o) => o.r.lot1_numero));
  const total = surf(locaux);
  return immeuble && enLots.length > 0 && total > 0 && surf(enLots.flat()) / total > PART_AUTRE_COPRO_MAX;
}

/**
 * @param ailleurs identifiants des mutations qui ont aussi des lignes dans le fichier d'une autre
 *   commune : leur prix couvre des locaux qu'on ne voit pas ici.
 */
type Candidate = { ids: string[]; serie: string; sansLots: boolean; date: string; parcelles: Set<string>; lots: Set<string>; prix: number; surface: number };

/**
 * Les ventes d'immeubles retenues, une par vente, avec leur prix au m², du moins cher au plus cher.
 * Une seule sélection pour les chiffres (`ventesImmeubles`) et pour le détail (`detailVentesImmeubles`,
 * lot 125) : la liste vente par vente est exactement celle qui fait les médianes.
 */
function retenues(lignes: Ligne[], ailleurs?: ReadonlySet<string>): { ventes: (Candidate & { pm2: number })[]; parMutation: Map<string, Ligne[]> } {
  const parMutation = ventesParMutation(lignes);
  const candidats: Candidate[] = [];
  // Toute vente de plus de cinq logements compte pour repérer une série vendue plusieurs fois,
  // même si elle échoue à une autre règle (plusieurs prix, par exemple). La série, ce sont les
  // logements seuls, sans leur numéro de lot : les mêmes appartements vendus une fois avec et une
  // fois sans numéros de lot sont la même série.
  // Lot 114 (MAV, 15/11/2026 : « pas compter un acte sans prix comme une deuxième vente ») : un acte
  // sans aucun prix ne compte pas dans les séries.
  const series = new Map<string, { n: number; dates: Set<string>; prix: Map<string, number>; sansLots: boolean }>();
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
    const sansLots = sansNumerosDeLot(locaux);
    if (rows.some((r) => Number(r.valeur_fonciere) > 0)) {
      const s = series.get(serie) ?? { n: 0, dates: new Set<string>(), prix: new Map<string, number>(), sansLots: true };
      s.n++; s.dates.add(rows[0].date_mutation); s.sansLots &&= sansLots;
      const p = prixUnique(rows);
      if (p != null) s.prix.set(rows[0].date_mutation, p);
      series.set(serie, s);
    }
    const prix = prixUnique(rows);
    if (prix == null || prix < 150_000) continue;
    if (nbLogements / nbLocaux < PART_HABITATION_MIN) continue;
    const surface = locaux.reduce((s, o) => s + o.fois * (Number(o.r.surface_reelle_bati) || 0), 0);
    if (!surface) continue;
    if (ailleurs?.has(id)) continue;
    if (prendDesLotsDAutresCopros(locaux)) continue;
    candidats.push({ ids: [id], serie, sansLots, date: rows[0].date_mutation, parcelles: new Set(rows.map((r) => r.id_parcelle).filter(Boolean)), lots: lotsDe(rows), prix, surface });
  }
  // Une série vendue plusieurs fois est écartée, sauf (lot 114, MAV, 15/11/2026 : « pour l'immeuble
  // en double tu prends le dernier », « garder le deuxième acte ») un immeuble sans numéros de lot
  // vendu deux fois à deux dates différentes : on garde le dernier acte. Les reprises du même jour
  // et les parts d'indivision (plus de deux actes) restent écartées. Garde-fou de la relecture : le
  // dernier acte doit valoir au moins 80 % du premier, sinon c'est peut-être une part et les deux
  // restent écartés (aucun effet de 2023 à 2025).
  const gardee = (c: Candidate) => {
    const s = series.get(c.serie);
    if (!s || s.n === 1) return true;
    if (s.n !== 2 || s.dates.size !== 2 || !s.sansLots || !c.sansLots) return false;
    const [premiere, derniere] = [...s.dates].sort();
    const p1 = s.prix.get(premiere), p2 = s.prix.get(derniere);
    return c.date === derniere && p1 != null && p2 != null && p2 >= 0.8 * p1;
  };
  // Deux actes du même jour sur une même parcelle : une seule vente.
  const ventes: Candidate[] = [];
  for (const c of candidats) {
    if (!gardee(c)) continue;
    const deja = ventes.find((v) => v.date === c.date && [...c.parcelles].some((p) => v.parcelles.has(p)));
    if (deja) {
      deja.ids.push(...c.ids);
      deja.prix += c.prix;
      deja.surface += c.surface;
      for (const p of c.parcelles) deja.parcelles.add(p);
      for (const l of c.lots) deja.lots.add(l);
    } else ventes.push({ ...c, ids: [...c.ids], parcelles: new Set(c.parcelles), lots: new Set(c.lots) });
  }
  // Lot 114 (MAV, 15/11/2026 : « oui pour deux actes ») : une vente payée en deux actes le même jour,
  // dont l'un porte cinq logements ou moins. On réunit une vente retenue d'un seul acte et un autre
  // acte du même jour, sur la même parcelle, à lots différents, quand aucun des deux prix n'est rond
  // et que leur somme l'est (multiple de 10 000 €). Garde-fous de la relecture (aucun effet de 2023 à
  // 2025) : l'acte ajouté porte cinq logements ou moins (un acte plus gros a ses propres règles) ;
  // l'un des deux prix n'est pas un compte rond de milliers (sinon la somme ronde peut être un
  // hasard) ; un seul acte possible, sinon on ne réunit rien.
  const pris = new Set(ventes.flatMap((v) => v.ids));
  for (const v of ventes) {
    if (v.ids.length !== 1 || estRond(v.prix)) continue;
    const possibles: { id: string; prix: number; surface: number }[] = [];
    for (const [id, rows] of parMutation) {
      if (pris.has(id) || ailleurs?.has(id) || rows[0].date_mutation !== v.date) continue;
      if (!rows.some((r) => v.parcelles.has(r.id_parcelle))) continue;
      const lots = lotsDe(rows);
      if ([...lots].some((l) => v.lots.has(l))) continue;
      const prix = prixUnique(rows);
      if (prix == null || estRond(prix) || !estRond(v.prix + prix)) continue;
      if (prix % 1_000 === 0 && v.prix % 1_000 === 0) continue;
      const locaux = locauxDe(rows);
      if (locaux.reduce((s, o) => s + (estLogement(o.r) ? o.fois : 0), 0) > 5) continue;
      possibles.push({ id, prix, surface: locaux.reduce((s, o) => s + o.fois * (Number(o.r.surface_reelle_bati) || 0), 0) });
    }
    if (possibles.length !== 1) continue;
    const [a] = possibles;
    v.ids.push(a.id); pris.add(a.id);
    v.prix += a.prix;
    v.surface += a.surface;
  }
  const pm2 = ventes
    .filter((c) => dansLesBornes(c.prix / c.surface))
    .map((c) => ({ ...c, pm2: c.prix / c.surface }))
    .sort((a, b) => a.pm2 - b.pm2);
  return { ventes: pm2, parMutation };
}

export function ventesImmeubles(lignes: Ligne[], ailleurs?: ReadonlySet<string>): StatsImmeubles {
  const pm2 = retenues(lignes, ailleurs).ventes;
  const n = pm2.length;
  // La fourchette : du premier au troisième quartile. On laisse de côté autant de ventes en bas
  // qu'en haut, la médiane n'en bouge pas.
  const valeurs = pm2.map((c) => c.pm2);
  const fourchette = n >= VENTES_MIN_FOURCHETTE;
  return {
    nbVentes: n,
    prixM2Median: n >= 3 ? Math.round(mediane(valeurs)!) : null,
    prixM2Bas: fourchette ? Math.round(quantile(valeurs, PART_ECARTEE)) : null,
    prixM2Haut: fourchette ? Math.round(quantile(valeurs, 1 - PART_ECARTEE)) : null,
    prixM2Min: n >= 3 ? Math.round(pm2[0].pm2) : null,
    prixM2Max: n >= 3 ? Math.round(pm2[n - 1].pm2) : null,
    prixMedian: n >= 3 ? Math.round(mediane(pm2.map((c) => c.prix))!) : null,
    surfaceMediane: n >= 3 ? Math.round(mediane(pm2.map((c) => c.surface))!) : null,
  };
}

/** Un groupe de locaux semblables d'une vente : type, surface et nombre de pièces, et combien. */
export type LotVendu = { type: string; surface: number | null; pieces: number | null; nombre: number };

/**
 * Une vente d'immeuble retenue, telle que la page des ventes l'affiche (lot 125, MAV, 15/11/2026).
 * La rue sans son numéro (règle de MAV du 21/10/2026 pour les ventes publiées) ; les lots par type et
 * surface, sans loyer (DVF ne le connaît pas). Ce détail ne doit pas être indexé par les moteurs de
 * recherche (conditions de réutilisation de DVF) : il n'est servi que par une adresse fermée aux robots.
 */
export type VenteImmeubleDetail = {
  id: string;
  date: string;
  /** La rue telle que DVF l'écrit (« RUE BERANGER ») ; la tâche la remplace par le nom officiel. */
  rue: string | null;
  codePostal: string | null;
  prix: number;
  surface: number;
  prixM2: number;
  logements: number;
  /** Au moins un local commercial ou d'activité. */
  mixte: boolean;
  lots: LotVendu[];
  lat: number | null;
  lon: number | null;
};

export function detailVentesImmeubles(lignes: Ligne[], ailleurs?: ReadonlySet<string>): VenteImmeubleDetail[] {
  const { ventes, parMutation } = retenues(lignes, ailleurs);
  return ventes.map((v) => {
    const rows = v.ids.flatMap((id) => parMutation.get(id) ?? []);
    const locaux = v.ids.flatMap((id) => locauxDe(parMutation.get(id) ?? []));
    const groupes = new Map<string, LotVendu>();
    for (const o of locaux) {
      const surface = Number(o.r.surface_reelle_bati) || null;
      const pieces = Number(o.r.nombre_pieces_principales) || null;
      const type = o.r.type_local === "Local industriel. commercial ou assimilé" ? "Local commercial" : o.r.type_local;
      const cle = `${type}|${surface}|${type === "Local commercial" ? "" : pieces}`;
      const g = groupes.get(cle);
      if (g) g.nombre += o.fois; else groupes.set(cle, { type, surface, pieces: type === "Local commercial" ? null : pieces, nombre: o.fois });
    }
    const lots = [...groupes.values()].sort((a, b) => a.type.localeCompare(b.type) || (a.surface ?? 0) - (b.surface ?? 0));
    // La rue la plus présente dans les lignes de la vente.
    const rues = new Map<string, number>();
    for (const r of rows) if (r.adresse_nom_voie) rues.set(r.adresse_nom_voie, (rues.get(r.adresse_nom_voie) ?? 0) + 1);
    const rue = [...rues].sort((a, b) => b[1] - a[1])[0]?.[0];
    const coords = rows.map((r) => [Number(r.latitude), Number(r.longitude)]).filter(([la, lo]) => la && lo);
    const moy = (i: number) => (coords.length ? coords.reduce((s, c) => s + c[i], 0) / coords.length : null);
    return {
      id: [...v.ids].sort()[0],
      date: v.date,
      rue: rue ?? null,
      codePostal: rows.find((r) => r.code_postal)?.code_postal ?? null,
      prix: Math.round(v.prix),
      surface: Math.round(v.surface),
      prixM2: Math.round(v.pm2),
      logements: locaux.reduce((s, o) => s + (estLogement(o.r) ? o.fois : 0), 0),
      mixte: locaux.some((o) => !estLogement(o.r)),
      lots,
      lat: moy(0),
      lon: moy(1),
    };
  });
}

/** Sous ce nombre de ventes, le prix médian des appartements ne se publie pas : pas de décote. */
export const VENTES_MIN_APPARTEMENTS = 30;

export type StatsAppartements = { nbVentes: number; prixM2Median: number | null };

/**
 * Les appartements vendus seuls, pour mesurer la décote d'un immeuble vendu en bloc (lot 110, MAV,
 * 13/11/2026 : « inclure la décote en pourcentage par rapport aux ventes d'appartements »). Même
 * fichier DVF et même année que les immeubles, pour comparer ce qui se compare. Règles :
 *  - une mutation de nature « Vente », comme pour les immeubles ;
 *  - exactement un logement, et c'est un appartement. Il est compté par `locauxDe` : deux lignes
 *    identiques sans numéro de lot sont deux appartements, la vente n'est pas retenue (lot 109,
 *    pas de dédoublonnage par surface et nombre de pièces) ;
 *  - ses dépendances (cave, parking) sont admises, aucun autre local : ni maison, ni local
 *    commercial ;
 *  - un seul prix, et une surface ;
 *  - prix au m² dans les mêmes bornes que les immeubles ;
 *  - une vente dont des lignes sont dans une autre commune suivie est écartée, comme pour les
 *    immeubles.
 * Le prix médian au m², arrondi à l'euro, n'est publié qu'à partir de trente ventes.
 *
 * @param ailleurs le même ensemble que pour `ventesImmeubles`.
 */
export function ventesAppartements(lignes: Ligne[], ailleurs?: ReadonlySet<string>): StatsAppartements {
  const pm2: number[] = [];
  for (const [id, rows] of ventesParMutation(lignes)) {
    const locaux = locauxDe(rows);
    if (locaux.length !== 1 || locaux[0].fois !== 1 || locaux[0].r.type_local !== "Appartement") continue;
    if (new Set(rows.map((r) => r.valeur_fonciere)).size !== 1) continue;
    const prix = Number(rows[0].valeur_fonciere);
    const surface = Number(locaux[0].r.surface_reelle_bati);
    if (!(prix > 0) || !(surface > 0)) continue;
    if (ailleurs?.has(id)) continue;
    if (dansLesBornes(prix / surface)) pm2.push(prix / surface);
  }
  const n = pm2.length;
  return { nbVentes: n, prixM2Median: n >= VENTES_MIN_APPARTEMENTS ? Math.round(mediane(pm2)!) : null };
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
