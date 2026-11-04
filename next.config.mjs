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
  // UNE seule source externe : les coffres publics du projet Supabase DU SITE.
  // Ce n'est pas une entorse au §16 (« images hébergées hors du domaine ») :
  // next/image télécharge le fichier côté serveur et le sert depuis
  // /_next/image, sur NOTRE domaine. Le navigateur du visiteur ne contacte
  // jamais Supabase, son adresse IP ne part chez aucun tiers.
  // Tout autre hôte reste refusé — y compris le projet du BO.
  images: {
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
