import Link from "next/link";
import { PREUVES, SITE, nombre } from "@/lib/site";

/**
 * Footer global.
 * ⚠️ URLs vérifiées contre l'inventaire réel du site (CLAUDE.md §10) :
 *  - la page mentions légales est bien `/mentions-legales-2/` (slug dupliqué)
 *  - `/politique-de-confidentialite/` N'EXISTE PAS : aucun lien tant que la
 *    page n'est pas créée. Un lien mort vaut moins que pas de lien.
 *  - la colonne « Vendre par ville » arrivera en M6, avec les pages.
 */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link className="brand" href="/">
              France<span>&nbsp;Immeuble</span>
            </Link>
            <p className="small muted" style={{ marginTop: "var(--space-s)", maxWidth: "34ch" }}>
              Agence spécialisée dans la vente d&rsquo;immeubles de rapport en bloc.{" "}
              {PREUVES.immeublesTraites} immeubles traités depuis {PREUVES.depuis}.
            </p>
            <p className="small mono" style={{ marginTop: "var(--space-s)" }}>
              <a href={SITE.telHref}>{SITE.tel}</a>
              <br />
              {SITE.adresse}
              <br />
              {SITE.codePostalVille}
            </p>
          </div>

          <div className="footer-col">
            <h4>Vendre</h4>
            <ul>
              <li><Link href="/vendre-un-immeuble/">Vendre un immeuble</Link></li>
              <li><Link href="/estimer-un-immeuble/">Estimer un immeuble</Link></li>
              <li><Link href="/immeubles-vendus/">Nos biens vendus</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Acheter</h4>
            <ul>
              <li><Link href="/acheter-un-immeuble/">Accès investisseurs</Link></li>
              <li>
                <a href={SITE.pleinbail} target="_blank" rel="noopener">
                  PleinBail — biens loués
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 {SITE.nom}</span>
          <span className="mono">
            {nombre(PREUVES.investisseurs)} investisseurs · Paris 8<sup>e</sup>
          </span>
        </div>
      </div>
    </footer>
  );
}
