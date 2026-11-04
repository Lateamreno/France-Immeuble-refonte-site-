"use client";

import { useEffect, useState } from "react";
import { ouvrirEstimation } from "./ModaleEstimation";

/**
 * Le bouton d'action qui suit le visiteur au téléphone, sur toutes les pages
 * qui vendent (retour #77, puis MAV, 02/11/2026 : « mets le bouton fixe
 * partout […] pas tout en bas […] sous le pouce, et que ça reste dans la
 * section »).
 *
 * C'est une pilule posée au-dessus du bas de l'écran, dans la zone du pouce,
 * sans bandeau : la section reste visible autour, toujours au même endroit.
 * Au téléphone, il remplace les boutons des sections qui mènent au même
 * endroit (classe `double-fixe`), pour ne jamais montrer deux fois le même
 * bouton. Il laisse la place :
 * - au hero, qui a ses propres boutons ;
 * - au formulaire (`cible`). Il reste affiché sur le pied de page (retour #201,
 *   MAV, 04/11/2026 : « garder le bouton affiché jusqu'à la fin du pied de page ») ;
 * - aux rangées de boutons qui portent l'action elles-mêmes (`.porte-action`,
 *   les deux boutons collés de « Vendez votre immeuble » sur l'accueil).
 * Sur ordinateur, rien : les boutons des sections suffisent.
 */
export function BoutonFixeMobile({ href, libelle, cible, modale = false }: {
  href: string; libelle: string; cible?: string;
  /** Ouvre la fenêtre d'estimation au lieu de suivre le lien (retour #252). */
  modale?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const etats = new Map<Element, boolean>();
    const hero = document.querySelector("main .hero-media");
    const zoneCible = cible ? document.getElementById(cible) : null;
    // Il s'efface aussi devant tout formulaire visible : il ne recouvre jamais un champ.
    const formulaires = Array.from(document.querySelectorAll<HTMLElement>("main form"));
    const fin = [zoneCible, ...formulaires].filter((x): x is HTMLElement => !!x);
    // Les boutons des sections qui mènent au même endroit : la pilule les remplace.
    const doubles = Array.from(document.querySelectorAll<HTMLElement>(modale ? "main .btn[data-estimer]" : "main a.btn")).filter((b) =>
      (modale || b.getAttribute("href") === href) && !b.closest(".hero-media, .bouton-fixe-mob, .porte-action") &&
      !(zoneCible && zoneCible.contains(b)));
    doubles.forEach((b) => b.classList.add("double-fixe"));
    const porteurs = Array.from(document.querySelectorAll<HTMLElement>("main .porte-action"));
    const calcul = () => {
      const heroVisible = hero ? etats.get(hero) ?? true : false;
      const finVisible = fin.some((x) => etats.get(x));
      const sectionPorte = porteurs.some((b) => etats.get(b));
      setVisible(!heroVisible && !finVisible && !sectionPorte);
    };
    const obs = new IntersectionObserver((entrees) => {
      for (const e of entrees) etats.set(e.target, e.isIntersecting);
      calcul();
    }, { threshold: 0.05 });
    if (hero) obs.observe(hero);
    fin.forEach((x) => obs.observe(x));
    porteurs.forEach((b) => obs.observe(b));
    return () => { obs.disconnect(); doubles.forEach((b) => b.classList.remove("double-fixe")); };
  }, [cible, href, modale]);
  return (
    <div className={`bouton-fixe-mob${visible ? " est-visible" : ""}`} aria-hidden={!visible}>
      {modale
        ? <button type="button" className="btn btn--primary" tabIndex={visible ? 0 : -1} onClick={ouvrirEstimation}>{libelle}</button>
        : <a href={href} className="btn btn--primary" tabIndex={visible ? 0 : -1}>{libelle}</a>}
    </div>
  );
}
