import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { RechercheForm } from "@/components/RechercheForm";
import { PREUVES, SITE, nombre } from "@/lib/site";
import { HeroMedia } from "@/components/HeroMedia";
import { BandeMedia } from "@/components/BandeMedia";
import { VISUELS } from "@/lib/visuels";

/**
 * /acheter-un-immeuble/ — construction du fichier acquéreurs.
 *
 * AUCUN BIEN N'EST MONTRÉ PUBLIQUEMENT. Tout le discours vendeur repose sur
 * l'off-market : lister des immeubles ici démonterait l'argument devant le
 * vendeur. La page vend l'accès, pas le stock.
 */
export const metadata: Metadata = {
  title: "Acheter un immeuble de rapport",
  description:
    "Accédez aux immeubles de rapport avant leur diffusion. Déposez votre recherche : vous recevez les dossiers correspondants avant toute présentation à d’autres acquéreurs.",
  alternates: { canonical: "/acheter-un-immeuble/" },
};

export default function Acheter() {
  return (
    <>
      <HeroMedia
        className="section section--noir"
        image={VISUELS.toursContrePlongee.src}
        alt={VISUELS.toursContrePlongee.alt}
      >
        <>
          <Eyebrow>Accès investisseurs</Eyebrow>
          <h1 style={{ maxWidth: "19ch", marginBottom: "var(--space-m)" }}>
            Les meilleurs immeubles partent{" "}
            <span className="accent">avant d’être annoncés</span>
          </h1>
          <p className="lead" style={{ maxWidth: "58ch" }}>
            C’est ce que nous promettons aux propriétaires : leur dossier est présenté à notre
            fichier avant toute diffusion. Vous ne trouverez donc aucun bien sur cette page —
            mais l’accès à ceux qui circulent en premier.
          </p>
          <div className="hero-proof" style={{ marginTop: "var(--space-l)" }}>
            <div className="hero-proof__item">
              <span className="hero-proof__val">{nombre(PREUVES.investisseurs)}</span>
              <span className="hero-proof__lbl">investisseurs déjà dans le fichier</span>
            </div>
            <div className="hero-proof__item">
              <span className="hero-proof__val">{PREUVES.immeublesTraites}</span>
              <span className="hero-proof__lbl">immeubles traités depuis {PREUVES.depuis}</span>
            </div>
          </div>
        </>
      </HeroMedia>

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Comment ça marche</Eyebrow>
            <h2>Vous ne cherchez pas, on vous présente</h2>
            <p className="lead">
              Aucune alerte automatique, aucune newsletter. Un dossier ne vous est envoyé que
              lorsqu’il correspond réellement à ce que vous nous avez décrit.
            </p>
          </Reveal>

          <div className="grid grid--3">
            {[
              {
                n: "01",
                t: "Vous déposez vos critères",
                p: "Zones, budget, financement, rendement visé. Plus c’est précis, moins vous recevez de choses inutiles.",
              },
              {
                n: "02",
                t: "Nous filtrons pour vous",
                p: "Chaque immeuble rentré est confronté au fichier. Si vos critères collent, vous êtes dans la short-list.",
              },
              {
                n: "03",
                t: "Vous recevez le dossier complet",
                p: "Baux, revenus, état d’occupation, travaux. Pas une annonce : de quoi décider.",
              },
            ].map((c, i) => (
              <Reveal key={c.n} as="article" className="card" delayIndex={i}>
                <span className="card__num">{c.n}</span>
                <h3>{c.t}</h3>
                <p>{c.p}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <BandeMedia image={VISUELS.facadeCoucher.src} alt={VISUELS.facadeCoucher.alt}>
        <h2>Ce qu’un portail ne vous donnera pas</h2>
        <p>
          Nos vendeurs viennent parce que leur dossier ne part pas d’emblée sur la place
          publique. Vous en profitez de l’autre côté : des immeubles présentés au fichier
          avant tout le monde, avec les baux et les comptes sur la table.
        </p>
      </BandeMedia>

      <section className="section section--noir-3">
        <div className="container split">
          <Reveal className="split__aside">
            <Eyebrow>Ce que ça vous donne</Eyebrow>
            <h2>Voir avant les autres</h2>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
              Un immeuble qui se négocie bien est un immeuble que peu de gens ont vu. Être dans le
              fichier, c’est faire partie de ce « peu de gens ».
            </p>
            <div className="railed" style={{ marginTop: "var(--space-m)" }}>
              <p className="muted">
                Le groupe traite aussi les travaux, la gestion et la vente à la découpe. Un
                immeuble à repositionner ne s’arrête donc pas à l’acquisition&nbsp;: nous savons
                vous accompagner sur la suite.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <RechercheForm />
          </Reveal>
        </div>
      </section>

      <section className="section section--noir">
        <div className="container container--narrow" style={{ textAlign: "center" }}>
          <Reveal>
            <h2 style={{ maxWidth: "22ch", marginInline: "auto" }}>
              Une question avant de déposer&nbsp;?
            </h2>
            <p className="lead" style={{ maxWidth: "48ch", margin: "var(--space-s) auto var(--space-l)" }}>
              Nous répondons plus vite au téléphone qu’à un formulaire.
            </p>
            <div className="btn-row" style={{ justifyContent: "center" }}>
              <a className="btn btn--outline" href={SITE.telHref}>{SITE.tel}</a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
