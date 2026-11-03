"use client";

import { useEffect, useRef, useState } from "react";
import { Picto, type NomPicto } from "@/components/Picto";

/**
 * Les cinq analyses de l'estimation et le schéma de l'immeuble qui les illustre
 * (dessin A, MAV 03/11/2026). Chaque analyse allume sa partie du schéma :
 *  - sur ordinateur, elles s'allument l'une après l'autre toutes les trois secondes,
 *    le survol de la section arrête le défilement, le survol ou le clavier choisit ;
 *  - au téléphone, le schéma reste en haut de l'écran et l'analyse qui passe
 *    sous lui s'allume, au fil du défilement ;
 *  - mouvement réduit : rien ne bouge seul, la première analyse reste allumée.
 * Les cinq textes sont toujours lisibles sans rien faire.
 */
export type Analyse = { picto: NomPicto; titre: string; texte: string };

export function AnalysesSchema({ svg, analyses }: { svg: string; analyses: Analyse[] }) {
  const [actif, setActif] = useState(0);
  const racine = useRef<HTMLDivElement>(null);
  const survol = useRef(false);

  // Le schéma vient du serveur en SVG : on y pose l'état allumé.
  useEffect(() => {
    racine.current?.querySelectorAll<SVGGElement>(".sch [data-i]").forEach((g) => {
      g.classList.toggle("est-actif", g.dataset.i === String(actif));
    });
  }, [actif]);

  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const telephone = matchMedia("(max-width: 759px)").matches;

    if (telephone) {
      const io = new IntersectionObserver(
        (es) => es.forEach((x) => { if (x.isIntersecting) setActif(Number((x.target as HTMLElement).dataset.i)); }),
        { rootMargin: "-58% 0px -30% 0px" },
      );
      el.querySelectorAll<HTMLElement>(".analyses-sch__item").forEach((e) => io.observe(e));
      return () => io.disconnect();
    }
    if (calme) return;
    let visible = false;
    const vue = new IntersectionObserver((es) => { visible = es.some((x) => x.isIntersecting); }, { threshold: 0.3 });
    vue.observe(el);
    const t = setInterval(() => {
      if (visible && !survol.current && !el.contains(document.activeElement)) setActif((i) => (i + 1) % analyses.length);
    }, 3000);
    return () => { clearInterval(t); vue.disconnect(); };
  }, [analyses.length]);

  const choisir = (i: number) => () => setActif(i);

  return (
    <div
      ref={racine}
      className="analyses-sch"
      data-actif={actif}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") survol.current = true; }}
      onPointerLeave={() => { survol.current = false; }}
    >
      <div
        className="analyses-sch__scene"
        role="presentation"
        onClick={(e) => {
          const g = (e.target as Element).closest<SVGGElement>("[data-i]");
          if (g?.dataset.i) setActif(Number(g.dataset.i));
        }}
        // Le dessin est calculé par le serveur (src/lib/schema-immeuble.ts), sans donnée extérieure.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <ul className="analyses-sch__liste">
        {analyses.map((a, i) => (
          <li
            key={a.titre}
            data-i={i}
            className={`analyses-sch__item${i === actif ? " est-actif" : ""}`}
            tabIndex={0}
            aria-current={i === actif ? "true" : undefined}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") setActif(i); }}
            onFocus={choisir(i)}
            onClick={choisir(i)}
          >
            <span className="analyses-sch__picto" aria-hidden="true">
              <Picto nom={a.picto} taille={22} />
            </span>
            <h3>{a.titre}</h3>
            <p>{a.texte}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
