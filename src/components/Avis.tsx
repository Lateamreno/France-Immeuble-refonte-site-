import { AVIS } from "@/lib/accueil";
import { PREUVES } from "@/lib/site";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";
import { TeteMedia } from "./TeteMedia";

/**
 * Le « G » de Google, dessiné d'un seul trait en `currentColor` : pas de
 * fichier servi par Google (§16), et pas de seconde couleur (§3).
 */
function LogoGoogle({ taille = 18 }: { taille?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={taille} height={taille} aria-hidden="true" fill="currentColor">
      <path d="M21.6 12.23c0-.72-.06-1.25-.19-1.8H12.2v3.26h5.4c-.11.9-.7 2.27-2.02 3.18l-.02.12 2.94 2.28.2.02c1.87-1.73 2.9-4.27 2.9-7.06ZM12.2 21.8c2.66 0 4.9-.88 6.53-2.39l-3.11-2.4c-.84.58-1.96.98-3.42.98a5.93 5.93 0 0 1-5.6-4.1l-.11.01-3.06 2.37-.04.11a9.86 9.86 0 0 0 8.81 5.42ZM6.6 13.9a6.1 6.1 0 0 1-.33-1.96c0-.68.12-1.34.32-1.96v-.13L3.5 7.44l-.1.05a9.84 9.84 0 0 0 0 8.86l3.2-2.45ZM12.2 5.87c1.85 0 3.1.8 3.81 1.47l2.78-2.72C17.08 3.03 14.86 2.07 12.2 2.07a9.86 9.86 0 0 0-8.81 5.42l3.2 2.49a5.95 5.95 0 0 1 5.6-4.1Z" />
    </svg>
  );
}

/** « Danièle M. » → « DM » : un monogramme tient la place d'une photo. */
const initiales = (nom: string) =>
  nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0].toUpperCase()).join("");

/**
 * Les avis Google, repris de la fiche de l'agence.
 *
 * Volontairement en dur plutôt que servis par l'API Places, pour trois raisons
 * mesurables : l'API ne rend que 5 avis quand la fiche en porte 28 ; elle
 * demande une clé facturée ; et ses photos de profil sont servies par Google,
 * ce que le §16 interdit (aucune image hébergée hors du domaine). MAV a tranché
 * le 21/10 pour cette option.
 *
 * Retours du 22/10 : la note 4,9/5 s'affiche en grand avec le lien vers la
 * fiche Google ; chaque avis porte sa note et le nom du client en or ; plus de
 * date. Un monogramme remplace la photo, que Google ne nous laisse pas servir.
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
  const tete = (
    <>
      <Eyebrow>Ils nous font confiance</Eyebrow>
      <h2>{titre}</h2>
      <a className="avis-note" href={PREUVES.avisGoogle} target="_blank" rel="noopener">
        <span className="avis-note__val">
          {PREUVES.noteGoogle}
          <span className="avis-note__sur">/5</span>
        </span>
        <span className="avis-note__detail">
          <span className="avis-note__etoiles" aria-hidden="true">★★★★★</span>
          <span className="avis-note__lien">
            <LogoGoogle />
            {PREUVES.nbAvis} avis Google · les lire
          </span>
        </span>
      </a>
      <p className="lead">
        {intro ?? "Vendeurs et acquéreurs, sur des immeubles de rapport vendus en bloc."}
      </p>
      {children}
    </>
  );

  return (
    <section className={`section section--${fond}`}>
      <div className="container">
        {fond === "creme" ? (
          /* Sur crème, une photo à côté du titre casse l'aplat (22/10/2026). */
          <TeteMedia
            image={{
              src: "/media/immeubles-paris.webp",
              alt: "Toits et façades d’immeubles parisiens",
              width: 1000,
              height: 667,
            }}
          >
            {tete}
          </TeteMedia>
        ) : (
          <Reveal className="section__head">{tete}</Reveal>
        )}

        <div className="avis">
          {liste.map((a, i) => (
            <Reveal key={a.nom} as="article" className="avis__item" delayIndex={i}>
              <header className="avis__tete">
                <span className="avis__mono" aria-hidden="true">{initiales(a.nom)}</span>
                <span className="avis__qui">
                  <span className="avis__nom">{a.nom}</span>
                  <span className="avis__note">
                    <span className="avis__etoiles" aria-hidden="true">★★★★★</span>
                    <span>5/5</span>
                  </span>
                </span>
                <span className="avis__source" title="Avis Google">
                  <LogoGoogle taille={16} />
                </span>
              </header>
              <p>{a.texte}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
