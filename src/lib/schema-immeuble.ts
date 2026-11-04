/**
 * Schéma d'immeuble de la page Estimer, section « Analyses » (dessin A retenu par
 * MAV le 03/11/2026 : haussmannien R+5 à l'angle de deux rues, mansarde « comme le
 * D », contours en pointillés et vide à l'intérieur).
 *
 * Chaque analyse a sa partie, dans un groupe `data-i` que le composant
 * `AnalysesSchema` allume :
 *   0 secteur          rues en pointillés, passage piéton, abribus, commerces
 *   1 technique        contours du bâtiment
 *   2 financier        fenêtres et vitrines (la porte d'entrée reste à part, éteinte)
 *   3 constructibilité la mansarde en pointillés, marquée « +1 »
 *   4 cible            un des trois personnages
 *   5 découpe          les lots dessinés en pointillés sur les façades (retour #165)
 *
 * Projection isométrique calculée ici, rendue côté serveur en une chaîne SVG :
 * aucune image, aucune dépendance. Les couleurs sont dans la feuille globale
 * (classes `.sch …`), jamais dans le dessin.
 */
type P2 = [number, number];
type P3 = [number, number, number];
type Face = { a: P2; b: P2; cls: "f-g" | "f-d" | "f-m"; L: number };

const f1 = (v: number) => v.toFixed(1);

export function schemaImmeuble(): string {
  const W = 4, D = 3, NIV = 6, HF = 0.8;
  const s = 34, C = 0.866, H = NIV * HF;
  const P = (x: number, y: number, z: number): P2 => [(x - y) * C * s, (x + y) * 0.5 * s - z * s];
  const tous: P2[] = [];
  const pt = ([x, y, z]: P3) => { const p = P(x, y, z); tous.push(p); return `${f1(p[0])},${f1(p[1])}`; };
  const poly = (cls: string, a: P3[]) => `<polygon class="${cls}" points="${a.map(pt).join(" ")}"/>`;
  const ligne = (cls: string, a: P3[]) => `<polyline class="${cls}" points="${a.map(pt).join(" ")}"/>`;
  const en = (p: P2, z: number): P3 => [p[0], p[1], z];

  const emprise: P2[] = [[0, 0], [W, 0], [W, D], [0, D]];
  const cx = W / 2, cy = D / 2;

  /** Retrait d'un polygone convexe : chaque côté décalé vers l'intérieur. */
  const retrait = (pg: P2[], d: number): P2[] => {
    const n = pg.length;
    const L = pg.map((a, i) => {
      const b = pg[(i + 1) % n];
      let nx = b[1] - a[1], ny = -(b[0] - a[0]);
      const l = Math.hypot(nx, ny); nx /= l; ny /= l;
      if ((cx - (a[0] + b[0]) / 2) * nx + (cy - (a[1] + b[1]) / 2) * ny < 0) { nx = -nx; ny = -ny; }
      return [a[0] + nx * d, a[1] + ny * d, b[0] - a[0], b[1] - a[1]];
    });
    return pg.map((_, i) => {
      const [px, py, dx, dy] = L[(i - 1 + n) % n], [qx, qy, ex, ey] = L[i];
      const t = ((qx - px) * ey - (qy - py) * ex) / (dx * ey - dy * ex);
      return [px + dx * t, py + dy * t] as P2;
    });
  };
  /** Faces vues : normale extérieure tournée vers l'observateur (x + y croissants). */
  const faces = (pg: P2[]): Face[] =>
    pg.map((a, i) => [a, pg[(i + 1) % pg.length]] as [P2, P2]).flatMap(([a, b]) => {
      let nx = b[1] - a[1], ny = -(b[0] - a[0]);
      if ((cx - (a[0] + b[0]) / 2) * nx + (cy - (a[1] + b[1]) / 2) * ny > 0) { nx = -nx; ny = -ny; }
      if (nx + ny <= 1e-6) return [];
      const cls = Math.abs(nx) < 1e-6 ? "f-g" : Math.abs(ny) < 1e-6 ? "f-d" : "f-m";
      return [{ a, b, cls, L: Math.hypot(b[0] - a[0], b[1] - a[1]) } as Face];
    });
  const sur = (f: Face, t: number): P2 => [f.a[0] + (f.b[0] - f.a[0]) * t, f.a[1] + (f.b[1] - f.a[1]) * t];
  const vues = faces(emprise);
  const facade = vues.find((f) => f.cls === "f-g") ?? vues[0];

  // ── 0. Secteur ──
  const X0 = -2.6, X1 = W + 3.2, Y0 = -2.4, Y1 = D + 3.4;
  const fr = [D + 0.75, D + 2.05], cote = [W + 0.75, W + 2.05];
  let sect = "";
  const segX = (y: number, cls: string) =>
    [[X0, cote[0]], [cote[1], X1]].map(([a, b]) => ligne(cls, [[a, y, 0], [b, y, 0]])).join("");
  const segY = (x: number, cls: string) =>
    [[Y0, fr[0]], [fr[1], Y1]].map(([a, b]) => ligne(cls, [[x, a, 0], [x, b, 0]])).join("");
  sect += segX(fr[0], "trottoir") + segX(fr[1], "trottoir") + segX((fr[0] + fr[1]) / 2, "axe");
  sect += segY(cote[0], "trottoir") + segY(cote[1], "trottoir") + segY((cote[0] + cote[1]) / 2, "axe");
  // Bandes du passage piéton dans le sens de la rue, posées l'une après l'autre
  // en travers de la chaussée (retour #166).
  for (let k = 0; k < 6; k++) {
    const y = fr[0] + 0.16 + (k * (fr[1] - fr[0] - 0.32)) / 5;
    sect += ligne("zebre", [[W - 1.15, y, 0], [W - 0.45, y, 0]]);
  }
  for (const [a, b, c, d] of [[-2.4, -2.2, -0.7, -0.6], [0, -2.2, 1.8, -0.6], [2.2, -2.2, W, -0.6], [W + 2.35, -2.2, X1, -0.6], [-2.4, D + 2.6, -0.7, Y1]])
    sect += poly("parc", [[a, b, 0], [c, b, 0], [c, d, 0], [a, d, 0]]);
  const boite = (x0: number, y0: number, x1: number, y1: number, h: number, store: boolean) => {
    let out =
      poly("com-f f-g", [[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]]) +
      poly("com-f f-d", [[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h]]) +
      poly("com-f t-h", [[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]]) +
      ligne("com-c", [[x0, y1, 0], [x0, y1, h], [x1, y1, h], [x1, y0, h], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]]) +
      ligne("com-c", [[x1, y1, 0], [x1, y1, h]]);
    if (store) {
      out += poly("vit", [[x0 + 0.15, y1, 0.08], [x1 - 0.15, y1, 0.08], [x1 - 0.15, y1, h * 0.55], [x0 + 0.15, y1, h * 0.55]]);
      out += poly("store", [[x0 + 0.08, y1, h * 0.72], [x1 - 0.08, y1, h * 0.72], [x1 - 0.08, y1 + 0.32, h * 0.56], [x0 + 0.08, y1 + 0.32, h * 0.56]]);
      for (let k = 1; k < 6; k++) {
        const x = x0 + 0.08 + ((x1 - x0 - 0.16) * k) / 6;
        out += ligne("store-r", [[x, y1, h * 0.72], [x, y1 + 0.32, h * 0.56]]);
      }
    }
    return out;
  };
  sect += boite(-2.3, 0.9, -0.2, D, 0.95, true) + boite(-2.3, -0.4, -0.2, 0.7, 0.7, false);
  const ab = [0.5, fr[1] + 0.22, 1.6, fr[1] + 0.5];
  sect +=
    poly("abri-v", [[ab[0], ab[3], 0.05], [ab[2], ab[3], 0.05], [ab[2], ab[3], 0.62], [ab[0], ab[3], 0.62]]) +
    ligne("abri", [[ab[0], ab[1], 0], [ab[0], ab[1], 0.66]]) +
    ligne("abri", [[ab[2], ab[1], 0], [ab[2], ab[1], 0.66]]) +
    poly("abri-t", [[ab[0] - 0.05, ab[1] - 0.06, 0.68], [ab[2] + 0.05, ab[1] - 0.06, 0.68], [ab[2] + 0.05, ab[3] + 0.04, 0.68], [ab[0] - 0.05, ab[3] + 0.04, 0.68]]) +
    ligne("abri", [[ab[0], ab[1] + 0.12, 0.8], [ab[0], ab[1] + 0.12, 0.68]]);

  // ── Volume neutre ──
  const volume = vues.map((f) => poly(f.cls, [en(f.a, 0), en(f.b, 0), en(f.b, H), en(f.a, H)])).join("");

  // ── 1. Technique : contours, étages, balcons filants, corniche ──
  let tech = "";
  for (const f of vues) tech += ligne("ct", [en(f.a, 0), en(f.b, 0), en(f.b, H), en(f.a, H), en(f.a, 0)]);
  for (let n = 1; n < NIV; n++) for (const f of vues) tech += ligne("ct fin", [en(f.a, n * HF), en(f.b, n * HF)]);
  for (const n of [2, NIV - 1]) for (const f of vues) tech += ligne("ct bal", [en(f.a, n * HF + 0.06), en(f.b, n * HF + 0.06)]);
  for (const f of faces(retrait(emprise, -0.07))) tech += ligne("ct", [en(f.a, H), en(f.b, H)]);

  // ── 2. Financier : fenêtres et vitrines ; la porte à part ──
  let fen = "", porte = "";
  for (const f of vues) {
    const nc = Math.max(1, Math.round(f.L));
    for (let c = 0; c < nc; c++) {
      const t0 = (c + 0.3) / nc, t1 = (c + 0.7) / nc;
      for (let n = 1; n < NIV; n++) {
        const z0 = n * HF + 0.18, z1 = n * HF + 0.64;
        fen += poly("fen", [en(sur(f, t0), z0), en(sur(f, t1), z0), en(sur(f, t1), z1), en(sur(f, t0), z1)]);
      }
      if (f === facade && c === Math.floor(nc / 2))
        porte = poly("porte", [en(sur(f, (c + 0.3) / nc), 0), en(sur(f, (c + 0.7) / nc), 0), en(sur(f, (c + 0.7) / nc), 0.66), en(sur(f, (c + 0.3) / nc), 0.66)]);
      else
        fen += poly("fen", [en(sur(f, (c + 0.18) / nc), 0.02), en(sur(f, (c + 0.82) / nc), 0.02), en(sur(f, (c + 0.82) / nc), 0.62), en(sur(f, (c + 0.18) / nc), 0.62)]);
    }
  }

  // ── 3. Constructibilité : la mansarde, contours en pointillés, vide ──
  const haut = retrait(emprise, 0.32), TH = 0.7;
  let cons = "";
  for (let i = 0; i < emprise.length; i++) {
    const j = (i + 1) % emprise.length, a = emprise[i], b = emprise[j];
    if (!vues.some((f) => f.a === a && f.b === b)) continue;
    cons += poly("cp", [en(a, H), en(b, H), en(haut[j], H + TH), en(haut[i], H + TH)]);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), nc = Math.max(1, Math.round(L));
    for (let c = 0; c < nc; c++) {
      const t = (c + 0.5) / nc, e = (0.09 / L) * nc, k = 0.35;
      const m0: P2 = [a[0] + (b[0] - a[0]) * (t - e), a[1] + (b[1] - a[1]) * (t - e)];
      const m1: P2 = [a[0] + (b[0] - a[0]) * (t + e), a[1] + (b[1] - a[1]) * (t + e)];
      const h0: P2 = [m0[0] + (haut[i][0] - a[0]) * k, m0[1] + (haut[i][1] - a[1]) * k];
      const h1: P2 = [m1[0] + (haut[j][0] - b[0]) * k, m1[1] + (haut[j][1] - b[1]) * k];
      cons += poly("luc", [en(m0, H + 0.14), en(m1, H + 0.14), en(h1, H + 0.14 + TH * k * 0.9), en(h0, H + 0.14 + TH * k * 0.9)]);
    }
  }
  cons += poly("cp", haut.map((p) => en(p, H + TH)));
  const [plx, ply] = P(cx, cy, H + TH);
  cons += `<text class="plus" x="${f1(plx)}" y="${f1(ply + 5)}">+1</text>`;

  // ── 5. Découpe : les lots en pointillés, deux par étage et par façade ──
  let dec = "";
  for (const f of vues) {
    const m = sur(f, 0.5);
    dec += ligne("dec", [en(m, HF), en(m, H)]);
    for (let n = 1; n <= NIV; n++) dec += ligne("dec", [en(f.a, n * HF), en(f.b, n * HF)]);
  }

  // ── 4. Cible : trois personnages sur le trottoir, un seul s'allume ──
  const fm = sur(facade, 0.5);
  const pos: P2[] = [[fm[0] + 0.75, D + 0.32], [fm[0] + 1.25, D + 0.5], [fm[0] + 1.75, D + 0.3]];
  const gens = pos.map(([x, y], k) => {
    const [gx, gy] = P(x, y, 0);
    tous.push([gx, gy - 30]);
    const corps = `<path class="gens" d="M${f1(gx - 6.5)} ${f1(gy)}v-11a6.5 6.5 0 0 1 13 0v11z"/><circle class="gens" cx="${f1(gx)}" cy="${f1(gy - 22)}" r="4.6"/>`;
    return k === 1
      ? `<g data-i="4"><ellipse class="anneau" cx="${f1(gx)}" cy="${f1(gy)}" rx="15" ry="7.5"/><ellipse class="anneau a2" cx="${f1(gx)}" cy="${f1(gy)}" rx="25" ry="12.5"/>${corps}</g>`
      : `<g>${corps}</g>`;
  }).join("");

  // ── Repères : un mot à côté de la partie allumée ──
  const rep = (x: number, y: number, z: number, dx: number, dy: number, mot: string) => {
    const [ax, ay] = P(x, y, z), bx = ax + dx, by = ay + dy, g = dx < 0;
    tous.push([bx + (g ? -110 : 165), by]);
    return `<g class="rep"><circle cx="${f1(ax)}" cy="${f1(ay)}" r="2.6"/><polyline points="${f1(ax)},${f1(ay)} ${f1(bx)},${f1(by)} ${f1(bx + (g ? -14 : 14))},${f1(by)}"/><text x="${f1(bx + (g ? -20 : 20))}" y="${f1(by + 4)}" text-anchor="${g ? "end" : "start"}">${mot}</text></g>`;
  };
  const fd = vues.find((f) => f.cls === "f-d") ?? vues[vues.length - 1];
  const reps = [
    rep(-1.4, (fr[0] + fr[1]) / 2, 0, -24, 26, "Secteur"),
    rep(0, D, H * 0.62, -40, -10, "Technique"),
    rep(...sur(fd, 0.5), 3 * HF + 0.41, 40, -16, "Financier"),
    rep(W - 0.5, 0.6, H + 0.5, 40, -14, "Constructibilité"),
    rep(pos[1][0], pos[1][1], 1.05, 34, 10, "Cible"),
    rep(...sur(fd, 0.5), 4 * HF, 40, -12, "Découpe"),
  ];

  const xs = tous.map((p) => p[0]), ys = tous.map((p) => p[1]);
  const x0 = Math.min(...xs) - 8, y0 = Math.min(...ys) - 12;
  const w = Math.max(...xs) - x0 + 8, h = Math.max(...ys) - y0 + 8;
  const [mx, my] = P(cx, cy, 0), R = Math.max(w, h) * 0.58;
  return `<svg class="sch" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" aria-hidden="true" focusable="false">
<defs>
<radialGradient id="sch-fg" gradientUnits="userSpaceOnUse" cx="${mx.toFixed(0)}" cy="${my.toFixed(0)}" r="${R.toFixed(0)}"><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<mask id="sch-fondu"><rect x="${x0.toFixed(0)}" y="${y0.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="url(#sch-fg)"/></mask>
<linearGradient id="sch-fac-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sch-st sch-st--g1"/><stop offset="1" class="sch-st sch-st--g2"/></linearGradient>
<linearGradient id="sch-fac-d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sch-st sch-st--d1"/><stop offset="1" class="sch-st sch-st--d2"/></linearGradient>
<linearGradient id="sch-or" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sch-st sch-st--or1"/><stop offset=".55" class="sch-st sch-st--or2"/><stop offset="1" class="sch-st sch-st--or3"/></linearGradient>
</defs>
<g data-i="0" mask="url(#sch-fondu)">${sect}</g>
<g class="vol">${volume}</g>
<g data-i="1">${tech}</g>
<g data-i="2">${fen}</g>
<g>${porte}</g>
<g data-i="3">${cons}</g>
<g data-i="5">${dec}</g>
${gens}
<g class="reps">${reps.map((r, i) => `<g data-r="${i}">${r}</g>`).join("")}</g>
</svg>`;
}
