import { readFileSync } from "node:fs";

/**
 * Les adresses de l'ancien WordPress qui n'existent plus (lot 77, MAV, 04/11/2026 : « réparer
 * toutes les redirections avant de passer sur france-immeuble.fr ») : sitemaps Yoast,
 * catégorie, étiquettes, flux, pages de pièces jointes, anciennes adresses liées depuis le
 * plan du site, documents. Liste générée depuis l'inventaire de l'ancien site (API WordPress
 * et sitemaps du 04/11/2026) ; les images, avec leurs tailles, passent par `src/proxy.ts`.
 */
const REDIRECTIONS_WP = JSON.parse(readFileSync(new URL("./content/redirections-wp.json", import.meta.url), "utf8"));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Les retours de recette envoient leurs captures par une action serveur : la
  // limite par défaut (1 Mo) refusait une capture d'écran collée (04/11/2026).
  // Les captures sont allégées dans le navigateur ; cette marge couvre plusieurs
  // captures dans un même retour, sous la limite de 4,5 Mo de Vercel.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // Les URLs existantes se terminent toutes par un slash (voir CLAUDE.md §10).
  // Objectif zéro perte : ne jamais servir /vendre-un-immeuble sans slash final.
  trailingSlash: true,
  async redirects() {
    return REDIRECTIONS_WP.map((r) => ({ source: r.source, destination: r.destination, statusCode: 301 }));
  },
  // Avant la bascule, le site répond aussi sur *.vercel.app : ces adresses ne doivent pas
  // entrer dans Google (audit SEO, T7). Le domaine www.france-immeuble.fr n'est pas touché.
  async headers() {
    return [
    // Les fichiers de /public/media (photos, carte) : un jour en cache, puis rafraîchis en
    // arrière-plan. Par défaut, Vercel les revalide à chaque visite.
    { source: "/media/:chemin*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
    {
      source: "/:chemin*",
      has: [{ type: "host", value: "(?<sous>.*)\\.vercel\\.app" }],
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }];
  },
  // UNE seule source externe : les coffres publics du projet Supabase DU SITE.
  // Ce n'est pas une entorse au §16 (« images hébergées hors du domaine ») :
  // next/image télécharge le fichier côté serveur et le sert depuis
  // /_next/image, sur NOTRE domaine. Le navigateur du visiteur ne contacte
  // jamais Supabase, son adresse IP ne part chez aucun tiers.
  // Tout autre hôte reste refusé — y compris le projet du BO.
  images: {
    // AVIF d'abord (30 à 50 % plus léger que le WebP à qualité égale), WebP pour les
    // navigateurs qui ne le lisent pas (lot 77, vitesse avant la bascule).
    formats: ["image/avif", "image/webp"],
    // Une image optimisée reste un mois en cache : les photos ne changent pas d'adresse.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "omtkttpvfjsbnqsajcsp.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};
export default nextConfig;
