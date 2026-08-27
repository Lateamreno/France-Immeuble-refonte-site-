import type { Metadata } from "next";
import "./styleguide.css";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";

/** Page interne de référence visuelle. Jamais indexée, jamais liée publiquement. */
export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const FONDS = [
  ["--color-noir", "#0A0A0A"],
  ["--color-noir-2", "#121110"],
  ["--color-noir-3", "#1B1917"],
  ["--color-ligne", "#282522"],
  ["--color-gris", "#8E8A84"],
  ["--color-creme", "#EFE9DE"],
];
const BRONZES = [
  ["--color-bronze-clair", "#E6D4BD"],
  ["--color-bronze-clair-2", "#D4B894"],
  ["--color-bronze", "#C19B6E"],
  ["--color-bronze-hover", "#9C7C54"],
  ["--color-bronze-profond", "#7A5C3E"],
];

function Swatches({ items }: { items: string[][] }) {
  return (
    <div className="swatches">
      {items.map(([nom, hex]) => (
        <div key={nom}>
          <div className="swatch__chip" style={{ background: `var(${nom})` }} />
          <span className="swatch__name">{nom}</span>
          <span className="swatch__hex">{hex}</span>
        </div>
      ))}
    </div>
  );
}

export default function DesignSystem() {
  return (
    <>
      <section className="section section--noir" style={{ paddingBottom: "var(--space-l)" }}>
        <div className="container">
          <Eyebrow>Milestone M1</Eyebrow>
          <h1>Design system</h1>
          <p className="lead" style={{ marginTop: "var(--space-s)" }}>
            Référence visuelle des tokens, de la typographie et des composants définis dans{" "}
            <span className="mono">CLAUDE.md</span> §3 à §5. Page interne, en{" "}
            <span className="mono">noindex</span>.
          </p>
        </div>
      </section>

      <section className="sg-block">
        <div className="container">
          <Eyebrow>§3</Eyebrow>
          <h2>Couleurs</h2>
          <div className="sg-row">
            <span className="sg-label">Fonds &amp; structure</span>
            <Swatches items={FONDS} />
          </div>
          <div className="sg-row">
            <span className="sg-label">Accent bronze — couleur unique</span>
            <Swatches items={BRONZES} />
          </div>
          <div className="sg-row">
            <span className="sg-label">Relief — dégradé monochrome, jamais une 2e couleur</span>
            <div
              className="swatch__chip"
              style={{
                height: 64,
                background:
                  "linear-gradient(135deg, var(--color-bronze-clair) 0%, var(--color-bronze) 45%, var(--color-bronze-profond) 100%)",
              }}
            />
          </div>
          <p className="sg-note">
            Couleurs mortes, à ne jamais réintroduire : #D9BF7D, #D98F7D, #0C2432, #BD9091, #000000,
            #CCCCCC, #EFEFEF, #F8F8F8. Le blanc pur n’est admis que comme couleur de texte sur bouton
            à fond sombre (§5).
          </p>
        </div>
      </section>

      <section className="sg-block">
        <div className="container">
          <Eyebrow>§4</Eyebrow>
          <h2>Typographie</h2>
          <div className="sg-row">
            <span className="sg-label">Display — Archivo variable, wdth 118 / wght 900</span>
            <h1>Immeuble de rapport</h1>
            <p className="type-spec">h1 · clamp(2.3rem → 4.5rem) · font-variation-settings wdth 118</p>
          </div>
          <div className="sg-row">
            <h2>Vente en bloc, off-market</h2>
            <p className="type-spec">h2 · clamp(1.9rem → 3.1rem)</p>
          </div>
          <div className="sg-row">
            <h3>Mandat semi-exclusif</h3>
            <p className="type-spec">h3 · clamp(1.3rem → 1.85rem)</p>
          </div>
          <div className="sg-row">
            <span className="sg-label">Body — Inter variable</span>
            <p className="lead">
              Accroche en <span className="mono">.lead</span> — couleur{" "}
              <span className="mono">--color-gris</span>.
            </p>
            <p style={{ marginTop: "var(--space-s)" }}>
              Corps de texte courant. Nous présentons votre immeuble à un fichier d’investisseurs déjà
              qualifiés, sans annonce publique ni visite de curieux.
            </p>
          </div>
          <div className="sg-row">
            <span className="sg-label">Mono — JetBrains Mono</span>
            <p className="mono">01 72 87 52 22 · 365 immeubles · 5 % · 4,9/5</p>
          </div>
          <p className="sg-note">
            Contrôle visuel : si les titres s’affichent en largeur standard, c’est que le woff2
            variable Archivo n’est pas chargé — ou qu’il a été découpé par graisse, ce qui casse l’axe{" "}
            <span className="mono">wdth</span>.
          </p>
        </div>
      </section>

      <section className="sg-block">
        <div className="container">
          <Eyebrow>§5</Eyebrow>
          <h2>Boutons</h2>
          <div className="sg-row">
            <span className="sg-label">Sur fond sombre</span>
            <div className="btn-row">
              <Button href="/design-system/" icone>CTA principal</Button>
              <Button href="/design-system/" variant="outline">CTA secondaire</Button>
            </div>
          </div>
          <div className="sg-row sg-panel">
            <span className="sg-label">Sur fond clair</span>
            <div className="btn-row">
              <Button href="/design-system/" variant="light" icone>CTA principal</Button>
              <Button href="/design-system/" variant="ghost-dark">CTA secondaire</Button>
            </div>
          </div>
          <p className="sg-note">
            Pilule stricte sur les 4 côtés, texte centré même avec icône, icône à droite avec{" "}
            <span className="mono">gap: 10px</span>. Focus clavier :{" "}
            <span className="mono">outline 2px --color-bronze-clair</span>, offset 3px — vérifiable à
            la touche Tab.
          </p>
        </div>
      </section>

      <section className="sg-block">
        <div className="container">
          <Eyebrow>Composants</Eyebrow>
          <h2>Cartes, chiffres, signature</h2>
          <div className="sg-row">
            <span className="sg-label">.card</span>
            <div className="grid grid--3">
              <article className="card">
                <span className="card__num">01</span>
                <h3>Discrétion totale</h3>
                <p>Aucune annonce, aucune pancarte.</p>
              </article>
              <article className="card">
                <span className="card__num">02</span>
                <h3>Pas de décote</h3>
                <p>L’immeuble n’a pas d’historique public.</p>
              </article>
              <article className="card">
                <span className="card__num">03</span>
                <h3>Acheteurs réels</h3>
                <p>Capacité de financement vérifiée.</p>
              </article>
            </div>
          </div>
          <div className="sg-row">
            <span className="sg-label">.stat-number — dégradé bronze monochrome</span>
            <div className="grid grid--4">
              <div className="stat"><span className="stat-number">365</span><span className="stat-label">Immeubles traités</span></div>
              <div className="stat"><span className="stat-number">1&nbsp;372</span><span className="stat-label">Investisseurs</span></div>
              <div className="stat"><span className="stat-number">5&nbsp;%</span><span className="stat-label">D’honoraires</span></div>
              <div className="stat"><span className="stat-number">4,9</span><span className="stat-label">Avis Google</span></div>
            </div>
          </div>
          <div className="sg-row">
            <span className="sg-label">Filet vertical bronze</span>
            <div className="grid grid--3">
              <div className="railed"><h3>.railed</h3><p className="muted small">Filet 2 px pleine hauteur.</p></div>
              <div className="railed railed--thin"><h3>.railed--thin</h3><p className="muted small">Filet 1 px.</p></div>
              <div className="railed--fade"><h3>.railed--fade</h3><p className="muted small">Dégradé bronze → transparent.</p></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
