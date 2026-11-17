import { PagePrix, metadataPrix } from "@/components/annonces/PagePrix";

/** /prix-immeuble-paris/ : tout Paris. Le gabarit est dans src/components/annonces/PagePrix.tsx. */
export const metadata = metadataPrix(null);

export default function PrixImmeubleParis() {
  return <PagePrix arr={null} />;
}
