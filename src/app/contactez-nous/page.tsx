import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { HeroMedia } from "@/components/HeroMedia";
import { VISUELS } from "@/lib/visuels";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { Picto } from "@/components/Picto";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { metadonneesWP } from "@/components/ContenuWP";
import { SITE } from "@/lib/site";

/**
 * /contactez-nous/ — page reprise du WordPress, RECOMPOSÉE.
 *
 * Texte repris mot pour mot. Dans la version précédente, le pictogramme de
 * localisation s'affichait à 700 px de large et occupait deux écrans : les
 * pictos n'étaient pas dans un <figure> et héritaient de `img{width:100%}`.
 * Ils sont désormais inline, à 20 px, dans une fiche de contact.
 *
 * Le `<h1>Votre message</h1>` du corps d'origine devient un h2 : la page
 * portait deux h1, ce qu'aucun moteur n'apprécie. Le mot reste à l'écran.
 */
export const metadata: Metadata = metadonneesWP("/contactez-nous/");

export default function ContactezNous() {
  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Contact", url: "/contactez-nous/" },
        ])}
      />

      <HeroMedia image={VISUELS.skylineCrepuscule.src} alt={VISUELS.skylineCrepuscule.alt}>
        <>
          <Eyebrow>Contact</Eyebrow>
          <h1>
            Contactez-<span className="accent">nous</span>
          </h1>
          <p className="lead">
            Un immeuble à vendre ou à acheter&nbsp;? nous répondons à toutes vos questions
          </p>
        </>
      </HeroMedia>

      <section className="section section--noir">
        <div className="container split">
          <Reveal>
            <ul className="fiche-contact">
              <li>
                <Picto nom="mail" taille={20} />
                <span>
                  <span className="fiche-contact__lbl">Email</span>
                  <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                </span>
              </li>
              <li>
                <Picto nom="secteur" taille={20} />
                <span>
                  <span className="fiche-contact__lbl">Adresse</span>
                  <span>
                    {SITE.adresse}
                    <br />
                    {SITE.codePostalVille}
                  </span>
                </span>
              </li>
              <li>
                <Picto nom="telephone" taille={20} />
                <span>
                  <span className="fiche-contact__lbl">Téléphone</span>
                  <a href={SITE.telHref}>{SITE.tel}</a>
                </span>
              </li>
            </ul>
          </Reveal>

          <div>
            <h2 style={{ marginBottom: "var(--space-s)" }}>Votre message</h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
