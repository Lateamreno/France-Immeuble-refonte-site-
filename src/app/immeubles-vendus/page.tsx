import type { Metadata } from "next";
import Image from "next/image";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Avis } from "@/components/Avis";
import { Reveal } from "@/components/Reveal";
import { Picto } from "@/components/Picto";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { metadonneesWP } from "@/components/ContenuWP";
import { VISUELS } from "@/lib/visuels";
import { SITE } from "@/lib/site";
import { ventesEtStats, villesFrequentes, prix, volume } from "@/lib/biens";

/**
 * /immeubles-vendus/ — les ventes réalisées, servies depuis nos données.
 *
 * Remplace l'iframe Bubble, qui n'exposait aucun contenu indexable : 44 ventes
 * étaient affichées dans un cadre que Google ne lit pas. Les mêmes ventes sont
 * désormais du HTML, avec leurs photos servies depuis notre domaine (§16).
 *
 * Ce qui est publié : commune, département, prix, année. Jamais la rue, jamais
 * un nom — on ne peut pas promettre la discrétion off-market en page Vendre et
 * publier l'adresse ici (§2).
 *
 * Title, meta et canonical restent repris au caractère près (§10).
 */
const CHEMIN = "/immeubles-vendus/";

export const metadata: Metadata = metadonneesWP(CHEMIN);

const REGIONS: Record<string, string> = {
  idf: "Île-de-France",
  "sud-ouest": "Sud-Ouest",
  autre: "Régions",
};

/** Une vente publiée par le BO apparaît sous 10 minutes, sans redéploiement. */
export const revalidate = 600;

export default async function ImmeublesVendus() {
  const { ventes, stats } = await ventesEtStats();
  const villes = villesFrequentes(ventes, 10);

  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Biens vendus", url: CHEMIN },
        ])}
      />

      <HeroMedia image={VISUELS.facadeCoucher.src} alt={VISUELS.facadeCoucher.alt}>
        <>
          <Eyebrow>Nos biens · vendus</Eyebrow>
          <h1>Les immeubles que nous avons vendus</h1>
          <p className="lead">
            Chaque ligne est un acte signé. Commune, année et prix réel&nbsp;— jamais l’adresse,
            jamais un nom.
          </p>
          <div className="hero-proof">
            <span className="hero-proof__item">
              <span className="hero-proof__val">{stats.total}</span>
              <span className="hero-proof__lbl">
                immeubles vendus depuis {stats.premiereAnnee}
              </span>
            </span>
            <span className="hero-proof__item">
              <span className="hero-proof__val">{stats.villes}</span>
              <span className="hero-proof__lbl">communes</span>
            </span>
            <span className="hero-proof__item">
              <span className="hero-proof__val">{volume(stats.volume)}</span>
              <span className="hero-proof__lbl">de transactions</span>
            </span>
          </div>
        </>
      </HeroMedia>

      <section className="section section--creme">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Les ventes</Eyebrow>
            <h2>
              {stats.total} actes signés entre {stats.premiereAnnee} et{" "}
              {stats.derniereAnnee}
            </h2>
            <p className="lead">
              {stats.partIdf}&nbsp;% en Île-de-France, le reste réparti sur{" "}
              {stats.departements} départements. Les montants sont les prix de vente
              honoraires inclus.
            </p>
          </Reveal>

          <ul className="ventes">
            {ventes.map((v, i) => (
              <Reveal key={v.id} as="li" className="vente" delayIndex={i % 6}>
                <span className="vente__visuel">
                  {v.image ? (
                    <Image
                      src={v.image}
                      alt={`Immeuble vendu à ${v.ville}`}
                      width={1200}
                      height={900}
                      sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                      className="vente__img"
                    />
                  ) : (
                    /* Trois photos n'ont pas pu être reprises de l'ancien outil
                       (son serveur répond 401 depuis la coupure). La carte reste
                       complète : le picto tient la place, rien ne se casse. */
                    <span className="vente__sansphoto" aria-hidden="true">
                      <Picto nom="immeubles" taille={40} />
                    </span>
                  )}
                  <span className="vente__annee">{v.annee}</span>
                </span>
                <span className="vente__corps">
                  <span className="vente__ville">
                    {v.ville} <span className="vente__dept">({v.dept})</span>
                  </span>
                  <span className="vente__prix">{prix(v.prix)}</span>
                  <span className="vente__region">{REGIONS[v.region]}</span>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Couverture</Eyebrow>
            <h2>Où nous vendons</h2>
            <p className="lead">
              Les communes où nous avons signé plus d’une fois. Le reste se répartit sur{" "}
              {stats.villes - villes.filter((v) => v.n > 1).length} autres communes.
            </p>
          </Reveal>
          <ul className="villes">
            {villes.map((v) => (
              <li key={v.ville} className="ville">
                <span className="ville__nom">{v.ville}</span>
                {v.n > 1 && <span className="ville__n">{v.n} ventes</span>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Apres la preuve chiffree : les 44 ventes disent ce qu'on a fait, les
          avis disent comment ca s'est passe. */}
      <Avis titre="Ce qu'en disent ceux qui ont signé" compact fond="creme" />

      <section className="section section--noir">
        <div className="container" style={{ textAlign: "center" }}>
          <Reveal>
            <Eyebrow bare>Votre immeuble</Eyebrow>
            <h2>Le prochain sur cette page&nbsp;?</h2>
            <p className="lead" style={{ marginInline: "auto", maxWidth: "52ch" }}>
              Nous estimons gratuitement et commercialisons auprès de notre fichier
              d’acquéreurs, sans annonce publique si vous le souhaitez.
            </p>
            <div
              className="btn-row"
              style={{ marginTop: "var(--space-m)", justifyContent: "center" }}
            >
              <Button href="/estimer-un-immeuble/" icone>
                Estimer mon immeuble
              </Button>
              <Button href={SITE.telHref} variant="outline">
                Être rappelé.e
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
