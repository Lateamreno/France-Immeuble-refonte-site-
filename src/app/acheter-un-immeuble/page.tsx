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
import { Button } from "@/components/Button";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { BiensEnVenteLigne } from "@/components/biens/BiensEnVenteLigne";

/** Médiane d'une liste de nombres, ou null. */
const mediane = (xs: number[]) => {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const pct = (x: number | null) => (x == null ? "" : `${x.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`);

/**
 * /acheter-un-immeuble/ — construction du fichier acquéreurs.
 *
 * La page vend d'abord l'accès à l'off-market. Depuis le 05/11/2026 (MAV), une
 * ligne montre aussi les immeubles en annonce, la vignette off-market en tête.
 */
export const metadata: Metadata = {
  title: "Acheter un immeuble de rapport",
  description:
    "Achetez un immeuble de rapport en off-market à Paris, en Île-de-France et en région : déposez votre recherche et recevez les dossiers complets avant leur diffusion.",
  alternates: { canonical: "/acheter-un-immeuble/" },
};

export default async function Acheter() {
  const [{ stats, ventes }, ch] = await Promise.all([ventesEtStats(), chiffres()]);
  // Les rendements de nos propres ventes : la donnée que personne d'autre ne publie (§7).
  const rdt = (idf: boolean) => mediane(ventes.filter((v) => (v.region === "idf") === idf).map((v) => Number(v.rendement)).filter((x) => x > 0));
  const rdtIdf = rdt(true), rdtRegion = rdt(false);
  const QUESTIONS: { question: string; texte: string }[] = [
    {
      question: "Qu’est-ce qu’un immeuble de rapport ?",
      texte: "Un immeuble entier, découpé en plusieurs lots loués (logements, commerces, bureaux), que l’on achète en bloc pour ses loyers. L’acquéreur devient seul propriétaire de tout l’immeuble, sans copropriété.",
    },
    {
      question: "Quel rendement attendre d’un immeuble de rapport ?",
      texte: rdtIdf && rdtRegion
        ? `Sur nos ventes publiées en référence, le rendement brut médian est de ${pct(rdtIdf)} en Île-de-France et de ${pct(rdtRegion)} en région. Il dépend surtout de la ville : plus bas là où les prix sont élevés, plus haut ailleurs.`
        : "Il dépend surtout de la ville : plus bas là où les prix sont élevés, plus haut en région. Chaque dossier que nous envoyons donne le rendement brut, net et acte en main.",
    },
    {
      question: "Pourquoi les meilleurs immeubles ne sont-ils pas en ligne ?",
      texte: "Beaucoup de propriétaires ne veulent pas que leurs locataires, leurs voisins ou le marché apprennent la vente par une annonce. Leur immeuble est présenté d’abord en off-market, aux acquéreurs dont la recherche correspond.",
    },
    {
      question: "Comment recevoir les immeubles qui correspondent à ma recherche ?",
      texte: "Déposez votre recherche : zones, budget, type d’immeuble et rendement visé. Quand un immeuble y correspond, vous recevez le dossier complet parmi les premiers : état locatif, surfaces, diagnostics, taxe foncière, baux et travaux.",
    },
    {
      question: "Où vendez-vous des immeubles de rapport ?",
      texte: `Partout en France. Nos références publiées couvrent ${stats.villes} communes, dont ${stats.partIdf} % en Île-de-France.`,
    },
  ];
  return (
    <>
      <JsonLd
        data={[
          filAriane([
            { nom: "Accueil", url: "/" },
            { nom: "Acheter un immeuble de rapport", url: "/acheter-un-immeuble/" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: QUESTIONS.map((q) => ({
              "@type": "Question",
              name: q.question,
              acceptedAnswer: { "@type": "Answer", text: q.texte },
            })),
          },
        ]}
      />
      <HeroMedia
        image={VISUELS.toursContrePlongee.src}
        alt={VISUELS.toursContrePlongee.alt}
      >
        <>
          {/* Retour #178 : le surtitre dit la page, pas le compte client. */}
          <Eyebrow>Acheter un immeuble</Eyebrow>
          {/* Le titre porte la requête (MAV, 04/11/2026 : « le titre c'est même pas
              acheter un immeuble de rapport »), la promesse reste en or. */}
          {/* Retours #244 et #245 (MAV, 04/11/2026). */}
          <h1>
            Acheter un immeuble de rapport{" "}
            <span className="accent">avec France Immeuble</span>
          </h1>
          <p className="lead">
            Tout est pensé pour les acquéreurs d’immeubles : des dossiers complets (adresse, état
            locatif, taxe foncière, urbanisme, DPE) et un tri par type d’opération, rentabilité,
            occupation et destination. Vous ne recevez que ce qui vous intéresse.
          </p>
          {/* Retour #142 (MAV, 03/11/2026) : le bouton du hero mène au dépôt de recherche. */}
          <div className="btn-row">
            <Button href="#deposer" icone>Recevoir nos offres exclusives</Button>
          </div>
          <div className="hero-proof">
            <Chiffre picto="reseau" valeur={nombre(ch.investisseurs)} libelle="investisseurs déjà dans le fichier" />
            {/* Retour #246 (MAV, 04/11/2026). */}
            <Chiffre picto="best" valeur="100 %" libelle="de nos biens d’abord en off-market" />
          </div>
        </>
      </HeroMedia>

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Comment ça marche</Eyebrow>
            {/* Retour #96 (MAV, 02/11/2026) : l'outil fait pour les acquéreurs d'immeubles. */}
            <h2>Un outil conçu pour les acquéreurs d’immeubles de rapport</h2>
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
        <h2>Des immeubles de rapport en exclusivité</h2>
        <p>
          Nos vendeurs choisissent une agence spécialisée dans la vente d’immeubles plutôt
          qu’une agence de quartier. Leurs immeubles ne sont donc pas partout sur internet :
          nous les présentons d’abord en off-market, à notre fichier d’acquéreurs.
        </p>
      </BandeMedia>

      {/* MAV, 05/11/2026 : les immeubles en vente, juste avant le dépôt de recherche.
          La vignette off-market ouvre la ligne, « Voir tous nos immeubles » la ferme. */}
      <BiensEnVenteLigne id="en-vente" />
      <section id="deposer" className="section section--noir-3 recherche-sec">
        <div className="container split">
          <Reveal className="split__aside">
            <Eyebrow>Recevez nos biens en exclusivité</Eyebrow>
            <h2>Recevoir nos immeubles</h2>
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

      <section className="section section--noir-2 faq-sec">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>Questions fréquentes</Eyebrow>
            <h2>Acheter un immeuble de rapport : vos questions</h2>
          </Reveal>
          <Reveal>
            <Faq items={QUESTIONS.map((q) => ({ question: q.question, reponse: <p>{q.texte}</p> }))} />
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
