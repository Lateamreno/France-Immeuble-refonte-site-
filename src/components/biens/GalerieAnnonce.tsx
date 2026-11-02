"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Picto } from "@/components/Picto";
import { BoutonFavori } from "./BoutonFavori";

/**
 * La galerie de la fiche, comme Plein Bail (spec §11) : un carrousel qui glisse
 * (doigt, molette, flèches, clavier), le compteur « 1 / 9 », les vignettes, le
 * plein écran. En surcouche : les badges en haut à gauche, le cœur et
 * « Partager » en haut à droite.
 */
export function GalerieAnnonce({
  images, alt, bien, titre, badges,
}: {
  images: string[];
  alt: string;
  bien: string;
  titre: string;
  badges: string[];
}) {
  const piste = useRef<HTMLDivElement>(null);
  const pistePlein = useRef<HTMLDivElement>(null);
  const plein = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const [partage, setPartage] = useState(false);
  const [copie, setCopie] = useState(false);
  const n = images.length;

  const aller = useCallback((k: number, el = piste.current) => {
    if (!el) return;
    const cible = Math.max(0, Math.min(n - 1, k));
    el.scrollTo({ left: cible * el.clientWidth, behavior: "smooth" });
  }, [n]);

  const suivre = (el: HTMLDivElement) => setI(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));

  // Le plein écran s'ouvre sur la photo affichée.
  const ouvrirPlein = () => {
    plein.current?.showModal();
    requestAnimationFrame(() => {
      const el = pistePlein.current;
      if (el) el.scrollTo({ left: i * el.clientWidth });
    });
  };

  useEffect(() => {
    if (!partage) return;
    const fermer = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest(".galerie-pb__partage")) setPartage(false); };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, [partage]);

  async function partager() {
    const url = window.location.href.split("#")[0];
    if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ title: titre, url }); } catch { /* annulé */ }
      return;
    }
    setPartage((x) => !x);
  }

  const touches = (e: React.KeyboardEvent, el: HTMLDivElement | null) => {
    if (e.key === "ArrowRight") { e.preventDefault(); aller(i + 1, el); }
    if (e.key === "ArrowLeft") { e.preventDefault(); aller(i - 1, el); }
  };

  const url = typeof window === "undefined" ? "" : window.location.href.split("#")[0];
  const texte = encodeURIComponent(`${titre} ${url}`);

  if (n === 0) {
    return (
      <div className="galerie-pb galerie-pb--vide">
        <Picto nom="immeubles" taille={56} aria-hidden="true" />
        <div className="galerie-pb__haut"><span /><BoutonFavori bien={bien} className="galerie-pb__favori" /></div>
      </div>
    );
  }

  return (
    <div className="galerie-pb">
      <div className="galerie-pb__cadre">
        <div ref={piste} className="galerie-pb__piste" tabIndex={0} role="region" aria-roledescription="carrousel"
          aria-label={`Photos, ${n} en tout. Flèches gauche et droite pour défiler.`}
          onScroll={(e) => suivre(e.currentTarget)} onKeyDown={(e) => touches(e, piste.current)}>
          {images.map((src, k) => (
            <div key={src} className="galerie-pb__diapo" aria-roledescription="diapositive" aria-label={`${k + 1} sur ${n}`}>
              <Image src={src} alt={k === 0 ? alt : ""} fill sizes="(max-width: 899px) 100vw, 60vw"
                className="galerie-pb__img" priority={k === 0} />
            </div>
          ))}
        </div>

        <div className="galerie-pb__haut">
          <span className="galerie-pb__badges">
            {badges.map((x) => <span key={x} className="badge badge--clair">{x}</span>)}
          </span>
          <span className="galerie-pb__actions">
            <BoutonFavori bien={bien} className="galerie-pb__favori" />
            <span className="galerie-pb__partage">
              <button type="button" className="favori" aria-label="Partager" title="Partager" aria-expanded={partage} onClick={partager}>
                <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M5 12.5v7h14v-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {partage && (
                <span className="galerie-pb__menu" role="menu">
                  <button type="button" role="menuitem" onClick={async () => {
                    try { await navigator.clipboard.writeText(url); setCopie(true); setTimeout(() => setCopie(false), 1800); } catch { /* refusé */ }
                  }}>{copie ? "Lien copié" : "Copier le lien"}</button>
                  <a role="menuitem" href={`https://wa.me/?text=${texte}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  <a role="menuitem" href={`mailto:?subject=${encodeURIComponent(titre)}&body=${encodeURIComponent(url)}`}>E-mail</a>
                  <a role="menuitem" href={`sms:?&body=${texte}`}>SMS</a>
                </span>
              )}
            </span>
          </span>
        </div>

        {n > 1 && (
          <>
            <button type="button" className="galerie-pb__fleche galerie-pb__fleche--g" aria-label="Photo précédente" disabled={i === 0} onClick={() => aller(i - 1)}>‹</button>
            <button type="button" className="galerie-pb__fleche galerie-pb__fleche--d" aria-label="Photo suivante" disabled={i >= n - 1} onClick={() => aller(i + 1)}>›</button>
          </>
        )}
        <div className="galerie-pb__bas">
          <span className="galerie-pb__compteur" aria-live="polite">{i + 1} / {n}</span>
          <button type="button" className="galerie-pb__plein-btn" onClick={ouvrirPlein}>Plein écran</button>
        </div>
      </div>

      {n > 1 && (
        <div className="galerie-pb__vignettes">
          {images.map((src, k) => (
            <button key={src} type="button" className="galerie-pb__vignette" aria-label={`Photo ${k + 1}`} aria-current={k === i ? "true" : undefined}
              onClick={() => aller(k)}>
              <Image src={src} alt="" fill sizes="96px" className="galerie-pb__img" />
            </button>
          ))}
        </div>
      )}

      <dialog ref={plein} className="galerie-plein" aria-label="Photos en plein écran"
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <div ref={pistePlein} className="galerie-pb__piste galerie-plein__piste" tabIndex={0}
          onScroll={(e) => suivre(e.currentTarget)} onKeyDown={(e) => touches(e, pistePlein.current)}>
          {images.map((src, k) => (
            <div key={src} className="galerie-pb__diapo">
              <Image src={src} alt={k === 0 ? alt : ""} fill sizes="100vw" className="galerie-plein__img" />
            </div>
          ))}
        </div>
        <button type="button" className="galerie-plein__fermer" aria-label="Fermer le plein écran" onClick={() => plein.current?.close()}>×</button>
        {n > 1 && (
          <>
            <button type="button" className="galerie-pb__fleche galerie-pb__fleche--g" aria-label="Photo précédente" disabled={i === 0} onClick={() => aller(i - 1, pistePlein.current)}>‹</button>
            <button type="button" className="galerie-pb__fleche galerie-pb__fleche--d" aria-label="Photo suivante" disabled={i >= n - 1} onClick={() => aller(i + 1, pistePlein.current)}>›</button>
          </>
        )}
        <span className="galerie-pb__compteur galerie-plein__compteur">{i + 1} / {n}</span>
      </dialog>
    </div>
  );
}
