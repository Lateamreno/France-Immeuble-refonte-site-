import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeroMedia } from "@/components/HeroMedia";
import { BandeMedia } from "@/components/BandeMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Avis } from "@/components/Avis";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import { ContactForm } from "@/components/ContactForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { metadonneesWP } from "@/components/ContenuWP";
import { VISUELS } from "@/lib/visuels";
import { SITE, nombre } from "@/lib/site";
import { chiffres } from "@/lib/chiffres";
import { LigneDefilante } from "@/components/LigneDefilante";

/**
 * /vendre-un-immeuble/ — page reprise du WordPress, RECOMPOSÉE.
 *
 * Texte repris mot pour mot de `content/pages-wp.json`.
 *
 * Un bug de la version précédente disparaît ici : l'ancien thème superposait
 * en absolu, sur l'image de chaque étape, un calque portant le titre et le
 * numéro. Sans ce CSS, les calques revenaient dans le flux et CHAQUE ÉTAPE
 * affichait son titre deux fois (« Parlons-nous » puis « Parlons-nous »,
 * « 1/4 » puis « 1 »). La recomposition ne garde qu'une occurrence.
 */
export const metadata: Metadata = metadonneesWP("/vendre-un-immeuble/");

/* Les illustrations sont celles de l'ancien site, reprises à la demande de MAV
   (22/10/2026) : cartes de visite, calculatrice, loupe, ordinateur. */
const ETAPES = [
  {
    num: "1/4",
    image: "/media/img-carte-3.webp",
    titre: "Parlons-nous",
    texte: "Faites-nous part de votre projet en ligne, par mail ou par téléphone",
  },
  {
    num: "2/4",
    image: "/media/img-carte-2.webp",
    titre: "Estimation",
    texte:
      "Nous déterminons le prix de vente maximum de votre immeuble selon ses atouts et le type d’acheteurs ciblé",
  },
  {
    num: "3/4",
    image: "/media/img-carte-1.webp",
    titre: "Commercialisation",
    texte:
      "Grâce à nos outils spécifiques et à notre réseau, nous trouvons le meilleur acheteur pour votre immeuble",
  },
  {
    num: "4/4",
    image: "/media/img-carte.webp",
    titre: "Finalisation de la vente",
    texte:
      "Nous vous accompagnons dans les négociations puis nous occupons de toutes les démarches jusqu’à la vente",
  },
];

/**
 * Les six atouts, en cartes noires à photo fondue (MAV, 26/10/2026). Les
 * photos ont été choisies d'après le texte de chaque carte, pas son titre :
 *   constructibilite  une main tient le stylo sur un plan : le calcul du
 *                     constructible (Pexels, 1109541)
 *   commercialisation un acheteur annote son dossier, stylo à la main
 *                     (Pexels, 3760514)
 *   conseils          un conseiller montre un dossier à son client
 *                     (Pexels, 6285115)
 *   meilleur-prix     deux mains qui se serrent dans la rue, manches de
 *                     costume et poignet de chemise (Pexels, 4963445)
 *   agents            un agent en costume accueille un couple et lui serre
 *                     la main (Pexels, 8112160). Remplace la photo de
 *                     l'équipe, conservée dans l'historique git.
 *   reseau            des écrans de suivi allumés dans le noir (Pexels, 35296240)
 * Licences Unsplash et Pexels : usage commercial libre, sans mention.
 * Le nombre d'acheteurs est celui que le BO dépose dans `chiffres`.
 */
function atouts(acheteurs: number): { picto: NomPicto; photo: string; titre: string; texte: string }[] {
  return [
    {
      picto: "constructibilite",
      photo: "/media/atouts/constructibilite-stylo.webp",
      titre: "Etude de constructibilité offerte",
      texte:
        "Nous calculons avec précision la surface constructible sur votre terrain et à quel prix un promoteur peut l’acheter.",
    },
    {
      picto: "dossierCible",
      photo: "/media/atouts/commercialisation-dossier.webp",
      titre: "Commercialisation optimisée",
      texte:
        "Nos dossiers sont conçus pour les immeubles et adaptés au type d’acheteur ciblé pour faciliter leur prise de décision.",
    },
    {
      picto: "bulles",
      photo: "/media/atouts/conseils-rendez-vous.webp",
      titre: "Conseils et un suivi complet",
      texte:
        "Nos conseillers sont à votre disposition pour tout conseil sur les sujets propres aux immeubles avant, pendant et après la vente.",
    },
    {
      picto: "euro",
      photo: "/media/atouts/meilleur-prix-poignee-rue.webp",
      titre: "Le meilleur prix pour votre immeuble",
      texte:
        "Nous trouvons parmi notre réseau d’investisseurs privés, de foncières, de family offices, de marchands de biens et d’institutionnels le meilleur acheteur pour votre immeuble.",
    },
    {
      picto: "business",
      photo: "/media/atouts/agents-accueil-haut.webp",
      titre: "Agents spécialisés",
      texte:
        "Nos agents basés à Paris sont formés pour répondre aux exigences des acheteurs d’immeubles et défendre au mieux vos intérêts.",
    },
    {
      picto: "reseau",
      photo: "/media/atouts/reseau-ecrans.webp",
      titre: "Un réseau en recherche constante",
      texte: `${nombre(acheteurs)} acheteurs en recherche active d’immeubles : investisseurs privés, foncières, family offices, institutionnels, marchands de biens, promoteurs immobiliers…`,
    },
  ];
}

export default async function VendreUnImmeuble() {
  const ch = await chiffres();
  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Vendre un immeuble", url: "/vendre-un-immeuble/" },
        ])}
      />

      <HeroMedia image={VISUELS.facadeCoucher.src} alt={VISUELS.facadeCoucher.alt}>
        <>
          <Eyebrow>Vendre un immeuble &middot; Valorisation</Eyebrow>
          <h1>
            Vendez votre immeuble <span className="accent">au meilleur prix</span>
          </h1>
          <p className="lead">
            France Immeuble estime, valorise et trouve le meilleur acheteur pour votre immeuble.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>Vendre mon immeuble</Button>
            <Button href={SITE.telHref} variant="outline">Être rappelé.e</Button>
          </div>
        </>
      </HeroMedia>

      {/* Les deux portes d'entrée : estimer, ou chercher un acquéreur. Chaque
          carte entière est un lien (MAV, 22/10/2026) : l'estimation mène à la
          page Estimer, la recherche d'acquéreur au formulaire de vente plus
          bas. L'immeuble détouré casse l'aplat crème. */}
      <section className="section section--creme">
        <div className="container">
          <Reveal className="portes__visuel">
            <Image
              src="/media/img-vendez222-2.webp"
              alt="Immeuble de rapport parisien d’angle, façade en pierre et brique"
              width={900}
              height={437}
              sizes="(max-width: 700px) 100vw, 620px"
            />
          </Reveal>
          <div className="grid grid--2">
            <Reveal as="article" className="card card--medaillon">
              <span className="card__fond" aria-hidden="true">
                <Picto nom="calculatrice" taille={96} />
              </span>
              <span className="card__picto" aria-hidden="true">
                <Picto nom="calculatrice" taille={30} />
              </span>
              <h2>
                <Link href="/estimer-un-immeuble/" className="card__lien">
                  Vous souhaitez connaître la valeur de votre immeuble&nbsp;?
                </Link>
              </h2>
              <p>
                Obtenez une estimation gratuite et sans engagement basée sur l’aspect général,
                géographique et locatif de votre immeuble ainsi que sur son caractère
                constructible pour une valorisation optimale.
              </p>
            </Reveal>
            <Reveal as="article" className="card card--medaillon" delayIndex={1}>
              <span className="card__fond" aria-hidden="true">
                <Picto nom="poignee" taille={96} />
              </span>
              <span className="card__picto" aria-hidden="true">
                <Picto nom="poignee" taille={30} />
              </span>
              <h2>
                <a href="#estimer" className="card__lien">
                  Vous cherchez un acquéreur pour votre immeuble&nbsp;?
                </a>
              </h2>
              <p>
                Nous trouvons parmi notre réseau d’investisseurs privés, de foncières, de family
                offices, de marchands de biens et d’institutionnels le meilleur acheteur pour
                votre immeuble.
              </p>
            </Reveal>
          </div>
          <div className="btn-row" style={{ marginTop: "var(--space-l)" }}>
            <Button href="#estimer" icone>Vendre mon immeuble</Button>
          </div>
        </div>
      </section>

      <section className="section section--noir-2">
        <div className="container split split--sticky">
          <Reveal className="split__aside">
            <Eyebrow>La méthode</Eyebrow>
            <h2>Comment ça fonctionne&nbsp;?</h2>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="#estimer" icone>Vendre mon immeuble</Button>
            </div>
          </Reveal>

          <div className="steps">
            {ETAPES.map((e, i) => (
              <Reveal key={e.num} as="article" className="step step--illustre" delayIndex={i}>
                <span className="step__dot" aria-hidden="true" />
                <span className="step__visuel" aria-hidden="true">
                  <Image src={e.image} alt="" width={445} height={390} sizes="150px" />
                </span>
                <span className="step__num">{e.num}</span>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <BandeMedia image={VISUELS.toitsAeriens.src} alt={VISUELS.toitsAeriens.alt}>
        <h2>Pourquoi vendre avec France Immeuble&nbsp;?</h2>
      </BandeMedia>

      <section className="section section--creme">
        <div className="container">
          <LigneDefilante className="atouts">
            {atouts(ch.investisseurs).map((a) => (
              <article key={a.titre} className="atout">
                <span className="atout__photo" aria-hidden="true">
                  <Image src={a.photo} alt="" fill sizes="(max-width: 760px) 80vw, 400px" />
                </span>
                <Picto nom={a.picto} taille={54} className="atout__picto" />
                <h3>{a.titre}</h3>
                <span className="atout__filet" aria-hidden="true" />
                <p>{a.texte}</p>
              </article>
            ))}
          </LigneDefilante>
          <div className="btn-row" style={{ marginTop: "var(--space-l)" }}>
            <Button href="#estimer" icone>Vendre mon immeuble</Button>
          </div>
        </div>
      </section>

      {/* Les avis arrivent juste avant le formulaire : c'est le moment ou le
          vendeur hesite, pas en bas de page une fois decide. Trois suffisent,
          la page d'accueil porte les douze. */}
      <Avis
        titre="Ce qu'en disent les vendeurs"
        compact
        fond="noir-2"
        intro="Des propriétaires qui nous ont confié la vente de leur immeuble de rapport."
      />

      <section id="estimer" className="section section--noir">
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Première étape</Eyebrow>
            <h2>Obtenez votre estimation gratuite</h2>
            <p className="lead">
              Quelques informations sur le bien, et nous revenons vers vous sous 48&nbsp;h avec une
              fourchette argumentée.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href={SITE.telHref} variant="outline">
                Préférer le téléphone · {SITE.tel}
              </Button>
            </div>
          </Reveal>
          <EstimationForm formulaire="vendre" />
        </div>
      </section>

      <section className="section section--noir-3">
        <div className="container split">
          <Reveal>
            <Eyebrow>Contact</Eyebrow>
            <h2>Besoin d’un conseil&nbsp;?</h2>
            <p className="lead">
              Un immeuble à vendre ou à acheter&nbsp;? Nous répondons à toutes vos questions.
            </p>
            <ul className="fiche-contact">
              <li>
                <Picto nom="telephone" taille={20} />
                <span>
                  <span className="fiche-contact__lbl">Téléphone</span>
                  <a href={SITE.telHref}>{SITE.tel}</a>
                </span>
              </li>
              <li>
                <Picto nom="mail" taille={20} />
                <span>
                  <span className="fiche-contact__lbl">Email</span>
                  <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                </span>
              </li>
            </ul>
          </Reveal>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
