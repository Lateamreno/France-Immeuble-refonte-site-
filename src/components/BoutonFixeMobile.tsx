"use client";

import { useEffect, useState } from "react";

/**
 * Le bouton « Vendre mon immeuble » collé en bas de l'écran du téléphone
 * (retour #77, MAV, 02/11/2026 : « qu'il soit fixe en bas à chaque section de
 * telle sorte que le client voit quasi toujours le bouton »).
 *
 * Il se cache quand il ferait doublon ou gênerait : tant que le hero et ses
 * propres boutons sont à l'écran, et dès que le formulaire (`cible`) ou le bas
 * de page apparaissent. Sur ordinateur, rien : les boutons des sections suffisent.
 */
export function BoutonFixeMobile({ href, libelle, cible }: { href: string; libelle: string; cible: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const etats = new Map<Element, boolean>();
    const hero = document.querySelector("main .hero-media");
    const fin = [document.getElementById(cible), document.querySelector("footer")].filter((x): x is HTMLElement => !!x);
    const calcul = () => {
      const heroVisible = hero ? etats.get(hero) ?? true : false;
      const finVisible = fin.some((x) => etats.get(x));
      setVisible(!heroVisible && !finVisible);
    };
    const obs = new IntersectionObserver((entrees) => {
      for (const e of entrees) etats.set(e.target, e.isIntersecting);
      calcul();
    }, { threshold: 0.05 });
    if (hero) obs.observe(hero);
    fin.forEach((x) => obs.observe(x));
    return () => obs.disconnect();
  }, [cible]);
  return (
    <div className={`bouton-fixe-mob${visible ? " est-visible" : ""}`} aria-hidden={!visible}>
      <a href={href} className="btn btn--primary btn--wide" tabIndex={visible ? 0 : -1}>{libelle}</a>
    </div>
  );
}
