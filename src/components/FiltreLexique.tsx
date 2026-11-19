"use client";

import { useEffect, useState } from "react";

/**
 * Le filtre du lexique (lot 142) : tout le lexique est dans le HTML, lu par Google ; le filtre ne fait que
 * cacher les définitions qui ne contiennent pas le mot tapé (terme, autre nom et texte).
 */
const sansAccent = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, " ").trim();

export function FiltreLexique({ total }: { total: number }) {
  const [q, setQ] = useState("");
  const [vus, setVus] = useState(total);

  useEffect(() => {
    const cherche = sansAccent(q);
    let n = 0;
    document.querySelectorAll<HTMLElement>(".lex-groupe").forEach((g) => {
      let visibles = 0;
      g.querySelectorAll<HTMLElement>(".lex-terme").forEach((t) => {
        const ok = !cherche || sansAccent(t.dataset.recherche ?? "").includes(cherche);
        t.hidden = !ok;
        if (ok) visibles++;
      });
      g.hidden = visibles === 0;
      n += visibles;
    });
    document.querySelectorAll<HTMLElement>(".lex-alpha a").forEach((a) => {
      const g = document.getElementById(a.getAttribute("href")!.slice(1));
      a.toggleAttribute("aria-disabled", !g || g.hidden === true);
    });
    setVus(n);
  }, [q]);

  return (
    <div className="lex-filtre">
      <label htmlFor="lex-q" className="sr-only">Chercher un mot du lexique</label>
      <input
        id="lex-q"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ex. : rentabilité, préemption"
        autoComplete="off"
        enterKeyHint="search"
      />
      {q && (
        <button type="button" className="lex-filtre__effacer" onClick={() => setQ("")} aria-label="Effacer la recherche">
          Effacer
        </button>
      )}
      <p className="lex-filtre__n" aria-live="polite">
        {q ? (vus ? `${vus} mot${vus > 1 ? "s" : ""}` : "Aucun mot ne correspond.") : `${total} mots`}
      </p>
    </div>
  );
}
