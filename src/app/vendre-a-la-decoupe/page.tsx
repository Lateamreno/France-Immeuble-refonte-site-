import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/Button";
import { Faq, type QuestionFaq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { filAriane, service } from "@/lib/schema";
import { PREUVES, SITE } from "@/lib/site";

/**
 * /vendre-a-la-decoupe/ — pilier SEO à forte valeur.
 *
 * C'est le meilleur aimant à gros immeubles du site : un immeuble qui se
 * découpe est par définition un immeuble de taille, en zone tendue, à plusieurs
 * millions. La requête filtre d'elle-même, sans effort de qualification.
 *
 * Le vocabulaire juridique (accord collectif, congé pour vente, préemption)
 * est un second filtre : il est illisible pour un particulier et évident pour
 * un patrimoine.
 */
export const metadata: Metadata = {
  title: "Vendre un immeuble à la découpe",
  description:
    "Vente à la découpe d’un immeuble : quand elle rapporte plus qu’une vente en bloc, ce qu’impose l’accord collectif de 2009, et comment nous pilotons l’opération de bout en bout.",
  alternates: { canonical: "/vendre-a-la-decoupe/" },
};

const QUESTIONS: QuestionFaq[] = [
  {
    question: "Découpe ou vente en bloc : comment trancher ?",
    reponse: (
      <>
        <p>
          La découpe dégage généralement une valeur supérieure — un lot vendu à l’unité se paie
          plus cher qu’au prorata d’un bloc — mais elle prend plus de temps et immobilise des
          frais. La vente en bloc est immédiate et sans aléa.
        </p>
        <p>
          Nous chiffrons les deux scénarios avant que vous ne choisissiez. C’est le seul moyen de
          décider sur des chiffres plutôt que sur une intuition.
        </p>
      </>
    ),
  },
  {
    question: "Que change l’accord collectif pour mes locataires ?",
    reponse: (
      <p>
        Lorsqu’un immeuble de plus de cinq logements est vendu par lots, la loi encadre la
        protection des locataires en place : information préalable, droit de préemption sur leur
        logement, et durée de bail prolongée selon leur situation. Ce n’est pas un obstacle à la
        vente, mais un calendrier à respecter — et c’est précisément ce que nous prenons en charge.
      </p>
    ),
  },
  {
    question: "Faut-il attendre que l’immeuble soit vide ?",
    reponse: (
      <p>
        Non, et c’est même rarement souhaitable. Un lot occupé se vend à un investisseur, un lot
        libre à un occupant : ce sont deux marchés, à deux prix. Une découpe bien menée mélange les
        deux plutôt que d’attendre des départs qui peuvent prendre des années.
      </p>
    ),
  },
  {
    question: "Combien de temps dure une opération ?",
    reponse: (
      <p>
        Le découpage technique — géomètre, règlement de copropriété, diagnostics — prend quelques
        mois. La commercialisation dépend ensuite du nombre de lots et du marché local. Nous vous
        donnons un calendrier réaliste dès l’étude, pas une promesse commerciale.
      </p>
    ),
  },
  {
    question: "Quels frais faut-il engager d’avance ?",
    reponse: (
      <p>
        Géomètre, mise en copropriété, diagnostics et frais de notaire de division. Nous
        réunissons les devis et vous présentons le budget complet avant tout engagement, avec son
        impact sur le rendement final de l’opération.
      </p>
    ),
  },
];

export default function Decoupe() {
  return (
    <>
      <JsonLd
        data={[
          filAriane([
            { nom: "Accueil", url: "/" },
            { nom: "Vendre à la découpe", url: "/vendre-a-la-decoupe/" },
          ]),
          service(
            "Vente à la découpe d’immeuble",
            "Étude d’opportunité, mise en copropriété et commercialisation lot par lot d’un immeuble de rapport.",
            "/vendre-a-la-decoupe/",
          ),
        ]}
      />

      <section className="section section--noir" style={{ paddingBottom: "var(--space-l)" }}>
        <div className="container">
          <Eyebrow>Vente à la découpe</Eyebrow>
          <h1 style={{ maxWidth: "17ch", marginBottom: "var(--space-m)" }}>
            Vendre lot par lot vaut souvent{" "}
            <span className="bronze-grad">plus cher qu’en bloc</span>
          </h1>
          <p className="lead" style={{ maxWidth: "58ch" }}>
            Un appartement vendu à l’unité se paie plus cher que sa quote-part dans un immeuble
            entier. Encore faut-il que l’écart couvre les frais, le temps et le cadre juridique —
            c’est exactement ce que nous chiffrons avant que vous ne décidiez.
          </p>
          <div className="btn-row" style={{ marginTop: "var(--space-l)" }}>
            <Button href="/estimer-un-immeuble/" icone>Étudier mon immeuble</Button>
            <a className="btn btn--outline" href={SITE.telHref}>
              En parler &middot; {SITE.tel}
            </a>
          </div>
        </div>
      </section>

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Quand ça vaut le coup</Eyebrow>
            <h2>La découpe n’est pas toujours la bonne réponse</h2>
            <p className="lead">
              Elle rapporte davantage dans certaines configurations, et fait perdre du temps dans
              d’autres. Voici comment nous tranchons.
            </p>
          </Reveal>

          <div className="grid grid--2">
            <Reveal as="article" className="card">
              <span className="card__num">Favorable</span>
              <h3>L’écart de prix est réel</h3>
              <p>
                Zone tendue, lots recherchés à l’unité, immeuble d’au moins une dizaine de lots,
                copropriété simple à constituer. C’est là que la découpe dégage vraiment de la
                valeur.
              </p>
            </Reveal>
            <Reveal as="article" className="card" delayIndex={1}>
              <span className="card__num">Défavorable</span>
              <h3>Le bloc est plus rentable</h3>
              <p>
                Peu de lots, marché local étroit, travaux lourds sur les parties communes, ou besoin
                de liquidité rapide. Dans ce cas nous vous le disons et nous vendons en bloc.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--noir-3">
        <div className="container split split--sticky">
          <Reveal className="split__aside">
            <Eyebrow>Notre rôle</Eyebrow>
            <h2>Vous n’avez pas à devenir promoteur</h2>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
              Nous coordonnons les intervenants et tenons le calendrier. Vous validez, vous
              signez — vous ne gérez ni les devis, ni les relances, ni les rendez-vous techniques.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="/estimer-un-immeuble/" icone>Demander une étude</Button>
            </div>
          </Reveal>

          <div className="steps">
            {[
              { n: "01", t: "Étude des deux scénarios", p: "Valeur en bloc contre valeur découpée, frais déduits. Vous décidez sur des chiffres.", m: "Retour sous 48 h" },
              { n: "02", t: "Mise en copropriété", p: "Géomètre, division des lots, règlement de copropriété, diagnostics. Nous réunissons les devis et suivons l’exécution.", m: "Devis comparés" },
              { n: "03", t: "Calendrier locataires", p: "Information préalable, droit de préemption, délais de bail. Le cadre légal est tenu dans les temps.", m: "Cadre respecté" },
              { n: "04", t: "Commercialisation lot par lot", p: "Lots occupés vers notre fichier d’investisseurs, lots libres vers les occupants. Deux marchés, deux prix.", m: `${PREUVES.investisseurs} investisseurs` },
            ].map((e, i) => (
              <Reveal key={e.n} as="article" className="step" delayIndex={i}>
                <span className="step__dot" aria-hidden="true" />
                <span className="step__num">Étape {e.n}</span>
                <h3>{e.t}</h3>
                <p>{e.p}</p>
                <span className="step__meta">{e.m}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--noir">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>Questions fréquentes</Eyebrow>
            <h2>Ce que les propriétaires nous demandent</h2>
          </Reveal>
          <Reveal>
            <Faq items={QUESTIONS} />
          </Reveal>
        </div>
      </section>

      <section className="section cta-final section--noir-3">
        <div className="container">
          <Reveal>
            <Eyebrow bare>Étude sans engagement</Eyebrow>
            <h2>Bloc ou découpe&nbsp;: on vous donne les deux chiffres</h2>
            <p className="lead">
              Décrivez-nous l’immeuble, et nous revenons sous 48&nbsp;h avec les deux scénarios
              chiffrés. Vous choisissez ensuite, ou vous ne faites rien.
            </p>
            <div className="btn-row">
              <Button href="/estimer-un-immeuble/" icone>Étudier mon immeuble</Button>
              <a className="btn btn--outline" href={SITE.telHref}>{SITE.tel}</a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
