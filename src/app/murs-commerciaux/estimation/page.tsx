import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { SectionFaq, type QR } from "@/components/SectionFaq";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { CarteMurs, HeroMurs, PICTOS_MURS, SectionEstimationMurs } from "@/components/murs/communs";
import { chiffres as lesChiffres } from "@/lib/chiffres";

/**
 * /murs-commerciaux/estimation/ : estimer des murs commerciaux (MAV, 20 et 22/11/2026). Le menu
 * « Estimer un local commercial », « un entrepôt », « un retail park » y mène avec le type déjà
 * choisi (`?type=`). Sur l'aperçu seulement : hors index et hors sitemap jusqu'à l'accord de MAV.
 */
export const metadata: Metadata = {
  title: "Estimer des murs commerciaux gratuitement",
  description:
    "Estimation gratuite et confidentielle de vos murs commerciaux : local commercial, entrepôt ou retail park, loué ou libre, au rendement qu’attendent les investisseurs.",
  robots: { index: false, follow: false },
};

const FAQ: QR[] = [
  {
    question: "Que faut-il pour estimer des murs commerciaux ?",
    texte:
      "L’adresse, la surface, le loyer et le bail suffisent pour une première estimation. Pour l’affiner, votre agent vous demandera le bail et ses avenants, le dernier avis de taxe foncière et, si le local est en copropriété, les derniers procès-verbaux d’assemblée générale.",
  },
  {
    question: "Un local loué vaut-il plus qu’un local libre ?",
    texte:
      "Souvent, quand le locataire est solide et le loyer au niveau du marché : l’investisseur achète un revenu immédiat. Un loyer trop haut pour la rue, un bail qui finit bientôt ou une activité fragile font baisser le prix. Un local libre se vend sur sa valeur locative, en tenant compte du temps de la mise en location.",
  },
  {
    question: "L’estimation est-elle vraiment gratuite ?",
    texte:
      "Oui. Elle est gratuite, confidentielle et ne vous engage pas à vendre. Votre locataire n’en est pas informé.",
  },
];

export default async function EstimerDesMurs() {
  const ch = await lesChiffres();
  return (
    <>
      <HeroMurs
        surtitre="Estimer des murs commerciaux"
        chiffres={ch}
        lead={
          <>
            Local commercial, entrepôt ou retail park, loué ou libre : nous estimons vos murs au
            rendement qu’attendent les investisseurs, à partir du loyer, du bail et de l’emplacement.
            L’estimation est gratuite et confidentielle.
          </>
        }
      >
        Le prix de vos <span className="accent">murs commerciaux</span>, vu par ceux qui les achètent
      </HeroMurs>

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head tete-2col">
            <Eyebrow>Ce que nous regardons</Eyebrow>
            <h2>Quatre lectures pour <span className="accent">un seul prix</span></h2>
            <p className="lead">
              Le prix de murs commerciaux, c’est un loyer et le rendement qu’un investisseur accepte pour
              ce loyer. Chacune de ces quatre lectures le fait monter ou baisser.
            </p>
          </Reveal>
          <div className="grid grid--2 grid--ligne-mob">
            <CarteMurs picto={PICTOS_MURS.rue} titre="La rue">
              Le passage devant la vitrine, les enseignes voisines, la commercialité du quartier et ce qui
              va changer autour.
            </CarteMurs>
            <CarteMurs picto={PICTOS_MURS.bail} titre="Le bail">
              La durée restante, le loyer face au marché, les charges et la taxe foncière refacturées, les
              clauses qui rassurent ou inquiètent un acheteur.
            </CarteMurs>
            <CarteMurs picto={PICTOS_MURS.local} titre="Le local">
              La surface utile, le linéaire de vitrine, le sous-sol et la réserve, l’extraction, le
              classement ERP, l’état.
            </CarteMurs>
            <CarteMurs picto={PICTOS_MURS.rendement} titre="Le rendement">
              Celui que nos acheteurs demandent aujourd’hui pour ce type de murs, dans votre ville, avec ce
              locataire.
            </CarteMurs>
          </div>
        </div>
      </section>

      <SectionEstimationMurs
        titre={<>Lancez votre <span className="accent">estimation gratuite</span></>}
        texte="Le type de bien, l’adresse et quelques mots sur le loyer et le bail suffisent. Un agent vous rappelle pour l’affiner."
      />

      <SectionFaq items={FAQ} titre={<>Estimer des murs commerciaux : <span className="accent">vos questions</span></>} />

      <BoutonFixeMobile href="#estimer" libelle="Estimer mes murs" cible="estimer" />
    </>
  );
}
