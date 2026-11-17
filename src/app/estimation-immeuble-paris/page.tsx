import { imagesPartage } from "@/lib/partage";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { LigneDefilante } from "@/components/LigneDefilante";
import { TeteMedia } from "@/components/TeteMedia";
import { SectionFaq } from "@/components/SectionFaq";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { HeroAnnonce } from "@/components/annonces/HeroAnnonce";
import { CarteArgument, Citation, Relance, type Carte } from "@/components/annonces/arguments";
import { CONDITIONS, ESTIMATION } from "@/lib/arguments-paris";
import { donneesPrixParis } from "@/lib/prix-paris";
import { faqParis, vivantsParis } from "@/lib/faq-paris";
import { chiffres } from "@/lib/chiffres";
import { VISUELS } from "@/lib/visuels";
import { SITE, nombre } from "@/lib/site";

/**
 * /estimation-immeuble-paris/ : la page des annonces Google pour « estimation immeuble Paris »
 * (MAV, 10/11/2026 : « un formulaire de transformation ++++ sur Paris et on fait du SEA à mort
 * dessus »). Refaite au lot 140 (MAV, 17/11/2026 : « entre conversion et ux/ui faut quand même
 * réussir à les convaincre »).
 *
 * Son rôle parmi les quatre pages des annonces : le propriétaire veut une valeur et craint le prix
 * flatteur. C'est la page de la méthode. Le formulaire est dans le premier écran ; chaque section
 * répond ensuite à une objection : gonflent-ils le prix, que dois-je donner et qui le saura,
 * savent-ils estimer un immeuble.
 *
 * Hors index, hors sitemap, hors menus. Aucun délai avant l'écran de fin du formulaire, aucun lien
 * de sortie hors FAQ (nouvel onglet), textes repris de la page Paris validée.
 */
const URL_PAGE = "/estimation-immeuble-paris/";
const TITRE = "Estimation immeuble Paris | France Immeuble";

// Balises écrites en dur : la balise « noindex » d'une page d'annonces ne doit dépendre d'aucune lecture.
const DESCRIPTION =
  "Estimation gratuite et confidentielle de votre immeuble parisien, par une agence spécialisée dans la vente d’immeubles de rapport. Sans engagement de vente.";

export const metadata: Metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}${URL_PAGE}` },
  robots: { index: false, follow: true },
  openGraph: { type: "website", title: TITRE, description: DESCRIPTION, url: URL_PAGE, images: imagesPartage(URL_PAGE) },
};

/** Que dois-je donner, et qui le saura ? */
const DEMANDE: Carte[] = [
  {
    picto: "dossier",
    titre: "L’état locatif d’abord",
    texte:
      "Pour estimer, il nous faut surtout un état locatif à jour : pour chaque lot, sa surface, son loyer hors charges, son type et son DPE.",
  },
  {
    picto: "detective",
    titre: "Aucune annonce",
    texte:
      "Une demande d’estimation ne donne lieu à aucune annonce. Si vous vendez ensuite avec nous, vos locataires et vos voisins ne l’apprennent pas par une annonce.",
  },
  CONDITIONS[0],
];

export default async function EstimationImmeubleParis() {
  const [ch, prixParis] = await Promise.all([chiffres(), donneesPrixParis()]);
  const etudies = nombre(ch.immeublesTraites);
  const faq = faqParis(vivantsParis(prixParis, ch), [
    "Comment estime-t-on un immeuble de rapport à Paris ?",
    "L’estimation d’un immeuble à Paris est-elle gratuite ?",
    "Un mauvais DPE fait-il baisser le prix d’un immeuble à Paris ?",
  ]);

  return (
    <>
      <HeroAnnonce
        image={VISUELS.toitsAeriens.src}
        alt={VISUELS.toitsAeriens.alt}
        formulaire="estimer"
        surtitre="Estimation d’immeuble à Paris"
        titre={<>Estimez votre <span className="accent">immeuble parisien</span></>}
        accroche={
          <>
            Une estimation gratuite et confidentielle, par une agence spécialisée
            <span className="lp-long"> dans la vente d’immeubles de rapport entiers</span>.
          </>
        }
        preuves={[
          { picto: "dossier", titre: `${etudies} immeubles étudiés`, texte: "depuis 2018" },
          { picto: "loupeCible", titre: "Quatre lectures", texte: "le marché, le locatif, le bâti, la cible" },
          { picto: "immeubles", titre: "Notre spécialité", texte: "la vente d’immeubles de rapport, à Paris et en Île-de-France" },
        ]}
        preuveMobile={`${etudies} immeubles étudiés depuis 2018`}
      />

      {/* Gonflent-ils le prix pour avoir le mandat ? Un vendeur répond. */}
      <section className="section section--noir-2 lp-bande lp-citation-grande" data-lp="citation">
        <div className="container">
          <Citation
            texte="… leur estimation, qui n’était pas la plus haute, mais la plus convaincante."
            auteur="Romain VZ"
          />
        </div>
      </section>

      {/* Que dois-je donner, et qui le saura ? */}
      <section className="section section--creme lp-demande-sec" data-lp="confidentiel">
        <div className="container">
          <TeteMedia image={{ src: "/media/img-offres-dossier2x.webp", alt: "Un dossier de vente France Immeuble ouvert", width: 1400, height: 1328, libre: true }}>
            <Eyebrow>Votre demande</Eyebrow>
            <h2>
              Ce qu’il nous faut, et <span className="accent">ce qui reste confidentiel</span>
            </h2>
          </TeteMedia>
          <LigneDefilante marches className="paris-ligne paris-ligne--3">
            {DEMANDE.map((x) => (
              <CarteArgument key={x.titre} {...x} />
            ))}
          </LigneDefilante>
          <Relance />
        </div>
      </section>

      {/* Savent-ils estimer un immeuble ? La section de la page Paris, ses quatre cartes. */}
      <section className="section section--noir paris-estimation-sec lp-methode-sec" data-lp="methode">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>Notre méthode</Eyebrow>
            <h2>
              Un immeuble ne s’estime pas <span className="accent">comme un appartement</span>
            </h2>
            <p className="lead">
              Le prix au&nbsp;m² du quartier ne suffit pas&nbsp;: il faut bien connaître le marché et
              avoir de solides compétences techniques et locatives. C’est le métier de nos agents, qui
              ont étudié {etudies} immeubles depuis 2018.
            </p>
          </Reveal>
          <LigneDefilante marches className="paris-ligne">
            {ESTIMATION.map((x) => (
              <CarteArgument key={x.titre} {...x} />
            ))}
          </LigneDefilante>
          <Citation
            texte="C’est après une estimation de qualité et très professionnelle de notre immeuble que nous avons accepté de confier cette vente à France Immeuble."
            auteur="Mariane Suzanne"
          />
          <Relance libelle="Faire estimer mon immeuble" />
        </div>
      </section>

      <SectionFaq
        items={faq}
        className="section--noir-2 lp-faq-sec"
        titre={<>Faire estimer un immeuble à Paris&nbsp;: <span className="accent">vos&nbsp;questions</span></>}
      />

      <BoutonFixeMobile href="#estimer" cible="estimer" libelle="Estimer mon immeuble" />
    </>
  );
}
