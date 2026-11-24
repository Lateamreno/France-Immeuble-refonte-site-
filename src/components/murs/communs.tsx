import type { ReactNode } from "react";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { FondPhoto } from "@/components/FondPhoto";
import { EstimationForm } from "@/components/EstimationForm";
import { Chiffre } from "@/components/Chiffre";
import { SITE, PREUVES, nombre } from "@/lib/site";
import type { Chiffres } from "@/lib/chiffres";
import type { Vente } from "@/lib/biens";

/**
 * Briques de la section des murs commerciaux (MAV, 20, 22 et 23/11/2026). Sur l'aperçu seulement :
 * pages hors index, hors sitemap, en attente de l'accord de MAV pour la production.
 */

/** Photo du haut retenue pour avancer (MAV, 23/11/2026 : « pour l'instant A ») : licence CC BY-SA 3.0, crédit obligatoire. */
export const PHOTO_MURS = {
  src: "/media/murs/boulangerie-alesia.webp",
  alt: "Boulangerie au rez-de-chaussée d’un immeuble parisien en pierre, à l’angle de deux rues",
  position: "50% 60%",
  credit: (
    <>
      Photo : It’s Judith,{" "}
      <a href="https://commons.wikimedia.org/wiki/File:Fa%C3%A7ade_Boulangerie_Rue_d%27Al%C3%A9sia.jpg" target="_blank" rel="noopener">Wikimedia Commons</a>,{" "}
      <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.fr" target="_blank" rel="noopener">CC BY-SA 3.0</a>
    </>
  ),
};

const trace = (chemin: ReactNode) => (
  <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{chemin}</svg>
);
export const PICTOS_MURS = {
  boutique: trace(<><path d="M6 20h36M8 20v20h32V20M5 20l4-10h30l4 10" /><path d="M5 20c0 3 2.5 5 5 5s5-2 5-5c0 3 2.5 5 5 5s4-2 4-5c0 3 2 5 4.5 5s4.5-2 4.5-5c0 3 2.5 5 5 5s5-2 5-5" /><path d="M14 40V30h8v10M27 30h9v6h-9z" /></>),
  entrepot: trace(<><path d="M5 18 24 8l19 10v22H5z" /><path d="M13 40V24h22v16M13 30h22M13 35h22" /></>),
  retail: trace(<><path d="M4 40h40M7 40V22h14v18M27 40V16h14v24" /><path d="M7 22l7-5 7 5M27 16l7-5 7 5" /><path d="M10 28h8M30 22h8M30 28h8" /><circle cx="14" cy="34" r="1.5" /><circle cx="34" cy="34" r="1.5" /></>),
  rue: trace(<><path d="M24 42s-13-12-13-22a13 13 0 0 1 26 0c0 10-13 22-13 22z" /><circle cx="24" cy="20" r="4.5" /></>),
  bail: trace(<><path d="M13 6h16l8 8v28H13z" /><path d="M29 6v8h8M18 22h14M18 28h14M18 34h9" /></>),
  local: trace(<><path d="M6 40h36M9 40V16h30v24" /><path d="M9 16l3-8h24l3 8M14 40V24h9v16M28 24h7v8h-7z" /></>),
  bureaux: trace(<><path d="M12 42V8h24v34M6 42h36" /><path d="M17 14h4M27 14h4M17 20h4M27 20h4M17 26h4M27 26h4M17 32h4M27 32h4M21 42v-5h6v5" /></>),
  rendement: trace(<><path d="M6 40h36M10 34l9-9 7 6 12-14" /><path d="M32 17h6v6" /></>),
};

export function CarteMurs({ picto, titre, children, lien }: {
  picto: ReactNode; titre: string; children: ReactNode; lien?: { href: string; libelle: string };
}) {
  return (
    <article className="card murs-carte">
      <span className="card__picto">{picto}</span>
      <h3>{titre}</h3>
      <p>{children}</p>
      {lien && <a className="murs-carte__lien" href={lien.href}>{lien.libelle}</a>}
    </article>
  );
}

/** Hero des pages de la section : la photo du haut et son crédit. */
export function HeroMurs({ surtitre, children, lead, chiffres }: {
  surtitre: string; children: ReactNode; lead: ReactNode; chiffres: Chiffres;
}) {
  return (
    <HeroMedia image={PHOTO_MURS.src} alt={PHOTO_MURS.alt} className="hero-murs" credit={PHOTO_MURS.credit}>
      <>
        <Eyebrow>{surtitre}</Eyebrow>
        <h1>{children}</h1>
        <p className="lead">{lead}</p>
        <div className="btn-row">
          <Button href="#estimer" icone>Estimer mes murs</Button>
        </div>
        <div className="hero-proof">
          {/* Le chiffre des acheteurs de murs vient du BO (`acheteurs_murs`) : rien d'affiché tant qu'il manque. */}
          {chiffres.acheteursMurs != null && (
            <Chiffre picto="reseau" valeur={nombre(chiffres.acheteursMurs)} libelle="acheteurs de murs commerciaux" />
          )}
          <Chiffre picto="best" valeur={`${PREUVES.noteGoogle}/5`} libelle={`sur Google, ${PREUVES.nbAvis} avis`} />
          <Chiffre picto="agenda" valeur="2018" libelle="nos premières ventes" />
        </div>
      </>
    </HeroMedia>
  );
}

/** Les ventes publiées qui sont des murs (Hagondange compris, MAV, 22/11/2026). */
export const estUneVenteDeMurs = (v: Vente) =>
  /murs|local d.activit|local commercial|entrep/i.test(`${v.type ?? ""} ${v.titre ?? ""}`);

/** Le formulaire, en fin de page, comme sur Vendre et Estimer : un seul formulaire par page (§9). */
export function SectionEstimationMurs({ titre, texte }: { titre: ReactNode; texte: ReactNode }) {
  return (
    <section id="estimer" className="section section--noir section--ecran sec-formulaire">
      <FondPhoto image="/media/atouts/signature-dossier.webp" position="40% center" clair />
      <div className="container split">
        <Reveal>
          <Eyebrow bare>Première étape</Eyebrow>
          <h2>{titre}</h2>
          <p className="lead">{texte}</p>
          <div className="btn-row" style={{ marginTop: "var(--space-m)" }}>
            <Button href={SITE.telHref} variant="outline">Préférer le téléphone · {SITE.tel}</Button>
          </div>
        </Reveal>
        <EstimationForm formulaire="estimer" murs />
      </div>
    </section>
  );
}
