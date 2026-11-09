import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";
import { Picto } from "./Picto";

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
        {/* Pied de page « C » (retour #295, MAV, 09/11/2026) : une rangée de colonnes, les
            mentions sur la dernière ligne, une colonne « Nos biens ». */}
        <div className="footer-grid">
          <div className="footer-col footer-col--marque">
            <Link className="brand" href="/" aria-label="France Immeuble, accueil">
              <Logo titre={null} />
            </Link>
            <p className="small mono footer-coords">
              {/* Retour #211 (MAV, 04/11/2026) : un picto devant le téléphone et l'e-mail. */}
              <a className="footer-coord" href={SITE.telHref}><Picto nom="telephone" taille={16} />{SITE.tel}</a>
              <a className="footer-coord" href={`mailto:${SITE.email}`}><Picto nom="mail" taille={16} />{SITE.email}</a>
              {/* Retour #233 (MAV, 04/11/2026). */}
              <span className="footer-adresse"><Picto nom="secteur" taille={16} /><span>{SITE.adresse}<br />{SITE.codePostalVille}</span></span>
            </p>
          </div>

          <div className="footer-col">
            <h4>Vendre</h4>
            <ul>
              <li><Link href="/vendre-un-immeuble/">Vendre un immeuble</Link></li>
              <li><Link href="/vendre-a-la-decoupe/">Vendre à la découpe</Link></li>
              <li><Link href="/estimer-un-immeuble/">Estimer un immeuble</Link></li>
              <li><Link href="/nos-honoraires/">Nos honoraires</Link></li>
              <li><Link href="/blog/">Blog</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Acheter</h4>
            <ul>
              <li><Link href="/acheter-un-immeuble/">Acheter un immeuble</Link></li>
              <li>
                <a href={SITE.pleinbail} target="_blank" rel="noopener">
                  PleinBail, biens loués
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Nos biens</h4>
            <ul>
              <li><Link href="/immeubles-a-vendre/">Biens à vendre</Link></li>
              <li><Link href="/immeubles-off-market/">Biens off-market</Link></li>
              <li><Link href="/immeubles-vendus/">Biens vendus</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 {SITE.nom}</span>
          <ul className="footer-legal">
            <li><Link href="/contactez-nous/">Nous contacter</Link></li>
            <li><Link href="/plan-du-site/">Plan du site</Link></li>
            <li><Link href="/mentions-legales-2/">Mentions légales</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
