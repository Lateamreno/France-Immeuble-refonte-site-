/**
 * Les deux marchés de la découpe, en dessin (retour #128, MAV, 03/11/2026) :
 * en bloc, un investisseur qui ne regarde que l'argent ; à la découpe, des
 * familles et des particuliers, des cœurs dans les yeux. Dessins au trait or,
 * calculés ici, sans image.
 */

/** Un personnage : tête et buste, le bas posé sur `y`. `s` règle la taille. */
function personne(x: number, y: number, s: number, yeux: "euro" | "coeur") {
  const r = 13 * s;
  const tete = y - 46 * s;
  const buste = `M${x - 22 * s} ${y} C${x - 22 * s} ${y - 30 * s} ${x + 22 * s} ${y - 30 * s} ${x + 22 * s} ${y}`;
  const ex = 5 * s;
  const oeil = (cx: number) =>
    yeux === "euro"
      ? `<text x="${cx}" y="${tete + 3.4 * s}" text-anchor="middle" font-size="${9.5 * s}" class="da-oeil">€</text>`
      : coeur(cx, tete, 3.1 * s);
  return `<g><circle cx="${x}" cy="${tete}" r="${r}"/><path d="${buste}"/>${oeil(x - ex)}${oeil(x + ex)}</g>`;
}

function coeur(x: number, y: number, k: number) {
  return `<path class="da-coeur" d="M${x} ${y + k * 0.95} C${x - k * 1.7} ${y - k * 0.15} ${x - k * 0.7} ${y - k * 1.35} ${x} ${y - k * 0.45} C${x + k * 0.7} ${y - k * 1.35} ${x + k * 1.7} ${y - k * 0.15} ${x} ${y + k * 0.95} Z"/>`;
}

const BLOC = `<svg class="da-svg" viewBox="0 0 260 150" role="img" aria-label="Un investisseur, les yeux fixés sur l’argent">
  ${personne(86, 138, 1.45, "euro")}
  <path class="da-regard" d="M112 70 L160 58"/>
  <circle cx="190" cy="56" r="28"/><circle cx="190" cy="56" r="21" class="da-fin"/>
  <text x="190" y="66" text-anchor="middle" font-size="28" class="da-euro">€</text>
  <path class="da-fin" d="M168 108 h44 M172 118 h36 M176 128 h28"/>
</svg>`;

const DECOUPE = `<svg class="da-svg" viewBox="0 0 260 150" role="img" aria-label="Des familles et des particuliers, des cœurs dans les yeux">
  ${personne(34, 138, 0.95, "coeur")}
  ${personne(98, 138, 1.25, "coeur")}
  ${personne(126, 138, 0.72, "coeur")}
  ${personne(156, 138, 1.15, "coeur")}
  ${personne(222, 138, 0.95, "coeur")}
  ${coeur(126, 34, 6)}${coeur(190, 52, 4.2)}${coeur(62, 56, 4.2)}
</svg>`;

const COTES = [
  {
    svg: BLOC,
    vente: "Vente en bloc",
    titre: "Un investisseur, qui achète un rendement",
    attentes: [
      "Il divise vos loyers par le taux qu’il exige",
      "Son prix s’arrête à ce calcul",
      "Peu d’acheteurs, qui raisonnent tous de la même façon",
    ],
  },
  {
    svg: DECOUPE,
    vente: "Vente à la découpe",
    titre: "Des familles et des particuliers, qui achètent un logement",
    attentes: [
      "Ils paient le prix du marché résidentiel",
      "Le coup de cœur compte autant que les chiffres",
      "Beaucoup d’acheteurs pour chaque lot",
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
