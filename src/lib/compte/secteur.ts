// Serveur uniquement.
import { biensAVendre, ventes, NOMS_DEPTS_IDF } from "../biens";

/**
 * Les données du secteur de l'estimation (MAV, 30/10/2026), tirées des seules
 * ventes et annonces que l'agence publie déjà : rien qui ne soit visible sur
 * le site. Le BO pourra déposer plus fin (contrat, demande du 30/10).
 */
export type Secteur = {
  nom: string;
  ventes: number;
  prixM2: number | null;
  rendement: number | null;
  delaiJours: number | null;
  ecart: number | null;
  enVente: number;
  exemples: { ville: string; lots: number | null; surface: number | null; prix: number; annee: number }[];
};

const mediane = (t: number[]) => {
  if (!t.length) return null;
  const s = [...t].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export async function secteurDe(dept: string | null): Promise<Secteur | null> {
  if (!dept) return null;
  const [toutes, annonces] = await Promise.all([ventes(), biensAVendre()]);
  const v = toutes.filter((x) => x.dept === dept);
  if (v.length < 3) return null;   // pas de statistique sur deux ventes
  const prixM2 = mediane(v.filter((x) => x.surface).map((x) => x.prix / Number(x.surface)));
  const rendement = mediane(v.filter((x) => x.loyerPotentiel).map((x) => (Number(x.loyerPotentiel) / x.prix) * 100));
  return {
    nom: NOMS_DEPTS_IDF[dept] ?? `Département ${dept}`,
    ventes: v.length,
    prixM2: prixM2 && Math.round(prixM2 / 10) * 10,
    rendement: rendement && Math.round(rendement * 10) / 10,
    delaiJours: mediane(v.map((x) => x.delaiOffreJours).filter((x): x is number => x != null)),
    ecart: mediane(v.map((x) => x.ecartEstimation).filter((x): x is number => x != null)),
    enVente: annonces.filter((b) => b.dept === dept).length,
    exemples: v.slice(0, 4).map((x) => ({ ville: x.ville, lots: x.lots ?? null, surface: x.surface ?? null, prix: x.prix, annee: x.annee })),
  };
}
