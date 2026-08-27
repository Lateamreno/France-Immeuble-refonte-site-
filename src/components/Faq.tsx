"use client";

import { useState, type ReactNode } from "react";

export type QuestionFaq = { question: string; reponse: ReactNode };

/** Accordéon FAQ — une seule réponse ouverte à la fois. */
export function Faq({ items }: { items: QuestionFaq[] }) {
  const [ouvert, setOuvert] = useState<number | null>(null);

  return (
    <div className="faq">
      {items.map((item, i) => (
        <details
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
