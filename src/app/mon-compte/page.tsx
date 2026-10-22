import type { Metadata } from "next";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { VISUELS } from "@/lib/visuels";
import { SITE } from "@/lib/site";

/**
 * /mon-compte/ — l'icône du menu y mène dès maintenant, pour que le lien ne
 * tombe pas sur une 404.
 *
 * La connexion et les tableaux du compte arrivent avec le §9 du contrat BO
 * (comptes, recherches, propositions). Rien n'est lu ni écrit ici tant que ce
 * contrat n'est pas câblé. Page hors index : elle n'a rien à classer.
 */
export const metadata: Metadata = {
  title: { absolute: "Mon compte | France Immeuble" },
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE.url}/mon-compte/` },
};

export default function MonCompte() {
  return (
    <HeroMedia image={VISUELS.interieurToits.src} alt={VISUELS.interieurToits.alt}>
      <>
        <Eyebrow>Espace client</Eyebrow>
        <h1>
          Votre <span className="accent">espace client</span> ouvre bientôt
        </h1>
        <p className="lead">
          Vous y retrouverez les immeubles que nous vous avons présentés et l’état de votre
          recherche. En attendant, déposez vos critères : nous vous appelons dès qu’un immeuble
          y correspond.
        </p>
        <div className="btn-row">
          <Button href="/acheter-un-immeuble/#deposer">Déposer ma recherche</Button>
          <Button href={SITE.telHref} variant="outline">{SITE.tel}</Button>
        </div>
      </>
    </HeroMedia>
  );
}
