/**
 * Les ventes d'immeubles entiers repérées dans DVF (lot 100, MAV, 10/11/2026 : « les ventes dans
 * l'ancien qui ont plus de 5 lots d'habitation différents avec le même ID de vente et le même
 * prix affiché quelle que soit la surface »).
 *
 * Source : fichiers DVF géolocalisés d'Etalab (files.data.gouv.fr/geo-dvf), un fichier par
 * commune et par année civile. Règles :
 *  - une mutation de nature « Vente » (le neuf en VEFA est exclu) ;
 *  - plus de cinq logements distincts (appartements ou maisons) et un seul prix ;
 *  - au moins 65 % de logements parmi les lots, caves et parkings exclus (MAV, 10/11/2026 :
 *    les immeubles de bureaux et les grands commerces tiraient les prix vers le haut) ;
 *  - prix d'au moins 150 000 € ;
 *  - une même série de logements vendue plusieurs fois dans l'année (ventes de parts,
 *    démembrements) est écartée : on ne sait pas quel prix vaut pour l'immeuble entier ;
 *  - prix au m² (sur la surface bâtie hors dépendances, commerces compris) entre 3 000 et
 *    30 000 € pour écarter les valeurs aberrantes.
 * La médiane du prix au m² n'est publiée qu'à partir de trois ventes.
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

export type StatsImmeubles = { nbVentes: number; prixM2Median: number | null; prixMedian: number | null; surfaceMediane: number | null };

const mediane = (xs: number[]) => {
  if (!xs.length) return null;
  const v = [...xs].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

export function ventesImmeubles(lignes: Record<string, string>[]): StatsImmeubles {
  const parMutation = new Map<string, Record<string, string>[]>();
  for (const l of lignes) {
    if (l.nature_mutation !== "Vente") continue;
    const g = parMutation.get(l.id_mutation);
    if (g) g.push(l); else parMutation.set(l.id_mutation, [l]);
  }
  type Candidate = { signature: string; prix: number; surface: number };
  const candidats: Candidate[] = [];
  for (const rows of parMutation.values()) {
    const prixDistincts = new Set(rows.map((r) => r.valeur_fonciere));
    if (prixDistincts.size !== 1) continue;
    const prix = Number(rows[0].valeur_fonciere);
    if (!Number.isFinite(prix) || prix < 150_000) continue;
    // Une ligne DVF par local et par nature de culture : on dédoublonne les locaux.
    const locaux = new Map<string, Record<string, string>>();
    for (const r of rows) {
      if (!r.type_local || r.type_local === "Dépendance") continue;
      locaux.set([r.id_parcelle, r.lot1_numero, r.type_local, r.surface_reelle_bati, r.nombre_pieces_principales].join("|"), r);
    }
    const logements = [...locaux.values()].filter((r) => r.type_local === "Appartement" || r.type_local === "Maison");
    if (logements.length <= 5) continue;
    if (logements.length / locaux.size < PART_HABITATION_MIN) continue;
    const surface = [...locaux.values()].reduce((s, r) => s + (Number(r.surface_reelle_bati) || 0), 0);
    if (!surface) continue;
    const signature = [...locaux.keys()].sort().join(";");
    candidats.push({ signature, prix, surface });
  }
  const vues = new Map<string, number>();
  for (const c of candidats) vues.set(c.signature, (vues.get(c.signature) ?? 0) + 1);
  const retenus = candidats.filter((c) => vues.get(c.signature) === 1 && c.prix / c.surface >= 3_000 && c.prix / c.surface <= 30_000);
  const n = retenus.length;
  return {
    nbVentes: n,
    prixM2Median: n >= 3 ? Math.round(mediane(retenus.map((c) => c.prix / c.surface))!) : null,
    prixMedian: n >= 3 ? Math.round(mediane(retenus.map((c) => c.prix))!) : null,
    surfaceMediane: n >= 3 ? Math.round(mediane(retenus.map((c) => c.surface))!) : null,
  };
}

/** Dernière année civile publiée par DVF (essai de l'année passée, puis de la précédente). */
export async function derniereAnneeDvf(): Promise<number | null> {
  const an = new Date().getFullYear();
  for (const a of [an - 1, an - 2]) {
    try {
      const r = await fetch(urlDvf(a, "75101"), { method: "HEAD", redirect: "follow", cache: "no-store" });
      if (r.ok) return a;
    } catch { /* année suivante */ }
  }
  return null;
}
