"use client";

import { useState, type ReactNode } from "react";

export type QuestionFaq = { question: string; reponse: ReactNode };

/**
 * Accordéon FAQ : une seule réponse ouverte à la fois. `nom` : le même nom sur plusieurs listes
 * (FAQ en groupes de la page Paris), et le navigateur n'en garde qu'une ouverte sur l'ensemble.
 */
export function Faq({ items, nom, ouvertAuDepart }: {
  items: QuestionFaq[];
  nom?: string;
  /** La réponse ouverte à l'arrivée (lot 140 : les cinq questions de la page des annonces, au téléphone). */
  ouvertAuDepart?: number;
}) {
  const [ouvert, setOuvert] = useState<number | null>(ouvertAuDepart ?? null);

  return (
    <div className="faq">
      {items.map((item, i) => (
        <details
          name={nom}
          key={item.question}
          className="faq__item"
          open={ouvert === i}
          onToggle={(e) => {
            const el = e.currentTarget;
            if (el.open) setOuvert(i);
            else if (ouvert === i) setOuvert(null);
          }}
        >
          <summary>
            {item.question}
            <span className="faq__sign" aria-hidden="true" />
          </summary>
          <div className="faq__answer">{item.reponse}</div>
        </details>
      ))}
    </div>
  );
}
