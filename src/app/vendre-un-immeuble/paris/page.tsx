import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { LigneDefilante } from "@/components/LigneDefilante";
import { SectionFaq } from "@/components/SectionFaq";
import { FondPhoto } from "@/components/FondPhoto";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { JsonLd } from "@/components/JsonLd";
import { filAriane, service } from "@/lib/schema";
import { marchesDesCommunes } from "@/lib/marche";
import { immeublesDesCommunes } from "@/lib/immeubles-dvf-lecture";
import { chiffres } from "@/lib/chiffres";
import { PARIS } from "@/lib/paris";
import { VISUELS } from "@/lib/visuels";
import { SITE, nombre } from "@/lib/site";

/**
 * /vendre-un-immeuble/paris/ — la page Paris faite pour Google (lot 99, MAV, 10/11/2026).
 * Les questions des propriétaires parisiens, les prix par arrondissement, les types
 * d'immeubles, nos ventes à Paris, puis le formulaire. La page des annonces Google est
 * /estimation-immeuble-paris/, hors index : les deux ne se concurrencent pas.
 */
export const metadata: Metadata = {
  title: { absolute: "Vendre un immeuble à Paris : prix et règles | France Immeuble" },
  description:
    "Vendre un immeuble de rapport à Paris : prix au m² par arrondissement, rendement de 3 à 6 %, DPE, encadrement des loyers, meublés de tourisme, préemption. Estimation gratuite.",
  alternates: { canonical: `${SITE.url}/vendre-un-immeuble/paris/` },
};

const fmtPrix = (n: number) => `${n.toLocaleString("fr-FR")}\u00a0€/m²`;
const pc = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nomArr = (n: number) => `${n}${n === 1 ? "er" : "e"} arrondissement`;
const moisAnnee = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : null;

/** Ce qui pèse sur le prix d'un immeuble parisien (MAV, 10/11/2026 : « loi 48, locataires protégés, loyers sous-évalués, DPE »). */
const POIDS: { picto: NomPicto; titre: string; texte: string }[] = [
  {
    picto: "dossier",
    titre: "Les baux de la loi de 1948",
    texte:
      "Quelques logements d’immeubles anciens restent soumis à la loi du 1er septembre 1948 : loyer réglementé, souvent très inférieur au marché, et droit du locataire à se maintenir dans les lieux. L’acheteur les valorise sur ce loyer, ou comme un logement occupé pour longtemps.",
  },
  {
    picto: "profil",
    titre: "Les locataires protégés",
    texte:
      "Un locataire de plus de 65 ans aux ressources modestes ne peut pas recevoir de congé pour vente ou reprise sans offre de relogement adaptée, sauf si le bailleur a lui-même plus de 65 ans ou des ressources modestes. Son logement se vend donc occupé, à un prix plus bas.",
  },
  {
    picto: "euro",
    titre: "Les loyers sous-évalués",
    texte:
      "Beaucoup d’immeubles parisiens détenus depuis longtemps ont des loyers bien sous le marché. La hausse n’est possible qu’au renouvellement du bail, de façon encadrée et étalée dans le temps : l’acheteur paie le rendement d’aujourd’hui, en tenant compte de ce qu’il pourra rattraper.",
  },
  {
    picto: "technique",
    titre: "Le DPE",
    texte:
      "Un logement classé G ne peut plus faire l’objet d’un nouveau bail depuis 2025, F suivra en 2028 et E en 2034. Les chambres de service et petites surfaces sous les toits sont les premières concernées : l’acheteur déduit les travaux et le risque de vacance.",
  },
  {
    picto: "logement",
    titre: "Les petites surfaces",
    texte:
      "Une chambre de service de moins de 9 m² (ou de 20 m³) ne peut pas être louée comme logement. Réunie à un appartement voisin ou vendue à part, elle change pourtant la valeur de l’immeuble.",
  },
];

export default async function VendreUnImmeubleParis() {
  const codes = Array.from({ length: 20 }, (_, i) => `751${String(i + 1).padStart(2, "0")}`);
  const [ch, marches, immeubles] = await Promise.all([chiffres(), marchesDesCommunes(codes), immeublesDesCommunes(codes)]);
  const { questions, architectures } = PARIS;
  // Tant que le contenu relu n'est pas déposé dans content/paris.json, la page n'existe pas.
  if (!questions.length) notFound();

  const lignes = codes.map((code, i) => ({ n: i + 1, code, m: marches.get(code), imm: immeubles.get(code) }));
  const avecPrix = lignes.filter((l) => l.m?.prixM2 != null);
  const min = avecPrix.length ? avecPrix.reduce((a, b) => (b.m!.prixM2! < a.m!.prixM2! ? b : a)) : null;
  const max = avecPrix.length ? avecPrix.reduce((a, b) => (b.m!.prixM2! > a.m!.prixM2! ? b : a)) : null;
  const totalImmeubles = lignes.reduce((s, l) => s + (l.imm?.nbVentes ?? 0), 0);
  const anneeImmeubles = lignes.find((l) => l.imm)?.imm?.annee ?? null;
  const finPrix = moisAnnee(avecPrix[0]?.m?.periodeFin ?? null);
  const millesime = lignes.find((l) => l.m?.millesimeLoyers)?.m?.millesimeLoyers ?? null;

  const reperes: { picto: NomPicto; valeur: string; libelle: string }[] = [
    { picto: "stats", valeur: "3 à 6\u00a0%", libelle: "de rendement pour un immeuble, selon les arrondissements" },
    ...(min && max
      ? [{ picto: "euro" as NomPicto, valeur: `${(Math.round(min.m!.prixM2! / 100) / 10).toLocaleString("fr-FR")}–${(Math.round(max.m!.prixM2! / 100) / 10).toLocaleString("fr-FR")}\u00a0k€`, libelle: `au m² pour un appartement, du ${nomArr(min.n)} au ${nomArr(max.n)}` }]
      : []),
    ...(totalImmeubles && anneeImmeubles
      ? [{ picto: "immeubles" as NomPicto, valeur: nombre(totalImmeubles), libelle: `immeubles entiers vendus à Paris en ${anneeImmeubles} (DVF)` }]
      : [{ picto: "reseau" as NomPicto, valeur: nombre(ch.investisseurs), libelle: "acheteurs d’immeubles en base" }]),
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
            Vendre un <span className="accent">immeuble à Paris</span>
          </h1>
          <p className="lead">
            Prix par arrondissement, rendement, DPE, encadrement des loyers, meublés de tourisme :
            ce qu’il faut savoir avant de vendre un immeuble de rapport parisien.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>Estimer mon immeuble</Button>
          </div>
        </>
      </HeroMedia>

      <section className="section section--noir-2 paris-reperes-sec">
        <div className="container">
          <ul className="paris-reperes paris-reperes--seul">
            {reperes.map((r) => (
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
              Prix, rendement et ventes d’immeubles dans les <span className="accent">20 arrondissements</span>
            </h2>
            <p className="lead">
              Le prix au m² et le rendement des appartements donnent le repère du secteur. Un immeuble
              entier se négocie en général autour de 15 % sous ce prix au m², ce qui relève d’autant
              son rendement.
            </p>
          </Reveal>
          <div className="paris-arr">
            <table>
              <thead>
                <tr>
                  <th scope="col">Arrondissement</th>
                  <th scope="col">Prix au m² d’un appartement</th>
                  <th scope="col">Rendement brut d’un appartement</th>
                  <th scope="col">Ventes d’immeubles entiers{anneeImmeubles ? ` en ${anneeImmeubles}` : ""}</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.code}>
                    <th scope="row">{nomArr(l.n)}</th>
                    <td className="paris-arr__prix" data-libelle="Prix au m²">{l.m?.prixM2 != null ? fmtPrix(l.m.prixM2) : "n.c."}</td>
                    <td data-libelle="Rendement">
                      {l.m?.rdtMin != null && l.m?.rdtMax != null ? `${pc(l.m.rdtMin)} à ${pc(l.m.rdtMax)}\u00a0%` : "n.c."}
                    </td>
                    <td data-libelle="Immeubles vendus">
                      {l.imm
                        ? l.imm.nbVentes === 0
                          ? "Aucune repérée"
                          : `${l.imm.nbVentes} vente${l.imm.nbVentes > 1 ? "s" : ""}${l.imm.prixM2Median != null ? `, ${fmtPrix(l.imm.prixM2Median)} en médiane` : ""}`
                        : "n.c."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="paris-arr__notes">
            <p>
              <strong>Ce sont des chiffres d’appartements.</strong> Pour un immeuble entier, prévoyez
              une décote d’environ 15 % sur le prix au m², plus ou moins selon l’occupation, les loyers et
              l’état de l’immeuble. Le rendement brut d’un immeuble est donc plus élevé que celui affiché :
              c’est la fourchette de 3 à 6 % que nous constatons à Paris.
            </p>
            <p>
              Prix au m² : médiane des ventes d’appartements anciens sur douze mois
              {finPrix ? `, à fin ${finPrix}` : ""} (DVF, base des notaires et de la DGFiP). Rendement brut :
              loyer de marché des appartements, des grands logements aux petits (carte des loyers de
              l’ANIL{millesime ? ` ${millesime}` : ""}, charges comprises), rapporté à ce prix. Ventes
              d’immeubles entiers : ventes de plus de cinq logements en un seul acte et pour un seul prix,
              repérées dans DVF ; le prix médian au m² n’est donné qu’à partir de trois ventes, commerces
              compris dans la surface. Ces chiffres se mettent à jour seuls.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--noir-2 paris-poids-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Ce qui pèse sur le prix</Eyebrow>
            <h2>
              Loi de 1948, locataires protégés, DPE : <span className="accent">ce que l’acheteur déduit</span>
            </h2>
            <p className="lead">
              À Paris, deux immeubles voisins peuvent se vendre à des prix très différents. Ce qui fait
              l’écart tient souvent aux baux et aux occupants.
            </p>
          </Reveal>
          <LigneDefilante className="paris-poids" marches>
            {POIDS.map((x) => (
              <article key={x.titre} className="paris-archi__carte">
                <Picto nom={x.picto} taille={28} />
                <h3>{x.titre}</h3>
                <p>{x.texte}</p>
              </article>
            ))}
          </LigneDefilante>
        </div>
      </section>

      <section className="section section--creme paris-decoupe-sec">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>En bloc ou à la découpe</Eyebrow>
            <h2>
              À Paris, la découpe <span className="accent">vaut souvent le coup</span>
            </h2>
            <p className="lead">
              Vendu en bloc, un immeuble se négocie autour de 15 % sous le prix au m² des appartements.
              Vendus un par un, les logements libres se vendent au prix du marché résidentiel. Sur un
              immeuble parisien, cet écart couvre souvent largement les frais et le temps de la mise en
              copropriété.
            </p>
          </Reveal>
          <ul className="paris-decoupe">
            <li><strong>Nous faisons les deux.</strong> Pour chaque immeuble, nous chiffrons la vente en bloc et la vente à la découpe avant de vous conseiller.</li>
            <li><strong>Nous prenons tout en charge.</strong> Mise en copropriété, offres aux locataires, travaux, commercialisation lot par lot.</li>
            <li><strong>Vous gardez le choix.</strong> Tant que le premier lot n’est pas vendu, l’immeuble reste vendable en bloc.</li>
          </ul>
          <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
            <Button href="/vendre-a-la-decoupe/">Voir la vente à la découpe</Button>
          </div>
        </div>
      </section>

      <section className="section section--noir paris-archi-sec">
        <div className="container">
          <Reveal className="section__head">
            <Eyebrow>Types d’immeubles</Eyebrow>
            <h2>
              Ce que les acheteurs regardent, <span className="accent">selon l’époque</span>
            </h2>
          </Reveal>
          <LigneDefilante className="paris-archi" marches>
            {architectures.map((x) => (
              <article key={x.type} className="paris-archi__carte">
                <p className="paris-archi__periode">{x.periode}</p>
                <h3>{x.type}</h3>
                <p>{x.reperes}</p>
                <p><strong>Pour les acheteurs.</strong> {x.pourLesAcheteurs}</p>
                <p><strong>Travaux.</strong> {x.travaux}</p>
              </article>
            ))}
          </LigneDefilante>
        </div>
      </section>

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
