import { imagesPartage } from "@/lib/partage";
import type { Metadata } from "next";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { Avis } from "@/components/Avis";
import { SectionFaq } from "@/components/SectionFaq";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { ventes as lesVentes } from "@/lib/biens";
import { fourchetteRendement, immeublesDesCommunes, libelleRendement, rendementsTheoriques } from "@/lib/immeubles-dvf-lecture";
import { marchesDesCommunes } from "@/lib/marche";
import { chiffres } from "@/lib/chiffres";
import { chiffresFaq, faqVendre } from "@/lib/faq";
import { VISUELS } from "@/lib/visuels";
import { PREUVES, SITE, nombre } from "@/lib/site";

/**
 * /estimation-immeuble-paris/ — la page des annonces Google sur Paris (MAV, 10/11/2026 :
 * « un formulaire de transformation ++++ sur Paris et on fait du SEA à mort dessus »).
 * Le formulaire est dans le premier écran, les preuves à côté, peu de liens de sortie.
 * Hors index : les annonces n'en ont pas besoin, et elle ne concurrence pas la page
 * Paris faite pour Google (/vendre-un-immeuble/paris/). Absente du sitemap et des menus.
 */
export const metadata: Metadata = {
  title: { absolute: "Estimation immeuble Paris | France Immeuble" },
  description:
    "Estimez gratuitement votre immeuble parisien. Agence spécialisée dans la vente d’immeubles de rapport, 1 500 acheteurs en recherche, honoraires dus seulement à l’acte.",
  alternates: { canonical: `${SITE.url}/estimation-immeuble-paris/` },
  robots: { index: false, follow: true },
  openGraph: { type: "website", title: "Estimation immeuble Paris | France Immeuble", description: "Estimez gratuitement votre immeuble parisien. Agence spécialisée dans la vente d’immeubles de rapport, 1 500 acheteurs en recherche, honoraires dus seulement à l’acte.", url: "/estimation-immeuble-paris/", images: imagesPartage("/estimation-immeuble-paris/") },
};

export default async function EstimationImmeubleParis() {
  const codes = Array.from({ length: 20 }, (_, i) => `751${String(i + 1).padStart(2, "0")}`);
  const [toutes, ch, immeubles, marches] = await Promise.all([lesVentes(), chiffres(), immeublesDesCommunes(codes), marchesDesCommunes(codes)]);
  const c = chiffresFaq(toutes);
  const faq = faqVendre(c);
  // Comme la page Paris : l'année la plus récente, et seulement les lignes de cette année.
  const anneeImmeubles = immeubles.size ? Math.max(...[...immeubles.values()].map((x) => x.annee)) : null;
  const totalImmeubles = [...immeubles.values()].reduce((s, x) => s + (x.annee === anneeImmeubles ? x.nbVentes : 0), 0);

  const etapes: { picto: NomPicto; titre: string; texte: string }[] = [
    { picto: "calculatrice", titre: "Estimation gratuite", texte: "Un agent spécialisé étudie l’immeuble, ses baux et son secteur, et vous donne un prix réaliste." },
    { picto: "detective", titre: "Présentation off-market", texte: "Votre immeuble est proposé à nos acheteurs, sans annonce. Vos locataires et vos voisins n’en savent rien." },
    { picto: "poignee", titre: "Offres et négociation", texte: "Nous organisons les visites, recueillons les offres et vérifions la solidité de chaque acheteur." },
    { picto: "dossier", titre: "Signature chez le notaire", texte: "Nous suivons le dossier jusqu’à l’acte. Nos honoraires ne sont dus qu’à ce moment-là." },
  ];
  const reperes: { valeur: string; libelle: string }[] = [
    // MAV, 13/11/2026 : « 3,5 à 6,5 en général », la fourchette de la page Paris.
    { valeur: libelleRendement(fourchetteRendement(rendementsTheoriques(immeubles, marches))), libelle: "de rendement en général, selon l’arrondissement" },
    ...(totalImmeubles && anneeImmeubles ? [{ valeur: nombre(totalImmeubles), libelle: `immeubles entiers vendus à Paris en ${anneeImmeubles} (DVF)` }] : []),
    ...(ch.traitesPar["75"] ? [{ valeur: nombre(ch.traitesPar["75"]), libelle: "immeubles parisiens étudiés par nos agents depuis 2018" }] : []),
    ...(c.delaiMedian ? [{ valeur: `${c.delaiMedian}\u00a0jours`, libelle: "avant la première offre, en médiane sur nos ventes" }] : []),
  ];

  const preuves: { picto: NomPicto; titre: string; texte: string }[] = [
    // Lot 110 (retour #300) : « à Paris » seulement quand le BO a déposé le nombre d'acheteurs d'immeubles parisiens.
    {
      picto: "reseau",
      titre: `${nombre(ch.acheteursParis ?? ch.investisseurs)} acheteurs`,
      texte: ch.acheteursParis != null
        ? "investisseurs, foncières et family offices en recherche d’immeubles à Paris"
        : "investisseurs, foncières et family offices dans notre base",
    },
    { picto: "detective", titre: "Off-market", texte: "votre immeuble est proposé à nos acheteurs sans annonce, en toute discrétion" },
    { picto: "euro", titre: "Payé à l’acte", texte: "nos honoraires ne sont dus qu’à la signature chez le notaire" },
  ];

  return (
    <>
      <HeroMedia image={VISUELS.toitsAeriens.src} alt={VISUELS.toitsAeriens.alt} className="hero-sea">
        <div className="sea-grille">
          <div className="sea-texte">
            <Eyebrow>Immeubles à Paris</Eyebrow>
            <h1>
              Estimez votre <span className="accent">immeuble parisien</span>
            </h1>
            <p className="lead">
              Une estimation gratuite et confidentielle, par une agence spécialisée dans la vente
              d’immeubles de rapport entiers.
            </p>
            <ul className="sea-preuves">
              {preuves.map((p) => (
                <li key={p.titre}>
                  <Picto nom={p.picto} taille={26} />
                  <span>
                    <strong>{p.titre}</strong> {p.texte}
                  </span>
                </li>
              ))}
            </ul>
            <a className="sea-note" href={PREUVES.avisGoogle} target="_blank" rel="noopener">
              <span className="sea-note__val">{PREUVES.noteGoogle}/5</span>
              <span aria-hidden="true">★★★★★</span>
              <span>{PREUVES.nbAvis} avis Google</span>
            </a>
          </div>
          <div id="estimer" className="sea-form">
            <EstimationForm formulaire="estimer" />
            <p className="sea-tel">
              Vous préférez en parler ? <a href={SITE.telHref}>{SITE.tel}</a>
            </p>
          </div>
        </div>
      </HeroMedia>

      <section className="section section--noir-2 sea-reperes-sec">
        <div className="container">
          <ul className="paris-reperes paris-reperes--seul">
            {reperes.map((r) => (
              <li key={r.libelle}>
                <span className="paris-reperes__val">{r.valeur}</span>
                <span className="paris-reperes__lib">{r.libelle}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--creme sea-etapes-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Comment se passe la vente</Eyebrow>
            <h2>
              De l’estimation à l’acte, <span className="accent">un seul interlocuteur</span>
            </h2>
          </Reveal>
          <ol className="sea-etapes">
            {etapes.map((e, i) => (
              <Reveal key={e.titre} as="li" delayIndex={i}>
                <Picto nom={e.picto} taille={30} />
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </Reveal>
            ))}
          </ol>
          <div className="sea-decoupe">
            <h3>En bloc ou à la découpe&nbsp;?</h3>
            <p>
              Vendu en bloc, un immeuble parisien se négocie sous le prix au m² des appartements&nbsp;: le
              plus souvent de 10 à 30&nbsp;%, selon l’état de l’immeuble et le niveau de ses loyers. Vendus
              un par un, les logements libres se vendent au prix du marché. Nous
              chiffrons la vente en bloc, et la découpe si vous le souhaitez.
            </p>
          </div>
          <div className="btn-row porte-action" style={{ marginTop: "var(--space-m)" }}>
            <Button href="#estimer">Estimer mon immeuble</Button>
          </div>
        </div>
      </section>

      <Avis titre="Ce qu’en disent nos vendeurs" fond="noir-3" />

      <SectionFaq
        items={faq}
        titre={<>Vendre un immeuble à Paris : <span className="accent">vos questions</span></>}
      />

      <BoutonFixeMobile href="#estimer" cible="estimer" libelle="Estimer mon immeuble" />
    </>
  );
}
