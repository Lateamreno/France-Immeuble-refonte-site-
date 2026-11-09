import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { Picto, type NomPicto } from "@/components/Picto";
import { ContactForm } from "@/components/ContactForm";
import { JsonLd } from "@/components/JsonLd";
import { CarteBien } from "@/components/CarteBien";
import { filAriane } from "@/lib/schema";
import { SITE } from "@/lib/site";
import { biensAVendre, lotsDuBien, type BienAVendre, type LotAnnonce } from "@/lib/biens";
import {
  charges, classeDpe, decomposition, eur, etiquetteDpe, fraisNotaire, libelleOccupation, lienCarte,
  m2, pct, rendementAffiche, rendements,
} from "@/lib/annonce";
import { similaires } from "@/lib/recherche-biens";
import { secteurDe } from "@/lib/compte/secteur";
import { marcheDuBien, ecartPct, type Marche } from "@/lib/marche";
import { GalerieAnnonce } from "@/components/biens/GalerieAnnonce";
import { CarteAction } from "@/components/biens/CarteAction";

/**
 * Fiche d'un immeuble à vendre, sur le modèle de Plein Bail (spec du 30/10/2026,
 * §11 et §12) : à gauche la galerie, les tuiles chiffrées avec leur formule,
 * la description, l'état locatif lot par lot, nos ventes du département,
 * l'état financier complet et les mentions réglementaires ; à droite la carte
 * d'action collante (prix, favoris, numéro, contact, simulation, offre).
 *
 * Données déposées par le BO, jamais saisies ici. Pas d'adresse, pas de
 * coordonnées : le code postal et la commune situent. La page reste en cache ;
 * ce qui dépend du visiteur (favori, offre déjà faite) est lu par le navigateur.
 */
export const revalidate = 600;

type Params = { params: Promise<{ slug: string }> };

const TYPES_LOT: Record<LotAnnonce["type"], [string, NomPicto]> = {
  habitation: ["Habitation", "logement"], commerce: ["Commerce", "commerce"], bureau: ["Bureau", "business"],
  activite: ["Activité", "entrepot"], parking: ["Parking", "parking"], cave: ["Cave", "cave"], autre: ["Autre", "autre"],
};
const BAUX: Record<string, string> = {
  nu: "Habitation", meuble: "Meublé", commercial: "Bail commercial", professionnel: "Professionnel",
  derogatoire: "Dérogatoire", mixte: "Mixte", saisonnier: "Saisonnier", autre: "Autre",
};
const ETATS: Record<string, string> = { a_rafraichir: "À rafraîchir", a_renover: "À rénover" };
const date = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const b = (await biensAVendre()).find((x) => x.slug === slug);
  if (!b) return { title: { absolute: "Cette annonce n’est plus en ligne | France Immeuble" }, robots: { index: false } };
  const r = rendementAffiche(b);
  const desc = [
    `${b.type} à ${b.ville}`,
    b.surface !== null ? `${Math.round(b.surface)} m²` : null,
    b.lots !== null ? `${b.lots} lots` : null,
    eur(b.prixHai),
    r !== null ? `rendement brut ${pct(r)}` : null,
  ].filter(Boolean).join(", ");
  return {
    title: { absolute: `${b.titre} | France Immeuble` },
    description: `${desc}. État locatif, état financier et simulation en ligne.`,
    alternates: { canonical: `${SITE.url}/immeubles-a-vendre/${b.slug}/` },
    openGraph: b.images[0] ? { images: [b.images[0]] } : undefined,
  };
}

/** Une tuile chiffrée ; « i » donne sa formule, sans JavaScript. */
/** `ecart` colore la ligne du dessous : or quand c'est favorable à l'acquéreur, noir sinon (MAV, 03/11/2026). */
function Tuile({ titre, valeur, sous, formule, ecart, children }: { titre: string; valeur?: string; sous?: string | null; formule: string; ecart?: "bien" | "moins" | null; children?: React.ReactNode }) {
  return (
    <div className="tuile-pb">
      <dt>
        {titre}
        <details className="tuile-pb__info">
          <summary aria-label={`Comment est calculé : ${titre}`}>i</summary>
          <p>{formule}</p>
        </details>
      </dt>
      <dd>{children ?? valeur}{sous && <small className={ecart ? `ecart--${ecart}` : undefined}>{sous}</small>}</dd>
    </div>
  );
}

/** Le marché de la ville, calculé comme sur Plein Bail (src/lib/marche.ts). */
function BlocMarche({ marche: m, ville, dept }: { marche: Marche; ville: string; dept: string }) {
  const ou = (e: Marche["prixEchelle"]) => (e === "commune" ? ville : `département ${dept}`);
  return (
    <Reveal className="fiche-pb__bloc">
      <h2 className="fiche-pb__h2">{`Le marché à ${ville}`}</h2>
      <dl className="faits faits--marche">
        {m.prixM2 != null && (
          <div><dt>Prix médian au m²</dt><dd>{eur(m.prixM2)}
            <small>{`appartements, ${ou(m.prixEchelle)}, ${m.prixFenetreMois} derniers mois, ${m.nbVentes} ventes`}</small></dd></div>
        )}
        {m.loyerM2 != null && (
          <div><dt>Loyer médian au m²</dt><dd>{`${m.loyerM2.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} € / mois`}
            <small>{`appartements, charges comprises, ${ou(m.loyerEchelle)}`}</small></dd></div>
        )}
        {m.rentaVille != null && (
          <div><dt>Rentabilité moyenne de la ville</dt><dd>{pct(m.rentaVille, 1)}
            <small>{m.rentaAVerifier ? "chiffre élevé, à vérifier" : "loyer × 12 ÷ prix au m²"}</small></dd></div>
        )}
      </dl>
      <p className="faits__note">
        Données Plein Bail, à partir des ventes DVF (DGFiP) et de la carte des loyers de l’ANIL (estimations à partir
        des données du Groupe SeLoger et de leboncoin).
      </p>
    </Reveal>
  );
}

function EtatLocatif({ lots }: { lots: LotAnnonce[] }) {
  const potentiel = (l: LotAnnonce) => (l.statut === "occupe" ? l.loyerHcMois : l.loyerMarcheMois ?? l.loyerHcMois) ?? 0;
  const surface = lots.reduce((s, l) => s + (l.surface ?? 0), 0);
  const loyer = lots.reduce((s, l) => s + potentiel(l), 0);
  const travaux = lots.reduce((s, l) => s + (l.travaux ?? 0), 0);
  const datesBail = lots.filter((l) => l.bailDebut || l.bailFin);
  return (
    <>
      <div className="tableau-defile">
        <table className="etat-locatif">
          <thead>
            <tr><th scope="col">Lot</th><th scope="col">Type</th><th scope="col">Bail</th><th scope="col">Surface</th><th scope="col">Loyer HC/mois</th><th scope="col">DPE</th><th scope="col">Travaux</th></tr>
          </thead>
          <tbody>
            {lots.map((l) => {
              const [nomType, picto] = TYPES_LOT[l.type];
              const sous = [
                l.etat && l.etat !== "bon" ? ETATS[l.etat] : null,
                l.chargesMois ? `+ ${eur(l.chargesMois)} de charges` : null,
                l.disponibleLe ? `Disponible le ${date(l.disponibleLe)}` : null,
              ].filter(Boolean);
              return (
                <tr key={l.numero}>
                  <th scope="row">{l.numero}{(l.typologie || l.etage) && <small>{[l.typologie, l.etage].filter(Boolean).join(" · ")}</small>}</th>
                  <td><span className="etat-locatif__type"><Picto nom={picto} taille={16} aria-hidden="true" />{nomType}</span></td>
                  <td>{l.statut === "libre" ? <span className="etat-locatif__libre">Libre</span> : l.bail ? BAUX[l.bail] ?? l.bail : "Occupé"}</td>
                  <td className="nombre">{l.surface != null ? m2(l.surface) : "—"}</td>
                  <td className="nombre">
                    {l.statut === "libre"
                      ? l.loyerMarcheMois != null ? <>{eur(l.loyerMarcheMois)}<small>loyer de marché</small></> : "—"
                      : l.loyerHcMois != null ? eur(l.loyerHcMois) : "—"}
                    {sous.length > 0 && <small>{sous.join(" · ")}</small>}
                  </td>
                  <td>{l.dpe ? <span className={`dpe-etiquette dpe-etiquette--${l.dpe.toLowerCase()}`}>{l.dpe}</span> : "n.c."}</td>
                  <td className="nombre">{l.travaux ? eur(l.travaux) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>TOTAL <small>loyer potentiel</small></th>
              <td className="nombre">{surface ? m2(surface) : "—"}</td>
              <td className="nombre">{eur(loyer)}<small>{eur(loyer * 12)} par an</small></td>
              <td />
              <td className="nombre">{travaux ? eur(travaux) : "—"}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {datesBail.length > 0 && (
        <details className="replie">
          <summary>Afficher les dates de bail</summary>
          <ul>
            {datesBail.map((l) => (
              <li key={l.numero}>{l.numero} : {l.bailDebut ? `depuis le ${date(l.bailDebut)}` : ""}{l.bailDebut && l.bailFin ? ", " : ""}{l.bailFin ? `échéance le ${date(l.bailFin)}` : ""}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

/**
 * Un bloc de l'état financier (retour #114, MAV, 02/11/2026 : « structure le
 * mieux, quitte à mettre des pictos ») : picto, titre et le chiffre qui compte
 * en tête, le détail dessous.
 */
function BlocFinancier({ picto, titre, chiffre, libelle, children }: {
  picto: NomPicto; titre: string; chiffre?: string; libelle?: string; children: React.ReactNode;
}) {
  return (
    <section className="ef-bloc">
      <header className="ef-bloc__tete">
        <span className="ef-bloc__picto"><Picto nom={picto} taille={22} /></span>
        <h3>{titre}</h3>
        {chiffre && <p className="ef-bloc__chiffre"><span>{libelle}</span>{chiffre}</p>}
      </header>
      {children}
    </section>
  );
}

function EtatFinancier({ b, lots }: { b: BienAVendre; lots: LotAnnonce[] }) {
  const { net, honoraires } = decomposition(b);
  const n = fraisNotaire(net);
  const travaux = b.travauxTotal ?? 0;
  const total = b.prixHai + n.total + travaux;
  const ch = charges(b);
  const r = rendements(b);
  // Revenus par nature de lots, quand l'état locatif est déposé.
  const parNature = new Map<string, { actuel: number; potentiel: number }>();
  for (const l of lots) {
    const k = TYPES_LOT[l.type][0];
    const x = parNature.get(k) ?? { actuel: 0, potentiel: 0 };
    x.actuel += l.statut === "occupe" ? (l.loyerHcMois ?? 0) * 12 : 0;
    x.potentiel += (l.statut === "occupe" ? l.loyerHcMois : l.loyerMarcheMois ?? 0) ?? 0;
    parNature.set(k, x);
  }
  for (const x of parNature.values()) x.potentiel *= 12;
  const deuxColonnes = !!r.potentiel;
  // Le BO dépose ses totaux à part des lots (loyer_hc_an, loyer_hc_an_potentiel). Quand ils ne
  // tombent pas sur la somme des lots, l'écart a sa propre ligne : sinon les lignes ne font
  // pas le total affiché (Sin-le-Noble, 05/11/2026 : lots 57 372 €, potentiel du BO 60 372 €).
  const somme = [...parNature.values()].reduce((t, x) => ({ actuel: t.actuel + x.actuel, potentiel: t.potentiel + x.potentiel }), { actuel: 0, potentiel: 0 });
  const ecart = {
    actuel: parNature.size && b.loyerHcAn != null ? b.loyerHcAn - somme.actuel : 0,
    potentiel: parNature.size && deuxColonnes && b.loyerPotentielAn != null ? b.loyerPotentielAn - somme.potentiel : 0,
  };
  const avecEcart = Math.abs(ecart.actuel) >= 1 || Math.abs(ecart.potentiel) >= 1;

  return (
    <div className="etat-financier-pb">
      <BlocFinancier picto="euro" titre="Coût d’acquisition" libelle="Coût total" chiffre={eur(total)}>
      <div className="tableau-defile">
        <table className="etat-financier">
          <tbody>
            <tr><th scope="row">Prix net vendeur</th><td>{eur(net)}</td></tr>
            <tr><th scope="row">+ Honoraires TTC ({pct((honoraires / net) * 100, 1)} du net vendeur)</th><td>{eur(honoraires)}</td></tr>
            <tr className="etat-financier__total"><th scope="row">Prix honoraires inclus</th><td>{eur(b.prixHai)}</td></tr>
            <tr>
              <th scope="row">
                + Frais de notaire estimés ({pct((n.total / b.prixHai) * 100, 1)} du prix)
                <details className="replie replie--ligne">
                  <summary>Détail</summary>
                  <span>Droits de mutation 6,32 % : {eur(n.droits)} · émoluments TTC : {eur(n.emoluments)} · contribution de sécurité immobilière : {eur(n.csi)} · débours : {eur(n.debours)}. Calculés sur le net vendeur.</span>
                </details>
              </th>
              <td>{eur(n.total)}</td>
            </tr>
            {travaux > 0 && <tr><th scope="row">+ Travaux prévus</th><td>{eur(travaux)}</td></tr>}
            <tr className="etat-financier__total"><th scope="row">Coût total de l’opération</th><td>{eur(total)}</td></tr>
          </tbody>
        </table>
      </div>
      </BlocFinancier>

      {(b.loyerHcAn != null || b.loyerPotentielAn != null) && (
        <BlocFinancier picto="augmentation" titre="Revenus annuels hors charges" libelle="Loyers HC"
          chiffre={b.loyerHcAn != null ? eur(b.loyerHcAn) : undefined}>
          <div className="tableau-defile">
            <table className="etat-financier">
              {deuxColonnes && <thead><tr><td /><th scope="col">Actuel</th><th scope="col">Potentiel</th></tr></thead>}
              <tbody>
                {(parNature.size > 1 || avecEcart) && [...parNature.entries()].map(([k, x]) => (
                  <tr key={k}><th scope="row">{k}</th><td>{eur(x.actuel)}</td>{deuxColonnes && <td>{eur(x.potentiel)}</td>}</tr>
                ))}
                {avecEcart && (
                  <tr>
                    <th scope="row">{ecart.potentiel > 0 && Math.abs(ecart.actuel) < 1
                      ? <>Hausse de loyers prévue <small>non détaillée par lot</small></>
                      : <>Autres loyers <small>non détaillés par lot</small></>}</th>
                    <td>{Math.abs(ecart.actuel) >= 1 ? eur(ecart.actuel) : "—"}</td>
                    {deuxColonnes && <td>{Math.abs(ecart.potentiel) >= 1 ? eur(ecart.potentiel) : "—"}</td>}
                  </tr>
                )}
                <tr className="etat-financier__total">
                  <th scope="row">Total des loyers HC</th>
                  <td>{b.loyerHcAn != null ? eur(b.loyerHcAn) : "—"}</td>
                  {deuxColonnes && <td>{eur(b.loyerPotentielAn ?? 0)}</td>}
                </tr>
              </tbody>
            </table>
          </div>
        </BlocFinancier>
      )}

      {ch && (
        <BlocFinancier picto="calculatrice" titre="Charges annuelles" libelle="Non récupérables" chiffre={eur(ch.nonRecuperables)}>
          <div className="tableau-defile">
            <table className="etat-financier etat-financier--3">
              <thead><tr><td /><th scope="col">Totales</th><th scope="col">Récupérables</th><th scope="col">Non récupérables</th></tr></thead>
              <tbody>
                {ch.taxeFonciere != null && <tr><th scope="row">Taxe foncière</th><td>{eur(ch.taxeFonciere)}</td><td>{eur(ch.taxeFonciereRecup)}</td><td>{eur(ch.taxeFonciere - ch.taxeFonciereRecup)}</td></tr>}
                {ch.copro != null && <tr><th scope="row">Charges</th><td>{eur(ch.copro)}</td><td>{eur(ch.coproRecup)}</td><td>{eur(ch.copro - ch.coproRecup)}</td></tr>}
                <tr className="etat-financier__total"><th scope="row">Total</th><td>{eur(ch.totales)}</td><td>{eur(ch.recuperables)}</td><td>{eur(ch.nonRecuperables)}</td></tr>
              </tbody>
            </table>
          </div>
        </BlocFinancier>
      )}

      {r.actuel && (
        <BlocFinancier picto="stats" titre="Rendement" libelle="Net acte en main" chiffre={pct(r.actuel.aem)}>
          <div className="tableau-defile">
            <table className="etat-financier">
              {deuxColonnes && <thead><tr><td /><th scope="col">Actuel</th><th scope="col">Potentiel</th></tr></thead>}
              <tbody>
                <tr><th scope="row"><strong>Brut</strong></th><td>{pct(r.actuel.brut)}</td>{r.potentiel && <td>{pct(r.potentiel.brut)}</td>}</tr>
                <tr><th scope="row"><strong>Net de charges</strong></th><td>{ch ? pct(r.actuel.net) : "—"}</td>{r.potentiel && <td>{ch ? pct(r.potentiel.net) : "—"}</td>}</tr>
                <tr className="etat-financier__total"><th scope="row"><strong>Net acte en main</strong></th><td>{pct(r.actuel.aem)}</td>{r.potentiel && <td>{pct(r.potentiel.aem)}</td>}</tr>
              </tbody>
            </table>
          </div>
          <ul className="legende-pb">
            <li><strong>Brut</strong> : loyers annuels hors charges ÷ prix honoraires inclus{deuxColonnes ? " (+ travaux pour le potentiel)" : ""}.</li>
            <li><strong>Net de charges</strong> : (loyers − charges non récupérables) ÷ prix.</li>
            <li><strong>Net acte en main</strong> : (loyers − charges non récupérables) ÷ (prix + frais de notaire + travaux).</li>
            {deuxColonnes && <li><strong>Potentiel</strong> : les lots vides comptés à leur loyer de marché.</li>}
          </ul>
        </BlocFinancier>
      )}

      {(travaux > 0 || b.travaux) && (
        <div className="encadre-travaux">
          <p className="encadre-travaux__titre"><Picto nom="constructibilite" taille={20} />Travaux à prévoir{travaux > 0 ? ` : ${eur(travaux)}` : ""}</p>
          {b.travaux && <p>{b.travaux}</p>}
          {lots.some((l) => l.travaux) && (
            <ul>{lots.filter((l) => l.travaux).map((l) => <li key={l.numero}>{l.numero} : {eur(l.travaux!)}</li>)}</ul>
          )}
        </div>
      )}
    </div>
  );
}

export default async function FicheBien({ params }: Params) {
  const { slug } = await params;
  const tous = await biensAVendre();
  const b = tous.find((x) => x.slug === slug);
  if (!b) notFound();
  const [lots, secteur, marche] = await Promise.all([lotsDuBien(b.id), secteurDe(b.dept), marcheDuBien(b)]);
  const proches = similaires(tous, b);

  const r = rendementAffiche(b);
  // Écarts au marché calculés comme sur Plein Bail (retour #110) : prix au m² contre
  // la médiane DVF, rentabilité contre la rentabilité moyenne de la ville.
  const ecartM2 = ecartPct(b.prixM2, marche?.prixM2);
  const ecartRdt = ecartPct(r, marche?.rentaVille);
  const occ = libelleOccupation(b);
  const { net } = decomposition(b);
  const dpeFourchette = etiquetteDpe(b.dpeMin, b.dpe);
  const gesFourchette = etiquetteDpe(b.gesMin, b.ges);
  const excessive = b.dpe === "F" || b.dpe === "G";
  const paragraphes = (b.description ?? "").split(/\n{2,}|\r\n\r\n/).map((p) => p.trim()).filter(Boolean);
  const url = `${SITE.url}/immeubles-a-vendre/${b.slug}/`;

  return (
    <>
      <JsonLd
        data={[
          filAriane([
            { nom: "Accueil", url: "/" },
            { nom: "Biens à vendre", url: "/immeubles-a-vendre/" },
            { nom: b.titre, url: `/immeubles-a-vendre/${b.slug}/` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: b.titre,
            url,
            datePosted: b.publieLe,
            description: paragraphes[0] ?? b.titre,
            image: b.images.slice(0, 5),
            offers: {
              "@type": "Offer", price: Math.round(b.prixHai), priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
              seller: { "@type": "RealEstateAgent", name: "France Immeuble", url: SITE.url },
            },
            about: {
              "@type": "Residence",
              address: { "@type": "PostalAddress", addressLocality: b.ville, addressRegion: b.dept, addressCountry: "FR", ...(b.codePostal ? { postalCode: b.codePostal } : {}) },
              ...(b.surface ? { floorSize: { "@type": "QuantitativeValue", value: Math.round(b.surface), unitCode: "MTK" } } : {}),
            },
          },
        ]}
      />

      <section className="section section--creme fiche-pb">
        <div className="container fiche-pb__grille">
          <div className="fiche-pb__principal">
            <GalerieAnnonce images={b.images} alt={`${b.type} à ${b.ville}`} bien={b.id} titre={b.titre}
              badges={b.statut === "sous_offre" ? ["Sous offre"] : []} />

            {b.statut === "sous_offre" && (
              <p className="fiche-pb__sous-offre">
                <strong>Ce bien est sous offre.</strong> Une offre de second rang reste possible : elle passe si la première n’aboutit pas.
              </p>
            )}

            <div className="fiche-pb__tete">
              <div className="fiche-pb__badges">
                {b.statut === "sous_offre" && <span className="badge badge--clair">Sous offre</span>}
                <span className="badge badge--contour">{b.type}</span>
                {r != null && <span className="badge">{pct(r)} brut</span>}
                {occ && <span className="badge badge--sombre">{occ}</span>}
              </div>
              <h1>{b.titre}</h1>
              <a className="fiche-pb__lieu" href={lienCarte(b)} target="_blank" rel="noopener noreferrer">
                <Picto nom="secteur" taille={17} aria-hidden="true" />
                {b.codePostal ? `${b.codePostal} ` : ""}{b.ville} ({b.dept})
                <span className="sr-only"> (ouvre Google Maps)</span>
              </a>
            </div>

            <dl className="tuiles-pb">
              {b.loyerHcAn != null && (
                <Tuile titre="Loyer annuel HC" valeur={eur(b.loyerHcAn)}
                  sous={b.loyerPotentielAn && b.loyerPotentielAn !== b.loyerHcAn ? `${eur(b.loyerPotentielAn)} potentiel` : null}
                  formule="Somme des loyers hors charges des lots occupés, sur douze mois. Le potentiel ajoute le loyer de marché des lots vides." />
              )}
              <Tuile titre="Prix" valeur={eur(b.prixHai)} sous={`${eur(net)} net vendeur`}
                formule="Prix net vendeur plus les honoraires de l’agence, à la charge de l’acquéreur." />
              {r != null && (
                <Tuile titre="Rentabilité brute" valeur={pct(r)}
                  sous={ecartRdt != null ? `${ecartRdt >= 0 ? "+" : "−"}${Math.abs(Math.round(ecartRdt))} % vs secteur` : null}
                  ecart={ecartRdt == null ? null : ecartRdt > 0 ? "bien" : "moins"}
                  formule={(b.rendementPotentiel != null
                    ? "Loyer annuel potentiel hors charges ÷ (prix honoraires inclus + travaux prévus)."
                    : "Loyer annuel hors charges ÷ prix honoraires inclus.")
                    + (ecartRdt != null ? " Comparée à la rentabilité moyenne des appartements de la ville (loyer ANIL × 12 ÷ prix DVF), données Plein Bail." : "")} />
              )}
              {b.surface != null && (
                <Tuile titre="Surface totale" valeur={m2(b.surface)}
                  sous={b.anneeConstruction ? `construit en ${b.anneeConstruction}` : null}
                  formule="Somme des surfaces des lots (loi Carrez, sinon surface au sol)." />
              )}
              {b.prixM2 != null && (
                <Tuile titre="Prix / m²" valeur={eur(b.prixM2)}
                  sous={ecartM2 != null ? `${ecartM2 >= 0 ? "+" : "−"}${Math.abs(Math.round(ecartM2))} % vs marché` : null}
                  ecart={ecartM2 == null ? null : ecartM2 < 0 ? "bien" : "moins"}
                  formule={"Prix honoraires inclus ÷ surface totale."
                    + (ecartM2 != null ? " Comparé au prix médian au m² des ventes d’appartements du secteur (DVF), données Plein Bail." : "")} />
              )}
              <Tuile titre="Diagnostics" formule="Classe énergie (DPE) et classe climat (GES). Une fourchette quand les lots diffèrent, de la meilleure à la moins bonne.">
                <span className="tuile-pb__dpe">
                  <span className={`dpe-etiquette dpe-etiquette--${(classeDpe(b) ?? "nc").toLowerCase()}`}>{classeDpe(b) ? `DPE ${dpeFourchette}` : "DPE n.c."}</span>
                  {(b.ges || b.gesMin) && <span className="dpe-etiquette dpe-etiquette--nc">GES {gesFourchette}</span>}
                </span>
              </Tuile>
            </dl>

            {paragraphes.length > 0 && (
              <Reveal className="fiche-pb__bloc fiche-bien__texte">
                <h2 className="fiche-pb__h2">Description</h2>
                {paragraphes.map((p, i) => <p key={i}>{p}</p>)}
              </Reveal>
            )}

            <Reveal className="fiche-pb__bloc">
              <h2 className="fiche-pb__h2">État locatif{lots.length ? ` (${lots.length} lots)` : b.lots ? ` (${b.lots} lots)` : ""}</h2>
              {lots.length > 0 ? (
                <EtatLocatif lots={lots} />
              ) : (
                <p className="faits__note">
                  {occ ? `${occ} par surface. ` : ""}Le détail lot par lot (baux, loyers, surfaces) est transmis avec le dossier, sur simple demande.
                </p>
              )}
            </Reveal>

            <Reveal className="fiche-pb__bloc">
              <h2 className="fiche-pb__h2">État financier</h2>
              <EtatFinancier b={b} lots={lots} />
            </Reveal>

            {marche && <BlocMarche marche={marche} ville={b.ville} dept={b.dept} />}

            {/* Nos ventes du département, en fin de fiche (retour #113). Ce ne sont pas
                des références de marché pour ce bien : la référence est Plein Bail (#110). */}
            {secteur && (
              <Reveal className="fiche-pb__bloc">
                <h2 className="fiche-pb__h2">{`Nos ventes : ${secteur.nom}`}</h2>
                <dl className="faits faits--marche">
                  <div><dt>Immeubles vendus par l’agence</dt><dd>{secteur.ventes}</dd></div>
                  {secteur.prixM2 && <div><dt>Prix médian au m²</dt><dd>{eur(secteur.prixM2)}</dd></div>}
                  {secteur.rendement && <div><dt>Rendement médian</dt><dd>{pct(secteur.rendement)}</dd></div>}
                  {secteur.delaiJours && <div><dt>Délai médian jusqu’à l’offre</dt><dd>{Math.round(secteur.delaiJours)} jours</dd></div>}
                </dl>
                <p className="faits__note">Ventes réalisées par France Immeuble dans le département, publiées dans nos références.</p>
              </Reveal>
            )}

            <div className="fiche-pb__bloc mentions-pb">
              <h2 className="fiche-pb__h2">Mentions réglementaires</h2>
              <p>
                Diagnostic de performance énergétique : {classeDpe(b) ? `classe ${dpeFourchette}` : "non communiqué"}
                {(b.ges || b.gesMin) ? `, émissions de gaz à effet de serre : classe ${gesFourchette}` : ""}.
                {excessive ? " Logement à consommation énergétique excessive pour les lots classés F ou G." : ""}
              </p>
              <p>
                Les informations sur les risques auxquels ce bien est exposé sont disponibles sur le site Géorisques :{" "}
                <a href="https://www.georisques.gouv.fr" target="_blank" rel="noopener noreferrer">www.georisques.gouv.fr</a>.
              </p>
              <p>
                Prix de {eur(b.prixHai)} honoraires inclus, dont {eur(b.prixHai - net)} TTC d’honoraires à la charge de l’acquéreur,
                soit {pct(((b.prixHai - net) / net) * 100, 1)} du prix net vendeur de {eur(net)}.{" "}
                <a href="/nos-honoraires/">Barème de nos honoraires</a>.
              </p>
              <p>
                France Immeuble SAS, carte professionnelle Transactions CPI 7501 2018 000 026 004 délivrée par la CCI Paris
                Île-de-France, garantie financière Galian. Annonce diffusée par l’agence, mandataire du vendeur.
              </p>
            </div>
          </div>

          <aside className="fiche-pb__cote" aria-label="Prix, contact et offre">
            <CarteAction b={b} telephone={SITE.tel} telHref={SITE.telHref} prixM2Secteur={marche?.prixM2 ?? null} rentaVille={marche?.rentaVille ?? null} />
          </aside>
        </div>
      </section>

      {proches.length > 0 && (
        <section className="section section--creme fiche-pb__similaires">
          <div className="container">
            <Eyebrow>Dans le secteur</Eyebrow>
            <h2>Biens similaires</h2>
            <ul className="biens-liste biens-liste--resultats">
              {proches.map((x) => <li key={x.id}><CarteBien b={x} rang={9} /></li>)}
            </ul>
          </div>
        </section>
      )}

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
              <Button href={SITE.telHref}>Appeler · {SITE.tel}</Button>
              <Button href="/immeubles-a-vendre/" variant="outline">Tous les biens</Button>
            </div>
          </Reveal>
          <ContactForm bien={{ ref: b.id, titre: `${b.titre} (${b.ville})` }} />
        </div>
      </section>
    </>
  );
}
