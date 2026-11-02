import type { Metadata } from "next";
import { chiffres } from "@/lib/chiffres";
import { Chiffre } from "@/components/Chiffre";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Picto, type NomPicto } from "@/components/Picto";
import { RechercheForm } from "@/components/RechercheForm";
import { ventesEtStats } from "@/lib/biens";
import { PREUVES, SITE, nombre } from "@/lib/site";
import { HeroMedia } from "@/components/HeroMedia";
import { BandeMedia } from "@/components/BandeMedia";
import { VISUELS } from "@/lib/visuels";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";

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

export default async function Acheter() {
  const [{ stats }, ch] = await Promise.all([ventesEtStats(), chiffres()]);
  return (
    <>
      <HeroMedia
        image={VISUELS.toursContrePlongee.src}
        alt={VISUELS.toursContrePlongee.alt}
      >
        <>
          <Eyebrow>Accès investisseurs</Eyebrow>
          <h1>
            Les meilleurs immeubles partent{" "}
            <span className="accent">avant d’être annoncés</span>
          </h1>
          <p className="lead">
            C’est ce que nous promettons aux propriétaires : leur dossier est présenté à notre
            fichier avant toute diffusion. Vous ne trouverez donc aucun bien sur cette page, mais
            l’accès à ceux qui circulent en premier.
          </p>
          <div className="hero-proof">
            <Chiffre picto="reseau" valeur={nombre(ch.investisseurs)} libelle="investisseurs déjà dans le fichier" />
            <Chiffre picto="secteur" valeur={stats.villes} libelle="communes où nous avons vendu" />
          </div>
        </>
      </HeroMedia>

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Comment ça marche</Eyebrow>
            {/* Retour #96 (MAV, 02/11/2026) : l'outil fait pour les acquéreurs d'immeubles. */}
            <h2>Un outil conçu pour les acquéreurs d’immeubles</h2>
            <p className="lead">
              Nous avons développé notre propre outil pour les acheteurs d’immeubles. Vous ne
              recevez que les immeubles qui correspondent à votre recherche, sur des critères
              propres aux immeubles : localisation, budget, type de lots, rendement.
            </p>
          </Reveal>

          <div className="grid grid--3 grid--ligne-mob">
            {[
              {
                n: "01",
                picto: "cible" as NomPicto,
                t: "Vous déposez vos critères",
                p: "Zones, budget, type d’immeuble, rendement visé. Plus c’est précis, moins vous recevez de choses inutiles.",
              },
              {
                n: "02",
                picto: "loupeCible" as NomPicto,
                t: "Nous filtrons pour vous",
                p: "Quand un immeuble arrive chez nous, nous regardons s’il correspond à votre recherche. Si oui, vous le recevez parmi les premiers.",
              },
              {
                n: "03",
                picto: "dossier" as NomPicto,
                t: "Vous recevez le dossier complet",
                p: "Adresse, état locatif, surfaces Carrez, diagnostics, taxe foncière, baux, travaux : tout ce qu’il faut pour prendre votre décision.",
              },
            ].map((c, i) => (
              <Reveal key={c.n} as="article" className="card card--filigrane" delayIndex={i}>
                <span className="card__fond" aria-hidden="true">
                  <Picto nom={c.picto} taille={96} />
                </span>
                <span className="card__num">{c.n}</span>
                <h3>{c.t}</h3>
                <p>{c.p}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <BandeMedia image={VISUELS.facadeCoucher.src} alt={VISUELS.facadeCoucher.alt}>
        <h2>Des dossiers exclusifs</h2>
        <p>
          Nos vendeurs choisissent une agence spécialisée dans la vente d’immeubles plutôt
          qu’une agence de quartier. Leurs immeubles ne sont donc pas partout sur internet :
          nous les présentons d’abord en off-market, à notre fichier d’acquéreurs.
        </p>
      </BandeMedia>

      <section id="deposer" className="section section--noir-3 recherche-sec">
        <div className="container split">
          <Reveal className="split__aside">
            <Eyebrow>Ce que ça vous donne</Eyebrow>
            <h2>Voir avant les autres</h2>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
              {/* Retour #100 (MAV, 02/11/2026). */}
              Être peu nombreux à voir un immeuble, c’est une commercialisation discrète et
              courte. Le vendeur n’attend pas que tout le marché l’ait vu pour se décider : il
              choisit vite parmi les offres reçues.
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
              Besoin d’échanger tout de suite&nbsp;?
            </h2>
            <p className="lead" style={{ maxWidth: "48ch", margin: "var(--space-s) auto var(--space-l)" }}>
              Un agent vous répond au téléphone sur votre projet d’achat, vos critères ou un
              immeuble en particulier.
            </p>
            <div className="btn-row" style={{ justifyContent: "center" }}>
              <a className="btn btn--primary" href={SITE.telHref}>Appeler · {SITE.tel}</a>
            </div>
          </Reveal>
        </div>
      </section>
      <BoutonFixeMobile href="#deposer" libelle="Déposer ma recherche" cible="deposer" />
    </>
  );
}
