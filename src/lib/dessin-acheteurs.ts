/**
 * Les deux acheteurs de la page Découpe (retour #150, MAV, 04/11/2026 : « plus
 * corporate », « un immeuble derrière et ces personnes devant, un peu comme la cible
 * sur l'immeuble de la page Estimer »). Même projection isométrique et mêmes
 * silhouettes que `schema-immeuble.ts`, en plus simple.
 *
 *   bloc    : un seul investisseur devant l'immeuble, entouré comme la cible
 *             d'Estimer, son rendement au-dessus de la tête ;
 *   decoupe : des acquéreurs nombreux, une famille parmi eux, de petits cœurs.
 *
 * Calculé au serveur en une chaîne SVG. Les couleurs sont dans la feuille globale
 * (classes `.da2-…`), jamais dans le dessin.
 */
type P2 = [number, number];

const f1 = (v: number) => v.toFixed(1);

export function dessinAcheteurs(sorte: "bloc" | "decoupe"): string {
  const W = 4, D = 3, NIV = 6, HF = 0.8, H = NIV * HF;
  const s = 26, C = 0.866;
  const P = (x: number, y: number, z: number): P2 => [(x - y) * C * s, (x + y) * 0.5 * s - z * s];
  const tous: P2[] = [];
  const pts = (a: [number, number, number][]) =>
    a.map(([x, y, z]) => { const p = P(x, y, z); tous.push(p); return `${f1(p[0])},${f1(p[1])}`; }).join(" ");
  const poly = (cls: string, a: [number, number, number][]) => `<polygon class="${cls}" points="${pts(a)}"/>`;
  const ligne = (cls: string, a: [number, number, number][]) => `<polyline class="${cls}" points="${pts(a)}"/>`;

  // Le trottoir, en pointillés, devant la façade.
  let out = ligne("da2-rue", [[-1.2, D + 1.6, 0], [W + 1.4, D + 1.6, 0]]);
  out += ligne("da2-rue", [[W + 1.4, D + 1.6, 0], [W + 1.4, -1, 0]]);

  // Le volume : façade (y = D), pignon (x = W), toit.
  out += poly("da2-g", [[0, D, 0], [W, D, 0], [W, D, H], [0, D, H]]);
  out += poly("da2-d", [[W, 0, 0], [W, D, 0], [W, D, H], [W, 0, H]]);
  out += poly("da2-t", [[0, 0, H], [W, 0, H], [W, D, H], [0, D, H]]);

  // Fenêtres, étage par étage, sur les deux faces vues.
  const faces: { a: P2; b: P2 }[] = [{ a: [0, D], b: [W, D] }, { a: [W, D], b: [W, 0] }];
  for (const f of faces) {
    const L = Math.hypot(f.b[0] - f.a[0], f.b[1] - f.a[1]), nc = Math.round(L);
    const sur = (t: number): P2 => [f.a[0] + (f.b[0] - f.a[0]) * t, f.a[1] + (f.b[1] - f.a[1]) * t];
    for (let c = 0; c < nc; c++) {
      const a = sur((c + 0.3) / nc), b = sur((c + 0.7) / nc);
      for (let n = 1; n < NIV; n++) {
        const z0 = n * HF + 0.18, z1 = n * HF + 0.62;
        out += poly("da2-fen", [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]]);
      }
    }
  }
  // Contours, étages et corniche, au trait or.
  out += ligne("da2-ct", [[0, D, 0], [0, D, H], [W, D, H], [W, D, 0]]);
  out += ligne("da2-ct", [[W, D, H], [W, 0, H], [W, 0, 0]]);
  out += ligne("da2-ct", [[0, D, H], [0, 0, H], [W, 0, H]]);
  for (let n = 1; n < NIV; n++) out += ligne("da2-ct da2-fin", [[0, D, n * HF], [W, D, n * HF], [W, 0, n * HF]]);

  // Les personnes, sur le trottoir devant la façade.
  const personne = (x: number, y: number, k: number, cls: string) => {
    const [gx, gy] = P(x, y, 0);
    tous.push([gx, gy - 30 * k], [gx - 9 * k, gy], [gx + 9 * k, gy]);
    return `<path class="${cls}" d="M${f1(gx - 6.5 * k)} ${f1(gy)}v${f1(-11 * k)}a${f1(6.5 * k)} ${f1(6.5 * k)} 0 0 1 ${f1(13 * k)} 0v${f1(11 * k)}z"/><circle class="${cls}" cx="${f1(gx)}" cy="${f1(gy - 22 * k)}" r="${f1(4.6 * k)}"/>`;
  };
  const tete = (x: number, y: number, k: number): P2 => { const [gx, gy] = P(x, y, 0); return [gx, gy - 22 * k]; };
  const coeur = ([x, y]: P2, r: number) =>
    `<path class="da2-coeur" d="M${f1(x)} ${f1(y + r * 0.95)}C${f1(x - r * 1.7)} ${f1(y - r * 0.15)} ${f1(x - r * 0.7)} ${f1(y - r * 1.35)} ${f1(x)} ${f1(y - r * 0.45)}C${f1(x + r * 0.7)} ${f1(y - r * 1.35)} ${f1(x + r * 1.7)} ${f1(y - r * 0.15)} ${f1(x)} ${f1(y + r * 0.95)}Z"/>`;

  if (sorte === "bloc") {
    const x = W * 0.55, y = D + 0.85;
    const [gx, gy] = P(x, y, 0);
    tous.push([gx - 26, gy + 13], [gx + 26, gy + 13]);
    out += `<ellipse class="da2-anneau" cx="${f1(gx)}" cy="${f1(gy)}" rx="16" ry="8"/><ellipse class="da2-anneau da2-a2" cx="${f1(gx)}" cy="${f1(gy)}" rx="27" ry="13.5"/>`;
    out += personne(x, y, 1.15, "da2-gens");
    // Son rendement au-dessus de lui : il ne regarde que lui.
    const [tx, ty] = tete(x, y, 1.15);
    const bx = tx, by = ty - 30;
    tous.push([bx - 30, by - 14], [bx + 30, by + 12]);
    out += `<g class="da2-bulle"><rect x="${f1(bx - 27)}" y="${f1(by - 12)}" width="54" height="22" rx="11"/><text x="${f1(bx)}" y="${f1(by + 3.5)}">€ / %</text></g>`;
    out += `<polyline class="da2-tige" points="${f1(bx)},${f1(by + 10)} ${f1(tx)},${f1(ty - 7)}"/>`;
  } else {
    const gens: [number, number, number][] = [
      [0.2, D + 0.75, 1], [0.95, D + 1.05, 1.05], [1.45, D + 1.15, 0.7], [1.95, D + 0.95, 1.05],
      [2.85, D + 0.7, 1], [3.6, D + 1.05, 0.95], [4.45, D + 0.8, 1],
    ];
    for (const [x, y, k] of gens) out += personne(x, y, k, "da2-gens");
    for (const i of [1, 3, 5]) {
      const [x, y, k] = gens[i];
      const [tx, ty] = tete(x, y, k);
      tous.push([tx, ty - 22]);
      out += coeur([tx + 1, ty - 14], 4.2);
    }
  }

  const xs = tous.map((p) => p[0]), ys = tous.map((p) => p[1]);
  const x0 = Math.min(...xs) - 6, y0 = Math.min(...ys) - 6;
  const w = Math.max(...xs) - x0 + 6, h = Math.max(...ys) - y0 + 6;
  const titre = sorte === "bloc"
    ? "Un investisseur seul devant l’immeuble, son rendement en tête"
    : "Des familles et des particuliers devant l’immeuble";
  return `<svg class="da2" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" role="img" aria-label="${titre}">${out}</svg>`;
}
