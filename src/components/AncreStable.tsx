"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Retours #250 et #256 (MAV, 04/11/2026) : « Estimer mon immeuble » menait à la
 * fin du formulaire. Le navigateur saute à l'ancre (#estimer) dès le chargement,
 * puis des sections au-dessus changent de hauteur (images, schéma d'Estimer) et
 * la cible descend sous le bord de l'écran. On recale la page sur l'ancre
 * pendant que la mise en page se pose, et on s'arrête dès que le visiteur
 * touche ou fait défiler la page lui-même.
 */
export function AncreStable() {
  const pathname = usePathname();
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const cible = () => document.getElementById(id);
    let fini = false;
    const caler = () => {
      const el = cible();
      if (fini || !el) return;
      const ecart = el.getBoundingClientRect().top - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop || "0");
      if (Math.abs(ecart) > 4) window.scrollTo({ top: window.scrollY + ecart, behavior: "instant" as ScrollBehavior });
    };
    const arreter = () => { fini = true; };
    const minuteries = [60, 250, 600, 1200, 2000].map((ms) => window.setTimeout(caler, ms));
    window.addEventListener("load", caler, { once: true });
    window.addEventListener("wheel", arreter, { once: true, passive: true });
    window.addEventListener("touchstart", arreter, { once: true, passive: true });
    window.addEventListener("keydown", arreter, { once: true });
    return () => {
      fini = true;
      minuteries.forEach(clearTimeout);
      window.removeEventListener("load", caler);
      window.removeEventListener("wheel", arreter);
      window.removeEventListener("touchstart", arreter);
      window.removeEventListener("keydown", arreter);
    };
  }, [pathname]);
  return null;
}
