import type { Metadata } from "next";
import { PageFond } from "@/components/PageFond";
import { VISUELS } from "@/lib/visuels";
import { Reveal } from "@/components/Reveal";
import { ContactProjet } from "@/components/ContactProjet";
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

      {/* Retour #72 et précision de MAV (02/11/2026) : pas de hero ; une seule image sous toute la page, le titre, le formulaire tout de suite. */}
      {/* Retours #172 et #173 (MAV, 04/11/2026) : « Contactez-nous » revient à gauche,
          au-dessus des coordonnées, et le formulaire remonte à sa hauteur. */}
      <PageFond image={VISUELS.skylineCrepuscule.src} className="page-fond--contact">
      <section className="section section--noir contact-sec">
        <div className="container split">
          <Reveal>
            <h1 className="contact-titre">Contactez-<span className="accent">nous</span></h1>
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

          <ContactProjet />
        </div>
      </section>
      </PageFond>
    </>
  );
}
