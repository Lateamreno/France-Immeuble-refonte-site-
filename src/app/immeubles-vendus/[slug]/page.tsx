import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { Picto } from "@/components/Picto";
import { CarteVente, surfaceVente, delaiOffre } from "@/components/CarteVente";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { SITE } from "@/lib/site";
import {
  prix, ventes, venteParSlug, nouveauSlugVente, venteIndexable, AFFICHER_ECART_ESTIMATION, LIBELLE_ECART,
  type Vente,
} from "@/lib/biens";

/**
 * Fiche d'une vente réalisée — un cas pratique.
 *
 * Ce que personne d'autre ne peut publier : une vraie transaction, avec son
 * déroulé. Le BO dépose les faits et un récit rédigé à partir d'eux, que MAV
 * relit et valide avant tout dépôt (§8). Sans récit validé, la fiche reste
 * consultable mais n'est pas indexée (voir `venteIndexable`).
 *
 * Commune, rue sans numéro, fourchettes, profils : jamais le numéro, jamais un
 * nom. La rue vit dans son propre champ (décision de MAV, 21/10/2026) ; la base
 * refuse un texte qui contient une adresse (0003) et une rue avec un chiffre (0004).
 */
export const revalidate = 600;

type Params = { params: Promise<{ slug: string }> };

const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

const ACQUEREURS: Record<string, string> = {
  Investisseur: "Investisseur",
  "Marchand de biens": "Marchand de biens",
  Patrimonial: "Acquéreur patrimonial",
  Promoteur: "Promoteur",
};
const MODES: Record<string, string> = {
  off_market: "Off-market, sans annonce",
  diffusion: "Annonces",
  mixte: "Off-market, puis annonces",
};

function titreVente(v: Vente) {
  return v.titre ?? `${v.type ?? "Immeuble de rapport"} vendu à ${v.ville}`;
}

export async function generateStaticParams() {
  return (await ventes()).map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const v = await venteParSlug(slug);
  if (!v) return { title: { absolute: "Vente introuvable | France Immeuble" }, robots: { index: false } };
  const desc =
    v.seoDesc ??
    v.chapo ??
    [
      `${v.type ?? "Immeuble de rapport"} vendu ${prix(v.prix)} à ${v.ville} (${v.dept})`,
      v.lots ? `${v.lots} lots` : null,
      v.rendement !== null && v.rendement !== undefined ? `rendement brut ${pct(v.rendement)}` : null,
    ]
      .filter(Boolean)
      .join(", ") + ".";
  return {
    // Le title suit une forme fixe, faite pour la requête : le titre éditorial
    // du BO (le h1) peut être une phrase, il ne se prête pas à l'onglet.
    title: {
      absolute:
        v.seoTitle ??
        `${v.type ?? "Immeuble de rapport"} vendu à ${v.ville} (${v.dept}) | France Immeuble`,
    },
    description: desc,
    alternates: { canonical: `${SITE.url}/immeubles-vendus/${v.slug}/` },
    robots: venteIndexable(v) ? undefined : { index: false, follow: true },
    openGraph: v.image ? { images: [v.image] } : undefined,
  };
}

/** Récit déposé par le BO : paragraphes séparés par une ligne vide, intertitres en « ## ». */
function Recit({ texte }: { texte: string }) {
  const blocs = texte.split(/\r?\n\s*\r?\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocs.map((b, i) =>
        b.startsWith("## ") ? (
          <h2 key={i}>{b.slice(3).trim()}</h2>
        ) : b.startsWith("### ") ? (
          <h3 key={i}>{b.slice(4).trim()}</h3>
        ) : (
          <p key={i}>{b.replace(/\s*\n\s*/g, " ")}</p>
        ),
      )}
    </>
  );
}

function Faits({ lignes }: { lignes: ([string, ReactNode] | null | false)[] }) {
  const pleines = lignes.filter((l): l is [string, ReactNode] => Boolean(l));
  if (pleines.length === 0) return null;
  return (
    <dl className="faits">
      {pleines.map(([k, val]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{val}</dd>
        </div>
      ))}
    </dl>
  );
}

const rempli = <T,>(x: T | null | undefined): x is T => x !== null && x !== undefined;

export default async function FicheVente({ params }: Params) {
  const { slug } = await params;
  const [v, toutes] = await Promise.all([venteParSlug(slug), ventes()]);
  if (!v) {
    // Ancienne adresse à l'année (« …-pantin-2019 ») : redirection définitive.
    const nouveau = await nouveauSlugVente(slug);
    if (nouveau) permanentRedirect(`/immeubles-vendus/${nouveau}/`);
    notFound();
  }

  /* Maillage : les ventes du même département, à défaut les autres, du prix
     le plus élevé au plus modeste (pas de tri par date : MAV, 21/10/2026).
     Chaque fiche relie ainsi les autres, et Google les découvre toutes. */
  const ailleurs = toutes.filter((x) => x.id !== v.id).sort((a, b) => b.prix - a.prix);
  const voisines = ailleurs.filter((x) => x.dept === v.dept);
  const autres = (voisines.length > 0 ? voisines : ailleurs).slice(0, 3);

  const immeuble: ([string, ReactNode] | null | false)[] = [
    ["Commune", `${v.ville} (${v.dept})`],
    rempli(v.rue) && ["Rue", v.rue],
    rempli(v.arrondissement) && ["Secteur", v.arrondissement],
    ["Type", v.type ?? "Immeuble de rapport"],
    rempli(v.lots) && ["Lots", String(v.lots)],
    rempli(surfaceVente(v)) && ["Surface", surfaceVente(v)],
    rempli(v.epoque) && ["Époque", v.epoque],
    rempli(v.occupation) && ["Occupation", pct(v.occupation)],
    rempli(v.loyerPotentiel) && ["Loyer potentiel", `${prix(v.loyerPotentiel)}/an`],
    rempli(v.rendement) && ["Rendement brut", pct(v.rendement)],
    rempli(v.dpe) && ["DPE", v.dpe],
  ];
  const vente: ([string, ReactNode] | null | false)[] = [
    ["Prix de vente", prix(v.prix)],
    AFFICHER_ECART_ESTIMATION && rempli(v.ecartEstimation) && [
      LIBELLE_ECART,
      `${v.ecartEstimation > 0 ? "+" : ""}${pct(v.ecartEstimation)}`,
    ],
    rempli(v.delaiOffreJours) && ["De la mise en vente à l’offre", delaiOffre(v.delaiOffreJours)],
    rempli(v.modeCommercialisation) && ["Commercialisation", MODES[v.modeCommercialisation]],
    rempli(v.delaiSemaines) && [
      "Du mandat au compromis",
      `${v.delaiSemaines} semaine${v.delaiSemaines > 1 ? "s" : ""}`,
    ],
    rempli(v.acquereursSollicites) && ["Acquéreurs sollicités", String(v.acquereursSollicites)],
    rempli(v.visites) && ["Visites", String(v.visites)],
    rempli(v.offres) && ["Offres reçues", String(v.offres)],
    rempli(v.profilAcquereur) && ["Acquéreur", ACQUEREURS[v.profilAcquereur] ?? v.profilAcquereur],
    rempli(v.profilVendeur) && ["Vendeur", v.profilVendeur],
  ];
  const recit = v.recit && v.recitValideLe ? v.recit : null;
  const titre = titreVente(v);

  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Biens vendus", url: "/immeubles-vendus/" },
          { nom: titre, url: `/immeubles-vendus/${v.slug}/` },
        ])}
      />
      {recit && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: titre,
            description: v.chapo ?? undefined,
            image: v.image ? [v.image.startsWith("/") ? `${SITE.url}${v.image}` : v.image] : undefined,
            datePublished: v.recitValideLe,
            author: { "@id": `${SITE.url}/#organisation` },
            publisher: { "@id": `${SITE.url}/#organisation` },
            mainEntityOfPage: `${SITE.url}/immeubles-vendus/${v.slug}/`,
            about: { "@type": "Place", name: `${v.ville} (${v.dept})` },
          }}
        />
      )}

      {/* Texte et photo côte à côte : les photos de vente font 1 200 px de
          large, étirées sur toute la largeur elles deviendraient floues. */}
      <section className="section section--noir fiche-bien">
        <div className="container fiche-vente__haut">
          <div className="fiche-bien__tete">
            <Eyebrow>
              Vendu · {v.ville} ({v.dept})
            </Eyebrow>
            <h1>{titre}</h1>
            <p className="fiche-bien__prix">
              {prix(v.prix)}
              <span> honoraires inclus</span>
            </p>
            {v.chapo && <p className="lead fiche-vente__chapo">{v.chapo}</p>}
          </div>

          {v.image ? (
            <div className="galerie galerie--1 fiche-vente__photo">
              <span className="galerie__case">
                <Image
                  src={v.image}
                  alt={`${v.type ?? "Immeuble de rapport"} vendu à ${v.ville}`}
                  fill
                  sizes="(max-width: 900px) 100vw, 45vw"
                  className="galerie__img"
                  priority
                />
              </span>
            </div>
          ) : (
            <div className="galerie galerie--vide fiche-vente__photo" aria-hidden="true">
              <Picto nom="immeubles" taille={56} />
            </div>
          )}
        </div>
      </section>

      <section className="section section--creme">
        <div className="container split split--sticky">
          <div className="split__aside">
            <Reveal>
              <Eyebrow>L’immeuble</Eyebrow>
              <Faits lignes={immeuble} />
              {v.composition && <p className="faits__note">{v.composition}</p>}
              <div style={{ marginTop: "var(--space-m)" }}>
                <Eyebrow>La vente</Eyebrow>
                <Faits lignes={vente} />
              </div>
            </Reveal>
          </div>

          <div>
            {recit ? (
              <Reveal className="fiche-bien__texte fiche-vente__recit">
                <Recit texte={recit} />
              </Reveal>
            ) : (
              <Reveal className="fiche-bien__texte">
                <Eyebrow>Cette vente</Eyebrow>
                <p>
                  {v.type ?? "Immeuble de rapport"} vendu {prix(v.prix)} honoraires inclus à{" "}
                  {v.ville}
                  {v.rue ? `, ${v.rue}` : ""}.
                </p>
              </Reveal>
            )}
            <p className="fiche-bien__adresse">
              Le numéro de rue et le nom des parties restent confidentiels.
              {!v.surface && rempli(v.surfaceMin) && " La surface est donnée par tranche."}
            </p>
          </div>
        </div>
      </section>

      <section className="section section--noir">
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Votre immeuble</Eyebrow>
            <h2>Un immeuble comparable à vendre&nbsp;?</h2>
            <p className="lead">
              Nous l’estimons gratuitement et le présentons d’abord à notre
              fichier d’acquéreurs, sans annonce si vous le souhaitez.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="/estimer-un-immeuble/" variant="primary" icone>
                Estimer mon immeuble
              </Button>
              <Button href={SITE.telHref} variant="outline">
                Appeler · {SITE.tel}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {autres.length > 0 && (
        <section className="section section--creme">
          <div className="container">
            <Reveal className="section__head">
              <Eyebrow>Autres ventes</Eyebrow>
              <h2>
                {voisines.length > 0 ? `Nos autres ventes dans le ${v.dept}` : "Nos ventes récentes"}
              </h2>
            </Reveal>
            <ul className="ventes">
              {autres.map((x, i) => (
                <Reveal key={x.id} as="li" className="vente" delayIndex={i}>
                  <CarteVente v={x} />
                </Reveal>
              ))}
            </ul>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href="/immeubles-vendus/" variant="ghost-dark">
                Toutes nos ventes
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
