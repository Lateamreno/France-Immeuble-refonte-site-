import type { Metadata } from "next";
import { Chiffre } from "@/components/Chiffre";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Avis } from "@/components/Avis";
import { Reveal } from "@/components/Reveal";
import { CarteVente } from "@/components/CarteVente";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { metadonneesWP } from "@/components/ContenuWP";
import { VISUELS } from "@/lib/visuels";
import { SITE } from "@/lib/site";
import { CarteRegion, nomRegion } from "@/components/CarteRegion";
import { ventesEtStats, villesFrequentes, volume, groupesVentes, NOMS_DEPTS_IDF } from "@/lib/biens";

/**
 * /immeubles-vendus/ — les ventes réalisées, servies depuis nos données.
 *
 * Remplace l'iframe Bubble, qui n'exposait aucun contenu indexable : 44 ventes
 * étaient affichées dans un cadre que Google ne lit pas. Les mêmes ventes sont
 * désormais du HTML, avec leurs photos servies depuis notre domaine (§16).
 *
 * Chaque vente mène à sa fiche, /immeubles-vendus/<slug>/, où le BO dépose les
 * faits de la vente et un récit relu par MAV.
 *
 * Ce qui est publié : commune, département, rue sans numéro, prix. Aucune
 * date de vente, tri par région puis par prix (retours de MAV, 21/10/2026).
 * Jamais le numéro, jamais un nom — on ne peut pas promettre la discrétion
 * off-market en page Vendre et publier l'adresse exacte ici (§2).
 *
 * Title, meta et canonical restent repris au caractère près (§10).
 */
const CHEMIN = "/immeubles-vendus/";

export const metadata: Metadata = metadonneesWP(CHEMIN);

/** Une vente publiée par le BO apparaît sous 10 minutes, sans redéploiement. */
export const revalidate = 600;

export default async function ImmeublesVendus() {
  const { ventes, stats } = await ventesEtStats();
  const villes = villesFrequentes(ventes, 10);
  const groupes = groupesVentes(ventes);
  const gIdf = groupes.find((g) => g.region === "11");
  const autres = groupes.filter((g) => g.region !== "11");
  const idf = {
    cle: "idf",
    titre: nomRegion("11"),
    ventes: gIdf ? gIdf.departements.flatMap((d) => d.ventes) : [],
    detail: gIdf ? gIdf.departements.map((d) => (d.dept ? NOMS_DEPTS_IDF[d.dept] : "")).filter(Boolean).join(", ") : "",
  };
  const regions = {
    cle: "regions",
    titre: "En région",
    ventes: autres.flatMap((g) => g.departements.flatMap((d) => d.ventes)),
    detail: autres.map((g) => nomRegion(g.region)).join(", "),
  };

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
          <h1>
            Les immeubles que nous <span className="accent">avons vendus</span>
          </h1>
          <p className="lead">
            Immeubles de rapport vendus en bloc à Paris, en Île-de-France et en région. Voici une
            sélection de nos dernières ventes, avec la commune, la rue et le prix de vente.
          </p>
          {/* MAV, 21/10/2026 : ces chiffres décrivent l'échantillon affiché, pas
              l'ensemble de nos ventes. Les libellés le disent. */}
          <div className="hero-proof">
            <Chiffre picto="immeubles" valeur={stats.total} libelle="ventes présentées" />
            <Chiffre picto="secteur" valeur={stats.villes} libelle="communes" />
            <Chiffre picto="financier" valeur={volume(stats.volume)} libelle="de ventes dans cette sélection" />
          </div>
        </>
      </HeroMedia>

      {/* Sur ordinateur, la liste d'avant (MAV, 27/10/2026 : « c'était pas mal
          comme avant ») : région par région, l'Île-de-France département par
          département, puis du prix le plus élevé au plus modeste. Au
          téléphone, le même contenu se replie en deux lignes qui glissent au
          doigt, l'Île-de-France puis les régions, chacune sur un écran. Un
          seul jeu de cartes dans la page : les mêmes éléments, disposés
          autrement. */}
      {[{ bloc: idf, gs: gIdf ? [gIdf] : [] }, { bloc: regions, gs: autres }]
        .filter((x) => x.gs.length > 0)
        .map(({ bloc, gs }, k) => (
          <section key={bloc.cle} className="section section--creme region-sec">
            <div className="container">
              {k === 0 && (
                <Reveal className="section__head region-sec__intro">
                  <Eyebrow>Les ventes</Eyebrow>
                  <h2>Un échantillon de nos dernières ventes</h2>
                  <p className="lead">
                    Classées par région, l’Île-de-France département par département, puis du prix le
                    plus élevé au plus modeste. Les montants sont des prix de vente honoraires inclus.
                  </p>
                </Reveal>
              )}
              <p className="region-sec__mob" aria-hidden="true">
                <span className="region-sec__mob-titre">{bloc.titre}</span>
                <span className="region-sec__mob-n">
                  {bloc.ventes.length} vente{bloc.ventes.length > 1 ? "s" : ""} · {bloc.detail}
                </span>
              </p>
              <div className="ventes-flux">
                {gs.map((g) => (
                  <section key={g.region} className="region-ventes" aria-labelledby={`region-${g.region}`}>
                    <header className="region-ventes__tete">
                      <div>
                        <h2 id={`region-${g.region}`}>{nomRegion(g.region)}</h2>
                        <p className="region-ventes__n">
                          {g.total} vente{g.total > 1 ? "s" : ""} présentée{g.total > 1 ? "s" : ""}
                        </p>
                      </div>
                      <CarteRegion region={g.region} className="region-ventes__carte" />
                    </header>
                    {g.departements.map((d) => (
                      <div key={d.dept ?? "tous"} className="region-ventes__dept">
                        {d.dept && (
                          <h3>
                            {NOMS_DEPTS_IDF[d.dept]} <span>({d.dept})</span>
                          </h3>
                        )}
                        <ul className="ventes">
                          {d.ventes.map((v, i) => (
                            <Reveal key={v.id} as="li" className="vente" delayIndex={i % 6}>
                              <CarteVente v={v} />
                            </Reveal>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            </div>
          </section>
        ))}

      <section className="section section--noir-2">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Couverture</Eyebrow>
            <h2>Où nous vendons</h2>
            <p className="lead">Les communes qui reviennent le plus souvent dans cette sélection.</p>
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
