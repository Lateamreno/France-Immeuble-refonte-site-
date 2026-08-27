import type { Metadata } from "next";
import "./vendre.css";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Faq, type QuestionFaq } from "@/components/Faq";
import { PREUVES, SITE, CALIBRE, nombre } from "@/lib/site";
import { HeroMedia } from "@/components/HeroMedia";
import { BandeMedia } from "@/components/BandeMedia";
import { VISUELS } from "@/lib/visuels";

/**
 * /vendre-un-immeuble/ — page menu, TRANSFORMATION PURE.
 * Elle a abandonné toute ambition SEO (CLAUDE.md §10 : cannibalisation avec
 * les articles de blog qui, eux, performent). Ce sont les pages villes qui
 * porteront le SEO géolocalisé (§7). Ne pas la charger de texte SEO.
 */
export const metadata: Metadata = {
  title: "Vendre un immeuble de rapport",
  description:
    "Vendez votre immeuble de rapport en off-market, auprès de 1 372 investisseurs qualifiés. 365 immeubles traités depuis 2018. Honoraires 5 % du prix net vendeur. Estimation sous 48 h.",
  alternates: { canonical: "/vendre-un-immeuble/" },
};

const CHECK = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ETOILE = (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 1.6l2.4 5.2 5.6.7-4.1 3.9 1.1 5.6L10 14.3l-5 2.7 1.1-5.6L2 7.5l5.6-.7z" />
  </svg>
);

const ETAPES = [
  {
    num: "01",
    titre: "Estimation et analyse du rendement",
    texte:
      "Surface, lots, occupation, revenus locatifs, travaux à prévoir. Nous reconstituons le rendement réel de l’immeuble et le confrontons aux transactions comparables que nous avons signées.",
    meta: "Retour sous 48 h",
  },
  {
    num: "02",
    titre: "Mandat semi-exclusif",
    texte:
      "Nous démarrons par une période de test interne de deux à quatre semaines : le dossier ne sort pas de notre fichier. Si le prix est juste, il part souvent avant d’être diffusé plus largement.",
    meta: "Test interne 2 à 4 semaines",
  },
  {
    num: "03",
    titre: "Présentation ciblée aux investisseurs",
    texte: `Nous sélectionnons dans les ${nombre(PREUVES.investisseurs)} investisseurs de la base ceux dont les critères correspondent : zone, ticket, rendement attendu, appétence au locatif occupé. Ils reçoivent un dossier complet, pas une annonce.`,
    meta: "Short-list qualifiée",
  },
  {
    num: "04",
    titre: "Offre écrite, compromis, acte",
    texte:
      "Nous instruisons les offres, vérifions le financement, et suivons le dossier chez le notaire jusqu’à la signature. Nos honoraires ne sont dus qu’à ce moment-là.",
    meta: "Honoraires à la signature",
  },
];

const QUESTIONS: QuestionFaq[] = [
  {
    question: "Puis-je vendre un immeuble entièrement occupé ?",
    reponse: (
      <p>
        Oui, et c’est même le cas le plus fréquent. Un immeuble de rapport occupé se vend sur son
        rendement : les baux en cours sont une donnée d’entrée pour l’investisseur, pas un obstacle.
        Vous n’avez ni congé à délivrer ni logement à libérer.
      </p>
    ),
  },
  {
    question: "Combien de temps prend une vente en bloc ?",
    reponse: (
      <p>
        L’estimation revient sous 48 h. Le dossier part ensuite en test interne pendant deux à quatre
        semaines auprès de notre fichier. Les délais réels dépendent du prix, de l’emplacement et de
        l’état de l’immeuble — nous vous donnons une fourchette honnête dès l’estimation.
      </p>
    ),
  },
  {
    question: "Qu’est-ce qu’un mandat semi-exclusif ?",
    reponse: (
      <p>
        Vous nous confiez la commercialisation tout en gardant la possibilité de vendre par vous-même
        à un acquéreur que vous auriez trouvé directement. Nous commençons par une période de test
        interne : le dossier reste dans notre base, sans diffusion externe.
      </p>
    ),
  },
  {
    question: "Faut-il faire des travaux avant de vendre ?",
    reponse: (
      <p>
        Rarement. Les acquéreurs d’immeubles de rapport intègrent le budget travaux dans leur calcul
        de rendement, et beaucoup préfèrent piloter eux-mêmes la rénovation. Engager des travaux avant
        la vente revient le plus souvent à financer la plus-value de l’acheteur.
      </p>
    ),
  },
  {
    question: "Quels documents préparer ?",
    reponse: (
      <p>
        Pour l’estimation, une simple description suffit : adresse, surface, nombre de lots,
        occupation, revenus locatifs annuels. Pour la commercialisation, nous demandons ensuite les
        baux, la taxe foncière, les diagnostics et, le cas échéant, les derniers procès-verbaux
        d’assemblée.
      </p>
    ),
  },
  {
    question: "Intervenez-vous en dehors de Paris ?",
    reponse: (
      <p>
        Oui. Paris et la première couronne concentrent l’essentiel de notre activité, mais notre
        fichier d’investisseurs acquiert dans toute la France dès lors que le rendement est au
        rendez-vous. Parlez-nous de votre immeuble.
      </p>
    ),
  },
];

export default function VendreUnImmeuble() {
  return (
    <>
      {/* ===== HERO ===== */}
      <HeroMedia
        className="hero section--noir"
        image={VISUELS.facadeCoucher.src}
        alt={VISUELS.facadeCoucher.alt}
      >
        <>
          <Eyebrow>Vente en bloc &middot; Off-market</Eyebrow>

          <h1>
            Vendre un immeuble de rapport,{" "}
            <span className="bronze-grad">sans l’exposer au marché</span>
          </h1>

          <p className="lead">
            Nous présentons votre immeuble à un fichier de {nombre(PREUVES.investisseurs)}{" "}
            investisseurs déjà qualifiés. Pas d’annonce publique, pas de visites de curieux : une
            short-list d’acquéreurs solvables, et une offre écrite.
          </p>

          <div className="btn-row">
            <Button href="/estimer-un-immeuble/" icone>
              Estimer mon immeuble
            </Button>
            <Button href={SITE.telHref} variant="outline">
              Parler à un conseiller &middot; {SITE.tel}
            </Button>
          </div>

          <div className="hero-proof">
            <div className="hero-proof__item">
              <span className="hero-proof__val">{PREUVES.immeublesTraites}</span>
              <span className="hero-proof__lbl">immeubles traités depuis {PREUVES.depuis}</span>
            </div>
            <div className="hero-proof__item">
              <span className="hero-proof__val">{nombre(PREUVES.investisseurs)}</span>
              <span className="hero-proof__lbl">investisseurs en base</span>
            </div>
            <div className="hero-proof__item">
              <span className="hero-proof__val">{PREUVES.noteGoogle}/5</span>
              <span className="hero-proof__lbl">{PREUVES.nbAvis} avis Google</span>
            </div>
          </div>
        </>
      </HeroMedia>

      {/* ===== CHIFFRES ===== */}
      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>La maison</Eyebrow>
            <h2>Un seul métier&nbsp;: l’immeuble de rapport</h2>
            <p className="lead">
              Depuis {PREUVES.depuis}, {SITE.nom} ne traite que la vente en bloc. Pas d’appartement à
              l’unité, pas de location : un fichier d’acquéreurs construit sur une seule typologie de
              bien.
            </p>
            <div className="railed" style={{ marginTop: "var(--space-m)" }}>
              <p className="muted">
                Nous intervenons principalement sur des immeubles à partir de{" "}
                <strong>{CALIBRE.ticketMinLabel}</strong> à Paris et en Île-de-France, et en province
                au-delà de <strong>{CALIBRE.rentabiliteProvinceMin}&nbsp;%</strong> de rendement. En
                dehors de ce calibre, nous vous orientons plutôt que de vous faire perdre du temps.
              </p>
            </div>
          </Reveal>

          <div className="stats-band">
            {[
              {
                v: String(PREUVES.immeublesTraites),
                l: "Immeubles traités",
                n: `Depuis la création de l’agence en ${PREUVES.depuis}.`,
              },
              {
                v: nombre(PREUVES.investisseurs),
                l: "Investisseurs en base",
                n: "Marchands de biens, family offices, foncières, SCI patrimoniales.",
              },
              {
                v: `${PREUVES.honorairesPct} %`,
                l: "D’honoraires",
                n: "Du prix net vendeur, dus uniquement à la signature de l’acte.",
              },
              {
                v: PREUVES.noteGoogle,
                l: "Avis Google",
                n: `Sur ${PREUVES.nbAvis} avis de vendeurs et d’acquéreurs.`,
              },
            ].map((s, i) => (
              <Reveal key={s.l} className="stat" delayIndex={i}>
                <span className="stat-number">{s.v}</span>
                <span className="stat-label">{s.l}</span>
                <p className="stat-note">{s.n}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== OFF-MARKET ===== */}
      <section className="section section--noir">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Pourquoi l’off-market</Eyebrow>
            <h2>Une annonce publique coûte cher au&nbsp;vendeur</h2>
            <p className="lead">
              Un immeuble affiché sur les portails est vu par tout le monde : vos locataires, vos
              voisins, vos concurrents. Et son prix baisse à mesure qu’il reste en ligne.
            </p>
          </Reveal>

          <div className="grid grid--3">
            {[
              {
                n: "01",
                t: "Discrétion totale",
                p: "Aucune annonce, aucune photo en ligne, aucune pancarte. Vos locataires n’apprennent pas la vente par une vitrine, et vos partenaires bancaires non plus.",
              },
              {
                n: "02",
                t: "Pas de décote de durée",
                p: "Un bien resté six mois sur un portail se négocie à la baisse : l’acquéreur sait qu’il n’est pas parti. En off-market, l’immeuble n’a pas d’historique public.",
              },
              {
                n: "03",
                t: "Uniquement des acheteurs réels",
                p: "Nous ne présentons le dossier qu’à des investisseurs dont nous connaissons la capacité de financement et les critères d’acquisition. Pas de visite de confort.",
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

      {/* ===== MÉTHODE ===== */}
      <section className="section section--noir-3">
        <div className="container split split--sticky">
          <Reveal className="split__aside">
            <Eyebrow>La méthode</Eyebrow>
            <h2>De l’estimation à l’acte, en quatre temps</h2>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
              Le même déroulé sur les {PREUVES.immeublesTraites} immeubles que nous avons traités.
              Vous savez à chaque étape où en est votre dossier.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="/estimer-un-immeuble/" icone>
                Démarrer par l’estimation
              </Button>
            </div>
          </Reveal>

          <div className="steps">
            {ETAPES.map((e, i) => (
              <Reveal key={e.num} as="article" className="step" delayIndex={i}>
                <span className="step__dot" aria-hidden="true" />
                <span className="step__num">Étape {e.num}</span>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
                <span className="step__meta">{e.meta}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HONORAIRES ===== */}
      <section className="section section--creme">
        <div className="container split">
          <Reveal>
            <Eyebrow>Honoraires &amp; mandat</Eyebrow>
            <h2>{PREUVES.honorairesPct}&nbsp;%, et rien avant la signature</h2>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
              Un taux unique, annoncé dès le premier rendez-vous, calculé sur le prix net vendeur.
              Aucun frais de dossier, aucun forfait de commercialisation, aucune facture si l’immeuble
              ne se vend pas.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="/estimer-un-immeuble/" variant="light" icone>
                Estimer mon immeuble
              </Button>
              <Button href="/contactez-nous/" variant="ghost-dark">
                Poser une question
              </Button>
            </div>
          </Reveal>

          <Reveal className="fee-panel">
            <div className="stat">
              <span className="stat-number">{PREUVES.honorairesPct}&nbsp;%</span>
              <span className="stat-label">Du prix net vendeur</span>
            </div>
            <ul className="fee-list">
              <li>
                {CHECK}
                <span>
                  Honoraires dus <strong>uniquement à la signature de l’acte authentique</strong>.
                </span>
              </li>
              <li>
                {CHECK}
                <span>
                  Mandat <strong>semi-exclusif</strong>, avec période de test interne de 2 à 4
                  semaines.
                </span>
              </li>
              <li>
                {CHECK}
                <span>
                  Estimation, dossier de présentation et diffusion à la base : <strong>inclus</strong>
                  .
                </span>
              </li>
              <li>
                {CHECK}
                <span>
                  Suivi notarial jusqu’à l’acte, <strong>sans supplément</strong>.
                </span>
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ===== PREUVE SOCIALE ===== */}
      <section className="section section--noir-2">
        <div className="container split">
          <Reveal>
            <Eyebrow>Ils ont vendu avec nous</Eyebrow>
            <div className="rating">
              <span className="rating__stars" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i}>{ETOILE}</span>
                ))}
              </span>
              <span className="rating__text">
                {PREUVES.noteGoogle}/5 &middot; {PREUVES.nbAvis} avis Google
              </span>
            </div>
            <h2>La preuve tient dans un chiffre&nbsp;: {PREUVES.immeublesTraites}</h2>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
              Chaque immeuble vendu enrichit notre base de comparables et notre fichier d’acquéreurs.
              C’est ce qui nous permet d’estimer juste et de vendre vite.
            </p>
            <p style={{ marginTop: "var(--space-m)" }}>
              <a className="link-arrow" href="/immeubles-vendus/">
                Voir les immeubles vendus
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  aria-hidden="true"
                >
                  <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </p>
          </Reveal>

          <Reveal as="figure" className="quote">
            <blockquote>
              «&nbsp;Immeuble de 8 lots vendu en trois semaines, sans qu’une seule annonce ne sorte.
              Mes locataires n’ont rien su avant la signature.&nbsp;»
            </blockquote>
            <figcaption>
              Propriétaire vendeur &middot; immeuble de rapport, Paris 18<sup>e</sup>
            </figcaption>
          </Reveal>
        </div>
      </section>

      {/* ===== RESPIRATION ===== */}
      <BandeMedia image={VISUELS.interieurToits.src} alt={VISUELS.interieurToits.alt}>
        <h2>Vos locataires l’apprendront à la signature, pas avant</h2>
        <p>
          Aucune annonce, aucune photo en ligne, aucune pancarte sur la façade. C’est la
          première chose que nous promettons, et la dernière sur laquelle nous transigeons.
        </p>
      </BandeMedia>

      {/* ===== FAQ ===== */}
      <section className="section section--noir">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>Questions fréquentes</Eyebrow>
            <h2>Ce que les vendeurs nous demandent</h2>
          </Reveal>
          <Reveal>
            <Faq items={QUESTIONS} />
          </Reveal>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="section cta-final section--noir-3">
        <div className="container">
          <Reveal>
            <Eyebrow bare>Première étape</Eyebrow>
            <h2>Combien vaut votre immeuble aujourd’hui&nbsp;?</h2>
            <p className="lead">
              Quelques questions sur le bien, et nous revenons vers vous sous 48 h avec une fourchette
              argumentée. Sans engagement, et sans que votre immeuble n’apparaisse nulle part.
            </p>
            <div className="btn-row">
              <Button href="/estimer-un-immeuble/" icone>
                Estimer mon immeuble
              </Button>
              <Button href={SITE.telHref} variant="outline">
                {SITE.tel}
              </Button>
            </div>
            <div className="cta-contact">
              <p>
                <strong>{SITE.tel}</strong>Du lundi au vendredi, 9 h – 19 h
              </p>
              <p>
                <strong>{SITE.adresse}</strong>
                {SITE.codePostalVille}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
