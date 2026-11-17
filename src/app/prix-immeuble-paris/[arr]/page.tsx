import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PagePrix, arrondissementDe, metadataPrix } from "@/components/annonces/PagePrix";

/** /prix-immeuble-paris/16e/ : un arrondissement. Vingt adresses, de « 1er » à « 20e », et aucune autre. */
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: 20 }, (_, i) => ({ arr: `${i + 1}${i === 0 ? "er" : "e"}` }));
}

export async function generateMetadata({ params }: { params: Promise<{ arr: string }> }): Promise<Metadata> {
  return metadataPrix(arrondissementDe((await params).arr));
}

export default async function PrixImmeubleParisArrondissement({ params }: { params: Promise<{ arr: string }> }) {
  const arr = arrondissementDe((await params).arr);
  if (!arr) notFound();
  return <PagePrix arr={arr} />;
}
