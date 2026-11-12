import { imagesPartage } from "@/lib/partage";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { SectionFaq } from "@/components/SectionFaq";
import { FondPhoto } from "@/components/FondPhoto";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { JsonLd } from "@/components/JsonLd";
import { filAriane, service } from "@/lib/schema";
import { marchesDesCommunes } from "@/lib/marche";
import { immeublesDesCommunes } from "@/lib/immeubles-dvf-lecture";
import { chiffres } from "@/lib/chiffres";
import { ventes as lesVentes } from "@/lib/biens";
import { CarteVente } from "@/components/CarteVente";
import { Avis } from "@/components/Avis";
import { PARIS } from "@/lib/paris";
import { VISUELS } from "@/lib/visuels";
import { SITE, nombre } from "@/lib/site";

/**
 * /vendre-un-immeuble/paris/ — vendre un immeuble à Paris avec France Immeuble (lot 99, refait au
 * lot 102, MAV, 10/11/2026 : « je veux qu'on se vende et qu'on dise pourquoi France Immeuble c'est
 * bien. Comment on estime, comment on vend et à qui. Il faut des boutons réguliers »). Le tableau
 * des 20 arrondissements reste le cœur de la page, avec le prix des immeubles entiers vendus,
 * l'écart avec les appartements et le rendement qu'on en déduit. La page des annonces Google est
 * /estimation-immeuble-paris/, hors index : les deux ne se concurrencent pas.
 */
const DESCRIPTION =
  "Vendre un immeuble de rapport à Paris : estimation par des spécialistes, vente 100 % off-market à 1 500 acheteurs, prix des immeubles des 20 arrondissements.";

export const metadata: Metadata = {
  title: { absolute: "Vendre un immeuble à Paris | France Immeuble" },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/vendre-un-immeuble/paris/` },
  openGraph: { images: imagesPartage("/vendre-un-immeuble/paris/"), type: "website", title: "Vendre un immeuble à Paris | France Immeuble", description: DESCRIPTION, url: "/vendre-un-immeuble/paris/" },
};

const fmtPrix = (n: number) => `${n.toLocaleString("fr-FR")}\u00a0€/m²`;
const pc = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nomArr = (n: number) => `${n}${n === 1 ? "er" : "e"} arrondissement`;
const moisAnnee = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : null;
/** « 7 % sous » ou « 5 % au-dessus du » prix au m² des appartements. */
const ecartTexte = (n: number) => `${Math.abs(Math.round(n))}\u00a0% ${n < 0 ? "sous le" : "au-dessus du"}`;
/** Prix au m² sans l'unité, pour les bornes basse et haute. */
const milliers = (n: number | null) => (n != null ? `${n.toLocaleString("fr-FR")}\u00a0€` : "–");
const signe = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(Math.round(n))}\u00a0%`;
const mediane = (xs: number[]) => {
  const t = [...xs].sort((a, b) => a - b);
  return t.length ? (t.length % 2 ? t[(t.length - 1) / 2] : (t[t.length / 2 - 1] + t[t.length / 2]) / 2) : null;
};

/** Un bouton d'estimation en fin de section (« des boutons réguliers ») : la pilule du téléphone s'efface devant lui. */
function Relance({ libelle = "Estimer mon immeuble" }: { libelle?: string }) {
  return (
    <div className="btn-row porte-action paris-relance">
      <Button href="#estimer">{libelle}</Button>
    </div>
  );
}

/**
 * Ce que demande l'étude d'un immeuble parisien (MAV, 12/11/2026, retours #307 et #308 : « une
 * connaissance approfondie du marché et des compétences solides, en technique ou en locatif », et
 * « savoir associer le bon immeuble au bon acquéreur »).
 */
const ESTIMATION: { picto: NomPicto; titre: string; texte: string }[] = [
  {
    picto: "secteur",
    titre: "Le marché, rue par rue",
    texte:
      "Nous suivons les ventes d’immeubles de chaque arrondissement et ce que les acheteurs y paient vraiment. Deux immeubles voisins peuvent valoir des prix très différents.",
  },
  {
    picto: "dossier",
    titre: "Le locatif, bail par bail",
    texte:
      "Loi de 1948, locataires protégés, loyers sous le marché, encadrement des loyers, baux commerciaux : nous lisons chaque bail et chiffrons ce qu’il pèse sur le prix.",
  },
  {
    picto: "technique",
    titre: "Le bâti et la rénovation énergétique",
    texte:
      "Structure, toiture, façades, normes, logements classés F ou G : nous chiffrons les travaux à prévoir. En secteur protégé, nous savons ce qu’accepteront les Architectes des Bâtiments de France.",
  },
  {
    picto: "loupeCible",
    titre: "Le bon acquéreur",
    texte:
      "Investisseur, marchand de biens, acheteur patrimonial, vente en bloc ou à la découpe : nous associons votre immeuble à l’acquéreur qui en paiera le meilleur prix.",
  },
];

export default async function VendreUnImmeubleParis() {
  const codes = Array.from({ length: 20 }, (_, i) => `751${String(i + 1).padStart(2, "0")}`);
  const [ch, marches, immeubles, toutes] = await Promise.all([
    chiffres(),
    marchesDesCommunes(codes),
    immeublesDesCommunes(codes),
    lesVentes(),
  ]);
  // Nos dernières ventes d'immeubles à Paris : les murs d'une boutique n'y ont pas leur place (MAV, 10/11/2026).
  const ventesParis = toutes
    .filter((v) => v.dept === "75" && (v.lots ?? 2) > 1 && (!v.type || /immeuble/i.test(v.type)))
    .sort((a, b) => b.date.localeCompare(a.date));
  const etudiesParis = ch.traitesPar["75"] ?? null;
  const { questions } = PARIS;
  // Tant que le contenu relu n'est pas déposé dans content/paris.json, la page n'existe pas.
  if (!questions.length) notFound();

  // Immeuble face aux appartements (MAV, 10/11/2026 : « l'écart en pourcentage pour le prix au m² des
  // immeubles vs les apparts, et j'en déduirai le rendement moyen au prix de secteur ») : loyer des
  // appartements du secteur rapporté au prix au m² des immeubles entiers vendus.
  const lignes = codes.map((code, i) => {
    const m = marches.get(code);
    const imm = immeubles.get(code);
    const prixImm = imm?.prixM2Median ?? null;
    const ecart = prixImm != null && m?.prixM2 ? ((prixImm - m.prixM2) / m.prixM2) * 100 : null;
    // Loyer de marché des appartements rapporté au prix au m² des immeubles : le rendement brut le
    // plus bas va avec le prix le plus haut (retour #303 : min, médian et max, prix et rendement).
    const rdt = (prix: number | null | undefined) => (prix != null && m?.loyerM2 ? (m.loyerM2 * 12 * 100) / prix : null);
    const rdtImm = rdt(prixImm);
    const rdtBas = rdt(imm?.prixM2Max);
    const rdtHaut = rdt(imm?.prixM2Min);
    return { n: i + 1, code, m, imm, prixImm, ecart, rdtImm, rdtBas, rdtHaut };
  });
  const avecPrix = lignes.filter((l) => l.m?.prixM2 != null);
  const ecartParis = mediane(lignes.flatMap((l) => (l.ecart != null ? [l.ecart] : [])));
  const rdtParis = mediane(lignes.flatMap((l) => (l.rdtImm != null ? [l.rdtImm] : [])));
  const totalImmeubles = lignes.reduce((s, l) => s + (l.imm?.nbVentes ?? 0), 0);
  const anneeImmeubles = lignes.find((l) => l.imm)?.imm?.annee ?? null;
  const finPrix = moisAnnee(avecPrix[0]?.m?.periodeFin ?? null);
  const millesime = lignes.find((l) => l.m?.millesimeLoyers)?.m?.millesimeLoyers ?? null;

  const preuves: { picto: NomPicto; valeur: string; libelle: string }[] = [
    { picto: "reseau", valeur: nombre(ch.investisseurs), libelle: "acheteurs d’immeubles en base, prêts à recevoir votre dossier" },
    etudiesParis
      ? { picto: "immeubles", valeur: nombre(etudiesParis), libelle: "immeubles parisiens étudiés par nos agents depuis 2018" }
      : { picto: "immeubles", valeur: nombre(ch.immeublesTraites), libelle: "immeubles étudiés par nos agents depuis 2018" },
    { picto: "best", valeur: "4,9/5", libelle: "note moyenne de nos clients sur Google" },
  ];

  // Retours #311 et #312 (MAV, 12/11/2026) : 100 % off-market, la meilleure offre de notre base, pas de
  // délai affiché, et l'après-offre, la partie la plus difficile, où le professionnel fait la différence.
  const etapesVente: { picto: NomPicto; titre: string; texte: string }[] = [
    {
      picto: "detective",
      titre: "100 % off-market",
      texte: `Votre immeuble est commercialisé uniquement en off-market, auprès de nos ${nombre(ch.investisseurs)} acheteurs, pour préserver sa valeur et son exclusivité. Vos locataires et vos voisins n’en savent rien.`,
    },
    {
      picto: "loupeCible",
      titre: "Les bons acheteurs, directement",
      texte: "Nous envoyons le dossier aux acheteurs dont la recherche correspond : budget, arrondissement, rendement attendu. Pas de visites inutiles.",
    },
    {
      picto: "poignee",
      titre: "La meilleure offre",
      texte: "Nous cherchons dans notre base l’acheteur qui fera la meilleure offre pour votre immeuble. Les offres de nos acheteurs sont solides, souvent sans condition de financement.",
    },
    {
      picto: "dossier",
      titre: "Jusqu’à l’acte",
      texte: "Après l’offre commence le plus difficile : baux à vérifier, diagnostics, préemption de la Ville, offres aux locataires, questions du notaire. C’est là qu’un professionnel fait la différence : nous vous accompagnons de bout en bout. Nos honoraires ne sont dus qu’à la signature.",
    },
  ];

  const acheteurs: { picto: NomPicto; valeur: string | null; titre: string; texte: string }[] = [
    {
      picto: "business",
      valeur: nombre(ch.recherchesInvestisseur),
      titre: "Investisseurs",
      texte: "Particuliers, sociétés familiales, family offices : ils achètent pour louer et regardent le rendement et la qualité de l’immeuble.",
    },
    {
      picto: "calculatrice",
      valeur: nombre(ch.recherchesMarchand),
      titre: "Marchands de biens",
      texte: "Ils regardent les immeubles mal loués ou à gros travaux, où ils peuvent faire l’offre la plus haute. Quand les logements sont loués au prix du marché, c’est en général un investisseur qui fait la meilleure offre.",
    },
    {
      picto: "immeubles",
      valeur: nombre(ch.recherchesPatrimonial),
      titre: "Acheteurs patrimoniaux",
      texte: "Ils gardent longtemps et paient la qualité : bel immeuble, bon emplacement, peu de travaux.",
    },
    {
      picto: "equipe",
      valeur: null,
      titre: "Foncières et bailleurs sociaux",
      texte: "Pour les plus grands immeubles. À Paris, la Ville et les bailleurs sociaux achètent aussi des immeubles entiers : une demande de plus pour le vendeur.",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          filAriane([
            { nom: "Accueil", url: "/" },
            { nom: "Vendre un immeuble", url: "/vendre-un-immeuble/" },
            { nom: "Paris", url: "/vendre-un-immeuble/paris/" },
          ]),
          service(
            "Vente d’immeuble de rapport à Paris",
            "Estimation, commercialisation off-market et vente en bloc d’immeubles de rapport dans les vingt arrondissements de Paris.",
            "/vendre-un-immeuble/paris/",
          ),
        ]}
      />

      <HeroMedia image={VISUELS.toitsAeriens.src} alt={VISUELS.toitsAeriens.alt}>
        <>
          <Eyebrow>Vendre à Paris</Eyebrow>
          <h1>
            Vendre votre <span className="accent">immeuble à Paris</span> au meilleur acheteur
          </h1>
          <p className="lead">
            Nous ne vendons que des immeubles de rapport. Nos agents connaissent le marché parisien, ses
            baux et son bâti : ils estiment votre immeuble, puis le vendent 100 % en off-market à nos{" "}
            {nombre(ch.investisseurs)} acheteurs.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>Estimer mon immeuble</Button>
          </div>
        </>
      </HeroMedia>

      <section className="section section--noir-2 paris-reperes-sec">
        <div className="container">
          <ul className="paris-reperes paris-reperes--seul">
            {preuves.map((r) => (
              <li key={r.libelle}>
                <Picto nom={r.picto} taille={30} />
                <span className="paris-reperes__val">{r.valeur}</span>
                <span className="paris-reperes__lib">{r.libelle}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--creme paris-arr-sec">
        <div className="container">
          {/* Retour #302 (MAV, 12/11/2026) : surtitre, titre et texte d'introduction, le détail du calcul plus bas. */}
          <Reveal className="section__head">
            <Eyebrow>Prix des immeubles par arrondissement</Eyebrow>
            <h2>
              Quel est le prix des immeubles dans les <span className="accent">20 arrondissements</span>&nbsp;?
            </h2>
            <p className="lead">
              Voici notre étude des ventes d’immeubles à Paris{anneeImmeubles ? ` en ${anneeImmeubles}` : ""}.
              Pour chaque arrondissement, elle donne le prix au m² constaté sur les dernières ventes
              d’immeubles entiers, face à celui des appartements, et le rendement théorique qu’on en tire.
              En pratique, nous retenons en général une décote d’environ 15&nbsp;% sur le prix des
              appartements, mais elle varie selon l’arrondissement, le type d’immeuble et les loyers
              réellement pratiqués. Le détail du calcul est sous le tableau.
            </p>
          </Reveal>
          <p className="paris-arr__avert">
            Chiffres DVF non vérifiés : nous ne connaissons ni l’état ni le niveau des loyers des immeubles
            vendus. Ils donnent une tendance, pas le prix de votre immeuble.
          </p>
          {/* Retour #303 : filets entre les trois groupes, plus de colonne de prudence, le moins cher,
              le médian et le plus cher au m², et les rendements qui vont avec. */}
          <div className="paris-arr paris-arr--immeubles">
            <table>
              <thead>
                <tr>
                  <th scope="col" rowSpan={2}>Arrondissement</th>
                  <th scope="colgroup" colSpan={2} className="paris-arr__groupe paris-arr__debut">Appartements</th>
                  <th scope="colgroup" colSpan={4} className="paris-arr__groupe paris-arr__debut">
                    Immeubles entiers vendus{anneeImmeubles ? ` en ${anneeImmeubles}` : ""}
                  </th>
                </tr>
                <tr>
                  <th scope="col" className="paris-arr__debut">Prix au m²</th>
                  <th scope="col">Rendement brut</th>
                  <th scope="col" className="paris-arr__debut">Ventes</th>
                  <th scope="col">Prix au m²<span className="paris-arr__sous">bas · médian · haut</span></th>
                  <th scope="col">Écart</th>
                  <th scope="col">Rendement brut<span className="paris-arr__sous">bas · médian · haut</span></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.code}>
                    <th scope="row">{nomArr(l.n)}</th>
                    <td className="paris-arr__prix paris-arr__debut" data-libelle="Appartement, prix au m²">{l.m?.prixM2 != null ? fmtPrix(l.m.prixM2) : "n.c."}</td>
                    <td data-libelle="Appartement, rendement">
                      {l.m?.rdtMin != null && l.m?.rdtMax != null ? `${pc(l.m.rdtMin)} à ${pc(l.m.rdtMax)}\u00a0%` : "n.c."}
                    </td>
                    <td className="paris-arr__debut paris-arr__n" data-libelle="Immeubles vendus">{l.imm ? l.imm.nbVentes : "n.c."}</td>
                    <td className="paris-arr__prix" data-libelle="Immeuble, prix au m² (bas · médian · haut)">
                      {l.prixImm != null ? (
                        <span className="paris-arr__trio">
                          <span>{milliers(l.imm!.prixM2Min)}</span>
                          <strong>{fmtPrix(l.prixImm)}</strong>
                          <span>{milliers(l.imm!.prixM2Max)}</span>
                        </span>
                      ) : (
                        <span className="paris-arr__nb">{l.imm ? "trop peu de ventes" : "n.c."}</span>
                      )}
                    </td>
                    <td className="paris-arr__ecart" data-libelle="Écart avec les appartements">{l.ecart != null ? signe(l.ecart) : "–"}</td>
                    <td className="paris-arr__rdt" data-libelle="Immeuble, rendement (bas · médian · haut)">
                      {l.rdtImm != null ? (
                        <span className="paris-arr__trio">
                          <span>{l.rdtBas != null ? pc(l.rdtBas) : "–"}</span>
                          <strong>{`${pc(l.rdtImm)}\u00a0%`}</strong>
                          <span>{l.rdtHaut != null ? pc(l.rdtHaut) : "–"}</span>
                        </span>
                      ) : (
                        "–"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {ecartParis != null && rdtParis != null && (
                <tfoot>
                  <tr>
                    <th scope="row">Paris, en médiane</th>
                    <td colSpan={2} className="paris-arr__debut"></td>
                    <td className="paris-arr__debut paris-arr__n" data-libelle="Immeubles vendus">{totalImmeubles}</td>
                    <td></td>
                    <td className="paris-arr__ecart" data-libelle="Écart avec les appartements">{signe(ecartParis)}</td>
                    <td className="paris-arr__rdt" data-libelle="Immeuble, rendement">{`${pc(rdtParis)}\u00a0%`}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {/* Retour #304 : les sources et le calcul, repliés, sans dire que les chiffres se mettent à jour seuls. */}
          <details className="paris-arr__notes">
            <summary>Le détail du calcul et nos sources</summary>
            <p>
              L’écart compare le prix au m² médian des immeubles entiers vendus à celui des appartements du
              même arrondissement. Le rendement brut d’un immeuble est le loyer de marché des appartements du
              secteur rapporté au prix au m² de l’immeuble : c’est ce que rapporterait un immeuble acheté à ce
              prix et loué au prix du marché. Le prix bas va donc avec le rendement haut. Un prix très bas
              signale souvent un immeuble occupé, mal loué ou à gros travaux. Les loyers réels d’un immeuble
              ancien sont souvent plus bas que ceux du marché : c’est tout l’objet de notre estimation.
            </p>
            <p>
              Prix des appartements : médiane des ventes d’appartements anciens sur douze mois
              {finPrix ? ` à fin ${finPrix}` : ""} (DVF, notaires et DGFiP). Loyers : carte des loyers de
              l’ANIL{millesime ? ` ${millesime}` : ""}, charges comprises. Immeubles entiers : ventes de plus de
              cinq logements en un seul acte et pour un seul prix, avec au moins 65&nbsp;% de logements parmi
              les lots, repérées dans DVF ; prix donnés à partir de trois ventes, commerces compris dans la surface.
            </p>
          </details>
          <Relance />
        </div>
      </section>

      <section className="section section--noir paris-pourquoi-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Estimer votre immeuble à Paris</Eyebrow>
            <h2>
              Des spécialistes de l’immeuble parisien, <span className="accent">du bail à la toiture</span>
            </h2>
            <p className="lead">
              Étudier un immeuble à Paris demande une connaissance fine du marché et de solides compétences,
              techniques comme locatives : baux, loi de 1948, loyers de marché, encadrement des loyers,
              travaux, Architectes des Bâtiments de France, normes, rénovation énergétique. Il faut aussi
              savoir présenter le bon immeuble au bon acquéreur : c’est ce qui fait le meilleur prix. Notre
              estimation est gratuite.
            </p>
          </Reveal>
          <ul className="paris-cartes">
            {ESTIMATION.map((x, i) => (
              <Reveal key={x.titre} as="li" className="paris-carte" delayIndex={i}>
                <Picto nom={x.picto} taille={30} />
                <h3>{x.titre}</h3>
                <p>{x.texte}</p>
              </Reveal>
            ))}
          </ul>
          <Relance libelle="Faire estimer mon immeuble" />
        </div>
      </section>

      <section className="section section--creme paris-vente-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Vendre un immeuble à Paris</Eyebrow>
            <h2>
              Votre immeuble à Paris vendu <span className="accent">sans annonce</span> au meilleur prix
            </h2>
          </Reveal>
          <ol className="sea-etapes">
            {etapesVente.map((e, i) => (
              <Reveal key={e.titre} as="li" delayIndex={i}>
                <Picto nom={e.picto} taille={30} />
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </Reveal>
            ))}
          </ol>
          <Relance />
        </div>
      </section>

      <section className="section section--noir-2 paris-acheteurs-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>À qui nous vendons</Eyebrow>
            <h2>
              Les acheteurs d’immeubles parisiens <span className="accent">sont déjà chez nous</span>
            </h2>
            <p className="lead">
              Nos acheteurs ont déposé leur recherche : nous savons ce qu’ils cherchent, à quel prix et à quel
              rendement. Votre immeuble part directement à ceux qu’il intéresse.
            </p>
          </Reveal>
          <ul className="paris-cartes">
            {acheteurs.map((x, i) => (
              <Reveal key={x.titre} as="li" className="paris-carte" delayIndex={i}>
                <Picto nom={x.picto} taille={30} />
                {x.valeur && <span className="paris-carte__val">{x.valeur} <small>recherches</small></span>}
                <h3>{x.titre}</h3>
                <p>{x.texte}</p>
              </Reveal>
            ))}
          </ul>
          <Relance />
        </div>
      </section>

      {ventesParis.length > 0 && (
        <section className="section section--creme paris-ventes-sec">
          <div className="container">
            <Reveal className="section__head">
              <Eyebrow>Nos dernières ventes à Paris</Eyebrow>
              <h2>
                Des immeubles parisiens <span className="accent">vendus en bloc</span>
              </h2>
              <p className="lead">
                {etudiesParis
                  ? <>Depuis 2018, nous avons étudié {nombre(etudiesParis)} immeubles parisiens pour leurs propriétaires. </>
                  : null}
                Voici nos dernières ventes dans la capitale. Celles de 2020 datent d’avant la hausse des
                taux : les mêmes immeubles se vendraient aujourd’hui à un rendement plus élevé.
              </p>
            </Reveal>
            <ul className="ventes">
              {ventesParis.map((v, i) => (
                <Reveal key={v.id} as="li" className="vente" delayIndex={i}>
                  <CarteVente v={v} />
                </Reveal>
              ))}
            </ul>
            <Relance />
          </div>
        </section>
      )}

      <section className="section section--noir paris-decoupe-sec">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>En bloc ou à la découpe</Eyebrow>
            <h2>
              À Paris, la découpe <span className="accent">vaut souvent le coup</span>
            </h2>
            <p className="lead">
              {ecartParis != null && ecartParis < 0
                ? `Vendu en bloc, un immeuble parisien se négocie en médiane ${ecartTexte(ecartParis)} prix au m² des appartements, et bien plus dans certains arrondissements.`
                : "Vendu en bloc, un immeuble se négocie en général sous le prix au m² des appartements."}{" "}
              Vendus un par un, les logements libres se vendent au prix du marché. Sur un immeuble parisien,
              cet écart couvre souvent largement les frais et le temps de la mise en copropriété.
            </p>
          </Reveal>
          <ul className="paris-decoupe">
            <li><strong>Nous faisons les deux.</strong> Pour chaque immeuble, nous chiffrons la vente en bloc et la vente à la découpe avant de vous conseiller.</li>
            <li><strong>Nous prenons tout en charge.</strong> Mise en copropriété, offres aux locataires, travaux, commercialisation lot par lot.</li>
            <li><strong>Vous gardez le choix.</strong> Tant que le premier lot n’est pas vendu, l’immeuble reste vendable en bloc.</li>
          </ul>
          <div className="btn-row porte-action paris-relance">
            <Button href="#estimer">Estimer mon immeuble</Button>
            <Button href="/vendre-un-immeuble-a-la-decoupe/" variant="outline">La vente à la découpe</Button>
          </div>
        </div>
      </section>

      <Avis titre="Ce qu’en disent nos vendeurs" fond="noir-3" />

      <SectionFaq
        items={questions.map((q) => ({ question: q.question, texte: q.reponse }))}
        surtitre="Les questions des propriétaires parisiens"
        titre={<>Vendre un immeuble à Paris : <span className="accent">vos questions</span></>}
        className="section--noir-2"
      />

      <section id="estimer" className="section section--noir section--ecran sec-formulaire">
        <FondPhoto image="/media/atouts/signature-dossier.webp" position="40% center" clair />
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Première étape</Eyebrow>
            <h2>Obtenez votre <span className="accent">estimation gratuite</span></h2>
            <p className="lead">
              Quelques questions sur votre immeuble parisien suffisent pour lancer son estimation.
              Elle est gratuite et confidentielle.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href={SITE.telHref} variant="outline">Préférer le téléphone · {SITE.tel}</Button>
            </div>
            <p className="paris-guide">
              Pour aller plus loin :{" "}
              <a href="/comment-vendre-un-immeuble-a-paris/">notre guide pour vendre un immeuble à Paris</a>.
            </p>
          </Reveal>
          <EstimationForm formulaire="vendre" />
        </div>
      </section>

      <BoutonFixeMobile href="#estimer" cible="estimer" libelle="Estimer mon immeuble" />
    </>
  );
}
