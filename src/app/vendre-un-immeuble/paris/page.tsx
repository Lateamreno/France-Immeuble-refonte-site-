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
import { chiffresFaq } from "@/lib/faq";
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
export const metadata: Metadata = {
  title: { absolute: "Vendre un immeuble à Paris | France Immeuble" },
  description:
    "Vendre un immeuble de rapport à Paris avec une agence spécialisée : estimation au rendement, vente off-market à 1 500 acheteurs, prix et rendements des 20 arrondissements. Estimation gratuite.",
  alternates: { canonical: `${SITE.url}/vendre-un-immeuble/paris/` },
};

const fmtPrix = (n: number) => `${n.toLocaleString("fr-FR")}\u00a0€/m²`;
const pc = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nomArr = (n: number) => `${n}${n === 1 ? "er" : "e"} arrondissement`;
const moisAnnee = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : null;
/** « 7 % sous » ou « 5 % au-dessus du » prix au m² des appartements. */
const ecartTexte = (n: number) => `${Math.abs(Math.round(n))}\u00a0% ${n < 0 ? "sous le" : "au-dessus du"}`;
/** Décote de prudence que nous retenons pour un immeuble entier face aux appartements (MAV, 12/11/2026). */
const DECOTE_PRUDENCE = 0.15;
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

/** Ce que nous regardons pour estimer un immeuble parisien (MAV, 10/11/2026 : loi 48, protégés, loyers, DPE). */
const ESTIMATION: { picto: NomPicto; titre: string; texte: string }[] = [
  {
    picto: "stats",
    titre: "Le rendement du secteur",
    texte:
      "Un immeuble de rapport se vend au rendement que les acheteurs attendent dans son arrondissement, et non au prix au m² d’un appartement. Nous partons des ventes d’immeubles réelles, comme celles du tableau ci-dessus.",
  },
  {
    picto: "dossier",
    titre: "Chaque bail, un par un",
    texte:
      "Loi de 1948, locataire âgé protégé, loyer très sous le marché, bail commercial : chaque bail change la valeur du lot. Nous chiffrons ce que l’acheteur va déduire, et ce qu’il pourra rattraper.",
  },
  {
    picto: "technique",
    titre: "L’état et le DPE",
    texte:
      "Chambres de service, petites surfaces sous les toits, logements classés F ou G : nous repérons ce qui ne pourra plus se louer et le coût des travaux, avant que l’acheteur ne le fasse à votre place.",
  },
  {
    picto: "calculatrice",
    titre: "En bloc et à la découpe",
    texte:
      "Pour chaque immeuble, nous chiffrons les deux ventes. À Paris, l’écart entre le prix d’un immeuble et celui des appartements rend souvent la découpe intéressante.",
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
  const { delaiPC } = chiffresFaq(toutes);
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
    const rdtImm = prixImm != null && m?.loyerM2 ? (m.loyerM2 * 12 * 100) / prixImm : null;
    // Colonne prudence : le prix des appartements moins notre décote, pour les 20 arrondissements.
    const rdtPrudence = m?.prixM2 && m?.loyerM2 ? (m.loyerM2 * 12 * 100) / (m.prixM2 * (1 - DECOTE_PRUDENCE)) : null;
    return { n: i + 1, code, m, imm, prixImm, ecart, rdtImm, rdtPrudence };
  });
  const avecPrix = lignes.filter((l) => l.m?.prixM2 != null);
  const ecartParis = mediane(lignes.flatMap((l) => (l.ecart != null ? [l.ecart] : [])));
  const rdtParis = mediane(lignes.flatMap((l) => (l.rdtImm != null ? [l.rdtImm] : [])));
  const rdtPrudenceParis = mediane(lignes.flatMap((l) => (l.rdtPrudence != null ? [l.rdtPrudence] : [])));
  const totalImmeubles = lignes.reduce((s, l) => s + (l.imm?.nbVentes ?? 0), 0);
  const anneeImmeubles = lignes.find((l) => l.imm)?.imm?.annee ?? null;
  const finPrix = moisAnnee(avecPrix[0]?.m?.periodeFin ?? null);
  const millesime = lignes.find((l) => l.m?.millesimeLoyers)?.m?.millesimeLoyers ?? null;

  const preuves: { picto: NomPicto; valeur: string; libelle: string }[] = [
    { picto: "reseau", valeur: nombre(ch.investisseurs), libelle: "acheteurs d’immeubles en base, prêts à recevoir votre dossier" },
    etudiesParis
      ? { picto: "immeubles", valeur: nombre(etudiesParis), libelle: "immeubles parisiens étudiés par nos agents depuis 2018" }
      : { picto: "immeubles", valeur: nombre(ch.immeublesTraites), libelle: "immeubles étudiés par nos agents depuis 2018" },
    { picto: "best", valeur: "4,9/5", libelle: "sur Google, la note que nous donnent nos vendeurs" },
  ];

  const etapesVente: { picto: NomPicto; titre: string; texte: string }[] = [
    {
      picto: "detective",
      titre: "D’abord en off-market",
      texte: `Votre immeuble est présenté à nos ${nombre(ch.investisseurs)} acheteurs avant toute annonce. Vos locataires et vos voisins n’en savent rien.`,
    },
    {
      picto: "loupeCible",
      titre: "Les bons acheteurs, directement",
      texte: "Nous envoyons le dossier aux acheteurs dont la recherche correspond : budget, arrondissement, rendement attendu. Pas de visites inutiles.",
    },
    {
      picto: "poignee",
      titre: "Des offres solides",
      texte: delaiPC
        ? `La première offre arrive en moyenne en ${delaiPC} jours à Paris et en petite couronne. Nous vérifions le financement de chaque acheteur avant de vous la présenter.`
        : "Nous vérifions le financement de chaque acheteur avant de vous présenter son offre, pour que la vente aille jusqu’au bout.",
    },
    {
      picto: "dossier",
      titre: "Jusqu’à l’acte",
      texte: "Diagnostics, préemption de la Ville, offres aux locataires : nous suivons le dossier avec le notaire. Nos honoraires ne sont dus qu’à la signature.",
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
            Nous ne vendons que des immeubles de rapport. Nous estimons le vôtre au rendement que paient
            les acheteurs parisiens, et le présentons d’abord en toute discrétion à nos{" "}
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
          <Reveal className="section__head">
            <Eyebrow>Arrondissement par arrondissement</Eyebrow>
            <h2>
              Combien vaut un immeuble dans les <span className="accent">20 arrondissements</span>
            </h2>
            <p className="lead">
              Le prix des appartements, celui des immeubles entiers réellement vendus
              {anneeImmeubles ? ` en ${anneeImmeubles}` : ""}, l’écart entre les deux et le rendement
              qu’on en déduit, puis le rendement avec la décote de 15 % que nous retenons par prudence.
              {ecartParis != null
                ? ` À Paris, un immeuble entier se vend en médiane ${ecartTexte(ecartParis)} prix au m² des appartements de son arrondissement.`
                : ""}
            </p>
          </Reveal>
          <p className="paris-arr__avert">
            Chiffres DVF non vérifiés : nous ne connaissons ni l’état ni le niveau des loyers des immeubles
            vendus. Ils donnent une tendance, pas le prix de votre immeuble.
          </p>
          <div className="paris-arr paris-arr--immeubles">
            <table>
              <thead>
                <tr>
                  <th scope="col" rowSpan={2}>Arrondissement</th>
                  <th scope="colgroup" colSpan={2} className="paris-arr__groupe">Appartements</th>
                  <th scope="colgroup" colSpan={3} className="paris-arr__groupe">
                    Immeubles entiers vendus{anneeImmeubles ? ` en ${anneeImmeubles}` : ""}
                  </th>
                  <th scope="colgroup" className="paris-arr__groupe paris-arr__prudence">Notre prudence</th>
                </tr>
                <tr>
                  <th scope="col">Prix au m²</th>
                  <th scope="col">Rendement brut</th>
                  <th scope="col">Prix au m²</th>
                  <th scope="col">Écart réel</th>
                  <th scope="col">Rendement brut</th>
                  <th scope="col" className="paris-arr__prudence">Rendement à −15&nbsp;%</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.code}>
                    <th scope="row">{nomArr(l.n)}</th>
                    <td className="paris-arr__prix" data-libelle="Appartement, prix au m²">{l.m?.prixM2 != null ? fmtPrix(l.m.prixM2) : "n.c."}</td>
                    <td data-libelle="Appartement, rendement">
                      {l.m?.rdtMin != null && l.m?.rdtMax != null ? `${pc(l.m.rdtMin)} à ${pc(l.m.rdtMax)}\u00a0%` : "n.c."}
                    </td>
                    <td className="paris-arr__prix" data-libelle="Immeuble, prix au m²">
                      {l.prixImm != null ? (
                        <span>
                          {fmtPrix(l.prixImm)}
                          <span className="paris-arr__nb"> · {l.imm!.nbVentes} ventes</span>
                        </span>
                      ) : l.imm ? (
                        <span className="paris-arr__nb">{l.imm.nbVentes === 0 ? "Aucune vente" : `${l.imm.nbVentes} vente${l.imm.nbVentes > 1 ? "s" : ""}, trop peu`}</span>
                      ) : (
                        "n.c."
                      )}
                    </td>
                    <td className="paris-arr__ecart" data-libelle="Écart réel">{l.ecart != null ? signe(l.ecart) : "–"}</td>
                    <td className="paris-arr__rdt" data-libelle="Immeuble, rendement">{l.rdtImm != null ? `${pc(l.rdtImm)}\u00a0%` : "–"}</td>
                    <td className="paris-arr__rdt paris-arr__prudence" data-libelle="Rendement à −15 %">{l.rdtPrudence != null ? `${pc(l.rdtPrudence)}\u00a0%` : "n.c."}</td>
                  </tr>
                ))}
              </tbody>
              {ecartParis != null && rdtParis != null && (
                <tfoot>
                  <tr>
                    <th scope="row">Paris, en médiane</th>
                    <td colSpan={3}></td>
                    <td className="paris-arr__ecart" data-libelle="Écart réel">{signe(ecartParis)}</td>
                    <td className="paris-arr__rdt" data-libelle="Immeuble, rendement">{`${pc(rdtParis)}\u00a0%`}</td>
                    <td className="paris-arr__rdt paris-arr__prudence" data-libelle="Rendement à −15 %">
                      {rdtPrudenceParis != null ? `${pc(rdtPrudenceParis)}\u00a0%` : "n.c."}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="paris-arr__notes">
            <p>
              <strong>Comment lire ce tableau.</strong> L’écart réel compare le prix au m² des immeubles
              entiers vendus à celui des appartements du même arrondissement. Le rendement brut d’un immeuble
              est le loyer de marché des appartements du secteur rapporté au prix au m² des immeubles : c’est
              ce que rapporterait un immeuble acheté à ce prix et loué au prix du marché. Par prudence, nous
              retenons une décote de 15 % sur le prix des appartements : c’est la dernière colonne. Les loyers
              réels d’un immeuble ancien sont souvent plus bas, c’est tout l’objet de l’estimation.
            </p>
            <p>
              Sources : prix des appartements, médiane des ventes d’appartements anciens sur douze mois
              {finPrix ? ` à fin ${finPrix}` : ""} (DVF, base des notaires et de la DGFiP) ; loyers, carte des
              loyers de l’ANIL{millesime ? ` ${millesime}` : ""}, charges comprises (rendement des appartements
              des grands logements aux petits) ; immeubles entiers, ventes de plus de cinq logements en un seul
              acte et pour un seul prix, avec au moins 65 % de logements parmi les lots, repérées dans DVF, prix
              médian donné à partir de trois ventes, commerces compris dans la surface. Ces chiffres se mettent à jour seuls.
            </p>
          </div>
          <Relance />
        </div>
      </section>

      <section className="section section--noir paris-pourquoi-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Comment nous estimons</Eyebrow>
            <h2>
              Une estimation au <span className="accent">rendement</span>, bail par bail
            </h2>
            <p className="lead">
              Deux immeubles voisins peuvent valoir des prix très différents. Notre estimation est gratuite,
              faite par un agent spécialisé dans les immeubles de rapport, et elle tient compte de tout ce que
              l’acheteur regardera.
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
            <Eyebrow>Comment nous vendons</Eyebrow>
            <h2>
              Vendu <span className="accent">sans annonce</span>, au bon acheteur
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
            <Button href="/vendre-a-la-decoupe/" variant="outline">La vente à la découpe</Button>
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
