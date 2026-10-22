import type { Metadata } from "next";
import { chiffres } from "@/lib/chiffres";
import { Chiffre } from "@/components/Chiffre";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { Picto, type NomPicto } from "@/components/Picto";
import { RechercheForm } from "@/components/RechercheForm";
import { JsonLd } from "@/components/JsonLd";
import { TeteMedia } from "@/components/TeteMedia";
import { filAriane } from "@/lib/schema";
import { VISUELS } from "@/lib/visuels";
import { SITE, PREUVES, nombre } from "@/lib/site";
import { ventesEtStats, offMarket, lieuOffMarket } from "@/lib/biens";

/**
 * /immeubles-off-market/ — ce qu'est l'off-market, et comment y accéder.
 *
 * ⚠️ Cette page ne décrit AUCUN bien, et ce n'est pas une limite technique :
 * c'est le sujet. Un immeuble off-market décrit en public n'est plus
 * off-market. Elle montre seulement COMBIEN d'immeubles circulent, et OÙ, à la
 * commune près (table `offmarket`, déposée par le BO deux fois par jour). Ni
 * type, ni lots, ni prix.
 */
export const metadata: Metadata = {
  title: { absolute: "Immeubles off-market | France Immeuble" },
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

/** Le BO dépose à 9 h et 19 h ; relire toutes les 10 minutes suffit. */
export const revalidate = 600;

const heure = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  });

export default async function ImmeublesOffMarket() {
  const [{ stats }, communes, ch] = await Promise.all([ventesEtStats(), offMarket(), chiffres()]);
  const total = communes.reduce((s, c) => s + c.nombre, 0);
  // Paris 8e et Paris 18e sont deux cartes, mais une seule commune.
  const nbCommunes = new Set(communes.map((c) => `${c.dept}|${c.commune}`)).size;
  const majLe = communes.reduce((m, c) => (c.majLe > m ? c.majLe : m), "");
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
          <h1>
            Les immeubles que <span className="accent">personne ne voit passer</span>
          </h1>
          <p className="lead">
            La plupart de nos immeubles de rapport partent sans annonce, directement aux
            acquéreurs de notre fichier. C’est précisément ce que le vendeur achète.
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
          <TeteMedia
            image={{
              src: "/media/streets-of-paris-PV7Y89Z-1024x684.webp",
              alt: "Rue parisienne bordée d’immeubles haussmanniens",
              width: 1024,
              height: 684,
            }}
          >
            <Eyebrow>Le principe</Eyebrow>
            <h2>Off-market ne veut pas dire confidentiel pour tout le monde</h2>
            <p className="lead">
              Ça veut dire&nbsp;: pas d’annonce publique, pas de portail, pas de panneau. Le
              dossier complet part à la poignée d’acquéreurs dont la recherche correspond
              vraiment, et à eux seuls.
            </p>
          </TeteMedia>

          <div className="grid grid--3">
            {RAISONS.map((r, i) => (
              <Reveal key={r.titre} as="article" className="card card--medaillon" delayIndex={i}>
                <span className="card__fond" aria-hidden="true">
                  <Picto nom={r.picto} taille={96} />
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

      {/* Ce qui circule en ce moment : un nombre et des communes, rien d'autre.
          Sans dépôt du BO (base vide ou injoignable), la section ne s'affiche
          pas : aucun chiffre plutôt qu'un chiffre faux. */}
      {total > 0 && (
        <section className="section section--noir-2">
          <div className="container">
            <Reveal className="section__head">
              <Eyebrow>En ce moment</Eyebrow>
              <h2>
                {total} immeuble{total > 1 ? "s" : ""} actuellement off-market
              </h2>
              <p className="lead">
                {nbCommunes > 1 ? `Dans ${nbCommunes} communes. ` : ""}Le type, les lots
                et le prix ne sont communiqués qu’aux acquéreurs inscrits dont la recherche
                correspond&nbsp;: les publier ici reviendrait à rompre l’engagement pris avec
                leur propriétaire.
              </p>
            </Reveal>

            <ul className="om-liste">
              {communes.map((c, i) => (
                <Reveal
                  key={`${c.dept}-${c.commune}-${c.arrondissement ?? ""}`}
                  as="li"
                  className="om-commune"
                  delayIndex={i % 6}
                >
                  <span className="om-commune__nom">
                    {lieuOffMarket(c)} <span className="om-commune__dept">({c.dept})</span>
                  </span>
                  <span className="om-commune__n">
                    {c.nombre} immeuble{c.nombre > 1 ? "s" : ""}
                  </span>
                </Reveal>
              ))}
            </ul>
            {majLe && <p className="om-maj">Mis à jour le {heure(majLe)}</p>}
          </div>
        </section>
      )}

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
              <Chiffre picto="reseau" valeur={nombre(ch.investisseurs)} libelle="acquéreurs dans le fichier" />
              <Chiffre picto="secteur" valeur={stats.villes} libelle="communes où nous avons vendu" />
            </div>
          </Reveal>

          <RechercheForm />
        </div>
      </section>
    </>
  );
}
