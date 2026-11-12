import { configSitePublique } from "./supabase-site";
import { PREUVES } from "./site";

/**
 * Les chiffres affichés sur le site, déposés par le BO dans la table
 * `chiffres` à 9 h et 19 h (MAV, 22/10/2026 : « tous les chiffres viennent du
 * BO »). Le site ne calcule ni ne saisit rien ici ; il garde les dernières
 * valeurs publiées tant que le BO n'a rien déposé, ou si la base ne répond pas.
 *
 * Les chiffres tirés des ventes (communes, volume…) se calculent déjà à partir
 * de la table `ventes`, elle aussi déposée par le BO : voir `lib/biens.ts`.
 */
export type Chiffres = {
  investisseurs: number;
  /** Immeubles traités depuis la création de l'agence (MAV, 27/10/2026), déposé par le BO. */
  immeublesTraites: number;
  recherchesPatrimonial: number;
  recherchesInvestisseur: number;
  recherchesMarchand: number;
  recherchesPromoteur: number | null;
  /**
   * Immeubles étudiés par zone, déposés par le BO sous `immeubles_traites_<zone>` :
   * un département (`immeubles_traites_75`) ou une commune par son code INSEE
   * (`immeubles_traites_92012`). Agrégat anonyme (CLAUDE.md §2, décision du 04/11/2026).
   */
  traitesPar: Record<string, number>;
  majLe: string | null;
};

/** Dernières valeurs publiées sur le site, avant le premier dépôt du BO. */
const REPLI: Chiffres = {
  investisseurs: PREUVES.investisseurs,
  // 1 170 immeubles traités depuis 2018, validé par MAV le 31/10/2026 (§10). L'ancien repli, 365,
  // était le « 365 immeubles vendus » de l'ancien site : à ne plus afficher si le BO ne répond pas.
  immeublesTraites: 1170,
  recherchesPatrimonial: 365,
  recherchesInvestisseur: 1372,
  recherchesMarchand: 359,
  recherchesPromoteur: null,
  traitesPar: {},
  majLe: null,
};

export async function chiffres(): Promise<Chiffres> {
  const cfg = configSitePublique();
  if (!cfg) return REPLI;
  try {
    const r = await fetch(`${cfg.url}/rest/v1/chiffres?select=cle,valeur,maj_le`, {
      headers: { apikey: cfg.cle, Authorization: `Bearer ${cfg.cle}` },
      next: { revalidate: 600, tags: ["chiffres"] },
    });
    if (!r.ok) return REPLI;
    const lignes = (await r.json()) as { cle: string; valeur: number | string; maj_le: string }[];
    if (lignes.length === 0) return REPLI;
    const v = new Map(lignes.map((l) => [l.cle, Number(l.valeur)]));
    const n = (cle: string, defaut: number) => (Number.isFinite(v.get(cle)) ? (v.get(cle) as number) : defaut);
    return {
      investisseurs: n("investisseurs", REPLI.investisseurs),
      immeublesTraites: n("immeubles_traites", REPLI.immeublesTraites),
      recherchesPatrimonial: n("recherches_patrimonial", REPLI.recherchesPatrimonial),
      recherchesInvestisseur: n("recherches_investisseur", REPLI.recherchesInvestisseur),
      recherchesMarchand: n("recherches_marchand", REPLI.recherchesMarchand),
      recherchesPromoteur: v.has("recherches_promoteur") ? n("recherches_promoteur", 0) : null,
      traitesPar: Object.fromEntries(
        [...v]
          .filter(([cle, x]) => /^immeubles_traites_\w+$/.test(cle) && Number.isFinite(x) && x > 0)
          .map(([cle, x]) => [cle.slice("immeubles_traites_".length), x]),
      ),
      majLe: lignes.reduce((m, l) => (l.maj_le > m ? l.maj_le : m), ""),
    };
  } catch {
    return REPLI;
  }
}
