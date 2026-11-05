"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Picto, type NomPicto } from "@/components/Picto";

/**
 * Le cadre de l'espace client (option B, MAV, 30/10/2026) : le menu du site
 * reste en haut ; dessous, l'espace s'ouvre comme une application. Un menu à
 * gauche sur ordinateur, cinq onglets en bas au téléphone.
 *
 * Les rubriques suivent le profil : « Mes immeubles » pour un vendeur,
 * « Biens proposés » et « Mes recherches » pour un acheteur. Un client qui
 * vend et achète voit les deux.
 */

type Rubrique = { href: string; nom: string; court: string; picto: NomPicto; badge?: number; visible: boolean };

export function Coquille({
  vendeur,
  acheteur,
  nouveauxBiens,
  messagesAgent,
  children,
}: {
  vendeur: boolean;
  acheteur: boolean;
  nouveauxBiens: number;
  messagesAgent: number;
  children: React.ReactNode;
}) {
  const chemin = usePathname() ?? "/mon-compte/";
  const rubriques: Rubrique[] = [
    { href: "/mon-compte/", nom: "Accueil", court: "Accueil", picto: "logement", visible: true },
    // Toujours visible (MAV, 05/11/2026) : un propriétaire doit trouver ses biens même
    // avant que le BO les ait déposés ; la rubrique vide l'invite à remplir son dossier.
    { href: "/mon-compte/immeubles/", nom: "Mes immeubles", court: "Immeubles", picto: "immeubles", visible: true },
    { href: "/mon-compte/biens/", nom: "Biens proposés", court: "Biens", picto: "loupe", badge: nouveauxBiens, visible: acheteur },
    { href: "/mon-compte/favoris/", nom: "Mes favoris", court: "Favoris", picto: "coeur", visible: acheteur },
    { href: "/mon-compte/recherches/", nom: "Mes recherches", court: "Recherches", picto: "reglages", visible: acheteur },
    { href: "/mon-compte/messages/", nom: "Messages", court: "Messages", picto: "bulles", badge: messagesAgent, visible: true },
    { href: "/mon-compte/rendez-vous/", nom: "Rendez-vous", court: "Rendez-vous", picto: "agenda", visible: true },
    { href: "/mon-compte/profil/", nom: "Mon profil", court: "Profil", picto: "profil", visible: true },
  ];
  const visibles = rubriques.filter((r) => r.visible);
  const actif = (href: string) =>
    href === "/mon-compte/" ? chemin === "/mon-compte/" || chemin === "/mon-compte" : chemin.startsWith(href) ||
      (href === "/mon-compte/immeubles/" && chemin.startsWith("/mon-compte/dossier"));

  // Au téléphone, cinq onglets (MAV, 05/11/2026) : Accueil, Vendre (immeubles et
  // estimations), Acheter (biens proposés et recherches), Favoris, Profil. Messages et
  // rendez-vous restent dans l'accueil, qui porte le nombre de messages à lire.
  const onglets: (Rubrique & { aussi?: string[] })[] = [
    { ...rubriques[0], badge: messagesAgent },
    { href: "/mon-compte/immeubles/", nom: "Vendre", court: "Vendre", picto: "immeubles", visible: true, aussi: ["/mon-compte/dossier"] },
    { href: "/mon-compte/biens/", nom: "Acheter", court: "Acheter", picto: "loupe", badge: nouveauxBiens, visible: true, aussi: ["/mon-compte/recherches"] },
    { href: "/mon-compte/favoris/", nom: "Favoris", court: "Favoris", picto: "coeur", visible: true },
    { href: "/mon-compte/profil/", nom: "Mon profil", court: "Profil", picto: "profil", visible: true },
  ];
  const ongletActif = (o: (typeof onglets)[number]) => actif(o.href) || !!o.aussi?.some((a) => chemin.startsWith(a));

  return (
    <div className="compte-appli">
      <aside className="compte-menu" aria-label="Menu de mon espace">
        <nav>
          {visibles.map((r) => (
            <Link key={r.href} href={r.href} className={`compte-menu__i${actif(r.href) ? " est-actif" : ""}`}
              aria-current={actif(r.href) ? "page" : undefined}>
              <Picto nom={r.picto} taille={19} />
              <span>{r.nom}</span>
              {!!r.badge && <b className="pastille" aria-label={`${r.badge} nouveau${r.badge > 1 ? "x" : ""}`}>{r.badge}</b>}
            </Link>
          ))}
        </nav>
        <Link href="/" className="compte-menu__retour"><Picto nom="sortie" taille={17} /> Retour au site</Link>
      </aside>
      <div className="compte-contenu">{children}</div>
      <nav className="compte-barre" aria-label="Menu de mon espace">
        {onglets.map((r) => (
          <Link key={r.href} href={r.href} className={`compte-barre__i${ongletActif(r) ? " est-actif" : ""}`}
            aria-current={ongletActif(r) ? "page" : undefined}>
            <Picto nom={r.picto} taille={21} />
            <small>{r.court}</small>
            {!!r.badge && <b className="pastille">{r.badge}</b>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
