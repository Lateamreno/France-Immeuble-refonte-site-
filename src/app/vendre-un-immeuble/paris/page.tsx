import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import { Picto, type NomPicto } from "@/components/Picto";
import { CarteVente } from "@/components/CarteVente";
import { LigneDefilante } from "@/components/LigneDefilante";
import { SectionFaq } from "@/components/SectionFaq";
import { FondPhoto } from "@/components/FondPhoto";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { JsonLd } from "@/components/JsonLd";
import { filAriane, service } from "@/lib/schema";
import { ventes as lesVentes } from "@/lib/biens";
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
    "Vendre un immeuble de rapport à Paris : prix au m² par arrondissement, rendement de 3 à 6 %, DPE, encadrement des loyers, meublés de tourisme, préemption. Estimation gratuite.",
  alternates: { canonical: `${SITE.url}/vendre-un-immeuble/paris/` },
};

const fmtPrix = (n: number) => `${n.toLocaleString("fr-FR")} €/m²`;

export default async function VendreUnImmeubleParis() {
  const [toutes, ch] = await Promise.all([lesVentes(), chiffres()]);
  const paris = toutes.filter((v) => v.dept === "75").sort((a, b) => b.prix - a.prix);
  const { arrondissements, architectures, questions, sourcePrix } = PARIS;
  // Tant que le contenu relu n'est pas déposé dans content/paris.json, la page n'existe pas.
  if (!arrondissements.length || !questions.length) notFound();
  const avecPrix = arrondissements.filter((a) => a.prixM2 != null);
  const min = avecPrix.reduce((m, a) => (a.prixM2! < m.prixM2! ? a : m), avecPrix[0]);
  const max = avecPrix.reduce((m, a) => (a.prixM2! > m.prixM2! ? a : m), avecPrix[0]);

  const reperes: { picto: NomPicto; valeur: string; libelle: string }[] = [
    { picto: "stats", valeur: "3 à 6 %", libelle: "de rendement selon les arrondissements" },
    ...(min && max
      ? [{ picto: "euro" as NomPicto, valeur: `${(Math.round(min.prixM2! / 100) / 10).toLocaleString("fr-FR")}–${(Math.round(max.prixM2! / 100) / 10).toLocaleString("fr-FR")} k€`, libelle: `au m² selon l’arrondissement (${min.nom} au ${max.nom})` }]
      : []),
    { picto: "reseau", valeur: nombre(ch.investisseurs), libelle: "acheteurs d’immeubles en base" },
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
              Prix au m² et bâti des <span className="accent">20 arrondissements</span>
            </h2>
            <p className="lead">
              Le prix au m² des appartements anciens donne un repère. Un immeuble entier se valorise
              d’abord au rendement : il se vend en général en dessous de ce prix au m², d’autant plus
              qu’il est occupé.
            </p>
          </Reveal>
          <div className="paris-arr">
            <table>
              <thead>
                <tr>
                  <th scope="col">Arrondissement</th>
                  <th scope="col">Prix au m²</th>
                  <th scope="col">Sur un an</th>
                  <th scope="col">Bâti dominant</th>
                  <th scope="col">À savoir</th>
                </tr>
              </thead>
              <tbody>
                {arrondissements.map((a) => (
                  <tr key={a.n}>
                    <th scope="row">{a.nom}</th>
                    <td className="paris-arr__prix">{a.prixM2 != null ? fmtPrix(a.prixM2) : "n.c."}</td>
                    <td>{a.evolution1an ?? "n.c."}</td>
                    <td>{a.architecture}</td>
                    <td>{a.attention ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tableau__note">
            Source des prix : <a href={sourcePrix.url} target="_blank" rel="noopener">{sourcePrix.libelle}</a>.
          </p>
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

      {paris.length > 0 && (
        <section className="section section--creme">
          <div className="container">
            <Reveal className="section__head">
              <Eyebrow>Nos ventes à Paris</Eyebrow>
              <h2>
                Des immeubles parisiens <span className="accent">vendus en bloc</span>
              </h2>
            </Reveal>
            <ul className="ventes">
              {paris.map((v, i) => (
                <Reveal key={v.id} as="li" className="vente" delayIndex={i}>
                  <CarteVente v={v} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

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
