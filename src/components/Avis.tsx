import { AVIS } from "@/lib/accueil";
import { PREUVES } from "@/lib/site";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";

/**
 * Les avis Google, repris de la fiche de l'agence.
 *
 * Volontairement en dur plutôt que servis par l'API Places, pour trois raisons
 * mesurables : l'API ne rend que 5 avis quand la fiche en porte 28 ; elle
 * demande une clé facturée ; et ses photos de profil sont servies par Google,
 * ce que le §16 interdit (aucune image hébergée hors du domaine). MAV a tranché
 * le 21/10 pour cette option.
 *
 * `compact` : trois avis au lieu de douze, pour les pages où ils appuient un
 * argument sans devenir le sujet.
 */
export function Avis({
  titre = "Témoignages",
  intro,
  compact = false,
  fond = "creme",
  children,
}: {
  titre?: string;
  intro?: string;
  compact?: boolean;
  fond?: "creme" | "noir-2" | "noir-3";
  children?: React.ReactNode;
}) {
  const liste = compact ? AVIS.slice(0, 3) : AVIS;

  return (
    <section className={`section section--${fond}`}>
      <div className="container">
        <Reveal className="section__head">
          <Eyebrow>Ils nous font confiance</Eyebrow>
          <h2>{titre}</h2>
          <p className="lead">
            {intro ??
              `${PREUVES.nbAvis} avis Google, ${PREUVES.noteGoogle}/5 de moyenne. Vendeurs et acquéreurs, sur des immeubles entiers.`}
          </p>
          {children}
        </Reveal>

        <div className="avis">
          {liste.map((a, i) => (
            <Reveal key={a.nom} as="article" className="avis__item" delayIndex={i}>
              <span className="avis__etoiles" aria-label="5 étoiles sur 5">
                ★★★★★
              </span>
              <p>{a.texte}</p>
              <footer>
                <span className="avis__nom">{a.nom}</span>
                <span className="avis__date">{a.date}</span>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
