import type { Metadata } from "next";
import { chiffres } from "@/lib/chiffres";
import { Chiffre } from "@/components/Chiffre";
import Image from "next/image";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import { ContactForm } from "@/components/ContactForm";
import { Picto } from "@/components/Picto";
import { metadonneesWP } from "@/components/ContenuWP";
import { VISUELS } from "@/lib/visuels";
import { SITE, nombre } from "@/lib/site";
import { RECHERCHES } from "@/lib/accueil";
import { ventes, vitrineAccueil } from "@/lib/biens";
import { VitrineAccueil } from "@/components/VitrineAccueil";
import { Avis } from "@/components/Avis";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";

/**
 * Page d'accueil — reprise du WordPress, RECOMPOSÉE.
 *
 * Tout le texte vient de `content/pages-wp.json`, au mot près. Title, meta et
 * H1 restent gelés au caractère près (CLAUDE.md §10 et §16).
 */
export const metadata: Metadata = metadonneesWP("/");

export default async function Accueil() {
  const [ch, toutes] = await Promise.all([chiffres(), ventes()]);
  const vitrine = vitrineAccueil(toutes);
  /* Les trois compteurs de recherches : déposés par le BO (table `chiffres`),
     les textes restent ceux du WordPress. */
  const recherches = [
    { ...RECHERCHES[0], val: nombre(ch.recherchesPatrimonial), picto: "immeubles" as const },
    { ...RECHERCHES[1], val: nombre(ch.recherchesInvestisseur), picto: "financier" as const },
    { ...RECHERCHES[2], val: nombre(ch.recherchesMarchand), picto: "business" as const },
  ];
  return (
    <>
      <HeroMedia image={VISUELS.facadeCoucher.src} alt={VISUELS.facadeCoucher.alt}>
        <>
          <Eyebrow>Vente en bloc &middot; Off-market</Eyebrow>
          {/* H1 gelé au caractère près — §10. */}
          <h1>
            L’agence dédiée aux <span className="accent">immeubles</span>
          </h1>
          <p className="lead">
            Estimation et commercialisation conçues pour les immeubles.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>Estimer mon immeuble</Button>
            <Button href={SITE.telHref} variant="outline">{SITE.tel}</Button>
          </div>

          {/* Trois chiffres qui se comprennent d'un coup d'œil (retour #55,
              MAV, 27/10/2026) : les immeubles traités et les acheteurs viennent
              du BO (table `chiffres`), la
              zone dit où nous vendons, en toutes lettres pour le référencement. */}
          <div className="hero-proof">
            <Chiffre picto="immeubles" valeur={nombre(ch.immeublesTraites)} libelle="immeubles traités" />
            <Chiffre picto="reseau" valeur={nombre(ch.investisseurs)} libelle="acheteurs dans notre réseau" />
            <Chiffre picto="france" valeur="Paris" libelle="Île-de-France et toute la France" />
          </div>
        </>
      </HeroMedia>

      {/* Sur un seul écran (retour #56, MAV, 27/10/2026). */}
      <section className="section section--creme section--ecran accueil-vendre">
        {/* Retour #117 (MAV, 03/11/2026) : une photo d'immeubles à peine visible
            sous le crème, pour que la section ne soit plus un aplat. */}
        <div className="fond-leger" aria-hidden="true">
          <Image src={VISUELS.toitsAeriens.src} alt="" fill sizes="100vw" placeholder="blur" />
        </div>
        <div className="container split">
          <Reveal>
            <Eyebrow>Vendre</Eyebrow>
            <h2>
              Vendez votre immeuble <span className="accent">au meilleur prix</span>
            </h2>
            <p className="lead lead--or" style={{ marginTop: "var(--space-s)" }}>
              Estimation et commercialisation conçues pour les immeubles
            </p>
            <p style={{ marginTop: "var(--space-s)" }}>
              Obtenez une estimation basée sur des critères propres aux immeubles comme la
              rentabilité, l’occupation et le potentiel de surélévation/construction. Suite à cette
              estimation, nous vous accompagnons dans le choix du prix de commercialisation puis
              recherchons parmi notre réseau les acheteurs susceptibles d’être intéressés.
            </p>
            <p style={{ marginTop: "var(--space-s)" }}>
              Une fois identifiés, nous leur transmettons un dossier contenant tous les éléments
              nécessaires à l’étude de votre immeuble. Nous effectuons également les visites et
              gérons les négociations pour vous obtenir la meilleure offre.{" "}
              <strong>
                De l’estimation à l’acte de vente, nos experts vous accompagnent dans la vente de
                votre immeuble.
              </strong>
            </p>
            {/* Au téléphone, les boutons restent au bas de l'écran pendant que le
                texte défile, jusqu'à la section suivante (MAV, 27/10/2026). */}
            <div className="btn-row accueil-vendre__boutons porte-action" style={{ marginTop: "var(--space-m)" }}>
              <Button href="#estimer" icone>Estimer mon immeuble</Button>
              <Button href="/vendre-un-immeuble/" variant="ghost-dark">En savoir plus</Button>
            </div>
          </Reveal>

          {/* Le carnet des témoignages. Le fichier d'origine est coupé à droite :
              l'image va jusqu'au bord de l'écran, la coupe s'y confond (MAV). */}
          <Reveal delayIndex={1} className="media-colonne media-colonne--libre media-colonne--bord accueil-vendre__carnet">
            <Image
              src="/media/carnet-temoignage.webp"
              alt="Carnet France Immeuble ouvert sur le témoignage d’une famille cliente"
              width={800}
              height={820}
              sizes="(max-width: 900px) 100vw, 760px"
              // Retour #79 : chez MAV le carnet ne s'affichait pas. Nom de fichier
              // neutre (« Mock-up » peut être écarté par un bloqueur), fichier servi
              // tel quel (97 Ko) et chargé sans attendre le défilement.
              unoptimized
              loading="eager"
            />
          </Reveal>
        </div>
      </section>

      <section id="estimer" className="section section--noir section--ecran sec-formulaire">
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Première étape</Eyebrow>
            <h2>Obtenez votre estimation gratuite</h2>
            <p className="lead">
              Quelques questions sur votre immeuble suffisent pour lancer son estimation. Elle est
              gratuite et confidentielle.
            </p>
          </Reveal>
          <EstimationForm formulaire="estimer" />
        </div>
      </section>

      <section className="section section--noir-2 reseau-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Notre réseau</Eyebrow>
            <h2>Notre réseau d’acheteurs d’immeubles</h2>
            <p className="lead">Nos clients recherchent actuellement&nbsp;:</p>
          </Reveal>

          {/* Au téléphone, les trois cartes défilent sur une ligne : la section
              tient sur un écran (MAV, 27/10/2026). */}
          {/* Retour #190 : au téléphone, les trois cartes l'une sous l'autre. */}
          <div className="grid grid--3 reseau-grille">
            {recherches.map((r, i) => (
              <Reveal key={r.lbl} as="article" className="card card--filigrane" delayIndex={i}>
                <span className="card__fond" aria-hidden="true">
                  <Picto nom={r.picto} taille={96} />
                </span>
                <span className="stat-number">{r.val}</span>
                <span className="stat-label" style={{ marginTop: 6, display: "block" }}>
                  {r.lbl}
                </span>
                <p style={{ marginTop: "var(--space-xs)" }}>{r.txt}</p>
              </Reveal>
            ))}
          </div>

          <div className="btn-row reseau__suite">
            <Button href="#estimer" icone>Vendre mon immeuble</Button>
          </div>
        </div>
      </section>

      <section className="section vitrine-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Biens vendus</Eyebrow>
            <h2>Immeubles vendus par France Immeuble</h2>
          </Reveal>
        </div>
        {/* Déposées par le BO, comme la page des ventes. Polaroïds en ligne
            (MAV, 25/10/2026) ; les vignettes restent prêtes (forme="vignettes"). */}
        <VitrineAccueil ventes={vitrine} forme="polaroids" />
        <div className="container vitrine__suite">
          <Button href="/immeubles-vendus/">Voir tous nos immeubles vendus</Button>
        </div>
      </section>

      {/* Sur fond sombre comme sur la page Vendre, avec une poignée de main en
          fondu à la place de la photo de Paris (MAV, 22/10/2026). */}
      <Avis
        fond="noir-2"
        photo={{
          src: "/media/temoignages-poignee-de-main.webp",
          alt: "Deux personnes en chemise se serrent la main au terme d’une vente",
          width: 1800,
          height: 1202,
        }}
        intro="Ils ont choisi France Immeuble pour acheter ou vendre leurs immeubles, retrouvez tous leurs avis et découvrez pourquoi ils nous font confiance."
      >
        <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
          <Button href="#estimer" icone>Estimez mon immeuble</Button>
        </div>
      </Avis>

      <section className="section section--noir-3 histoire-sec">
        <div className="container split">
          <Reveal>
            <Eyebrow>Mes références</Eyebrow>
            <h2>Notre histoire</h2>
            <p style={{ marginTop: "var(--space-s)" }}>
              Au cours de ma carrière, j’ai examiné plusieurs centaines d’immeubles. Je me suis
              alors rendu compte qu’il était très compliqué d’obtenir les informations nécessaires
              à la prise de décision, faute d’intermédiaires spécialisés et de dossiers adaptés aux
              immeubles.
            </p>
            <p style={{ marginTop: "var(--space-s)" }}>
              Nous avons donc conçu avec mon associé une méthode et des outils spécifiques à la
              vente d’immeubles pour rendre l’information accessible aux acheteurs et accompagner
              au mieux les vendeurs.
            </p>
            <p style={{ marginTop: "var(--space-s)" }}>
              Forts de cette expertise, les agents France Immeuble font croître chaque jour notre
              réseau d’acheteurs récurrents pour toujours obtenir la meilleure offre à nos clients.
            </p>
            <p className="signature">
              <span className="signature__nom">Marc-Antoine Voci</span>
              <span className="signature__role">Co-fondateur</span>
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="#estimer" icone>Vendre mon immeuble</Button>
            </div>
          </Reveal>

          {/* Au téléphone, la photo passe en fond, fondue : le texte tient sur un écran. */}
          <Reveal delayIndex={1} className="media-colonne media--fond-mob">
            <Image
              src="/media/FRANCE_IMMEUBLE_210922_12_38_15_WEB-1.webp"
              alt="L’équipe France Immeuble"
              width={700}
              height={760}
              sizes="(max-width: 900px) 100vw, 520px"
            />
          </Reveal>
        </div>
      </section>

      {/* Retour #149, option A (MAV, 04/11/2026) : une photo fondue en fond et un
          picto en tête de chaque carte. */}
      <section className="section section--noir offres-sec">
        <span className="offres-sec__fond" aria-hidden="true">
          <Image src={VISUELS.toitsAeriens.src} alt="" fill sizes="100vw" />
        </span>
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Acheter</Eyebrow>
            <h2>Les offres France Immeuble</h2>
          </Reveal>

          <div className="grid grid--2 grid--ligne-mob">
            {/* Les deux cartes ont la même construction (MAV, 22/10/2026) :
                picto, surtitre, titre, texte, bouton, et leurs boutons alignés. */}
            <Reveal as="article" className="card card--offre">
              {/* Retour #95 (MAV, 02/11/2026) : à gauche ce que nous vendons déjà,
                  à droite recevoir en avant-première, confidentiels compris. */}
              <span className="card__picto-tete" aria-hidden="true"><Picto nom="immeubles" taille={44} /></span>
              <Eyebrow>En vente aujourd’hui</Eyebrow>
              <h3>Je souhaite acheter un immeuble</h3>
              <p>
                Parcourez nos immeubles de rapport en vente avec des{" "}
                <strong>critères pensés pour les immeubles</strong> : rendement, occupation, destination, prix.
                Chaque immeuble a son <strong>dossier complet</strong> et un{" "}
                <strong>interlocuteur spécialisé</strong>.
              </p>
              <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
                <Button href="/immeubles-a-vendre/" variant="outline" court="Voir les immeubles">
                  Voir les immeubles en vente
                </Button>
              </div>
            </Reveal>
            <Reveal as="article" className="card card--offre card--offmarket" delayIndex={1}>
              <span className="card__picto-tete" aria-hidden="true"><Picto nom="best" taille={44} /></span>
              <Eyebrow>Les offres off-market</Eyebrow>
              <h3>Nos biens d’exception</h3>
              <p>
                Les meilleurs immeubles partent avant d’être annoncés. Déposez votre recherche et
                recevez <strong>en avant-première</strong> ceux qui y correspondent,{" "}
                <strong>y compris les confidentiels</strong>.
              </p>
              <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
                {/* Retours #176 et #191 (MAV, 04/11/2026). */}
                <Button href="/acheter-un-immeuble/#deposer" icone>Déposer ma recherche</Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--noir-2 contact-sec">
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
            </ul>
          </Reveal>
          <ContactForm titre="Parlez-nous de votre projet" />
        </div>
      </section>
      <BoutonFixeMobile href="#estimer" libelle="Estimer mon immeuble" cible="estimer" />
    </>
  );
}
