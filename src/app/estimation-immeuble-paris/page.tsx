import type { Metadata } from "next";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { CarteVente } from "@/components/CarteVente";
import { Avis } from "@/components/Avis";
import { SectionFaq } from "@/components/SectionFaq";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { ventes as lesVentes } from "@/lib/biens";
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
};

export default async function EstimationImmeubleParis() {
  const [toutes, ch] = await Promise.all([lesVentes(), chiffres()]);
  const paris = toutes.filter((v) => v.dept === "75").sort((a, b) => b.prix - a.prix);
  const faq = faqVendre(chiffresFaq(toutes));

  const preuves: { picto: NomPicto; titre: string; texte: string }[] = [
    { picto: "reseau", titre: `${nombre(ch.investisseurs)} acheteurs`, texte: "investisseurs, foncières et family offices en recherche d’immeubles à Paris" },
    { picto: "detective", titre: "Off-market", texte: "votre immeuble est proposé à nos acheteurs avant toute annonce, en toute discrétion" },
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

      {paris.length > 0 && (
        <section className="section section--noir-2">
          <div className="container">
            <Reveal className="section__head">
              <Eyebrow>Nos ventes à Paris</Eyebrow>
              <h2>
                Des immeubles parisiens <span className="accent">vendus en bloc</span>
              </h2>
              <p className="lead">
                Prix, surface et rendement obtenus. Le rendement d’un immeuble à Paris va aujourd’hui
                de 3 à 6 % selon les arrondissements.
              </p>
            </Reveal>
            <ul className="ventes">
              {paris.map((v, i) => (
                <Reveal key={v.id} as="li" className="vente" delayIndex={i}>
                  <CarteVente v={v} />
                </Reveal>
              ))}
            </ul>
            <div className="btn-row porte-action" style={{ marginTop: "var(--space-m)" }}>
              <Button href="#estimer">Estimer mon immeuble</Button>
            </div>
          </div>
        </section>
      )}

      <Avis titre="Ce qu’en disent nos vendeurs" fond="noir-3" />

      <SectionFaq
        items={faq}
        titre={<>Vendre un immeuble à Paris : <span className="accent">vos questions</span></>}
      />

      <BoutonFixeMobile href="#estimer" cible="estimer" libelle="Estimer mon immeuble" />
    </>
  );
}
