import { PREUVES, SITE } from "./site";

/**
 * Données structurées — CLAUDE.md §10.
 *
 * Le title et la meta de la homepage sont gelés : les données structurées et
 * les sitelinks sont donc les seuls leviers qu'il reste pour porter le CTR de
 * 0,92 % à 2 %.
 *
 * ⚠️ À ne pas surestimer. Depuis 2023 Google a fortement restreint deux
 * formats qu'on met souvent en avant : les rich results FAQ (réservés à
 * quelques sites d'autorité) et les étoiles d'avis auto-déclarés sur une
 * entreprise (non éligibles). Ce qui s'affiche réellement ici, ce sont les
 * fils d'Ariane et les signaux de marque. Le balisage reste utile à la
 * compréhension de l'entité, mais il ne fera pas apparaître d'étoiles.
 */

export function organisation() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE.url}/#organisation`,
    name: SITE.nom,
    url: SITE.url,
    /* Lot 124 (MAV, 15/11/2026 : optimiser pour ChatGPT et Claude) : ce qu'il faut à un moteur ou à un
       assistant pour reconnaître l'agence comme une entreprise, et pas seulement comme un nom. */
    description:
      "Agence spécialisée dans la vente d'immeubles de rapport en bloc et à la découpe, à Paris, en Île-de-France et en région. Estimation gratuite, vente off-market auprès d'un fichier d'acheteurs d'immeubles.",
    logo: `${SITE.url}/logo/logo-france-immeuble-email.png`,
    image: `${SITE.url}/og/accueil.jpg`,
    email: SITE.email,
    /* La fiche Google de l'agence (identifiant de l'ancien lien d'avis). */
    sameAs: ["https://maps.google.com/?cid=16705123113272005071"],
    telephone: "+33172875222",
    areaServed: [
      { "@type": "City", name: "Paris" },
      { "@type": "AdministrativeArea", name: "Île-de-France" },
      { "@type": "Country", name: "France" },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.adresse,
      postalCode: "75008",
      addressLocality: "Paris",
      addressCountry: "FR",
    },
    knowsAbout: [
      "Vente d'immeuble de rapport",
      "Vente en bloc",
      "Vente à la découpe",
      "Estimation d'immeuble",
    ],
    slogan: "L’agence dédiée aux immeubles",
    /* L'année de création de la société, qui n'est pas une mesure de ventes :
       elle ne se dérive donc pas des données du BO. */
    foundingDate: "2018",
  };
}

export function filAriane(items: { nom: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.nom,
      item: `${SITE.url}${it.url}`,
    })),
  };
}

export function service(nom: string, description: string, url: string, ville?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: nom,
    description,
    url: `${SITE.url}${url}`,
    provider: { "@id": `${SITE.url}/#organisation` },
    areaServed: ville ? { "@type": "City", name: ville } : { "@type": "Country", name: "France" },
  };
}

/** Le site lui-même, relié à l'agence (lot 124). */
export function siteWeb() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#site`,
    name: SITE.nom,
    url: `${SITE.url}/`,
    inLanguage: "fr-FR",
    publisher: { "@id": `${SITE.url}/#organisation` },
  };
}
