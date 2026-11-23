import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { PHOTO_MURS } from "@/components/murs/communs";
import { MURS_A_VENIR } from "@/lib/site";

/**
 * Pages de la section des murs pas encore écrites (menu de l'aperçu, MAV, 23/11/2026) : une page
 * d'attente hors index, pour que le menu ne mène pas à une erreur. Chacune sera remplacée par sa
 * vraie page, une par une, avec l'accord de MAV.
 */
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(MURS_A_VENIR).map((page) => ({ page }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const p = MURS_A_VENIR[(await params).page];
  return { title: p?.titre ?? "Murs commerciaux", robots: { index: false, follow: false } };
}

export default async function PageAVenir({ params }: { params: Promise<{ page: string }> }) {
  const p = MURS_A_VENIR[(await params).page];
  if (!p) notFound();
  const [avant, apres] = p.titre.split(p.accent);
  return (
    <HeroMedia image={PHOTO_MURS.src} alt={PHOTO_MURS.alt} className="hero-murs" credit={PHOTO_MURS.credit}>
      <>
        <Eyebrow>Murs commerciaux · page en préparation</Eyebrow>
        <h1>{avant}<span className="accent">{p.accent}</span>{apres}</h1>
        <p className="lead">{p.texte} Cette page arrive bientôt. En attendant, nous estimons vos murs gratuitement.</p>
        <div className="btn-row">
          <Button href="/murs-commerciaux/estimation/#estimer">Estimer mes murs</Button>
        </div>
      </>
    </HeroMedia>
  );
}
