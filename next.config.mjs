/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Les URLs existantes se terminent toutes par un slash (voir CLAUDE.md §10).
  // Objectif zéro perte : ne jamais servir /vendre-un-immeuble sans slash final.
  trailingSlash: true,
  // Aucun `images.remotePatterns` : next/image refuse donc toute source
  // externe. C'est l'interdit « images hébergées hors du domaine » (§16)
  // rendu structurel plutôt que laissé à la vigilance.
};
export default nextConfig;
