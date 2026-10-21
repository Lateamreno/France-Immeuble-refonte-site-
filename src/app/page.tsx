import type { Metadata } from "next";
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
import { SITE } from "@/lib/site";
import { AVIS, BIENS_VENDUS, RECHERCHES } from "@/lib/accueil";

/**
 * Page d'accueil — reprise du WordPress, RECOMPOSÉE.
 *
 * Tout le texte vient de `content/pages-wp.json`, au mot près. Title, meta et
 * H1 restent gelés au caractère près (CLAUDE.md §10 et §16).
 */
export const metadata: Metadata = metadonneesWP("/");

export default function Accueil() {
  return (
    <>
      <HeroMedia image={VISUELS.facadeCoucher.src} alt={VISUELS.facadeCoucher.alt}>
        <>
          <Eyebrow>Vente en bloc &middot; Off-market</Eyebrow>
          {/* H1 gelé au caractère près — §10. */}
          <h1>L’agence dédiée aux immeubles</h1>
          <p className="lead">
            Estimation et commercialisation conçues pour les immeubles.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>Estimer mon immeuble</Button>
            <Button href={SITE.telHref} variant="outline">{SITE.tel}</Button>
          </div>

          {/* Les trois compteurs étaient au troisième écran, un par écran.
              Ils disent ce que le réseau cherche : c'est la preuve du site. */}
          <div className="hero-proof">
            {RECHERCHES.map((r) => (
              <div className="hero-proof__item" key={r.val}>
                <span className="hero-proof__val">{r.val}</span>
                <span className="hero-proof__lbl">{r.lbl}</span>
              </div>
            ))}
          </div>
        </>
      </HeroMedia>

      <section className="section section--creme">
        <div className="container split">
          <Reveal>
            <Eyebrow>Vendre</Eyebrow>
            <h2>Vendez votre immeuble au meilleur prix</h2>
            <p className="lead" style={{ marginTop: "var(--space-s)" }}>
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
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="#estimer" icone>Estimer mon immeuble</Button>
              <Button href="/vendre-un-immeuble/" variant="ghost-dark">En savoir plus</Button>
            </div>
          </Reveal>

          <Reveal delayIndex={1} className="media-colonne">
            <Image
              src="/media/05_Notebook-Mock-up-1.webp"
              alt="Dossier d’estimation France Immeuble"
              width={700}
              height={700}
              sizes="(max-width: 900px) 100vw, 540px"
            />
          </Reveal>
        </div>
      </section>

      <section id="estimer" className="section section--noir">
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Première étape</Eyebrow>
            <h2>Obtenez votre estimation gratuite</h2>
            <p className="lead">
              Quelques informations sur le bien, et nous revenons vers vous sous 48&nbsp;h avec une
              fourchette argumentée.
            </p>
            <p className="small muted" style={{ marginTop: "var(--space-s)" }}>
              Désolé, face à l&apos;augmentation des demandes, nous ne sommes actuellement plus en
              mesure de prendre en charge les immeubles de province hors préfectures.
            </p>
          </Reveal>
          <EstimationForm />
        </div>
      </section>

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Notre réseau</Eyebrow>
            <h2>Notre réseau d’acheteurs d’immeubles</h2>
            <p className="lead">Nos clients recherchent actuellement&nbsp;:</p>
          </Reveal>

          <div className="grid grid--3">
            {RECHERCHES.map((r, i) => (
              <Reveal key={r.val} as="article" className="card" delayIndex={i}>
                <span className="stat-number">{r.val}</span>
                <span className="stat-label" style={{ marginTop: 6, display: "block" }}>
                  {r.lbl}
                </span>
                <p style={{ marginTop: "var(--space-xs)" }}>{r.txt}</p>
              </Reveal>
            ))}
          </div>

          <div className="btn-row" style={{ marginTop: "var(--space-l)" }}>
            <Button href="#estimer" icone>Vendre mon immeuble</Button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Biens vendus</Eyebrow>
            <h2>Immeubles vendus par France Immeuble</h2>
          </Reveal>

          <div className="biens">
            {BIENS_VENDUS.map((b, i) => (
              <Reveal key={b.ville + b.prix} as="article" className="bien" delayIndex={i}>
                <Image
                  className="bien__img"
                  src={b.image}
                  alt={`Immeuble vendu à ${b.ville}`}
                  width={520}
                  height={650}
                  sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw"
                />
                <span className="bien__voile" aria-hidden="true" />
                <div className="bien__texte">
                  <span className="bien__ville">{b.ville}</span>
                  <dl className="bien__infos">
                    <div><dt>Surface carrez</dt><dd>{b.surface}</dd></div>
                    <div><dt>Destination</dt><dd>{b.destination}</dd></div>
                    <div><dt>Occupation</dt><dd>{b.occupation}</dd></div>
                    <div><dt>Prix de vente</dt><dd>{b.prix}</dd></div>
                  </dl>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--creme">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Ils nous font confiance</Eyebrow>
            <h2>Témoignages</h2>
            <p className="lead">
              Ils ont choisi France Immeuble pour acheter ou vendre leurs immeubles, retrouvez tous
              leurs avis et découvrez pourquoi ils nous font confiance.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="#estimer" icone>Estimez mon immeuble</Button>
            </div>
          </Reveal>

          <div className="avis">
            {AVIS.map((a, i) => (
              <Reveal key={a.nom} as="article" className="avis__item" delayIndex={i}>
                <span className="avis__etoiles" aria-label="5 étoiles sur 5">★★★★★</span>
                <p>{a.texte}</p>
                <footer>
                  <span className="avis__nom">{a.nom}</span>
                  <span className="avis__date">{a.date}</span>
                </footer>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--noir-3">
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

          <Reveal delayIndex={1} className="media-colonne">
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

      <section className="section section--noir">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Acheter</Eyebrow>
            <h2>Les offres France Immeuble</h2>
          </Reveal>

          <div className="grid grid--2">
            <Reveal as="article" className="card">
              <span className="card__picto" aria-hidden="true">
                <Picto nom="dossier" taille={28} />
              </span>
              <h3>Je souhaite acheter un immeuble</h3>
              <p>
                Recherchez selon des <strong>critères spécifiques aux immeubles</strong> ou créez
                une alerte pour être averti des prochaines ventes en{" "}
                <strong>avant-première</strong>. Étudiez chaque immeuble grâce à un{" "}
                <strong>dossier complet et structuré</strong> et échangez avec un{" "}
                <strong>interlocuteur spécialisé</strong>.
              </p>
              <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
                <Button href="/acheter-un-immeuble/" variant="outline">
                  Rechercher un immeuble
                </Button>
              </div>
            </Reveal>

            <Reveal as="article" className="card card--offmarket" delayIndex={1}>
              <Eyebrow bare>Les offres off-market</Eyebrow>
              <h3>Nos biens d’exception</h3>
              <p>
                Les meilleurs immeubles se vendent en quelques heures. Pour ne pas les rater, créez
                votre alerte off market et disposez de <strong>48h d’avance</strong> sur les
                prochains immeubles à vendre.
              </p>
              <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
                <Button href="/acheter-un-immeuble/" icone>Créer une alerte</Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--noir-2">
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
          <ContactForm />
        </div>
      </section>
    </>
  );
}
