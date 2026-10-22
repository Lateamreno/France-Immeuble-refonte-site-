import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { Picto } from "@/components/Picto";
import { ContactForm } from "@/components/ContactForm";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { SITE } from "@/lib/site";
import { bienAVendre, prix } from "@/lib/biens";

/**
 * Fiche d'un immeuble à vendre.
 *
 * Données déposées par le BO, jamais saisies ici. Pas d'adresse, pas de
 * coordonnées : la commune et le département situent, la visite fait le reste.
 * La demande de dossier part avec la référence du bien, pour que l'agent sache
 * de quel immeuble on parle sans avoir à le demander.
 */
export const revalidate = 600;

type Params = { params: Promise<{ slug: string }> };

const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const b = await bienAVendre(slug);
  if (!b) return { title: { absolute: "Immeuble introuvable | France Immeuble" }, robots: { index: false } };
  const titre = `${b.titre} — ${b.ville} (${b.dept}) | France Immeuble`;
  const desc = [
    `${b.type} à ${b.ville}`,
    b.surface !== null ? `${Math.round(b.surface)} m²` : null,
    b.lots !== null ? `${b.lots} lots` : null,
    `${prix(b.prixHai)}`,
    b.rendement !== null ? `rendement brut ${pct(b.rendement)}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  return {
    title: { absolute: titre },
    description: `${desc}. Dossier complet sur demande.`,
    alternates: { canonical: `${SITE.url}/immeubles-a-vendre/${b.slug}/` },
    openGraph: b.images[0] ? { images: [b.images[0]] } : undefined,
  };
}

export default async function FicheBien({ params }: Params) {
  const { slug } = await params;
  const b = await bienAVendre(slug);
  if (!b) notFound();

  /* Seules les lignes renseignées s'affichent : une fiche à trous (« DPE : — »)
     fait plus amateur qu'une fiche courte. */
  const faits: [string, string][] = [
    ["Type", b.type],
    b.surface !== null ? ["Surface", `${Math.round(b.surface).toLocaleString("fr-FR")} m²`] : null,
    b.lots !== null ? ["Lots", String(b.lots)] : null,
    b.anneeConstruction !== null ? ["Construction", String(b.anneeConstruction)] : null,
    b.occupation !== null ? ["Occupation", pct(b.occupation)] : null,
    b.loyerHcAn !== null ? ["Loyer annuel HC", prix(b.loyerHcAn)] : null,
    b.rendement !== null ? ["Rendement brut", pct(b.rendement)] : null,
    b.prixM2 !== null ? ["Prix au m²", prix(b.prixM2)] : null,
    b.dpe !== null ? ["DPE", b.dpe] : null,
  ].filter((f): f is [string, string] => f !== null);

  const paragraphes = (b.description ?? "")
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Biens à vendre", url: "/immeubles-a-vendre/" },
          { nom: b.titre, url: `/immeubles-a-vendre/${b.slug}/` },
        ])}
      />

      <section className="section section--noir fiche-bien">
        <div className="container">
          <div className="fiche-bien__tete">
            <Eyebrow>
              {b.ville} ({b.dept})
              {b.statut === "sous_offre" ? " · sous offre" : ""}
            </Eyebrow>
            <h1>{b.titre}</h1>
            <p className="fiche-bien__prix">
              {prix(b.prixHai)}
              <span> honoraires inclus</span>
            </p>
          </div>

          {b.images.length > 0 ? (
            <div className={`galerie galerie--${Math.min(b.images.length, 5)}`}>
              {b.images.slice(0, 5).map((src, i) => (
                <span key={src} className="galerie__case">
                  <Image
                    src={src}
                    alt={i === 0 ? `${b.type} à ${b.ville}` : ""}
                    fill
                    sizes={i === 0 ? "(max-width: 900px) 100vw, 60vw" : "(max-width: 900px) 50vw, 20vw"}
                    className="galerie__img"
                    priority={i === 0}
                  />
                </span>
              ))}
            </div>
          ) : (
            <div className="galerie galerie--vide" aria-hidden="true">
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
              <dl className="faits">
                {faits.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              {b.travaux && (
                <p className="faits__note">
                  <strong>Travaux à prévoir.</strong> {b.travaux}
                </p>
              )}
            </Reveal>
          </div>

          <div>
            {paragraphes.length > 0 && (
              <Reveal className="fiche-bien__texte">
                <Eyebrow>Description</Eyebrow>
                {paragraphes.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Reveal>
            )}
            <p className="fiche-bien__adresse">
              L’adresse exacte, l’état locatif lot par lot et les documents sont transmis avec le
              dossier, sur demande.
            </p>
          </div>
        </div>
      </section>

      <section id="dossier" className="section section--noir">
        <div className="container split">
          <Reveal>
            <Eyebrow bare>Recevoir le dossier</Eyebrow>
            <h2>Cet immeuble vous intéresse&nbsp;?</h2>
            <p className="lead">
              Laissez votre numéro&nbsp;: un agent vous rappelle avec l’adresse, l’état locatif et
              les documents.
            </p>
            <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
              <Button href={SITE.telHref}>
                Appeler · {SITE.tel}
              </Button>
              <Button href="/immeubles-a-vendre/" variant="outline">
                Tous les biens
              </Button>
            </div>
          </Reveal>
          <ContactForm bien={{ ref: b.id, titre: `${b.titre} — ${b.ville}` }} />
        </div>
      </section>
    </>
  );
}
