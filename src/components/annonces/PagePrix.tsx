import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { LigneDefilante } from "@/components/LigneDefilante";
import { SectionFaq } from "@/components/SectionFaq";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { HeroAnnonce } from "@/components/annonces/HeroAnnonce";
import { OutilPrix } from "@/components/annonces/OutilPrix";
import { TableauPrixParis } from "@/components/annonces/TableauPrixParis";
import { CarteArgument, Citation, Relance } from "@/components/annonces/arguments";
import { ESTIMATION } from "@/lib/arguments-paris";
import { donneesPrixParis, rang } from "@/lib/prix-paris";
import { faqParis, vivantsParis } from "@/lib/faq-paris";
import { chiffres } from "@/lib/chiffres";
import { imagesPartage } from "@/lib/partage";
import { VISUELS } from "@/lib/visuels";
import { SITE, nombre } from "@/lib/site";

/**
 * /prix-immeuble-paris/ et /prix-immeuble-paris/16e/ : la page des annonces Google pour « prix
 * immeuble Paris » (lot 140, MAV, 17/11/2026 : « Montre-moi quatre pages que tu utiliserais pour
 * les ads »).
 *
 * Son rôle : le propriétaire s'informe. La page lui donne d'abord la réponse, le prix médian au m²
 * des immeubles vendus en bloc (DVF, nos calculs des lots 100 à 114), puis lui dit pourquoi le sien
 * ne vaut pas la médiane, le formulaire à côté. Contacts moins mûrs que sur les deux autres pages.
 *
 * Une adresse par arrondissement : le bon chiffre est dans le HTML, et l'annonce « prix immeuble
 * Paris 16e » mène à la page du 16e. Agrégats seulement, année la plus récente, dès trois ventes
 * (conditions de réutilisation de DVF). Hors index, hors sitemap, hors menus ; les vingt et une
 * adresses ont pour canonique /prix-immeuble-paris/.
 */
const URL_PAGE = "/prix-immeuble-paris/";

/** « 16e » → 16 ; `null` pour une adresse inconnue. */
export function arrondissementDe(slug: string): number | null {
  const m = /^(\d{1,2})(er|e)$/.exec(slug);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 20 && (n === 1) === (m[2] === "er") ? n : null;
}

export function metadataPrix(arr: number | null): Metadata {
  const title = arr
    ? `Prix des immeubles à Paris ${rang(arr)} | France Immeuble`
    : "Prix des immeubles à Paris par arrondissement | France Immeuble";
  const description =
    "Prix médian au m² des immeubles vendus en bloc à Paris, par arrondissement, d’après DVF. Estimation gratuite de votre immeuble par une agence spécialisée.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${SITE.url}${URL_PAGE}` },
    robots: { index: false, follow: true },
    openGraph: { type: "website", title, description, url: URL_PAGE, images: imagesPartage(URL_PAGE) },
  };
}

export async function PagePrix({ arr }: { arr: number | null }) {
  const [ch, donnees] = await Promise.all([chiffres(), donneesPrixParis()]);
  const { annee, lignes, paris, rendementParis, tableau } = donnees;
  const lieu = arr ? `Paris ${rang(arr)}` : "Paris";
  const faq = faqParis(vivantsParis(donnees, ch), [
    "Quel est le prix au m² d’un immeuble de rapport à Paris ?",
    "Quel est le rendement d’un immeuble de rapport à Paris aujourd’hui ?",
    "Vaut-il mieux vendre un immeuble en bloc ou à la découpe ?",
    "Comment estime-t-on un immeuble de rapport à Paris ?",
  ]);

  return (
    <>
      <HeroAnnonce
        className="lp-hero--prix"
        image={VISUELS.skylineCrepuscule.src}
        alt={VISUELS.skylineCrepuscule.alt}
        formulaire="estimer"
        surtitre="Prix des immeubles à Paris"
        note={false}
        // Avec des prix, l'outil porte le titre : il change avec l'arrondissement choisi, sur place.
        titre={
          tableau && annee != null ? undefined : (
            <>Prix au&nbsp;m² des <span className="accent">immeubles à {lieu}</span></>
          )
        }
      >
        {tableau && annee != null ? (
          <OutilPrix initial={arr} annee={annee} lignes={lignes} paris={paris} rendementParis={rendementParis} />
        ) : (
          <p className="lead">
            Le prix d’un immeuble parisien dépend de ses baux, de son état et de son adresse. Nous
            estimons le vôtre gratuitement.
          </p>
        )}
      </HeroAnnonce>

      {/* Et dans les autres arrondissements ? Le tableau de la page Paris, un seul bouton. */}
      <TableauPrixParis donnees={donnees} secondBouton={false} />

      {/* J'ai le prix, pourquoi vous écrire ? */}
      <section className="section section--noir paris-estimation-sec lp-methode-sec" data-lp="mediane">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>Du prix médian au prix de votre immeuble</Eyebrow>
            <h2>
              Pourquoi votre immeuble <span className="accent">ne vaut pas la médiane</span>
            </h2>
            <p className="lead">
              Le prix au&nbsp;m² du quartier ne suffit pas&nbsp;: il faut bien connaître le marché et
              avoir de solides compétences techniques et locatives. C’est le métier de nos agents, qui
              ont étudié {nombre(ch.immeublesTraites)} immeubles depuis 2018.
            </p>
          </Reveal>
          <LigneDefilante marches className="paris-ligne">
            {ESTIMATION.map((x) => (
              <CarteArgument key={x.titre} {...x} />
            ))}
          </LigneDefilante>
          <Citation
            texte="… leur estimation, qui n’était pas la plus haute, mais la plus convaincante."
            auteur="Romain VZ"
          />
          <Relance libelle="Faire estimer mon immeuble" />
        </div>
      </section>

      <SectionFaq
        items={faq}
        className="section--noir-2 lp-faq-sec"
        titre={<>Prix des immeubles à Paris&nbsp;: <span className="accent">vos&nbsp;questions</span></>}
      />

      <BoutonFixeMobile href="#estimer" cible="estimer" libelle="Estimer mon immeuble" />
    </>
  );
}
