import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import Image from "next/image";
import { PREUVES, SITE, CALIBRE, nombre } from "@/lib/site";
import { VISUELS } from "@/lib/visuels";

/**
 * /estimer-un-immeuble/ — le tunnel de qualification.
 * Page de conversion pure : elle a abandonné toute ambition SEO (§10,
 * cannibalisation avec /comment-estimer-un-immeuble-de-rapport/).
 */
export const metadata: Metadata = {
  title: "Estimer un immeuble de rapport",
  description:
    "Estimation confidentielle d’immeuble de rapport sous 48 h, appuyée sur 365 transactions réelles. Sans engagement, sans diffusion, sans que votre immeuble n’apparaisse nulle part.",
  alternates: { canonical: "/estimer-un-immeuble/" },
};

export default function Estimer() {
  return (
    <>
      <section className="section section--noir" style={{ paddingBottom: "var(--space-l)" }}>
        <div className="container">
          <Eyebrow>Estimation confidentielle</Eyebrow>
          <h1 style={{ maxWidth: "16ch", marginBottom: "var(--space-m)" }}>
            Combien vaut votre immeuble&nbsp;?
          </h1>
          <p className="lead" style={{ maxWidth: "56ch" }}>
            Quatre questions sur le bien, et nous revenons sous 48&nbsp;h avec une fourchette
            argumentée — appuyée sur les {PREUVES.immeublesTraites} immeubles que nous avons
            réellement traités, pas sur un algorithme.
          </p>
        </div>
      </section>

      <section className="section section--noir-2" style={{ paddingTop: "var(--space-l)" }}>
        <div className="container split">
          <Reveal>
            <EstimationForm />
          </Reveal>

          <Reveal className="split__aside">
            <div className="railed" style={{ marginBottom: "var(--space-l)" }}>
              <h3 style={{ marginBottom: "var(--space-2xs)" }}>Rien ne sort d’ici</h3>
              <p className="muted">
                Pas d’annonce, pas de diffusion, pas de pancarte. Une estimation n’engage à rien
                et votre immeuble n’apparaît nulle part tant que vous ne l’avez pas décidé.
              </p>
            </div>

            <div className="railed railed--thin" style={{ marginBottom: "var(--space-l)" }}>
              <h3 style={{ marginBottom: "var(--space-2xs)" }}>Ce que nous traitons</h3>
              <p className="muted">
                Principalement des immeubles à partir de{" "}
                <strong>{CALIBRE.ticketMinLabel}</strong> à Paris et en Île-de-France, et en
                province au-delà de <strong>{CALIBRE.rentabiliteProvinceMin}&nbsp;%</strong> de
                rendement. En dehors, nous vous orientons vers PleinBail plutôt que de vous faire
                perdre du temps.
              </p>
            </div>

            <div className="railed railed--thin">
              <h3 style={{ marginBottom: "var(--space-2xs)" }}>Sur quoi repose le chiffre</h3>
              <p className="muted">
                Revenus locatifs constatés, comparables issus de nos propres transactions, état
                d’occupation, travaux à prévoir. Nous vous donnons une fourchette honnête, pas le
                chiffre que vous voulez entendre.
              </p>
            </div>

            <div className="hero-proof" style={{ marginTop: "var(--space-l)" }}>
              <div className="hero-proof__item">
                <span className="hero-proof__val">{PREUVES.immeublesTraites}</span>
                <span className="hero-proof__lbl">comparables réels</span>
              </div>
              <div className="hero-proof__item">
                <span className="hero-proof__val">48 h</span>
                <span className="hero-proof__lbl">de délai de retour</span>
              </div>
              <div className="hero-proof__item">
                <span className="hero-proof__val">{nombre(PREUVES.investisseurs)}</span>
                <span className="hero-proof__lbl">investisseurs en base</span>
              </div>
            </div>

            <div className="media-colonne" style={{ marginTop: "var(--space-l)" }}>
              <Image
                src={VISUELS.interieurToits.src}
                alt={VISUELS.interieurToits.alt}
                sizes="(max-width: 900px) 100vw, 480px"
                placeholder="blur"
              />
            </div>

            <p className="small muted" style={{ marginTop: "var(--space-m)" }}>
              Vous préférez en parler&nbsp;?{" "}
              <a className="link-arrow" href={SITE.telHref}>{SITE.tel}</a>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
