import type { Metadata } from "next";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { Picto } from "@/components/Picto";
import { JsonLd } from "@/components/JsonLd";
import { filAriane } from "@/lib/schema";
import { VISUELS } from "@/lib/visuels";
import { SITE } from "@/lib/site";

/**
 * /nos-honoraires/ — le barème de l'agence en page, à la place du PDF « Tarifs 2022 »
 * (MAV, 09/11/2026 : « que le barème sur le site ne soit plus en pdf mais que ce soit une
 * page, et qu'on y mette aussi les prix de la vente à la découpe »). Les chiffres sont
 * ceux du PDF de 2022 et de la page Vendre à la découpe, sans rien changer.
 */
export const metadata: Metadata = {
  title: "Barème de nos honoraires",
  description:
    "Les honoraires de France Immeuble pour vendre un immeuble de rapport : de 3 à 5 % selon le prix, dus seulement à la signature de l’acte. Et les tarifs de la vente à la découpe.",
  alternates: { canonical: `${SITE.url}/nos-honoraires/` },
};

const TRANCHES = [
  { prix: "Moins de 5 000 000 €", taux: "5 %", note: "Minimum 10 000 €" },
  { prix: "De 5 000 000 à 10 000 000 €", taux: "4 %", note: "Minimum 250 000 €" },
  { prix: "Plus de 10 000 000 €", taux: "3 %", note: "Minimum 400 000 €" },
];

export default function NosHonoraires() {
  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: "Accueil", url: "/" },
          { nom: "Nos honoraires", url: "/nos-honoraires/" },
        ])}
      />
      <HeroMedia image={VISUELS.skylineCrepuscule.src} alt={VISUELS.skylineCrepuscule.alt}>
        <>
          <Eyebrow>Nos honoraires</Eyebrow>
          <h1>
            Le barème de nos <span className="accent">honoraires</span>
          </h1>
          <p className="lead">
            De 3 à 5 % du prix selon la taille de l’immeuble, dus seulement à la signature de
            l’acte définitif chez le notaire. Tant que la vente n’est pas signée, vous ne payez rien.
          </p>
          <div className="btn-row">
            <Button href="/estimer-un-immeuble/#estimer" icone>Estimer mon immeuble</Button>
          </div>
        </>
      </HeroMedia>

      <section className="section section--noir-2 bareme-sec">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>Vente en bloc et recherche</Eyebrow>
            <h2>Vendre un immeuble <span className="accent">en bloc</span></h2>
            <p className="lead">
              Le même taux quel que soit le mandat : unique, simple, semi-exclusif ou exclusif. Il
              s’applique aussi aux mandats de recherche.
            </p>
          </Reveal>
          <Reveal>
            <ul className="tarifs">
              {TRANCHES.map((t) => (
                <li key={t.prix}>
                  <Picto nom="euro" taille={24} className="tarifs__picto" />
                  <span className="tarifs__nom">{t.prix}</span>
                  <span className="tarifs__val">{t.taux} TTC</span>
                  <span className="tarifs__note">{t.note}</span>
                </li>
              ))}
            </ul>
            <p className="tableau__note">
              Prix de l’immeuble et honoraires exprimés TTC, TVA au taux légal de 20 %. Honoraires
              à la charge de l’acquéreur, sauf en cas de vente avec un monolocataire. Ils ne sont
              dus qu’à la signature de l’acte authentique.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--noir bareme-sec">
        <div className="container container--narrow">
          <Reveal className="section__head">
            <Eyebrow>Vente à la découpe</Eyebrow>
            <h2>Vendre <span className="accent">lot par lot</span></h2>
            <p className="lead">
              Deux missions : la structuration de la copropriété, puis la vente des lots. Seuls
              5 000 € TTC sont exigibles à la signature ; le reste des frais de structuration est dû
              à la première vente d’un lot.
            </p>
          </Reveal>
          <Reveal>
            <ul className="tarifs">
              {/* MAV, 09/11/2026 : seuls 5 000 € TTC à la signature, le reste à la première vente. */}
              <li>
                <Picto nom="dossier" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">À la signature du contrat de structuration</span>
                <span className="tarifs__val">5 000 € TTC</span>
                <span className="tarifs__note">
                  Seule somme exigible à la signature. Le reste des forfaits de structuration est
                  exigé à la première vente d’un lot.
                </span>
              </li>
              <li>
                <Picto nom="profil" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">Forfait de structuration, par lot occupé</span>
                <span className="tarifs__val">2 000 € TTC</span>
              </li>
              <li>
                <Picto nom="logement" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">Forfait de structuration, par lot vide</span>
                <span className="tarifs__val">1 500 € TTC</span>
              </li>
              <li>
                <Picto nom="euro" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">Commission de vente, par lot</span>
                <span className="tarifs__val">5 % TTC</span>
                <span className="tarifs__note">À la charge du vendeur, exigible à chaque acte authentique.</span>
              </li>
              <li>
                <Picto nom="poignee" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">Vente à un locataire qui préempte</span>
                <span className="tarifs__val">− 20 % sur la commission</span>
              </li>
              <li>
                <Picto nom="technique" taille={24} className="tarifs__picto" />
                <span className="tarifs__nom">Coordination des travaux</span>
                <span className="tarifs__val">0 % ou 3 % TTC</span>
                <span className="tarifs__note">
                  Sans honoraires lorsque les travaux passent par La Team Reno, 3 % du montant
                  coordonné avec une entreprise extérieure.
                </span>
              </li>
            </ul>
            <p className="tableau__note">
              Les frais des autres intervenants (géomètre, notaire, diagnostics, syndic) sont réglés
              directement par le mandant, sans marge de notre part.
            </p>
          </Reveal>
          <div className="btn-row" style={{ justifyContent: "center", marginTop: "var(--space-m)" }}>
            <Button href="/vendre-a-la-decoupe/">Voir la vente à la découpe</Button>
          </div>
          <p className="tableau__note bareme-legal">
            France Immeuble SAS au capital de 100 000 €, APE 6831Z. RCS Paris, SIREN 835 369 562,
            TVA FR14835369562. Garantie financière Galian 120 000 €, RCP MMA Entreprises
            n° 120137405. Carte professionnelle transactions CPI 7501 2018 000 026 004 délivrée par
            la CCI Paris Île-de-France.
          </p>
        </div>
      </section>

    </>
  );
}
