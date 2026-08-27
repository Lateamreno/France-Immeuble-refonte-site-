/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Les URLs existantes se terminent toutes par un slash (voir CLAUDE.md §10).
  // Objectif zéro perte : ne jamais servir /vendre-un-immeuble sans slash final.
  trailingSlash: true,
};
export default nextConfig;
