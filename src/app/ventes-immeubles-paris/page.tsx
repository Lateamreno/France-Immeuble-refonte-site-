import type { Metadata } from "next";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { EstimationForm } from "@/components/EstimationForm";
import { FondPhoto } from "@/components/FondPhoto";
import { BoutonFixeMobile } from "@/components/BoutonFixeMobile";
import { JsonLd } from "@/components/JsonLd";
import { Picto, type NomPicto } from "@/components/Picto";
import { VentesDvf } from "@/components/VentesDvf";
import { VentesCarte } from "@/components/ventes-dvf/VentesCarte";
import { CarteArrondissement } from "@/components/ventes-dvf/CarteArrondissement";
import { filAriane } from "@/lib/schema";
import { CODES_ARRONDISSEMENTS, historiqueParis, reperesBarometre } from "@/lib/barometre";
import { ventesDvf, type VenteDvf } from "@/lib/ventes-dvf";
import { situer } from "@/lib/situation-paris";
import { imagesPartage } from "@/lib/partage";
import { VISUELS } from "@/lib/visuels";
import { SITE, nombre } from "@/lib/site";

/**
 * Les ventes d'immeubles de rapport à Paris, arrondissement par arrondissement (lot 125, MAV,
 * 15/11/2026 : un historique des ventes comme celui d'un concurrent, « nous en texte », avec la rue,
 * le prix, le type, la date, le rendement, les lots et une photo de la façade).
 *
 * Ce que Google lit : le texte de la page et des agrégats (nombre de ventes, prix médian, part
 * d'immeubles mixtes). Le détail vente par vente se charge ensuite depuis `/api/ventes-dvf/`, fermé
 * aux robots : les conditions de réutilisation de DVF interdisent l'indexation des ventes une par une.
 * Aucune vente ne doit donc être écrite dans le HTML de cette page.
 */
const URL_PAGE = "/ventes-immeubles-paris/";
const TITRE = "Ventes d'immeubles à Paris par arrondissement | France Immeuble";
const DESCRIPTION =
  "Les immeubles de rapport vendus à Paris depuis 2023, arrondissement par arrondissement : rue, prix, prix au m², état locatif et loyers théoriques.";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}${URL_PAGE}` },
  openGraph: { images: imagesPartage("/vendre-un-immeuble/paris/"), type: "website", title: TITRE, description: DESCRIPTION, url: URL_PAGE },
};

const NBSP = " ";
const rang = (n: number) => `${n}${n === 1 ? "er" : "e"}`;
const mediane = (xs: number[]) => {
  if (!xs.length) return null;
  const v = [...xs].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

const pct = (x: number) => `${Math.round(x * 100)}${NBSP}%`;
const prixLisible = (x: number) =>
  x >= 1_000_000
    ? `${(Math.round(x / 100_000) / 10).toLocaleString("fr-FR")}${NBSP}M€`
    : `${nombre(Math.round(x / 10_000) * 10_000)}${NBSP}€`;
const PIECES: Record<number, string> = { 1: "de studios", 2: "de deux pièces", 3: "de trois pièces", 4: "de quatre pièces et plus" };
const liste = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);

/** Sous ce nombre de ventes, l'arrondissement n'a que son compte : une médiane de trois ou quatre ventes en
 * désigne presque une. */
const VENTES_POUR_LE_DETAIL = 5;

/**
 * Le paragraphe de chaque arrondissement (lot 132, MAV, 16/11/2026 : « oui pour les paragraphes »). Des
 * comptes et des médianes seulement, lus par Google : quartiers, logements, surface, appartements par
 * nombre de pièces, prix, rendement théorique. Jamais une vente une par une (conditions de DVF).
 */
function paragrapheArrondissement(
  nom: string,
  siens: VenteDvf[],
  periode: string,
  loyer: (annee: number) => number | null,
  /** Le prix médian au m² de la dernière année (baromètre, trois ventes au moins), et cette année. */
  prixM2: { valeur: number; annee: number } | null,
): string[] {
  const n = siens.length;
  const mixtes = siens.filter((v) => v.mixte).length;
  const phrases: string[] = [];
  // Les quartiers d'au moins deux ventes, les plus fréquents d'abord (trois au plus).
  const parQuartier = new Map<string, number>();
  for (const v of siens) {
    const q = situer(v.lat, v.lon).quartier;
    if (q) parQuartier.set(q, (parQuartier.get(q) ?? 0) + 1);
  }
  const quartiers = [...parQuartier.entries()]
    .filter(([, k]) => k >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n >= 10 ? 3 : 2)
    .map(([q]) => q);
  const ou = quartiers.length
    ? `, surtout dans ${quartiers.length > 1 ? "les quartiers" : "le quartier"} ${liste(quartiers)}`
    : "";
  phrases.push(
    `${periode.charAt(0).toUpperCase() + periode.slice(1)}, ${nombre(n)} immeuble${n > 1 ? "s" : ""} de rapport ${
      n > 1 ? "ont été vendus" : "a été vendu"
    } dans le ${nom}${mixtes === n && n > 1 ? ", tous avec un commerce" : mixtes ? `, dont ${nombre(mixtes)} avec un commerce` : ""}${ou}.`,
  );
  if (n < 3) return phrases;
  const logements = mediane(siens.map((v) => v.logements))!;
  if (n < VENTES_POUR_LE_DETAIL) {
    phrases.push(`Ils comptaient en général ${Math.round(logements)}${NBSP}logements.`);
    if (prixM2) phrases.push(`En ${prixM2.annee}, leur prix médian était de ${nombre(prixM2.valeur)}${NBSP}€ le m².`);
    return phrases;
  }
  const surface = mediane(siens.map((v) => v.surface))!;
  // Lot 134 : les niveaux (BD TOPO de l'IGN), dès cinq immeubles où ils sont connus.
  const niveaux = siens.map((v) => v.niveaux).filter((x): x is number => x != null);
  // Lot 136 (MAV, 17/11/2026) : « si c'est 7 niveaux tu écris R+6 ».
  const enR = niveaux.length >= VENTES_POUR_LE_DETAIL ? `R+${Math.round(mediane(niveaux)!) - 1}` : null;
  phrases.push(
    enR
      ? `En général en ${enR}, ils comptaient ${Math.round(logements)}${NBSP}logements pour ${nombre(Math.round(surface / 10) * 10)}${NBSP}m² environ.`
      : `Ils comptaient en général ${Math.round(logements)}${NBSP}logements, pour ${nombre(Math.round(surface / 10) * 10)}${NBSP}m² environ.`,
  );
  // Lot 135 : l'année de construction médiane, arrondie à la décennie au-dessus (la phrase reste vraie).
  const annees = siens.map((v) => v.anneeConstruction).filter((x): x is number => x != null);
  if (annees.length >= VENTES_POUR_LE_DETAIL) {
    phrases.push(`La moitié d’entre eux datent de ${Math.ceil(mediane(annees)! / 10) * 10} ou d’avant.`);
  }
  // Les appartements, lot par lot (deux appartements identiques comptent pour deux).
  const apparts = siens.flatMap((v) =>
    v.lots.filter((l) => l.type === "Appartement" && l.pieces).flatMap((l) => Array.from({ length: Math.max(1, l.nombre) }, () => l)),
  );
  if (apparts.length >= 20) {
    const parPieces = new Map<number, number>();
    for (const l of apparts) {
      const k = Math.min(4, l.pieces!);
      parPieces.set(k, (parPieces.get(k) ?? 0) + 1);
    }
    const tri = [...parPieces.entries()].sort((a, b) => b[1] - a[1]).filter(([, k]) => k / apparts.length >= 0.1);
    const surfaces = apparts.map((l) => l.surface).filter((x): x is number => !!x);
    if (tri.length && surfaces.length) {
      phrases.push(
        `Leurs appartements font ${Math.round(mediane(surfaces)!)}${NBSP}m² en médiane : ${liste(
          tri.map(([p, k]) => `${pct(k / apparts.length)} ${PIECES[p]}`),
        )}.`,
      );
    }
  }
  phrases.push(
    `Le prix médian d’un immeuble y était de ${prixLisible(mediane(siens.map((v) => v.prix))!)}${
      prixM2 ? `, et de ${nombre(prixM2.valeur)}${NBSP}€ le m² en ${prixM2.annee}` : ""
    }.`,
  );
  const rendements = siens
    .map((v) => {
      const l = loyer(v.annee);
      return l && v.prixM2 ? (l * 12 * 100) / v.prixM2 : null;
    })
    .filter((x): x is number => x != null);
  if (rendements.length >= VENTES_POUR_LE_DETAIL) {
    const r = mediane(rendements)!;
    phrases.push(
      `Au loyer de marché des appartements de l’année de chaque vente, le rendement théorique médian ressort à ${r.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${NBSP}%.`,
    );
  }
  return phrases;
}

export default async function VentesImmeublesParis() {
  const [h, ventes] = await Promise.all([historiqueParis(), ventesDvf(CODES_ARRONDISSEMENTS)]);
  const annees = [...new Set(ventes.map((v) => v.annee))].sort((a, b) => a - b);
  const premiere = annees[0];
  const derniere = annees[annees.length - 1];
  const periode = premiere && derniere && premiere !== derniere ? `de ${premiere} à ${derniere}` : derniere ? `en ${derniere}` : "";
  const reperes = reperesBarometre(h);
  const pictos: NomPicto[] = ["immeubles", "stats", "logement"];

  // Des comptes et des médianes seulement : jamais une vente une par une dans le HTML.
  const arrondissements = CODES_ARRONDISSEMENTS.map((code) => {
    const n = Number(code.slice(3));
    const siens = ventes.filter((v) => v.codeInsee === code);
    const annee = (h.get(code) ?? []).find((a) => a.annee === derniere);
    return {
      code,
      n,
      nom: `${rang(n)} arrondissement`,
      total: siens.length,
      paragraphe: paragrapheArrondissement(
        `${rang(n)} arrondissement`,
        siens,
        periode,
        (an) => (h.get(code) ?? []).find((a) => a.annee === an)?.loyerM2 ?? null,
        annee && annee.nbVentes >= 3 && annee.prixM2Median && derniere ? { valeur: annee.prixM2Median, annee: derniere } : null,
      ),
    };
  });

  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Vendre à Paris", url: "/vendre-un-immeuble/paris/" },
          { nom: "Immeubles vendus à Paris", url: URL_PAGE },
        ])}
      />

      <HeroMedia image={VISUELS.toitsAeriens.src} alt={VISUELS.toitsAeriens.alt}>
        <>
          <Eyebrow>Ventes d’immeubles à Paris</Eyebrow>
          <h1 className="hero-titre">
            {/* Lot 126 (MAV, 16/11/2026 : « Oui ou sinon pas besoin par arrondissement ») : titre court. */}
            Les immeubles de rapport <span className="accent">vendus à Paris</span>
          </h1>
          <p className="lead">
            Chaque vente d’immeuble enregistrée par l’État {periode}&nbsp;: la rue, le prix, la surface et l’état locatif
            lot par lot. Choisissez votre arrondissement.
          </p>
          <div className="btn-row">
            <Button href="#estimer" icone>Estimer mon immeuble</Button>
          </div>
        </>
      </HeroMedia>

      <section className="section section--creme vdvf-intro">
        <div className="container vdvf-colonne">
          {reperes.length === 3 && (
            <ul className="article-chiffres" aria-label="Les ventes d’immeubles à Paris" style={{ ["--n" as string]: 3 }}>
              {reperes.map((r, i) => (
                <li key={r.libelle}>
                  <Picto nom={pictos[i]} taille={26} />
                  <span className="article-chiffres__val">{r.valeur}</span>
                  <span className="article-chiffres__lib">{r.libelle}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="prose">
            <p>
              Un immeuble de rapport vendu en bloc à Paris, c’est en général un immeuble ancien de six à quinze
              logements, souvent avec un commerce au rez-de-chaussée. Il s’en vend de cent à cent cinquante par an.
              Voici ces ventes {periode}, arrondissement par arrondissement, avec la rue, la date, le prix, le prix
              au m² et le détail des lots avec leur loyer théorique.
            </p>
            <p>
              Ces ventes viennent des actes enregistrés par l’administration fiscale (DVF). Nous les avons relevées
              une à une et nous n’affichons pas le numéro dans la rue, par discrétion pour les vendeurs.
            </p>
          </div>
          <nav className="vdvf-sommaire" aria-label="Arrondissements">
            {arrondissements.map((a) =>
              a.total ? (
                <a key={a.code} href={`#arr-${a.n}`}>
                  {rang(a.n)}
                  <span>{a.total}</span>
                </a>
              ) : (
                <span key={a.code} className="vdvf-sommaire__vide">{rang(a.n)}</span>
              ),
            )}
          </nav>
        </div>
      </section>

      {/* Lot 127 (MAV, 16/11/2026) : toutes les ventes sur la carte, en couleur selon le prix au m² ou le
          rendement ; la fiche de la vente au survol. Le détail arrive par l'API, hors HTML. */}
      <section className="section section--noir-2 vcarte-sec" aria-labelledby="titre-carte">
        <div className="container">
          <Eyebrow bare>La carte des ventes</Eyebrow>
          <h2 id="titre-carte">
            Les immeubles vendus à Paris <span className="accent">sur la carte</span>
          </h2>
          <p className="lead">
            Chaque point est un immeuble vendu {periode}. Sa couleur dit son prix au m² ou son rendement théorique,
            du bronze foncé pour les plus bas au bronze clair pour les plus hauts.
          </p>
          <VentesCarte />
        </div>
      </section>

      <section className="section section--creme vdvf-sec">
        <div className="container vdvf-colonne">
          {arrondissements
            .filter((a) => a.total)
            .map((a) => (
              <section key={a.code} id={`arr-${a.n}`} className="vdvf-arr">
                {/* MAV, 16/11/2026 : « un surtitre vente d'immeuble dans le x arrondissement et juste en dessous
                    un gros titre en or avec écrit juste l'arrondissement ». Le surtitre porte le H2 (texte
                    complet pour Google), le grand titre en or est visuel. */}
                <header className="vdvf-arr__tete">
                  <Eyebrow as="h2" bare>Ventes d’immeubles dans le {a.nom}</Eyebrow>
                  <p className="vdvf-arr__titre" aria-hidden="true">{a.nom}</p>
                  <p className="vdvf-arr__n">
                    {nombre(a.total)} vente{a.total > 1 ? "s" : ""} {periode}
                  </p>
                  <CarteArrondissement code={a.code} />
                </header>
                <p className="vdvf-arr__resume">
                  {a.paragraphe.join(" ")}
                </p>
                <VentesDvf code={a.code} nom={a.nom} />
              </section>
            ))}
        </div>
      </section>

      <section className="section section--noir-2 vdvf-lire">
        <div className="container vdvf-colonne">
          <Eyebrow bare>Lire ces ventes</Eyebrow>
          <h2>
            Ce que disent ces chiffres, <span className="accent">et ce qu’ils ne disent pas</span>
          </h2>
          <div className="prose">
            <p>
              Le prix est celui de l’acte, hors frais de notaire. Le prix au m² le rapporte à la surface de tous les
              locaux, commerces compris. Les lots sont ceux de l’acte, avec leur type et leur surface, sans les caves
              ni les parkings. Le loyer réel de chaque lot n’est pas connu : le loyer théorique du tableau lui applique le
              loyer de marché des appartements de l’année, commerces compris.
            </p>
            <p>
              Le rendement théorique suppose tous les logements loués au loyer de marché de l’année (carte des loyers de
              l’État). Beaucoup d’immeubles parisiens sont loués moins cher, et leur rendement réel se calcule avec
              leurs baux.
            </p>
          </div>
        </div>
      </section>

      <section id="estimer" className="section section--noir section--ecran sec-formulaire">
        <FondPhoto image="/media/atouts/signature-dossier.webp" position="40% center" clair />
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Votre immeuble</Eyebrow>
            <h2>
              Combien vaut <span className="accent">votre immeuble&nbsp;?</span>
            </h2>
            <p className="lead">
              Ces ventes donnent une idée du marché. Pour le prix de votre immeuble, nous étudions ses baux, son état
              et les acheteurs qui le recherchent. L’estimation est gratuite et confidentielle.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href={SITE.telHref} variant="outline">Préférer le téléphone · {SITE.tel}</Button>
            </div>
          </Reveal>
          <EstimationForm formulaire="vendre" libelleEnvoi="Estimer mon immeuble" />
        </div>
      </section>

      <BoutonFixeMobile href="#estimer" cible="estimer" libelle="Estimer mon immeuble" />
    </>
  );
}
