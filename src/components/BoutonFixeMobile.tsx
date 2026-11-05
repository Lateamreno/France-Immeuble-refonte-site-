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
 *   les deux boutons collés de « Vendez votre immeuble » sur l'accueil) ;
 * - à toute section qui porte ses propres boutons : la pilule s'efface dès
 *   qu'on arrive dans la section et revient quand on en sort (MAV, 05/11/2026 :
 *   « sinon des boutons peuvent se superposer », puis « dès qu'on arrive sur
 *   une section à bouton »).
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
    // Les sections qui ont leurs propres boutons (hors pilule, hero et doubles
    // masqués, hors fenêtres fermées) : on y entre, la pilule s'efface.
    const sections = [...new Set(
      Array.from(document.querySelectorAll<HTMLElement>("main .btn"))
        .filter((b) => !b.closest(".hero-media, .bouton-fixe-mob, dialog") && !doubles.includes(b) && b.getClientRects().length > 0)
        .map((b) => b.closest<HTMLElement>("main > section, main section"))
        .filter((x): x is HTMLElement => !!x),
    )];
    const calcul = () => {
      const heroVisible = hero ? etats.get(hero) ?? true : false;
      const finVisible = fin.some((x) => etats.get(x));
      const sectionPorte = porteurs.some((b) => etats.get(b));
      const sectionABoutons = sections.some((x) => dansSection.get(x));
      setVisible(!heroVisible && !finVisible && !sectionPorte && !sectionABoutons);
    };
    const obs = new IntersectionObserver((entrees) => {
      for (const e of entrees) etats.set(e.target, e.isIntersecting);
      calcul();
    }, { threshold: 0.05 });
    if (hero) obs.observe(hero);
    fin.forEach((x) => obs.observe(x));
    porteurs.forEach((b) => obs.observe(b));
    // « On arrive » dans une section quand son haut passe aux deux tiers de l'écran ;
    // on en sort quand son bas a quitté l'écran par le haut.
    const dansSection = new Map<Element, boolean>();
    const obsSections = new IntersectionObserver((entrees) => {
      for (const e of entrees) dansSection.set(e.target, e.isIntersecting);
      calcul();
    }, { rootMargin: "0px 0px -35% 0px", threshold: 0 });
    sections.forEach((x) => obsSections.observe(x));
    return () => { obs.disconnect(); obsSections.disconnect(); doubles.forEach((b) => b.classList.remove("double-fixe")); };
  }, [cible, href, modale]);
  return (
    <div className={`bouton-fixe-mob${visible ? " est-visible" : ""}`} aria-hidden={!visible}>
      {modale
        ? <button type="button" className="btn btn--primary" tabIndex={visible ? 0 : -1} onClick={ouvrirEstimation}>{libelle}</button>
        : <a href={href} className="btn btn--primary" tabIndex={visible ? 0 : -1}>{libelle}</a>}
    </div>
  );
}
