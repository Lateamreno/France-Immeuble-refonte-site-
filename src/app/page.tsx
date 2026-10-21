import type { Metadata } from "next";
import { ContenuWP, metadonneesWP, pageOu404 } from "@/components/ContenuWP";

/**
 * Accueil — page reprise du WordPress, à l'identique.
 *
 * Texte, images et structure viennent de `content/pages-wp.json` (copie du
 * 26 août 2026, seule copie existante depuis la perte du site). Rien n'est
 * réécrit : seule la couche graphique est neuve.
 *
 * Title, meta et canonical sont repris au caractère près — objectif zéro
 * perte de référencement (CLAUDE.md §10).
 */
const CHEMIN = "/";

export const metadata: Metadata = metadonneesWP(CHEMIN);

export default function Page() {
  const page = pageOu404(CHEMIN);
  return (
    <>
      <ContenuWP page={page} />
    </>
  );
}
