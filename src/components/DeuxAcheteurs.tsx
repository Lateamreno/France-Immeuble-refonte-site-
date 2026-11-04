/**
 * Les deux marchés de la découpe, en dessin (retours #128 et #150, MAV, 03 et
 * 04/11/2026) : devant le même immeuble, en bloc un investisseur seul qui ne
 * regarde que son rendement ; à la découpe, des acquéreurs nombreux, une famille
 * parmi eux. Dessins calculés au serveur (`src/lib/dessin-acheteurs.ts`).
 */

import { dessinAcheteurs } from "@/lib/dessin-acheteurs";

const BLOC = dessinAcheteurs("bloc");
const DECOUPE = dessinAcheteurs("decoupe");

const COTES = [
  {
    svg: BLOC,
    vente: "Vente en bloc",
    titre: "Un investisseur, qui achète un rendement",
    attentes: [
      "Son prix dépend du prix au m² et du rendement, et ne les dépasse pas",
      "Il n’achète ni sur un coup de cœur ni pour habiter le quartier",
      "Plus l’immeuble est grand, moins il a d’acheteurs : moins de concurrence, des offres plus basses",
    ],
  },
  {
    svg: DECOUPE,
    vente: "Vente à la découpe",
    titre: "Des familles et des particuliers, qui achètent un logement",
    attentes: [
      "Ils paient le prix du marché résidentiel",
      "Le coup de cœur et le besoin d’habiter le quartier jouent pour vous",
      "Un grand vivier d’acquéreurs pour chaque lot",
    ],
  },
];

export function DeuxAcheteurs() {
  return (
    <div className="deux-acheteurs">
      {COTES.map((c, i) => (
        <article key={c.vente} className={`da-carte${i === 1 ? " da-carte--decoupe" : ""}`}>
          {/* Dessin calculé ci-dessus, sans donnée extérieure. */}
          <div className="da-dessin" dangerouslySetInnerHTML={{ __html: c.svg }} />
          <span className="da-vente">{c.vente}</span>
          <h3>{c.titre}</h3>
          <ul className="da-attentes">
            {c.attentes.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </article>
      ))}
    </div>
  );
}
