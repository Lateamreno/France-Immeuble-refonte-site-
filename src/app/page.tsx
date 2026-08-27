import type { Metadata } from "next";
import "./accueil.css";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/Button";
import { JsonLd } from "@/components/JsonLd";
import { organisation } from "@/lib/schema";
import { PREUVES, SITE, CALIBRE, nombre } from "@/lib/site";

/**
 * Homepage — 16 % du trafic, 110 226 impressions/an à 0,92 % de CTR.
 *
 * ⚠️ TITLE ET META GELÉS AU CARACTÈRE PRÈS (CLAUDE.md §10 et §16).
 * Ne jamais les modifier : ils sont relevés du site en ligne. Le H1
 * « L’agence dédiée aux immeubles » est préservé sémantiquement.
 *
 * `title.absolute` court-circuite le template du layout, qui ajouterait
 * « | France Immeuble » une seconde fois.
 */
export const metadata: Metadata = {
  title: {
    absolute: "Vente Immeuble de Rapport Paris & France | France Immeuble",
  },
  description:
    "Agence n°1 spécialisée dans la vente d'immeubles de rapport en France. Réseau de 1 500+ acheteurs. Estimation gratuite et confidentielle en 48h. Off-market.",
  alternates: { canonical: "/" },
};

const MARQUES = [
  { nom: "France Immeuble", quoi: "Vente d’immeubles de rapport en bloc" },
  { nom: "La Team Reno", quoi: "Travaux et rénovation d’immeubles" },
  { nom: "PleinBail", quoi: "Annonces de biens loués" },
  { nom: "Grey Stone Capital", quoi: "Holding du groupe" },
];

export default function Accueil() {
  return (
    <>
      <JsonLd data={organisation()} />

      {/* ===== HERO ===== */}
      <section className="home-hero section--noir">
        <div className="container">
          <Eyebrow>Vente en bloc &middot; Off-market &middot; Depuis {PREUVES.depuis}</Eyebrow>

          <h1>
            L’agence dédiée aux <span className="bronze-grad">immeubles</span>
          </h1>

          <p className="lead">
            Nous ne vendons que des immeubles de rapport, en bloc, sans jamais les afficher.
            {" "}{PREUVES.immeublesTraites} transactions depuis {PREUVES.depuis} et un fichier de{" "}
            {nombre(PREUVES.investisseurs)} investisseurs qualifiés : voilà pourquoi un dossier
            bien positionné part souvent avant d’avoir été diffusé.
          </p>

          <div className="hero-proof">
            <div className="hero-proof__item">
              <span className="hero-proof__val">{PREUVES.immeublesTraites}</span>
              <span className="hero-proof__lbl">immeubles traités</span>
            </div>
            <div className="hero-proof__item">
              <span className="hero-proof__val">{nombre(PREUVES.investisseurs)}</span>
              <span className="hero-proof__lbl">investisseurs en base</span>
            </div>
            <div className="hero-proof__item">
              <span className="hero-proof__val">{PREUVES.noteGoogle}/5</span>
              <span className="hero-proof__lbl">{PREUVES.nbAvis} avis Google</span>
            </div>
            <div className="hero-proof__item">
              <span className="hero-proof__val">{PREUVES.honorairesPct}&nbsp;%</span>
              <span className="hero-proof__lbl">d’honoraires, à la signature</span>
            </div>
          </div>

          {/* Deux portes : le vendeur d'abord, il porte les honoraires. */}
          <div className="portes">
            <Reveal className="porte porte--principale">
              <Eyebrow>Vous vendez</Eyebrow>
              <h2>Savoir ce que vaut votre immeuble, sans que personne ne l’apprenne</h2>
              <p>
                Estimation sous 48&nbsp;h appuyée sur nos propres transactions. Aucune annonce,
                aucune diffusion, aucune pancarte — rien ne sort tant que vous ne l’avez pas décidé.
              </p>
              <div className="btn-row">
                <Button href="/estimer-un-immeuble/" icone>Estimer mon immeuble</Button>
                <Button href="/vendre-un-immeuble/" variant="outline">Comment nous vendons</Button>
              </div>
            </Reveal>

            <Reveal className="porte" delayIndex={1}>
              <Eyebrow>Vous achetez</Eyebrow>
              <h2>Accéder aux immeubles qu’on ne trouve nulle part</h2>
              <p>
                Nos dossiers ne sont pas diffusés. Déposez vos critères et recevez ceux qui
                correspondent, avant qu’ils ne soient présentés plus largement.
              </p>
              <div className="btn-row">
                <Button href="/acheter-un-immeuble/" variant="outline" icone>
                  Déposer ma recherche
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== POURQUOI L'OFF-MARKET ===== */}
      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Notre modèle</Eyebrow>
            <h2>Une annonce publique coûte cher au&nbsp;vendeur</h2>
            <p className="lead">
              Un immeuble affiché sur les portails est vu par ses locataires, ses voisins et ses
              concurrents. Et son prix baisse à mesure qu’il reste en ligne.
            </p>
          </Reveal>

          <div className="grid grid--3">
            {[
              { n: "01", t: "Discrétion totale", p: "Aucune annonce, aucune photo en ligne. Vos locataires n’apprennent pas la vente par une vitrine." },
              { n: "02", t: "Pas de décote de durée", p: "Un bien resté six mois en ligne se négocie à la baisse. En off-market, l’immeuble n’a pas d’historique public." },
              { n: "03", t: "Que des acheteurs réels", p: "Nous ne présentons le dossier qu’à des investisseurs dont nous connaissons la capacité de financement." },
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

      {/* ===== CALIBRE + PREUVE ===== */}
      <section className="section section--noir">
        <div className="container split">
          <Reveal className="split__aside">
            <Eyebrow>Ce que nous traitons</Eyebrow>
            <h2>Un seul métier, un seul calibre</h2>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
              Pas d’appartement à l’unité, pas de location. Uniquement de l’immeuble entier, à
              partir de <strong>{CALIBRE.ticketMinLabel}</strong> à Paris et en Île-de-France, et en
              province au-delà de <strong>{CALIBRE.rentabiliteProvinceMin}&nbsp;%</strong> de
              rendement.
            </p>
            <div className="railed" style={{ marginTop: "var(--space-m)" }}>
              <p className="muted">
                En dehors de ce calibre, nous vous orientons vers PleinBail plutôt que de vous
                faire perdre du temps. C’est plus honnête, et plus rapide pour tout le monde.
              </p>
            </div>
            <p style={{ marginTop: "var(--space-m)" }}>
              <a className="link-arrow" href="/immeubles-vendus/">
                Voir nos transactions
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                  strokeWidth={1.6} aria-hidden="true">
                  <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </p>
          </Reveal>

          <Reveal>
            <div className="grid grid--2">
              <div className="stat">
                <span className="stat-number">{PREUVES.immeublesTraites}</span>
                <span className="stat-label">Immeubles traités</span>
              </div>
              <div className="stat">
                <span className="stat-number">{nombre(PREUVES.investisseurs)}</span>
                <span className="stat-label">Investisseurs</span>
              </div>
              <div className="stat">
                <span className="stat-number">{PREUVES.honorairesPct}&nbsp;%</span>
                <span className="stat-label">D’honoraires</span>
              </div>
              <div className="stat">
                <span className="stat-number">{PREUVES.noteGoogle}</span>
                <span className="stat-label">Avis Google</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== LE GROUPE ===== */}
      <section className="section section--noir-3">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Le groupe</Eyebrow>
            <h2>Nous ne nous arrêtons pas à la signature</h2>
            <p className="lead">
              Vendre un immeuble soulève des questions de travaux, de gestion et parfois de
              découpe. Nos autres maisons les traitent — un acquéreur n’a pas à chercher ailleurs,
              et un vendeur sait que son dossier ne bloquera pas là-dessus.
            </p>
          </Reveal>

          <Reveal className="groupe">
            {MARQUES.map((m) => (
              <div key={m.nom} className="marque">
                <span className="marque__nom">{m.nom}</span>
                <span className="marque__quoi">{m.quoi}</span>
              </div>
            ))}
          </Reveal>

          <Reveal style={{ marginTop: "var(--space-l)" }}>
            <p className="muted">
              Nous lançons également la <strong>vente à la découpe</strong>, pour les propriétaires
              qui ont intérêt à vendre lot par lot plutôt qu’en bloc.{" "}
              <a className="link-arrow" href="/vendre-a-la-decoupe/">
                Comprendre la découpe
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="section cta-final section--noir-2">
        <div className="container">
          <Reveal>
            <Eyebrow bare>Première étape</Eyebrow>
            <h2>Combien vaut votre immeuble aujourd’hui&nbsp;?</h2>
            <p className="lead">
              Quatre questions sur le bien, et nous revenons sous 48&nbsp;h avec une fourchette
              argumentée. Sans engagement, et sans que votre immeuble apparaisse nulle part.
            </p>
            <div className="btn-row">
              <Button href="/estimer-un-immeuble/" icone>Estimer mon immeuble</Button>
              <a className="btn btn--outline" href={SITE.telHref}>{SITE.tel}</a>
            </div>
            <div className="cta-contact">
              <p><strong>{SITE.tel}</strong>Du lundi au vendredi, 9 h – 19 h</p>
              <p><strong>{SITE.adresse}</strong>{SITE.codePostalVille}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
