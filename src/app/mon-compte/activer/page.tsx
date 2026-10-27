import type { Metadata } from "next";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { VISUELS } from "@/lib/visuels";

export const metadata: Metadata = {
  title: "Votre espace client · France Immeuble",
  robots: { index: false, follow: false },
};

/**
 * Arrivée depuis l'e-mail envoyé après une estimation (MAV, 27/10/2026).
 *
 * Le lien ne fait rien tout seul : il faut appuyer sur le bouton. Les
 * antivirus de messagerie visitent les liens des e-mails ; si la visite
 * suffisait à ouvrir le compte, ils consommeraient le lien à usage unique
 * avant le client.
 */
export default async function Activer({ searchParams }: { searchParams: Promise<{ type?: string; jeton?: string }> }) {
  const { type, jeton } = await searchParams;
  const valide = (type === "invite" || type === "magiclink") && !!jeton && /^[A-Za-z0-9_-]{10,200}$/.test(jeton);
  return (
    <HeroMedia image={VISUELS.interieurToits.src} alt={VISUELS.interieurToits.alt}>
      <>
        <Eyebrow>Espace client</Eyebrow>
        <h1>
          Votre <span className="accent">espace</span> France Immeuble
        </h1>
        {valide ? (
          <>
            <p className="lead">
              {type === "invite"
                ? "Nous l’avons ouvert pour vous. Vous y retrouverez votre estimation et vous pourrez y déposer les pièces de votre immeuble."
                : "Votre espace vous attend : votre estimation et le dépôt des pièces de votre immeuble."}
            </p>
            <form method="post" action="/api/compte/activer/" className="btn-row">
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="jeton" value={jeton} />
              <button type="submit" className="btn btn--primary">Ouvrir mon espace</button>
            </form>
          </>
        ) : (
          <>
            <p className="lead">Ce lien n’est pas complet. Connectez-vous avec votre adresse e-mail.</p>
            <div className="btn-row">
              <a className="btn btn--primary" href="/mon-compte/">Me connecter</a>
            </div>
          </>
        )}
      </>
    </HeroMedia>
  );
}
