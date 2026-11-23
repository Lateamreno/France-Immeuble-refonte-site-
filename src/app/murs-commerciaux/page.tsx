import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { CarteVente } from "@/components/CarteVente";
import { LigneDefilante } from "@/components/LigneDefilante";
import { SectionFaq, type QR } from "@/components/SectionFaq";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { CarteMurs, HeroMurs, PICTOS_MURS, SectionEstimationMurs, estUneVenteDeMurs } from "@/components/murs/communs";
import { ventes as lesVentes } from "@/lib/biens";
import { chiffres as lesChiffres } from "@/lib/chiffres";

/**
 * /murs-commerciaux/ : la page mère de la section (MAV, 20 et 22/11/2026). Elle vise « murs
 * commerciaux » et « vendre des murs commerciaux » ; « local commercial » aura sa propre page.
 * Sur l'aperçu seulement (MAV, 23/11/2026 : « pour l'instant juste en preview ») : hors index et
 * hors sitemap jusqu'à son accord.
 */
export const metadata: Metadata = {
  title: "Vendre des murs commerciaux à des investisseurs",
  description:
    "Local commercial, entrepôt ou retail park : nous estimons vos murs commerciaux et les vendons sans annonce, loués ou libres, à des investisseurs. Estimation gratuite.",
  robots: { index: false, follow: false },
};

const FAQ: QR[] = [
  {
    question: "Faut-il proposer les murs à son locataire avant de les vendre ?",
    texte:
      "Le plus souvent, oui. Le locataire d’un local commercial a un droit de préférence quand le propriétaire vend le local seul : il doit recevoir l’offre en premier, au prix et aux conditions de la vente. Il y a des exceptions, par exemple la vente de l’immeuble entier. Nous préparons cette étape avec votre notaire.",
  },
  {
    question: "Comment se calcule le prix de murs commerciaux ?",
    texte:
      "Le prix part du loyer annuel, hors charges et hors taxes, et du rendement que les investisseurs demandent pour ce local. Ce rendement dépend de la ville et de la rue, du locataire, du bail (durée restante, loyer face au marché, taxe foncière refacturée ou non) et du local lui-même. Par exemple, un loyer de 60 000 € par an vendu sur un rendement de 5 % donne un prix de 1,2 M€, hors frais de notaire.",
  },
  {
    question: "Vendez-vous aussi des murs libres ?",
    texte:
      "Oui. Un local libre s’estime sur sa valeur locative, c’est-à-dire le loyer qu’il obtiendrait aujourd’hui dans sa rue. Nous le vendons libre à des investisseurs qui le loueront eux-mêmes. Le prix tient compte du temps et du coût de la mise en location.",
  },
];

export default async function MursCommerciaux() {
  const [toutes, ch] = await Promise.all([lesVentes(), lesChiffres()]);
  const ventesMurs = toutes.filter(estUneVenteDeMurs).slice(0, 3);
  return (
    <>
      <HeroMurs
        surtitre="Murs commerciaux"
        chiffres={ch}
        lead={
          <>
            Local commercial en pied d’immeuble, entrepôt ou retail park : nous estimons la valeur
            locative et le rendement qu’attendent les investisseurs, puis nous vendons vos murs sans
            annonce, loués ou libres.
          </>
        }
      >
        Vendre vos <span className="accent">murs commerciaux</span> au bon investisseur
      </HeroMurs>

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>Ce que nous vendons</Eyebrow>
            <h2>Trois types de murs, <span className="accent">les mêmes investisseurs</span></h2>
            <p className="lead">
              Nos acheteurs cherchent des loyers sûrs. Ils regardent l’emplacement, le locataire et la
              durée du bail avant la surface.
            </p>
          </Reveal>
          <div className="grid grid--3 grid--ligne-mob">
            <CarteMurs picto={PICTOS_MURS.boutique} titre="Local commercial"
              lien={{ href: "/murs-commerciaux/local-commercial/", libelle: "Vendre un local commercial" }}>
              Boutique, restaurant ou agence en pied d’immeuble, à Paris et dans les centres-villes. Loué à
              une enseigne ou à un commerçant, ou libre.
            </CarteMurs>
            <CarteMurs picto={PICTOS_MURS.entrepot} titre="Entrepôt et local d’activité"
              lien={{ href: "/murs-commerciaux/entrepot/", libelle: "Vendre un entrepôt" }}>
              Entrepôt, atelier ou local mixte en zone d’activité. Les acheteurs regardent l’accès poids
              lourds, la hauteur sous plafond et le bail.
            </CarteMurs>
            <CarteMurs picto={PICTOS_MURS.retail} titre="Retail park"
              lien={{ href: "/murs-commerciaux/retail-park/", libelle: "Vendre un retail park" }}>
              Ensemble de moyennes surfaces en périphérie, avec parking. Une vente à des investisseurs
              avertis, sur des baux longs.
            </CarteMurs>
          </div>
        </div>
      </section>

      <section className="section section--creme">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>Comment nous estimons</Eyebrow>
            <h2>La valeur de vos murs, <span className="accent">lue comme un investisseur</span></h2>
            <p className="lead">
              Un local commercial se vend sur son loyer et sur la confiance qu’on a dans ce loyer. Nous
              regardons quatre choses.
            </p>
          </Reveal>
          <div className="grid grid--2 grid--ligne-mob">
            <CarteMurs picto={PICTOS_MURS.rue} titre="L’emplacement">
              La rue, son passage, les enseignes voisines et la commercialité du quartier.
            </CarteMurs>
            <CarteMurs picto={PICTOS_MURS.bail} titre="Le locataire et le bail">
              L’activité, l’ancienneté, la durée restante, le loyer face au marché, la taxe foncière
              refacturée ou non.
            </CarteMurs>
            <CarteMurs picto={PICTOS_MURS.local} titre="Le local">
              Le linéaire de vitrine, le rez-de-chaussée et le sous-sol, l’extraction, la réserve, le
              classement ERP.
            </CarteMurs>
            <CarteMurs picto={PICTOS_MURS.rendement} titre="Le rendement attendu">
              Celui que les investisseurs demandent dans votre ville, pour ce locataire et ce bail. Un local
              libre s’estime sur sa valeur locative.
            </CarteMurs>
          </div>
        </div>
      </section>

      <section className="section section--noir paris-ventes-sec region-sec--noir">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>Comment nous vendons</Eyebrow>
            <h2>Vendus <span className="accent">sans annonce</span>, à des investisseurs</h2>
            <p className="lead">
              Votre local n’est pas mis en ligne. Nous l’envoyons aux acheteurs dont la recherche
              correspond, avec un dossier complet : bail, loyers, taxe foncière, diagnostics. Votre
              locataire n’apprend pas la vente par une annonce.
            </p>
          </Reveal>
          {ventesMurs.length > 0 && (
            <LigneDefilante marches className="paris-ventes-ligne">
              {ventesMurs.map((v) => (
                <article key={v.id} className="vente">
                  <CarteVente v={v} />
                </article>
              ))}
            </LigneDefilante>
          )}
          <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
            <Button href="/murs-commerciaux/biens-vendus/" variant="outline">Voir nos murs vendus</Button>
          </div>
        </div>
      </section>

      <SectionEstimationMurs
        titre={<>Obtenez votre <span className="accent">estimation gratuite</span></>}
        texte="L’adresse, le loyer et le bail suffisent pour lancer l’estimation de vos murs. Elle est gratuite et confidentielle."
      />

      <SectionFaq items={FAQ} titre={<>Vendre des murs commerciaux : <span className="accent">vos questions</span></>} />

      <BoutonFixeMobile href="#estimer" libelle="Estimer mes murs" cible="estimer" />
    </>
  );
}
