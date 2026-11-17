import Link from "next/link";
import { insecable, type QR } from "@/components/SectionFaq";
import { PARIS } from "@/lib/paris";
import { nombre } from "@/lib/site";
import type { Chiffres } from "@/lib/chiffres";
import type { DonneesPrixParis } from "@/lib/prix-paris";

/**
 * La FAQ des propriétaires parisiens (content/paris.json), sortie de la page Paris au lot 140 pour
 * servir aussi aux pages des annonces Google. Les accolades des réponses sont des chiffres vivants ;
 * une question dont un chiffre manque ne s'affiche pas.
 */

/** Les chiffres vivants des réponses. `acheteurs` y reste le chiffre global : la réponse dit « notre base compte … acheteurs d'immeubles ». */
export function vivantsParis(prix: DonneesPrixParis, ch: Chiffres): Record<string, string | null> {
  const { tableau, annee, totalImmeubles, etendueDecote, rendementParis } = prix;
  return {
    annee: tableau ? String(annee) : null,
    ventesImmeubles: tableau && totalImmeubles ? nombre(totalImmeubles) : null,
    // Sans les prix des appartements en base, la phrase d'avant le lot 110 : la question reste affichée.
    phraseDecote:
      tableau && etendueDecote
        ? `Par rapport au prix médian des appartements vendus seuls la même année, la décote mesurée va de ${etendueDecote.min.pct} % à ${etendueDecote.max.pct} % selon l’arrondissement. D’après notre expérience, elle est le plus souvent de 10 à 30 %, selon l’état de l’immeuble et le niveau de ses loyers.`
        : "Entre un immeuble vendu en bloc et le prix des appartements, la décote est le plus souvent de 10 à 30 %, selon l’état de l’immeuble et le niveau de ses loyers.",
    rendementParis,
    immeublesEtudies: nombre(ch.immeublesTraites),
    acheteurs: nombre(ch.investisseurs),
  };
}

/**
 * Les questions, chiffres remplis et lien posé. `intitules` : seulement ces questions, dans cet
 * ordre (pages des annonces) ; sans lui, toutes, dans l'ordre du fichier (page Paris).
 */
export function faqParis(vivants: Record<string, string | null>, intitules?: string[]): (QR & { groupe: string })[] {
  const toutes = PARIS.questions.flatMap((q): (QR & { groupe: string })[] => {
    let manque = false;
    const texte = q.reponse.replace(/\{(\w+)\}/g, (_, cle: string) => {
      const v = vivants[cle];
      if (v == null) manque = true;
      return v ?? "";
    });
    if (manque) return [];
    const [avant, ...suite] = q.lien ? texte.split(q.lien.texte) : [texte];
    return [
      {
        groupe: q.groupe,
        question: q.question,
        texte,
        reponse:
          q.lien && suite.length ? (
            <p>
              {insecable(avant)}
              {/* Lot 114 (MAV, 15/11/2026 : « le lien c'est un nouvel onglet ») : les liens de la FAQ s'ouvrent dans un nouvel onglet, le visiteur garde la page et son formulaire. */}
              <Link href={q.lien.href} className="lien-texte" target="_blank" rel="noopener">{q.lien.texte}</Link>
              {insecable(suite.join(q.lien.texte))}
            </p>
          ) : undefined,
      },
    ];
  });
  if (!intitules) return toutes;
  return intitules.flatMap((i) => toutes.filter((q) => q.question === i));
}
