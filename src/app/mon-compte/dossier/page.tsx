import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { DossierForm } from "@/components/dossier/DossierForm";
import { sessionCourante, uuidDe } from "@/lib/compte/auth";
import { creerDossier, dossierCourant, type LigneDossier } from "@/lib/dossier/serveur";
import { SITE } from "@/lib/site";

/**
 * /mon-compte/dossier/ — l'état locatif du vendeur (retour #64 de MAV).
 *
 * On y arrive par le bouton de l'écran de fin du formulaire d'estimation
 * (dossier retrouvé par son cookie), ou depuis le compte (dossier retrouvé par
 * le compte, créé au besoin avec les lots de la dernière estimation).
 * Page propre à chacun : hors index.
 */
export const metadata: Metadata = {
  title: { absolute: "Mon dossier | France Immeuble" },
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE.url}/mon-compte/dossier/` },
};
export const dynamic = "force-dynamic";

export default async function PageDossier() {
  const s = await sessionCourante();
  const verifie = s?.utilisateur.email_confirmed_at ? s.utilisateur : null;

  let l: LigneDossier | null = null;
  try {
    l = await dossierCourant(verifie?.id ?? null);
    if (!l && verifie) {
      const est = verifie.app_metadata?.estimation;
      l = await creerDossier({
        ref: est?.ref ?? uuidDe(`dossier|${verifie.id}`),
        email: verifie.email,
        compte: verifie.id,
        identite: {
          prenom: verifie.user_metadata?.prenom,
          nom: verifie.user_metadata?.nom,
          telephone: verifie.user_metadata?.telephone,
        },
        comptes: est?.lots ?? {},
        cookie: false,
      });
    }
  } catch (e) {
    console.error("[dossier] lecture impossible —", e instanceof Error ? e.message : e);
  }

  const i = l?.identite ?? {};
  const adresse = [[i.numero, i.rue].filter(Boolean).join(" "), [i.codePostal, i.ville].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const connecte = !!verifie && !!l && (l.compte === verifie.id || l.email === verifie.email.toLowerCase());

  return (
    <>

      {/* Pas de hero : c'est un écran de travail, il s'ouvre sur le tableau (retour #67). */}
      <section className="section section--noir-2 dossier-vendeur-sec">
        <div className="container">
          {l ? (
            <>
            <header className="dossier-vendeur__tete">
              <h1>Votre <span className="accent">dossier</span> en ligne</h1>
              <p>Remplissez ce que vous avez sous la main, lot par lot. Tout est enregistré au fur et à mesure&nbsp;: vous pouvez revenir plus tard.</p>
            </header>
            <DossierForm initial={l.donnees} adresse={adresse} connecte={connecte} dejaValide={!!l.valide_le && !connecte} />
            </>
          ) : (
            <div className="container--narrow dossier-absent">
              <h1>Ce dossier n’est plus disponible ici</h1>
              <p className="lead">
                Il a peut-être déjà été envoyé, ou il a été ouvert sur un autre appareil. Connectez-vous
                pour le retrouver, ou faites estimer votre immeuble.
              </p>
              <div className="btn-row">
                <Button href="/mon-compte/">Me connecter</Button>
                <Button href="/estimer-un-immeuble/#estimer" variant="outline">Estimer mon immeuble</Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
