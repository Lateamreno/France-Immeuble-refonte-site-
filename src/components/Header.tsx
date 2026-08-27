"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/site";
import { Button } from "./Button";

export function Header() {
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`.trim()}>
      <div className="container site-header__inner">
        <Link className="brand" href="/">
          France<span>&nbsp;Immeuble</span>
        </Link>

        <nav
          id="nav"
          className={`nav ${ouvert ? "is-open" : ""}`.trim()}
          aria-label="Navigation principale"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOuvert(false);
          }}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Button href="/estimer-un-immeuble/">Estimer mon immeuble</Button>
        </nav>

        <div className="header-cta">
          <a className="header-tel" href={SITE.telHref}>
            {SITE.tel.replace(/ /g, " ")}
          </a>
          <Button href="/estimer-un-immeuble/">Estimer mon immeuble</Button>
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
