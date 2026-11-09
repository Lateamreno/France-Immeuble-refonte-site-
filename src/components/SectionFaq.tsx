import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { Faq } from "./Faq";
import { JsonLd } from "./JsonLd";
import { Reveal } from "./Reveal";

/**
 * Une FAQ repliée en fin de page, avec ses données FAQPage pour Google (MAV, 09/11/2026 :
 * « pour le SEO on peut en mettre partout, c'est important »). `texte` est la réponse en
 * clair, lue par Google ; `reponse` la remplace à l'écran quand elle porte un lien.
 */
export type QR = { question: string; texte: string; reponse?: ReactNode };

export function SectionFaq({
  items,
  titre,
  surtitre = "Questions fréquentes",
  className = "section--noir-2",
}: {
  items: QR[];
  titre: ReactNode;
  surtitre?: string;
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <section className={`section ${className} faq-sec`}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((q) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: { "@type": "Answer", text: q.texte },
          })),
        }}
      />
      <div className="container container--narrow">
        <Reveal className="section__head">
          <Eyebrow>{surtitre}</Eyebrow>
          <h2>{titre}</h2>
        </Reveal>
        <Reveal>
          <Faq items={items.map((q) => ({ question: q.question, reponse: q.reponse ?? <p>{q.texte}</p> }))} />
        </Reveal>
      </div>
    </section>
  );
}
