import type { Metadata } from "next";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { Picto, type NomPicto } from "@/components/Picto";
import { RechercheForm } from "@/components/RechercheForm";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { VISUELS } from "@/lib/visuels";
import { SITE, PREUVES, nombre } from "@/lib/site";
import { ventesEtStats } from "@/lib/biens";

/**
 * /immeubles-off-market/ — ce qu'est l'off-market, et comment y accéder.
 *
 * ⚠️ Cette page ne liste AUCUN bien réel, et ce n'est pas une limite technique
 * : c'est le sujet. Un immeuble off-market publié n'est plus off-market, et
 * c'est l'argument que l'agence tient devant chaque vendeur. Les fiches
 * ci-dessous sont des EXEMPLES — inventés, étiquetés comme tels à l'écran, et
 * jamais présentés comme disponibles. Elles montrent le genre de dossier, pas
 * un dossier.
 */
export const metadata: Metadata = {
  title: "Immeubles off-market | France Immeuble",
  description:
    "Nous commercialisons la plupart de nos immeubles sans annonce publique, directement auprès de notre fichier d’acquéreurs. Déposez votre recherche pour y accéder.",
  alternates: { canonical: `${SITE.url}/immeubles-off-market/` },
};

/** Pourquoi un vendeur choisit de ne pas diffuser. */
const RAISONS: { picto: NomPicto; titre: string; texte: string }[] = [
  {
    picto: "poignee",
    titre: "Les locataires ne l’apprennent pas par une annonce",
    texte:
      "Un immeuble mis en ligne, ce sont des locataires qui découvrent la vente avant d’en être informés, et des questions auxquelles le propriétaire doit répondre avant d’être prêt.",
  },
  {
    picto: "secteur",
    titre: "Le voisinage et les concurrents ne savent rien",
    texte:
      "Une annonce publique signale à toute la rue, et à tous les confrères, qu’un immeuble change de mains. Certains vendeurs ne le souhaitent pas, et c’est leur droit.",
  },
  {
    picto: "augmentation",
    titre: "Le bien ne s’use pas en vitrine",
    texte:
      "Un immeuble qui reste trois mois en ligne perd de sa valeur perçue : les acquéreurs le voient passer, se demandent pourquoi il est toujours là, et négocient en conséquence.",
  },
];

/**
 * Exemples de dossiers. Fictifs, et dits tels quels à l'écran.
 *
 * Écrits à partir des ordres de grandeur réels du fichier — calibre, typologies
 * et rendements constatés — pour que l'exemple soit représentatif. Aucun ne
 * correspond à un immeuble existant, et aucun ne porte d'adresse.
 */
const EXEMPLES = [
  {
    secteur: "Paris 18e",
    type: "Immeuble de rapport",
    surface: "520 m² Carrez",
    lots: "9 lots d’habitation",
    occupation: "Occupé à 100 %",
    rendement: "4,1 % brut",
    calibre: "3 – 4 M€",
  },
  {
    secteur: "Hauts-de-Seine",
    type: "Immeuble mixte",
    surface: "740 m² Carrez",
    lots: "11 lots, dont 2 commerces",
    occupation: "Occupé à 82 %",
    rendement: "5,3 % brut",
    calibre: "4 – 6 M€",
  },
  {
    secteur: "Métropole régionale",
    type: "Immeuble de rapport",
    surface: "1 100 m² Carrez",
    lots: "16 lots d’habitation",
    occupation: "Libre à la vente",
    rendement: "9,8 % brut",
    calibre: "2 – 3 M€",
  },
];

export default async function ImmeublesOffMarket() {
  const { stats } = await ventesEtStats();
  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Biens off-market", url: "/immeubles-off-market/" },
        ])}
      />

      <HeroMedia image={VISUELS.fenetresHeureBleue.src} alt={VISUELS.fenetresHeureBleue.alt}>
        <>
          <Eyebrow>Nos biens · off-market</Eyebrow>
          <h1>Les immeubles que personne ne voit passer</h1>
          <p className="lead">
            La plupart de nos mandats ne sont jamais diffusés. Ils partent directement à notre
            fichier d’acquéreurs&nbsp;— et c’est précisément ce que le vendeur achète.
          </p>
          <div className="btn-row">
            <Button href="#deposer" icone>
              Déposer ma recherche
            </Button>
            <Button href={SITE.telHref} variant="outline">
              Être rappelé.e
            </Button>
          </div>
        </>
      </HeroMedia>

      <section className="section section--creme">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Le principe</Eyebrow>
            <h2>Off-market ne veut pas dire confidentiel pour tout le monde</h2>
            <p className="lead">
              Ça veut dire&nbsp;: pas d’annonce publique, pas de portail, pas de panneau. Le
              dossier complet part à la poignée d’acquéreurs dont la recherche correspond
              vraiment, et à eux seuls.
            </p>
          </Reveal>

          <div className="grid grid--3">
            {RAISONS.map((r, i) => (
              <Reveal key={r.titre} as="article" className="card card--medaillon" delayIndex={i}>
                <span className="card__fond" aria-hidden="true">
                  <Picto nom={r.picto} taille={190} />
                </span>
                <span className="card__picto" aria-hidden="true">
                  <Picto nom={r.picto} taille={30} />
                </span>
                <h3>{r.titre}</h3>
                <p>{r.texte}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Le genre de dossiers</Eyebrow>
            <h2>À quoi ressemble ce que vous recevriez</h2>
            <p className="lead">
              Nous ne publions pas les immeubles en cours de commercialisation&nbsp;: ce serait
              rompre l’engagement pris avec leur propriétaire. Voici en revanche le calibre, la
              typologie et les rendements de ce qui circule dans le fichier.
            </p>
          </Reveal>

          {/* L'avertissement est AU-DESSUS des cartes, pas en note de bas de
              page : un visiteur qui ne lit que les cartes doit savoir avant de
              les lire qu'elles sont des exemples. */}
          <p className="avertissement" role="note">
            <strong>Exemples, pas des biens disponibles.</strong> Les trois fiches ci-dessous sont
            construites à partir des ordres de grandeur réels du fichier. Aucune ne correspond à un
            immeuble existant, et aucune n’est à vendre.
          </p>

          <div className="grid grid--3">
            {EXEMPLES.map((e, i) => (
              <Reveal key={e.secteur} as="article" className="exemple" delayIndex={i}>
                <span className="exemple__tag">Exemple</span>
                <h3>{e.secteur}</h3>
                <dl className="exemple__faits">
                  <div>
                    <dt>Type</dt>
                    <dd>{e.type}</dd>
                  </div>
                  <div>
                    <dt>Surface</dt>
                    <dd>{e.surface}</dd>
                  </div>
                  <div>
                    <dt>Lots</dt>
                    <dd>{e.lots}</dd>
                  </div>
                  <div>
                    <dt>Occupation</dt>
                    <dd>{e.occupation}</dd>
                  </div>
                  <div>
                    <dt>Rendement</dt>
                    <dd>{e.rendement}</dd>
                  </div>
                  <div>
                    <dt>Calibre</dt>
                    <dd>{e.calibre}</dd>
                  </div>
                </dl>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="deposer" className="section section--noir">
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Y accéder</Eyebrow>
            <h2>Déposez votre recherche</h2>
            <p className="lead">
              Nous rapprochons chaque nouveau mandat des recherches enregistrées. Plus la vôtre est
              précise, plus tôt vous êtes appelé.
            </p>
            <div className="hero-proof" style={{ marginTop: "var(--space-l)" }}>
              <span className="hero-proof__item">
                <span className="hero-proof__val">{nombre(PREUVES.investisseurs)}</span>
                <span className="hero-proof__lbl">acquéreurs dans le fichier</span>
              </span>
              <span className="hero-proof__item">
                <span className="hero-proof__val">{stats.total}</span>
                <span className="hero-proof__lbl">
                  immeubles vendus depuis {stats.premiereAnnee}
                </span>
              </span>
            </div>
          </Reveal>

          <RechercheForm />
        </div>
      </section>
    </>
  );
}
