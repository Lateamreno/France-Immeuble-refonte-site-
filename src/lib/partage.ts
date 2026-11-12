/**
 * Images de partage (Open Graph) des pages principales (MAV, 12/11/2026 : « pour l'image de
 * partage fais quelque chose de beau »). 1 200 × 630, photo du site sous un voile noir, logo,
 * surtitre et titre de la page dans la charte. Fichiers dans `public/og/`, générés depuis le
 * gabarit HTML du lot 105 ; les articles gardent leur propre image.
 */
const IMAGES: Record<string, { fichier: string; alt: string }> = {
  "/": { fichier: "accueil", alt: "France Immeuble, l’agence dédiée aux immeubles" },
  "/vendre-un-immeuble/": { fichier: "vendre", alt: "Vendez votre immeuble au meilleur prix" },
  "/estimer-un-immeuble/": { fichier: "estimer", alt: "Découvrez tout le potentiel de votre immeuble" },
  "/vendre-un-immeuble-a-la-decoupe/": { fichier: "decoupe", alt: "Vendre un immeuble à la découpe" },
  "/vendre-un-immeuble/paris/": { fichier: "paris", alt: "Vendre votre immeuble à Paris" },
  "/estimation-immeuble-paris/": { fichier: "estimation-paris", alt: "Estimez votre immeuble parisien" },
  "/acheter-un-immeuble/": { fichier: "acheter", alt: "Les immeubles de rapport avant leur annonce" },
  "/immeubles-vendus/": { fichier: "vendus", alt: "Les immeubles que nous avons vendus" },
  "/immeubles-off-market/": { fichier: "off-market", alt: "Les immeubles que personne ne voit passer" },
  "/immeubles-a-vendre/": { fichier: "a-vendre", alt: "Nos immeubles de rapport à vendre" },
  "/nos-honoraires/": { fichier: "honoraires", alt: "Le barème de nos honoraires" },
  "/contactez-nous/": { fichier: "contact", alt: "Parlons de votre immeuble" },
  "/blog/": { fichier: "blog", alt: "Vendre, estimer, arbitrer : ce qu’il faut savoir" },
};

/** L'image de partage d'une page, ou celle de l'accueil par défaut. */
export function imagesPartage(chemin: string) {
  const i = IMAGES[chemin] ?? IMAGES["/"];
  return [{ url: `/og/${i.fichier}.jpg`, width: 1200, height: 630, alt: i.alt }];
}
