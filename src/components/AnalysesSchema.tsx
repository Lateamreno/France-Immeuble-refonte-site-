"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Picto, type NomPicto } from "@/components/Picto";

/**
 * Les cinq analyses de l'estimation et le schéma de l'immeuble qui les illustre
 * (dessin A, MAV 03/11/2026). Chaque analyse allume sa partie du schéma.
 *
 * Ordinateur (légende A1) : le titre et le chapeau en haut, le schéma à gauche, la
 * liste à droite sans encadré ; l'analyse allumée prend le filet or et son titre
 * passe en or. La section reste à l'écran pendant que le défilement fait passer
 * les cinq analyses, puis la page reprend (retour #127). Sur un écran trop bas
 * pour l'épingler, elles s'allument seules toutes les trois secondes ; le survol
 * arrête le défilement, le survol ou le clavier choisit.
 *
 * Téléphone (B1) : le surtitre, le titre et l'immeuble restent collés en haut de
 * l'écran ; dessous, une analyse par écran, en grand, la suivante à peine visible.
 * L'analyse qui arrive sous l'immeuble s'allume. Sur un écran bas, le titre se
 * resserre ; le surtitre « Estimation » et l'immeuble restent toujours visibles.
 *
 * Mouvement réduit : rien ne bouge seul. Les cinq textes restent toujours lisibles.
 */
export type Analyse = { picto: NomPicto; titre: string; texte: string };

export function AnalysesSchema({
  svg, analyses, entete, chapeau,
}: { svg: string; analyses: Analyse[]; entete: ReactNode; chapeau: ReactNode }) {
  const [actif, setActif] = useState(0);
  const racine = useRef<HTMLDivElement>(null);
  const colle = useRef<HTMLDivElement>(null);
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
    const telephone = matchMedia("(max-width: 759px)");
    let arret = () => {};

    const brancher = () => {
      arret();
      if (telephone.matches) {
        // Hauteur du bloc collé, pour que chaque analyse remplisse le reste de l'écran.
        const bloc = colle.current;
        const mesure = () => { if (bloc) el.style.setProperty("--colle-h", `${Math.round(bloc.offsetHeight)}px`); };
        const ro = new ResizeObserver(mesure);
        if (bloc) ro.observe(bloc);
        mesure();
        // L'analyse dont le haut a passé le milieu de l'espace libre sous le bloc collé.
        const items = [...el.querySelectorAll<HTMLElement>(".analyses-sch__item")];
        let attente = 0;
        const suivre = () => {
          attente = 0;
          const bas = bloc ? bloc.getBoundingClientRect().bottom : 0;
          const repere = bas + (innerHeight - bas) * 0.45;
          let i = 0;
          items.forEach((it, k) => { if (it.getBoundingClientRect().top <= repere) i = k; });
          setActif(i);
        };
        const surDefilement = () => { if (!attente) attente = requestAnimationFrame(suivre); };
        addEventListener("scroll", surDefilement, { passive: true });
        suivre();
        arret = () => { ro.disconnect(); removeEventListener("scroll", surDefilement); if (attente) cancelAnimationFrame(attente); };
        return;
      }
      // Section épinglée (retour #127) : elle reste à l'écran et le défilement fait
      // passer les cinq analyses, puis la page reprend.
      const piste = el.closest<HTMLElement>(".sec-analyses--pin");
      const epingle = piste?.querySelector<HTMLElement>(".sec-analyses__pin");
      if (piste && epingle && matchMedia("(min-width: 760px) and (min-height: 700px)").matches) {
        let attente = 0;
        const suivre = () => {
          attente = 0;
          const r = piste.getBoundingClientRect();
          const haut = parseFloat(getComputedStyle(epingle).top) || 0;
          const course = r.height - epingle.offsetHeight;
          if (course <= 0) return;
          const p = Math.min(1, Math.max(0, (haut - r.top) / course));
          setActif(Math.min(analyses.length - 1, Math.floor(p * analyses.length)));
        };
        const surDefilement = () => { if (!attente) attente = requestAnimationFrame(suivre); };
        addEventListener("scroll", surDefilement, { passive: true });
        addEventListener("resize", surDefilement);
        suivre();
        arret = () => { removeEventListener("scroll", surDefilement); removeEventListener("resize", surDefilement); if (attente) cancelAnimationFrame(attente); };
        return;
      }
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) { arret = () => {}; return; }
      let visible = false;
      const vue = new IntersectionObserver((es) => { visible = es.some((x) => x.isIntersecting); }, { threshold: 0.3 });
      vue.observe(el);
      const t = setInterval(() => {
        if (visible && !survol.current && !el.contains(document.activeElement)) setActif((i) => (i + 1) % analyses.length);
      }, 3000);
      arret = () => { clearInterval(t); vue.disconnect(); };
    };

    brancher();
    telephone.addEventListener("change", brancher);
    return () => { telephone.removeEventListener("change", brancher); arret(); };
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
      <div ref={colle} className="analyses-sch__colle">
        <div className="analyses-sch__entete">{entete}</div>
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
      </div>
      <div className="analyses-sch__chapeau">{chapeau}</div>
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
            <span className="analyses-sch__num" aria-hidden="true">{`0${i + 1}`}<i>/0{analyses.length}</i></span>
            <span className="analyses-sch__picto" aria-hidden="true">
              <Picto nom={a.picto} taille={24} />
            </span>
            <h3>{a.titre}</h3>
            <p>{a.texte}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
