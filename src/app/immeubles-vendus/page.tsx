import type { Metadata } from "next";
import "./biens.css";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/Button";
import { PREUVES, SITE, nombre } from "@/lib/site";
import { REFERENCES, REFERENCES_STATS } from "@/lib/references";
import { HeroMedia } from "@/components/HeroMedia";
import { VISUELS } from "@/lib/visuels";

/**
 * /immeubles-vendus/ — la preuve.
 *
 * URL existante, reprise à l'identique (CLAUDE.md §10). Elle remplace l'iframe
 * Bubble qui n'exposait aucun contenu indexable : 365 transactions dormaient
 * derrière un cadre invisible pour Google.
 *
 * Anonymisation obligatoire (§2) : arrondissement et non rue, fourchettes et
 * non montants exacts, jamais de nom. On ne peut pas promettre la discrétion
 * off-market en page Vendre et publier le détail ici.
 */
export const metadata: Metadata = {
  title: "Immeubles vendus",
  description:
    "365 immeubles de rapport traités depuis 2018 à Paris et en Île-de-France. Nos transactions réelles, arrondissement par arrondissement, en données anonymisées.",
  alternates: { canonical: "/immeubles-vendus/" },
};

export default function ImmeublesVendus() {
  return (
    <>
      <HeroMedia
        className="section section--noir"
        image={VISUELS.facadeCoucher.src}
        alt={VISUELS.facadeCoucher.alt}
      >
        <>
          <Eyebrow>Nos biens &middot; transactions réalisées</Eyebrow>
          <h1 style={{ maxWidth: "16ch", marginBottom: "var(--space-m)" }}>
            {PREUVES.immeublesTraites} immeubles, et ce qu’ils nous ont appris
          </h1>
          <p className="lead" style={{ maxWidth: "58ch" }}>
            Chaque vente enrichit notre base de comparables. C’est elle qui nous permet d’estimer
            juste plutôt qu’au doigt mouillé — et de dire à un vendeur ce que son immeuble vaut
            réellement, pas ce qu’il aimerait entendre.
          </p>

          <div className="hero-proof" style={{ marginTop: "var(--space-l)" }}>
            <div className="hero-proof__item">
              <span className="hero-proof__val">{REFERENCES_STATS.total}</span>
              <span className="hero-proof__lbl">immeubles traités</span>
            </div>
            <div className="hero-proof__item">
              <span className="hero-proof__val">{REFERENCES_STATS.villes}</span>
              <span className="hero-proof__lbl">communes couvertes</span>
            </div>
            <div className="hero-proof__item">
              <span className="hero-proof__val">{REFERENCES_STATS.delaiMedianSemaines} sem.</span>
              <span className="hero-proof__lbl">délai médian de vente</span>
            </div>
          </div>
        </>
      </HeroMedia>

      <section className="section section--noir-2" style={{ paddingTop: "var(--space-l)" }}>
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Sélection récente</Eyebrow>
            <h2>Des transactions réelles, sans indiscrétion</h2>
            <p className="lead">
              Nous publions l’arrondissement, jamais la rue. Des fourchettes, jamais le montant
              exact. Aucun nom. C’est la contrepartie de la discrétion que nous promettons à chaque
              vendeur — et elle vaut aussi après la vente.
            </p>
          </Reveal>

          <div className="refs">
            {REFERENCES.map((r, i) => (
              <Reveal key={r.id} as="article" className="ref" delayIndex={i}>
                <span className="ref__badge">{r.typologie}</span>
                <div className="ref__top">
                  <span className="ref__lieu">
                    {r.ville}
                    {r.secteur !== "Centre" && r.ville === "Paris" ? ` ${r.secteur}` : ""}
                  </span>
                  <span className="ref__annee">{r.annee}</span>
                </div>
                <div className="ref__ligne">
                  <span className="ref__k">Lots</span>
                  <span className="ref__v">{r.lots}</span>
                </div>
                <div className="ref__ligne">
                  <span className="ref__k">Surface</span>
                  <span className="ref__v">{nombre(r.surface)} m²</span>
                </div>
                <div className="ref__ligne">
                  <span className="ref__k">Délai de vente</span>
                  <span className="ref__v">{r.delaiSemaines} semaines</span>
                </div>
                <div className="ref__ligne">
                  <span className="ref__k">Fourchette</span>
                  <span className="ref__v ref__prix">{r.fourchette}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--creme">
        <div className="container split">
          <Reveal>
            <Eyebrow>Ce que ça change pour vous</Eyebrow>
            <h2>Une estimation appuyée sur des ventes, pas sur un barème</h2>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
              La plupart des estimations d’immeubles sont des extrapolations à partir de prix
              d’appartements. Les nôtres partent de {PREUVES.immeublesTraites} immeubles réellement
              vendus, avec leurs lots, leur occupation et leurs délais.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="/estimer-un-immeuble/" variant="light" icone>
                Estimer mon immeuble
              </Button>
              <Button href="/vendre-un-immeuble/" variant="ghost-dark">
                Comment nous vendons
              </Button>
            </div>
          </Reveal>

          <Reveal className="fee-panel">
            <div className="stat">
              <span className="stat-number">{nombre(PREUVES.investisseurs)}</span>
              <span className="stat-label">investisseurs en base</span>
            </div>
            <p className="muted" style={{ marginTop: "var(--space-s)" }}>
              C’est ce fichier qui explique les délais ci-dessus. Un immeuble bien positionné part
              souvent avant d’avoir été diffusé au-delà de notre base.
            </p>
            <p className="small mono" style={{ marginTop: "var(--space-m)", color: "var(--color-bronze-clair-2)" }}>
              {PREUVES.noteGoogle}/5 · {PREUVES.nbAvis} avis Google
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--noir-3">
        <div className="container container--narrow" style={{ textAlign: "center" }}>
          <Reveal>
            <h2 style={{ maxWidth: "20ch", marginInline: "auto" }}>
              Le prochain sera peut-être le vôtre
            </h2>
            <p className="lead" style={{ maxWidth: "50ch", margin: "var(--space-s) auto var(--space-l)" }}>
              Estimation sous 48&nbsp;h, sans engagement : rien n’est publié tant que vous ne
              l’avez pas décidé.
            </p>
            <div className="btn-row" style={{ justifyContent: "center" }}>
              <Button href="/estimer-un-immeuble/" icone>Estimer mon immeuble</Button>
              <a className="btn btn--outline" href={SITE.telHref}>{SITE.tel}</a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
