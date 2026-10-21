import type { Metadata } from "next";
import "../cartes.css";
import { Eyebrow } from "@/components/Eyebrow";
import { Picto, type NomPicto } from "@/components/Picto";

/**
 * Comparaison de variantes pour les deux cartes de /vendre-un-immeuble/.
 *
 * Page interne, jamais indexée, jamais liée publiquement. Le texte est repris
 * mot pour mot de la page : on compare des mises en forme, pas des rédactions.
 */
export const metadata: Metadata = {
  title: "Variantes de carte",
  robots: { index: false, follow: false },
};

const CARTES: { picto: NomPicto; titre: string; texte: string }[] = [
  {
    picto: "calculatrice",
    titre: "Vous souhaitez connaître la valeur de votre immeuble ?",
    texte:
      "Obtenez une estimation gratuite et sans engagement basée sur l’aspect général, géographique et locatif de votre immeuble ainsi que sur son caractère constructible pour une valorisation optimale.",
  },
  {
    picto: "poignee",
    titre: "Vous cherchez un acquéreur pour votre immeuble ?",
    texte:
      "Nous trouvons parmi notre réseau d’investisseurs privés, de foncières, de family offices, de marchands de biens et d’institutionnels le meilleur acheteur pour votre immeuble.",
  },
];

/** Variante 0 — ce qui est en ligne aujourd'hui. */
function Actuelle() {
  return (
    <div className="grid grid--2">
      {CARTES.map((c) => (
        <article className="card" key={c.titre}>
          <span className="card__picto" aria-hidden="true">
            <Picto nom={c.picto} taille={28} />
          </span>
          <h2>{c.titre}</h2>
          <p>{c.texte}</p>
        </article>
      ))}
    </div>
  );
}

function Centre() {
  return (
    <div className="grid grid--2">
      {CARTES.map((c) => (
        <article className="card card--centre" key={c.titre}>
          <span className="card__picto" aria-hidden="true">
            <Picto nom={c.picto} taille={30} />
          </span>
          <h2>{c.titre}</h2>
          <p>{c.texte}</p>
        </article>
      ))}
    </div>
  );
}

function Filigrane() {
  return (
    <div className="grid grid--2">
      {CARTES.map((c) => (
        <article className="card card--filigrane" key={c.titre}>
          <span className="card__fond" aria-hidden="true">
            <Picto nom={c.picto} taille={190} />
          </span>
          <span className="card__picto" aria-hidden="true">
            <Picto nom={c.picto} taille={28} />
          </span>
          <h2>{c.titre}</h2>
          <p>{c.texte}</p>
        </article>
      ))}
    </div>
  );
}

function EnLigne() {
  return (
    <div className="grid grid--2">
      {CARTES.map((c) => (
        <article className="card card--ligne" key={c.titre}>
          <div className="card__tete">
            <span className="card__picto" aria-hidden="true">
              <Picto nom={c.picto} taille={24} />
            </span>
            <h2>{c.titre}</h2>
          </div>
          <p>{c.texte}</p>
        </article>
      ))}
    </div>
  );
}

function Filet() {
  return (
    <div className="grid grid--2">
      {CARTES.map((c) => (
        <article className="card card--filet" key={c.titre}>
          {/* Pas de libellé ajouté : « Estimation » et « Acquéreur » seraient
              deux mots qui ne sont pas sur la page. Le picto tient la ligne. */}
          <div className="card__tete">
            <span className="card__picto" aria-hidden="true">
              <Picto nom={c.picto} taille={22} />
            </span>
          </div>
          <h2>{c.titre}</h2>
          <p>{c.texte}</p>
        </article>
      ))}
    </div>
  );
}

/** E — la combinaison demandée : médaillon centré + filigrane. Trois placements. */
function Combi({ variante }: { variante: "halo" | "socle" | "coin" }) {
  return (
    <div className="grid grid--2">
      {CARTES.map((c) => (
        <article className={`card card--combi card--combi-${variante}`} key={c.titre}>
          <span className="card__fond" aria-hidden="true">
            <Picto nom={c.picto} taille={220} />
          </span>
          <span className="card__picto" aria-hidden="true">
            <Picto nom={c.picto} taille={30} />
          </span>
          <h2>{c.titre}</h2>
          <p>{c.texte}</p>
        </article>
      ))}
    </div>
  );
}

const PROPOSITIONS: { lettre: string; nom: string; note: string; rendu: () => React.ReactNode }[] = [
  {
    lettre: "0",
    nom: "Aujourd’hui en ligne",
    note: "Le point de départ : picto en carré arrondi, titre, texte. Les deux cartes se suivent sur téléphone, chacune haute de presque un écran.",
    rendu: Actuelle,
  },
  {
    lettre: "A",
    nom: "Picto centré",
    note: "Le picto devient un médaillon rond et toute la carte s’aligne sur son axe. C’est la variante la plus « landing page ». Réserve honnête : un paragraphe centré de cinq lignes se lit moins vite qu’un paragraphe aligné à gauche — l’œil doit chercher le début de chaque ligne. La mesure est donc bornée pour limiter la casse.",
    rendu: Centre,
  },
  {
    lettre: "B",
    nom: "Picto en filigrane",
    note: "Le picto passe en fond, très grand et très pâle, débordant du coin. Le relief vient d’un dégradé monochrome, jamais d’une seconde couleur. Rien ne change pour la lecture : le texte garde son alignement à gauche.",
    rendu: Filigrane,
  },
  {
    lettre: "C",
    nom: "Picto en ligne avec le titre",
    note: "Le picto et le titre partagent une ligne. La carte gagne la hauteur d’un bloc entier — ce qui compte sur un téléphone où ces deux cartes se suivent. C’est la variante la plus compacte.",
    rendu: EnLigne,
  },
  {
    lettre: "E1",
    nom: "Centré + filigrane en halo",
    note: "Le fond est centré sur le médaillon, qui en masque le cœur : il reste un écho du picto rayonnant autour du cercle. C’est la combinaison la plus liée — un seul objet, vu deux fois à deux échelles.",
    rendu: () => <Combi variante="halo" />,
  },
  {
    lettre: "E2",
    nom: "Centré + filigrane en socle",
    note: "Le fond descend sous le texte et déborde par le bas de la carte. L’axe vertical est respecté et rien ne se superpose au médaillon : les deux apparitions du picto occupent chacune leur zone.",
    rendu: () => <Combi variante="socle" />,
  },
  {
    lettre: "E3",
    nom: "Centré + filigrane de coin",
    note: "Le filigrane de la variante B, posé tel quel sous une carte centrée. C’est la somme littérale des deux. Le coin tire l’œil à droite pendant que le reste de la carte le ramène au centre.",
    rendu: () => <Combi variante="coin" />,
  },
  {
    lettre: "D",
    nom: "Filet bronze, sans cadre",
    note: "La signature du groupe : filet vertical bronze à gauche des blocs importants. Plus de cadre, plus de fond. Sur une section crème, deux grandes boîtes bordées alourdissent ; le filet laisse respirer et le picto redevient un repère discret sur la ligne du surtitre.",
    rendu: Filet,
  },
];

export default function VariantesDeCarte() {
  return (
    <main>
      <section className="section section--creme">
        <div className="container">
          <Eyebrow>Design system</Eyebrow>
          <h1>Variantes de carte</h1>
          <p className="lead" style={{ maxWidth: "62ch" }}>
            Cinq mises en forme pour les deux cartes de la page Vendre. Le texte est repris mot
            pour mot : on compare des présentations, pas des rédactions.
          </p>

          <div style={{ marginTop: "var(--space-xl)" }}>
            {PROPOSITIONS.map((p) => (
              <div className="cmp" key={p.lettre}>
                <div className="cmp__tete">
                  <span className="cmp__lettre">{p.lettre}</span>
                  <h2 style={{ margin: 0 }}>{p.nom}</h2>
                </div>
                <p className="cmp__note">{p.note}</p>
                {p.rendu()}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
