import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/Button";
import { ContactForm } from "@/components/ContactForm";
import Image from "next/image";
import { SITE } from "@/lib/site";
import { VISUELS } from "@/lib/visuels";

/**
 * /contactez-nous/ — URL existante conservée (CLAUDE.md §10).
 * En noindex aujourd'hui : on conserve ce choix, la page ne cherche pas de
 * trafic, elle sert les gens déjà sur le site.
 */
export const metadata: Metadata = {
  title: "Nous contacter",
  description:
    "France Immeuble — 66 avenue des Champs-Élysées, 75008 Paris. 01 72 87 52 22, du lundi au vendredi de 9 h à 19 h.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/contactez-nous/" },
};

export default function Contact() {
  return (
    <>
      <section className="section section--noir" style={{ paddingBottom: "var(--space-l)" }}>
        <div className="container">
          <Eyebrow>Nous joindre</Eyebrow>
          <h1 style={{ maxWidth: "15ch", marginBottom: "var(--space-m)" }}>
            Le téléphone reste le plus rapide
          </h1>
          <p className="lead" style={{ maxWidth: "54ch" }}>
            Sur un dossier d’immeuble, une conversation de cinq minutes vaut mieux que trois
            échanges d’e-mails. Nous décrochons entre 9&nbsp;h et 19&nbsp;h.
          </p>
          <div className="btn-row" style={{ marginTop: "var(--space-l)" }}>
            <a className="btn btn--primary" href={SITE.telHref}>{SITE.tel}</a>
            <Button href="/estimer-un-immeuble/" variant="outline" icone>
              Demander une estimation
            </Button>
          </div>
        </div>
      </section>

      <section className="section section--noir-2" style={{ paddingTop: "var(--space-l)" }}>
        <div className="container split">
          <Reveal>
            <ContactForm />
          </Reveal>

          <Reveal className="split__aside">
            <div className="railed" style={{ marginBottom: "var(--space-l)" }}>
              <h3 style={{ marginBottom: "var(--space-2xs)" }}>Nos bureaux</h3>
              <p className="muted">
                {SITE.adresse}
                <br />
                {SITE.codePostalVille}
              </p>
            </div>
            <div className="railed railed--thin" style={{ marginBottom: "var(--space-l)" }}>
              <h3 style={{ marginBottom: "var(--space-2xs)" }}>Horaires</h3>
              <p className="muted">Du lundi au vendredi, 9&nbsp;h – 19&nbsp;h.</p>
            </div>
            <div className="media-colonne" style={{ marginBottom: "var(--space-l)" }}>
              <Image
                src={VISUELS.facadeCoucher.src}
                alt={VISUELS.facadeCoucher.alt}
                sizes="(max-width: 900px) 100vw, 480px"
                placeholder="blur"
              />
            </div>

            <div className="railed railed--thin">
              <h3 style={{ marginBottom: "var(--space-2xs)" }}>Vous vendez&nbsp;?</h3>
              <p className="muted">
                Passez plutôt par l’estimation : les questions y sont déjà posées, et vous avez
                un retour argumenté sous 48&nbsp;h.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
