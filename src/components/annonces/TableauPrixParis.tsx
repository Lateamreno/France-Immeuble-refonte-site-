import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { Fiabilite, Relance } from "@/components/annonces/arguments";
import { rang, type DonneesPrixParis } from "@/lib/prix-paris";
import { nombre } from "@/lib/site";

const pc = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** « −35 % », « +4 % » : un vrai signe moins et une espace insécable avant le signe pour cent. */
const ecartPct = (n: number) => `${n < 0 ? "−" : n > 0 ? "+" : ""}${Math.abs(n)} %`;

/**
 * Combien vaut un immeuble dans mon arrondissement ? Le tableau de la page Paris, cinq colonnes
 * (lots 108 à 112), sorti de sa page au lot 140 pour servir aussi à la page des annonces sur les
 * prix. `secondBouton` : le lien vers les ventes une par une, que les pages des annonces n'ont pas.
 */
export function TableauPrixParis({ donnees, secondBouton = true }: { donnees: DonneesPrixParis; secondBouton?: boolean }) {
  const {
    annee, lignes, moinsCher, plusCher, totalImmeubles, avecRdt, avecDecote, etendueDecote,
    rendementParis, millesime, releveEn, tableau, colonnesChiffres,
  } = donnees;
  if (!tableau) return null;
  return (
    <section className="section section--creme paris-prix-sec" id="prix-par-arrondissement">
      <div className="container paris-prix">
        <Reveal className="section__head paris-prix__tete">
          <Eyebrow>Notre étude des ventes d’immeubles de rapport</Eyebrow>
          <h2>
            Prix au&nbsp;m² des <span className="accent">immeubles à Paris</span>, par arrondissement
          </h2>
          {/* Retour #322 : nous avons étudié ces ventes nous-mêmes ; les deux prix suivent le tableau. */}
          <p className="lead">
            Pour affiner nos estimations et informer nos clients, nous avons étudié nous-mêmes les
            ventes d’immeubles en bloc enregistrées dans DVF, la base publique des ventes
            immobilières.
            {moinsCher && plusCher && moinsCher.n !== plusCher.n ? (
              <>
                {" "}À Paris en {annee}, le prix médian va de {nombre(moinsCher.prix)}&nbsp;€/m² dans le{" "}
                {rang(moinsCher.n)} à {nombre(plusCher.prix)}&nbsp;€/m² dans le {rang(plusCher.n)}.
              </>
            ) : null}
          </p>
        </Reveal>

        <div className="paris-prix__tableau">
          <table>
            {/* Retour #324 : un titre d'une ligne ; au téléphone, « par arrondissement » n'est que lu. */}
            <caption>
              Prix au&nbsp;m² des immeubles à Paris en {annee}
              <span className="paris-prix__long">, par arrondissement</span>
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="paris-prix__long">Arrondissement</span>{" "}
                  <span className="paris-prix__court" aria-hidden="true">Arr.</span>
                </th>
                {/* MAV, 14/11/2026 : « les mêmes titres sur PC que sur téléphone […] que ça tienne sur
                    une ligne ». Le libellé court s'affiche partout ; le long n'est plus que lu. */}
                <th scope="col" className="paris-prix__tete-med">
                  <span className="sr-only">Prix médian au&nbsp;m²</span>
                  <span aria-hidden="true">Prix médian</span>
                </th>
                {avecDecote && (
                  <th scope="col">
                    <span className="sr-only">Décote face aux appartements</span>
                    <span aria-hidden="true">Décote</span>
                  </th>
                )}
                <th scope="col">Fiabilité</th>
                {/* « Théorique » reste écrit au téléphone aussi : on ne le prend pas pour un rendement réel. */}
                {avecRdt && <th scope="col">Rendement <br className="paris-prix__rupture" />théorique</th>}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.n} id={`arr-${l.n}`} className={l.prix == null ? "paris-prix__peu" : undefined}>
                  <th scope="row">
                    {rang(l.n)}
                    <span className="paris-prix__long"> arrondissement</span>
                  </th>
                  {l.prix != null ? (
                    <>
                      <td className="paris-prix__med">{nombre(l.prix)}&nbsp;€</td>
                      {avecDecote && <td className="paris-prix__dec">{l.decote != null ? ecartPct(l.decote) : "–"}</td>}
                      <td className="paris-prix__fiab">{l.fiabilite != null ? <Fiabilite note={l.fiabilite} /> : "–"}</td>
                      {avecRdt && <td className="paris-prix__rdt">{l.rdt != null ? `${pc(l.rdt)} %` : "–"}</td>}
                    </>
                  ) : (
                    <td colSpan={colonnesChiffres}>
                      {l.connu ? `Moins de trois ventes en ${annee}` : `Chiffres de ${annee} non disponibles`}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Retour #304 : le calcul et les sources repliés, sans dire que les chiffres se mettent à jour seuls. */}
          <details className="paris-prix__calcul">
            <summary>Le détail du calcul et nos sources</summary>
            {/* Lot 124 (MAV, 15/11/2026, sur le baromètre : « Ils ont pas besoin de savoir tout ça ») :
                l'essentiel du calcul, sans la liste des règles. Le calcul ne change pas. */}
            <p>
              Les prix viennent de DVF, la base des ventes immobilières publiée par l’État sur
              data.gouv.fr. Nous n’en gardons que les ventes d’immeubles de plus de cinq logements
              ({nombre(totalImmeubles)} à Paris en {annee}), et nous écartons celles qui fausseraient le prix
              au&nbsp;m², comme les échanges ou les ventes aux enchères. Un prix n’est donné qu’à partir de
              trois ventes.
            </p>
            {avecDecote && (
              <p>
                La décote compare ce prix à celui des appartements vendus seuls dans le même
                arrondissement, la même année.
              </p>
            )}
            <p>
              Les étoiles disent si le prix est solide&nbsp;: trois quand les ventes sont nombreuses et
              leurs prix proches les uns des autres, une quand elles sont rares ou très dispersées.
            </p>
            {avecRdt && (
              <p>
                Le rendement théorique rapporte au prix médian le loyer de marché des appartements
                (carte des loyers de l’ANIL{millesime ? ` ${millesime}` : ""}, charges comprises).
              </p>
            )}
            <p>
              Ventes de {annee}{releveEn ? `, relevées en ${releveEn}` : ""}.
            </p>
          </details>
        </div>

        <div className="paris-prix__notes">
          {avecDecote ? (
            <p>
              <strong>Décote.</strong> L’écart entre le prix médian au&nbsp;m² des immeubles vendus en
              bloc et celui des appartements vendus seuls, dans le même arrondissement, la même année.
              {etendueDecote && (
                <>
                  {" "}En {annee}, elle va de {etendueDecote.min.pct}&nbsp;% dans le{" "}
                  {rang(etendueDecote.min.n)} à {etendueDecote.max.pct}&nbsp;% dans le{" "}
                  {rang(etendueDecote.max.n)}.
                </>
              )}{" "}
              D’après notre expérience, elle est le plus souvent de 10 à 30&nbsp;%, selon l’état de
              l’immeuble et le niveau de ses loyers.
            </p>
          ) : (
            /* Sans les prix des appartements en base : la note d'avant le lot 110, sans colonne à expliquer. */
            <p>
              <strong>De 10 à 30&nbsp;% de décote.</strong> Entre un immeuble vendu en bloc et le prix des
              appartements, la décote est le plus souvent de 10 à 30&nbsp;%. Elle varie selon
              l’arrondissement, l’état de l’immeuble et les loyers réellement pratiqués.
            </p>
          )}
          <p>
            <strong>Fiabilité.</strong> D’une à trois étoiles&nbsp;: la note est haute quand les ventes
            de l’arrondissement sont nombreuses et leurs prix proches les uns des autres. Avec une
            seule étoile, le prix est à lire avec prudence.
          </p>
          <p>
            <strong>Un rendement de {rendementParis} en général.</strong>{" "}
            {avecRdt ? (
              <>
                C’est l’ordre de grandeur du tableau, sans l’arrondissement le plus bas ni le plus
                haut. Ce rendement est théorique&nbsp;: le loyer de marché des appartements du secteur
                sur un an, charges comprises, rapporté au prix médian.
              </>
            ) : (
              /* Sans les loyers de marché : la fourchette de repli, un repère d'expérience. */
              <>
                D’après notre expérience, c’est l’ordre de grandeur du rendement d’un immeuble de
                rapport à Paris, selon les arrondissements.
              </>
            )}
          </p>
        </div>

        <p className="paris-prix__mention">
          Chiffres DVF non vérifiés&nbsp;: nous ne connaissons ni l’état ni le niveau des loyers des
          immeubles vendus. Un prix très bas signale souvent un immeuble occupé, mal loué ou à gros
          travaux. Pour le vôtre, nous lisons chaque bail et chiffrons les travaux.
        </p>

        {/* Lot 126 (MAV, 16/11/2026 : liens vers la page des ventes, « Yes ») : le détail des ventes
            derrière le prix médian, en second bouton. Les deux restent visibles au téléphone
            (`porte-action`), comme les deux boutons de la découpe. */}
        {secondBouton ? (
          <div className="btn-row paris-relance porte-action">
            <Button href="#estimer">Estimer mon immeuble</Button>
            <Button href="/ventes-immeubles-paris/" variant="outline" court="Voir les ventes">
              Voir les ventes une par une
            </Button>
          </div>
        ) : (
          /* Pages des annonces : un seul bouton, vers le formulaire ; au téléphone la pilule le remplace. */
          <Relance />
        )}
      </div>
    </section>
  );
}
