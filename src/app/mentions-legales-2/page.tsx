import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { SITE } from "@/lib/site";

/**
 * /mentions-legales-2/ — URL existante conservée telle quelle (CLAUDE.md §10).
 * Le suffixe « -2 » vient d'un slug dupliqué côté WordPress ; on ne le corrige
 * pas, changer l'URL ferait perdre le peu de signal qu'elle porte.
 *
 * ⚠️ LES MENTIONS MARQUÉES « À COMPLÉTER » DOIVENT L'ÊTRE AVANT PRODUCTION.
 * Numéro SIRET, carte professionnelle, garantie financière et RCP sont des
 * mentions légalement obligatoires pour un agent immobilier (loi Hoguet) :
 * je ne les invente pas.
 */
export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false, follow: true },
  alternates: { canonical: "/mentions-legales-2/" },
};

const A_COMPLETER = (
  <span className="mono" style={{ color: "var(--color-bronze-clair)" }}>
    [à compléter]
  </span>
);

export default function MentionsLegales() {
  return (
    <section className="section section--noir">
      <div className="container container--narrow">
        <Eyebrow>Informations légales</Eyebrow>
        <h1 style={{ marginBottom: "var(--space-l)" }}>Mentions légales</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-l)" }}>
          <div className="railed">
            <h3 style={{ marginBottom: "var(--space-xs)" }}>Éditeur du site</h3>
            <p className="muted">
              {SITE.nom} — {A_COMPLETER} (forme juridique et capital social)
              <br />
              {SITE.adresse}, {SITE.codePostalVille}
              <br />
              Téléphone : {SITE.tel}
              <br />
              SIRET : {A_COMPLETER} — RCS : {A_COMPLETER}
              <br />
              TVA intracommunautaire : {A_COMPLETER}
              <br />
              Directeur de la publication : {A_COMPLETER}
            </p>
          </div>

          <div className="railed railed--thin">
            <h3 style={{ marginBottom: "var(--space-xs)" }}>Activité réglementée</h3>
            <p className="muted">
              Activité de transaction sur immeubles et fonds de commerce, régie par la loi
              n°&nbsp;70-9 du 2 janvier 1970 dite loi Hoguet.
              <br />
              Carte professionnelle n° {A_COMPLETER}, délivrée par la CCI de {A_COMPLETER}
              <br />
              Garantie financière : {A_COMPLETER}
              <br />
              Assurance responsabilité civile professionnelle : {A_COMPLETER}
              <br />
              Médiateur de la consommation : {A_COMPLETER}
            </p>
          </div>

          <div className="railed railed--thin">
            <h3 style={{ marginBottom: "var(--space-xs)" }}>Hébergement</h3>
            <p className="muted">
              Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
              <br />
              Nom de domaine enregistré chez OVH SAS, 2 rue Kellermann, 59100 Roubaix.
            </p>
          </div>

          <div className="railed railed--thin">
            <h3 style={{ marginBottom: "var(--space-xs)" }}>Données personnelles</h3>
            <p className="muted">
              Les informations transmises via nos formulaires servent exclusivement à traiter
              votre demande. Elles ne sont ni vendues ni cédées à des tiers.
            </p>
            <p className="muted" style={{ marginTop: "var(--space-xs)" }}>
              Conformément au RGPD, vous disposez d’un droit d’accès, de rectification,
              d’effacement, de limitation, de portabilité et d’opposition. Pour l’exercer :{" "}
              {A_COMPLETER} (adresse de contact dédiée).
              <br />
              Durée de conservation : {A_COMPLETER}
              <br />
              Réclamation possible auprès de la CNIL, 3 place de Fontenoy, 75007 Paris.
            </p>
          </div>

          <div className="railed railed--thin">
            <h3 style={{ marginBottom: "var(--space-xs)" }}>Propriété intellectuelle</h3>
            <p className="muted">
              L’ensemble des contenus de ce site — textes, données de transactions, identité
              visuelle — est la propriété de {SITE.nom}. Toute reproduction sans autorisation
              écrite préalable est interdite.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
