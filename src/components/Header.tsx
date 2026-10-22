"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, SITE, type LienNav } from "@/lib/site";
import { Button } from "./Button";
import { Logo } from "./Logo";

export function Header() {
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /** Le sous-menu ouvert, par `href` du parent. Un seul à la fois. */
  const [deroule, setDeroule] = useState<string | null>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOuvert(false);
    setDeroule(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOuvert(false);
        setDeroule(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    /* Transparente au-dessus du hero, pleine dès qu'on défile ou que le tiroir
       est ouvert, comme sur les sites Grey Stone et La Team Reno (MAV,
       22/10/2026). */
    <header className={`site-header${scrolled || ouvert ? " is-scrolled" : ""}`}>
      <div className="container site-header__inner">
        <Link className="brand" href="/" aria-label="France Immeuble — accueil">
          {/* `titre={null}` : le nom accessible vient du lien, inutile de le
              doubler dans le SVG (le lecteur d'écran l'annoncerait deux fois). */}
          <Logo titre={null} />
        </Link>

        <nav
          id="nav"
          className={`nav ${ouvert ? "is-open" : ""}`.trim()}
          aria-label="Navigation principale"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) {
              setOuvert(false);
              setDeroule(null);
            }
          }}
        >
          {NAV.map((item) =>
            item.enfants ? (
              <SousMenu
                key={item.href}
                item={item}
                pathname={pathname}
                ouvert={deroule === item.href}
                onBascule={() =>
                  setDeroule((v) => (v === item.href ? null : item.href))
                }
              />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ),
          )}
          <Button href="/estimer-un-immeuble/">Estimer mon immeuble</Button>
        </nav>

        <div className="header-cta">
          <a className="header-tel" href={SITE.telHref}>
            {SITE.tel.replace(/ /g, " ")}
          </a>
          <Button href="/estimer-un-immeuble/">Estimer mon immeuble</Button>
          <Link
            className="header-compte"
            href="/mon-compte/"
            aria-label="Espace client"
            title="Espace client"
            aria-current={pathname.startsWith("/mon-compte") ? "page" : undefined}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="3.6" />
              <path d="M4.5 20c.9-3.6 3.9-5.6 7.5-5.6s6.6 2 7.5 5.6" />
            </svg>
          </Link>
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={ouvert}
            aria-controls="nav"
            aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOuvert((v) => !v)}
          >
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Entrée de menu à sous-menu.
 *
 * §6 : « le survol doit être un tap sur mobile ». Le bouton porte donc la
 * bascule au clic, qui marche au doigt comme à la souris ; le survol se
 * contente d'ouvrir en plus sur les écrans qui ont un vrai pointeur (CSS,
 * `@media (hover: hover)`). Le parent reste atteignable par son premier
 * enfant, qui pointe sur la même URL.
 */
function SousMenu({
  item,
  pathname,
  ouvert,
  onBascule,
}: {
  item: LienNav;
  pathname: string;
  ouvert: boolean;
  onBascule: () => void;
}) {
  /* Après un clic sur une entrée, le pointeur est encore au-dessus de la liste
     et le focus sur le lien : le survol et `:focus-within` la gardaient
     ouverte sur la page d'arrivée (retour de MAV du 22/10/2026). On la
     verrouille fermée jusqu'à ce que le pointeur quitte le groupe. */
  const [verrou, setVerrou] = useState(false);
  const actif =
    pathname === item.href || (item.enfants ?? []).some((e) => e.href === pathname);
  const id = `sm-${item.href.replace(/\W+/g, "")}`;

  return (
    <div
      className={`nav-groupe${ouvert ? " is-open" : ""}${verrou ? " is-ferme" : ""}`}
      onMouseLeave={() => setVerrou(false)}
    >
      <button
        type="button"
        className="nav-groupe__btn"
        aria-expanded={ouvert}
        aria-controls={id}
        aria-current={actif ? "page" : undefined}
        onClick={() => {
          setVerrou(false);
          onBascule();
        }}
      >
        {item.label}
        <svg
          className="nav-groupe__chev"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div className="nav-groupe__liste" id={id}>
        {(item.enfants ?? []).map((e) => (
          <Link
            key={e.href}
            href={e.href}
            aria-current={pathname === e.href ? "page" : undefined}
            onClick={(ev) => {
              setVerrou(true);
              ev.currentTarget.blur();
            }}
          >
            {e.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
