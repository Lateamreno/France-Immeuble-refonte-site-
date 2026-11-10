/**
 * Le marché du secteur d'un immeuble à vendre, tel que Plein Bail le calcule
 * (retour #110, MAV 03/11/2026 : « Pleinbail c'est mieux »).
 *
 * Mêmes données et mêmes règles que `src/lib/benchmarks.ts` du dépôt Plein Bail,
 * pour qu'un bien affiché sur les deux sites porte les mêmes écarts :
 *  - prix : médiane DVF des APPARTEMENTS (un immeuble se compare au m² appartement),
 *    commune sur 6 mois, puis 12 mois, puis le département, à partir de 5 ventes ;
 *  - loyers : carte des loyers ANIL (charges comprises), commune sinon département ;
 *  - rentabilité de la ville : loyer appartement × 12 ÷ prix m² appartement,
 *    seulement si le prix dépasse 750 €/m² et, à l'échelle communale, si le loyer
 *    repose sur 100 observations ou plus. Au-delà de 11,2 % (14 % sous 20 000
 *    habitants), le chiffre est marqué « à vérifier ».
 *
 * Sécurité (§2) : Plein Bail n'est pas le BO. Le site lit avec la clé PUBLIABLE de
 * Plein Bail, celle que pleinbail.fr envoie à tous ses visiteurs, et seulement des
 * tables en lecture publique (données ouvertes DVF et ANIL, liste des communes).
 * Aucune donnée personnelle, aucune clé secrète. Lu côté serveur, mis en cache un jour.
 */
const PB_URL = "https://fkfwucqpdhbkgkouccyi.supabase.co";
const PB_CLE = "sb_publishable_ahAE_aJvbd-zneEu17T36g_Qf2y1Y97";

const SEUIL_AFFICHAGE = 5;
const SEUIL_RENTA_PRIX_M2 = 750;
const SEUIL_RENTA_OBS_LOYER = 100;
const SEUIL_GRANDE_VILLE_HAB = 20000;
const RENTA_MAX_GRANDE_VILLE = 0.112;
const RENTA_MAX_PETITE_VILLE = 0.14;

export type Marche = {
  /** Médiane DVF des appartements, en €/m². */
  prixM2: number | null;
  prixEchelle: "commune" | "departement" | null;
  prixFenetreMois: number | null;
  nbVentes: number | null;
  /** Loyer médian des appartements, charges comprises, en €/m²/mois (ANIL). */
  loyerM2: number | null;
  loyerEchelle: "commune" | "departement" | null;
  /** Rentabilité brute de la ville, en % (ex. 6,4). */
  rentaVille: number | null;
  rentaAVerifier: boolean;
};

type LigneDvf = { echelle: string; fenetre_mois: number; prix_m2_median: number | string; nb_transactions: number; type_bien: string };
type LigneLoyer = { echelle: string; typologie: string; loyer_m2: number | string; nb_observations: number | null };

async function lire<T>(chemin: string): Promise<T | null> {
  try {
    const res = await fetch(`${PB_URL}/rest/v1/${chemin}`, {
      headers: { apikey: PB_CLE, Authorization: `Bearer ${PB_CLE}` },
      next: { revalidate: 86400, tags: ["marche"] },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const ECHELLES = [["commune", 6], ["commune", 12], ["departement", 6], ["departement", 12]] as const;

function meilleurPrix(lignes: LigneDvf[], plancher = 0) {
  for (const [echelle, fenetre] of ECHELLES) {
    const l = lignes.find((x) => x.echelle === echelle && x.fenetre_mois === fenetre
      && x.nb_transactions >= SEUIL_AFFICHAGE && Number(x.prix_m2_median) >= plancher);
    if (l) return { prixM2: Number(l.prix_m2_median), echelle, fenetre, n: l.nb_transactions };
  }
  return null;
}

/** Paris, Lyon et Marseille : DVF et ANIL raisonnent par arrondissement. */
function inseeArrondissement(ville: string, dept: string, codePostal: string | null): string | null {
  const cp = codePostal ?? "";
  if (/^750\d\d$/.test(cp)) return `751${cp.slice(3)}`;
  if (/^6900[1-9]$/.test(cp)) return `6938${cp.slice(4)}`;
  if (/^130(0[1-9]|1[0-6])$/.test(cp)) return `132${cp.slice(3)}`;
  const n = ville.match(/^(Paris|Lyon|Marseille)\s+(\d{1,2})/i);
  if (!n) return null;
  const a = Number(n[2]);
  const v = n[1].toLowerCase();
  if (v === "paris" && dept === "75" && a >= 1 && a <= 20) return `751${String(a).padStart(2, "0")}`;
  if (v === "lyon" && dept === "69" && a >= 1 && a <= 9) return `6938${a}`;
  if (v === "marseille" && dept === "13" && a >= 1 && a <= 16) return `132${String(a).padStart(2, "0")}`;
  return null;
}

async function codeInsee(ville: string, dept: string, codePostal: string | null): Promise<string | null> {
  const arr = inseeArrondissement(ville, dept, codePostal);
  if (arr) return arr;
  const q = new URLSearchParams({ select: "code_insee", nom: `ilike.${ville}`, departement_code: `eq.${dept}`, limit: "1" });
  const r = await lire<{ code_insee: string }[]>(`geo_communes?${q}`);
  return r?.[0]?.code_insee ?? null;
}

export async function marcheDuBien(b: { ville: string; dept: string; codePostal: string | null }): Promise<Marche | null> {
  if (!b.dept) return null;
  const insee = await codeInsee(b.ville, b.dept, b.codePostal);
  const ou = [insee ? `and(echelle.eq.commune,code.eq.${insee})` : null, `and(echelle.eq.departement,code.eq.${b.dept})`]
    .filter(Boolean).join(",");
  const [prixL, loyerL] = await Promise.all([
    lire<LigneDvf[]>(`dvf_benchmarks?select=echelle,fenetre_mois,prix_m2_median,nb_transactions,type_bien&type_bien=eq.appartement&or=(${ou})`),
    lire<(LigneLoyer & { echelle: string })[]>(`loyers_benchmarks?select=echelle,typologie,loyer_m2,nb_observations&or=(${ou})`),
  ]);
  if (!prixL && !loyerL) return null;

  const prix = meilleurPrix(prixL ?? []);
  let loyerEchelle: "commune" | "departement" | null = null;
  let ligneLoyer: LigneLoyer | undefined;
  for (const e of ["commune", "departement"] as const) {
    const lignes = (loyerL ?? []).filter((l) => l.echelle === e);
    if (lignes.length) { loyerEchelle = e; ligneLoyer = lignes.find((l) => l.typologie === "appartement"); break; }
  }
  const loyerM2 = ligneLoyer ? Number(ligneLoyer.loyer_m2) : null;

  const prixRenta = meilleurPrix(prixL ?? [], SEUIL_RENTA_PRIX_M2);
  const loyerObserve = loyerEchelle !== "commune" || (ligneLoyer?.nb_observations ?? 0) >= SEUIL_RENTA_OBS_LOYER;
  const renta = prixRenta && loyerM2 && loyerObserve ? (loyerM2 * 12) / prixRenta.prixM2 : null;

  let aVerifier = false;
  if (renta != null && renta > RENTA_MAX_GRANDE_VILLE) {
    let population = 0;
    if (insee) {
      const s = await lire<{ population: number | null }[]>(`villes_stats?select=population&code_insee=eq.${insee}&limit=1`);
      population = Number(s?.[0]?.population) || 0;
    }
    aVerifier = renta > (population >= SEUIL_GRANDE_VILLE_HAB ? RENTA_MAX_GRANDE_VILLE : RENTA_MAX_PETITE_VILLE);
  }

  if (!prix && loyerM2 == null) return null;
  return {
    prixM2: prix ? Math.round(prix.prixM2) : null,
    prixEchelle: prix?.echelle ?? null,
    prixFenetreMois: prix?.fenetre ?? null,
    nbVentes: prix?.n ?? null,
    loyerM2,
    loyerEchelle,
    rentaVille: renta != null ? Math.round(renta * 1000) / 10 : null,
    rentaAVerifier: aVerifier,
  };
}

/** Écart relatif en %, comme Plein Bail : (bien − marché) ÷ marché. */
export const ecartPct = (valeur: number | null | undefined, reference: number | null | undefined) =>
  valeur != null && reference ? ((valeur - reference) / reference) * 100 : null;

/**
 * Le marché de plusieurs communes d'un coup (lot 100, pages Paris et communes, MAV, 10/11/2026) :
 * prix médian DVF des appartements sur 12 mois, et rendement brut des appartements en fourchette,
 * du loyer des 3 pièces et plus (le plus bas au m²) à celui des 1 et 2 pièces (le plus haut),
 * rapportés au prix médian. Mêmes sources que Plein Bail (DVF, carte des loyers ANIL, loyers
 * charges comprises). Mis à jour seul quand Plein Bail recharge ses données.
 */
export type MarcheCommune = {
  code: string;
  prixM2: number | null;
  nbVentes: number | null;
  periodeFin: string | null;
  rdtMin: number | null;
  rdtMax: number | null;
  /** Loyer des appartements, toutes tailles, en €/m²/mois (ANIL, charges comprises). */
  loyerM2: number | null;
  millesimeLoyers: number | null;
};

export async function marchesDesCommunes(codes: string[]): Promise<Map<string, MarcheCommune>> {
  const liste = codes.join(",");
  const [prixL, loyerL] = await Promise.all([
    lire<(LigneDvf & { code: string; periode_fin: string })[]>(
      `dvf_benchmarks?select=code,echelle,fenetre_mois,prix_m2_median,nb_transactions,type_bien,periode_fin&type_bien=eq.appartement&echelle=eq.commune&fenetre_mois=eq.12&code=in.(${liste})`,
    ),
    lire<(LigneLoyer & { code: string; millesime: number })[]>(
      `loyers_benchmarks?select=code,echelle,typologie,loyer_m2,nb_observations,millesime&echelle=eq.commune&code=in.(${liste})`,
    ),
  ]);
  const out = new Map<string, MarcheCommune>();
  for (const code of codes) {
    const p = (prixL ?? []).find((l) => l.code === code && l.nb_transactions >= SEUIL_AFFICHAGE);
    const prix = p ? Number(p.prix_m2_median) : null;
    const loyer = (t: string) => {
      const l = (loyerL ?? []).find((x) => x.code === code && x.typologie === t);
      return l && (l.nb_observations ?? 0) >= SEUIL_RENTA_OBS_LOYER ? Number(l.loyer_m2) : null;
    };
    const grand = loyer("appart_3p");
    const petit = loyer("appart_1_2");
    const r = (loyerM2: number | null) =>
      prix && prix > SEUIL_RENTA_PRIX_M2 && loyerM2 ? Math.round(((loyerM2 * 12) / prix) * 1000) / 10 : null;
    const millesime = (loyerL ?? []).find((x) => x.code === code)?.millesime ?? null;
    out.set(code, {
      code,
      prixM2: prix != null ? Math.round(prix) : null,
      nbVentes: p?.nb_transactions ?? null,
      periodeFin: p?.periode_fin ?? null,
      rdtMin: r(grand),
      rdtMax: r(petit),
      loyerM2: loyer("appartement"),
      millesimeLoyers: millesime,
    });
  }
  return out;
}
