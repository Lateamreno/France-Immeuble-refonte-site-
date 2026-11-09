import Link from "next/link";
import type { QR } from "@/components/SectionFaq";
import type { Vente } from "./biens";
import { SITE } from "./site";

/**
 * Les FAQ des pages Vendre, Estimer, Nos ventes, Biens à vendre et Off-market (retours #291 à
 * #296, MAV, 09/11/2026). Les chiffres viennent des ventes publiées et se mettent à jour seuls.
 */

const fr = (n: number, d = 1) => n.toLocaleString("fr-FR", { maximumFractionDigits: d });
const mediane = (xs: number[]) => {
  const v = [...xs].sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const moyenne = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
/** Paris et petite couronne. */
const PETITE_COURONNE = new Set(["75", "92", "93", "94"]);

export type ChiffresFaq = {
  delaiMedian: number | null;
  delaiPC: number | null;
  delaiAilleurs: number | null;
  plusRapide: { jours: number; ville: string } | null;
  rdtMin: { val: number; ville: string } | null;
  rdtMax: { val: number; ville: string } | null;
  ecartMedian: number | null;
  ecartProches: number;
  ecartN: number;
};

export function chiffresFaq(ventes: Vente[]): ChiffresFaq {
  const avecDelai = ventes.filter((v) => (v.delaiOffreJours ?? 0) > 0);
  const delais = (l: Vente[]) => l.map((v) => v.delaiOffreJours as number);
  const rapide = [...avecDelai].sort((a, b) => (a.delaiOffreJours as number) - (b.delaiOffreJours as number))[0];
  const avecRdt = ventes.filter((v) => (v.rendement ?? 0) > 0).sort((a, b) => (a.rendement as number) - (b.rendement as number));
  const ecarts = ventes.map((v) => v.ecartEstimation).filter((x): x is number => x != null && Number.isFinite(x));
  const arrondi = (x: number | null) => (x == null ? null : Math.round(x));
  return {
    delaiMedian: arrondi(mediane(delais(avecDelai))),
    delaiPC: arrondi(moyenne(delais(avecDelai.filter((v) => PETITE_COURONNE.has(v.dept))))),
    delaiAilleurs: arrondi(moyenne(delais(avecDelai.filter((v) => !PETITE_COURONNE.has(v.dept))))),
    plusRapide: rapide ? { jours: rapide.delaiOffreJours as number, ville: rapide.ville } : null,
    rdtMin: avecRdt[0] ? { val: avecRdt[0].rendement as number, ville: avecRdt[0].ville } : null,
    rdtMax: avecRdt.length ? { val: avecRdt[avecRdt.length - 1].rendement as number, ville: avecRdt[avecRdt.length - 1].ville } : null,
    ecartMedian: mediane(ecarts),
    ecartProches: ecarts.filter((x) => Math.abs(x) <= 8).length,
    ecartN: ecarts.length,
  };
}

/** « la meilleure offre reçue dépasse notre estimation de 3,8 % en médiane ». */
function phraseEcart(m: number) {
  if (Math.abs(m) < 0.5) return "la meilleure offre reçue tombe, en médiane, sur notre estimation";
  return `la meilleure offre reçue ${m > 0 ? "dépasse" : "reste sous"} notre estimation de ${fr(Math.abs(m))} % en médiane`;
}

const lien = (href: string, texte: string) => <Link href={href} className="lien-texte">{texte}</Link>;

/** Vendre (#291). */
export function faqVendre(c: ChiffresFaq): QR[] {
  const delai =
    c.delaiMedian && c.delaiPC && c.delaiAilleurs
      ? `Sur nos ventes publiées, la première offre arrive en ${c.delaiMedian} jours en médiane, mais cela varie beaucoup : ${c.delaiPC} jours en moyenne à Paris et en petite couronne, ${c.delaiAilleurs} jours en banlieue et en région${c.plusRapide ? `, et ${c.plusRapide.jours} jours pour la plus rapide, à ${c.plusRapide.ville}` : ""}. Il faut ensuite compter le compromis puis l’acte chez le notaire.`
      : "La première offre arrive en général dans les premières semaines de commercialisation. Il faut ensuite compter le compromis puis l’acte chez le notaire.";
  const cout =
    "Nos honoraires vont de 3 à 5 % du prix selon la taille de l’immeuble : 5 % jusqu’à 5 M€, 4 % de 5 à 10 M€, 3 % au-delà. Ils ne sont dus qu’à la signature de l’acte définitif chez le notaire : tant que la vente n’est pas signée, vous ne payez rien.";
  return [
    {
      question: "Combien coûte la vente de mon immeuble ?",
      texte: `${cout} Le détail est dans notre barème des honoraires.`,
      reponse: <p>{cout} Le détail est dans {lien("/nos-honoraires/", "notre barème des honoraires")}.</p>,
    },
    { question: "Combien de temps faut-il pour vendre un immeuble de rapport ?", texte: delai },
    {
      question: "Puis-je parler de la vente à mes locataires ?",
      texte:
        "Oui, sans crainte. La vente ne met pas fin aux baux : les locataires restent chez eux, aux mêmes conditions, avec le nouveau propriétaire. Dans une vente en bloc de plus de cinq logements, la loi Aurillac les protège encore : l’acquéreur s’engage à prolonger les baux d’habitation pendant six ans, faute de quoi chaque locataire peut acheter son logement en priorité.",
    },
    {
      question: "Faut-il signer un mandat exclusif ?",
      texte:
        "Pas forcément. Mais pour garder le caractère off-market de la vente, nous préférons que l’immeuble ne soit pas diffusé sur les sites d’annonces. Nous travaillons donc souvent en semi-exclusivité, c’est-à-dire avec une exclusivité temporaire.",
    },
    {
      question: "Peut-on vendre un immeuble occupé ?",
      texte:
        "Oui, c’est le cas le plus courant : un investisseur achète un immeuble pour ses loyers. Un immeuble occupé se valorise au rendement pratiqué dans le secteur.",
    },
    {
      question: "Vendre en bloc ou à la découpe ?",
      texte:
        "En bloc, l’immeuble part en une fois à un investisseur. À la découpe, chaque lot est vendu à un particulier, souvent plus cher. Nous chiffrons les deux avant de vous conseiller.",
      reponse: (
        <p>
          En bloc, l’immeuble part en une fois à un investisseur. À la découpe, chaque lot est vendu
          à un particulier, souvent plus cher. Nous chiffrons les deux avant de vous conseiller :{" "}
          {lien("/vendre-a-la-decoupe/", "voir la vente à la découpe")}.
        </p>
      ),
    },
  ];
}

/** Estimer (#292). Aucune promesse de délai (§9 : le « sous 48 h » reste en fin de formulaire). */
export function faqEstimer(c: ChiffresFaq): QR[] {
  const qr: QR[] = [
    {
      question: "Comment estime-t-on un immeuble de rapport ?",
      texte:
        "Au rendement pratiqué dans le secteur, que l’on compare au prix au m² des appartements vendus autour. S’y ajoutent l’état de l’immeuble, son occupation et ce qu’il permet encore de construire.",
    },
    { question: "L’estimation est-elle gratuite ?", texte: "Oui, gratuite, confidentielle et sans engagement de vente." },
  ];
  if (c.ecartMedian != null && c.ecartN >= 5)
    qr.push({
      question: "Vos estimations sont-elles fiables ?",
      texte: `Sur nos ventes publiées, ${phraseEcart(c.ecartMedian)}, et l’écart reste sous 8 % dans ${c.ecartProches} cas sur ${c.ecartN}.`,
    });
  qr.push(
    {
      question: "Quels documents préparer ?",
      texte:
        "L’état locatif, les baux, le dernier avis de taxe foncière, les diagnostics, des photos de l’immeuble et les plans si vous les avez. Le formulaire vous guide, et vous pouvez tout déposer en ligne.",
    },
    {
      question: "Un mauvais DPE fait-il baisser le prix ?",
      texte:
        "Il pèse sur les logements qui ne pourront plus être loués sans travaux, mais il fait bien moins baisser le prix qu’un loyer trop bas, par exemple. Nous chiffrons ces travaux avec l’estimation, pour que le prix en tienne compte sans brader l’immeuble.",
    },
  );
  return qr;
}

/** Nos ventes (#293). */
export function faqVendus(c: ChiffresFaq): QR[] {
  const qr: QR[] = [];
  if (c.rdtMin && c.rdtMax)
    qr.push({
      question: "Quel rendement pour un immeuble de rapport ?",
      texte: `Il dépend surtout de la commune. Sur nos ventes publiées, il va de ${fr(c.rdtMin.val)} % à ${c.rdtMin.ville} à ${fr(c.rdtMax.val)} % à ${c.rdtMax.ville} : plus bas là où les prix au m² sont élevés, plus haut ailleurs.`,
    });
  qr.push({
    question: "Combien de temps pour trouver un acquéreur ?",
    texte: `Les offres arrivent dès les premières semaines de commercialisation, parce que nous envoyons chaque immeuble directement à tous nos acquéreurs.${c.delaiPC && c.delaiAilleurs ? ` En moyenne, la première offre arrive en ${c.delaiPC} jours à Paris et en petite couronne, et en ${c.delaiAilleurs} jours en banlieue et en région.` : ""}`,
  });
  if (c.ecartMedian != null && c.ecartN >= 5)
    qr.push({
      question: "Quel écart entre l’estimation et la meilleure offre ?",
      texte: `Sur nos ventes publiées, ${phraseEcart(c.ecartMedian)}, et l’écart reste sous 8 % dans ${c.ecartProches} cas sur ${c.ecartN}.`,
    });
  return qr;
}

/** Biens à vendre (#294). */
export function faqAVendre(): QR[] {
  const offre =
    "Avec votre compte, depuis la fiche : vous choisissez votre prix au curseur, et l’offre part à l’agent qui la présente au vendeur. Vous pouvez aussi nous envoyer tout simplement un e-mail";
  return [
    { question: "Comment visiter un immeuble ?", texte: "Depuis la fiche, appelez-nous ou écrivez-nous : un agent organise la visite avec le vendeur." },
    {
      question: "Comment faire une offre ?",
      texte: `${offre} à ${SITE.email}.`,
      reponse: <p>{offre} à <a className="lien-texte" href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>,
    },
    { question: "Le prix affiché comprend-il les honoraires ?", texte: "Oui, les prix sont affichés honoraires inclus. Les frais de notaire s’y ajoutent ; chaque fiche les calcule." },
    {
      question: "Quelle différence entre rendement brut, net et acte en main ?",
      texte: "Le brut rapporte les loyers au prix. Le net retire les charges du propriétaire. L’acte en main ajoute les frais de notaire au prix.",
    },
    { question: "Pourquoi certains immeubles ne sont-ils pas en ligne ?", texte: "Une partie de nos mandats part d’abord en off-market, aux acquéreurs qui ont déposé leur recherche." },
  ];
}

/** Off-market (#296). */
export function faqOffMarket(): QR[] {
  return [
    { question: "Qu’est-ce qu’un immeuble off-market ?", texte: "Un immeuble à vendre qui n’est pas diffusé en annonce. Il est proposé directement aux acquéreurs dont la recherche correspond." },
    {
      question: "Comment accéder aux immeubles off-market ?",
      texte: "Déposez votre recherche. Après un court appel avec un agent, vous recevez les dossiers qui y correspondent avant toute diffusion.",
    },
    {
      question: "Pourquoi un vendeur choisit-il l’off-market ?",
      texte: "Pour la discrétion vis-à-vis de ses locataires, de ses voisins et du marché, et pour une vente rapide auprès d’acquéreurs déjà qualifiés.",
    },
    {
      question: "Les prix off-market sont-ils plus bas ?",
      texte: "Pas forcément. L’avantage pour l’acquéreur est d’être parmi les premiers à voir l’immeuble, avec moins de concurrence.",
    },
    { question: "Le service est-il payant pour l’acquéreur ?", texte: "Non. Déposer une recherche et recevoir les dossiers est gratuit." },
  ];
}
