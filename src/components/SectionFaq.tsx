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

/** Espace insécable devant « ? : ; ! % » : pas de point d'interrogation seul en début de ligne. */
export const insecable = (t: string) => t.replace(/ ([?:;!%])/g, "\u00a0$1");

export function SectionFaq({
  items,
  groupes,
  titre,
  surtitre = "Questions fréquentes",
  className = "section--noir-2",
  children,
}: {
  items: QR[];
  /** Les mêmes questions rangées sous des titres (page Paris, lot 108) : un H3 par groupe. */
  groupes?: { titre: string; items: QR[] }[];
  titre: ReactNode;
  surtitre?: string;
  className?: string;
  /** Sous la liste : un bouton, par exemple. */
  children?: ReactNode;
}) {
  if (!items.length) return null;
  const liste = (qs: QR[]) => (
    <Faq items={qs.map((q) => ({ question: insecable(q.question), reponse: q.reponse ?? <p>{insecable(q.texte)}</p> }))} />
  );
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
        <Reveal className="faq-corps">
          {groupes
            ? groupes.map((g) => (
                <div key={g.titre} className="faq-groupe">
                  <h3>{g.titre}</h3>
                  {liste(g.items)}
                </div>
              ))
            : liste(items)}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
