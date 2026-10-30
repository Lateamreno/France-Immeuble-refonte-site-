import type { SVGProps } from "react";

/**
 * Pictogrammes de la charte 2026.
 *
 * Inline et non en <img> : dans une image, `currentColor` ne vaut rien et il
 * faudrait servir un fichier par couleur de fond. Ici le picto prend la
 * couleur de son contexte — bronze sur sombre, bronze profond sur crème.
 *
 * Dessin : grille 24, trait 1.5, bouts arrondis, aucun disque de fond.
 * La poignée de main reprend le tracé « handshake » de Lucide (licence ISC) :
 * la version dessinée à la main ne se lisait pas comme une poignée de main. Les
 * fichiers d'origine portaient un dégradé or à six arrêts, c'est-à-dire une
 * seconde couleur d'accent, que le §3 interdit.
 */
export type NomPicto =
  | "secteur" | "technique" | "financier" | "constructibilite" | "cible"
  | "reseau" | "stats" | "augmentation" | "poignee" | "best" | "business"
  | "immeubles" | "mail" | "telephone" | "calculatrice" | "dossier"
  | "loupeCible" | "ecoute" | "euro" | "equipe" | "dossierCible" | "bulles" | "france"
  | "logement" | "commerce" | "entrepot" | "parking" | "cave" | "autre";

const TRACES: Record<NomPicto, React.ReactNode> = {
  /* Types de lots de l'état locatif (retour #70, MAV, 27/10/2026). Le bureau
     reprend la mallette « business ». */
  logement: <><path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.4v11.1h13V9.4"/><path d="M10 20.5V15h4v5.5"/></>,
  commerce: <><path d="M3.5 9.5 5 4.5h14l1.5 5"/><path d="M3.5 9.5a2.1 2.1 0 0 0 4.25 0 2.1 2.1 0 0 0 4.25 0 2.1 2.1 0 0 0 4.25 0 2.1 2.1 0 0 0 4.25 0"/><path d="M5 11.6v8.9h14v-8.9"/><path d="M9.5 20.5v-5h5v5"/></>,
  entrepot: <><path d="M2.5 20.5V9L12 4l9.5 5v11.5"/><path d="M6.5 20.5v-8h11v8"/><path d="M6.5 15.2h11M6.5 17.9h11"/></>,
  parking: <><rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M9.5 16.5v-9h3.2a2.6 2.6 0 0 1 0 5.2H9.5"/></>,
  cave: <><path d="M5 20.5V11a7 7 0 0 1 14 0v9.5"/><path d="M3.5 20.5h17"/><path d="M9.5 20.5v-6a2.5 2.5 0 0 1 5 0v6"/></>,
  autre: <><rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="2.2"/></>,
  // Dossier et cible — le dossier pensé pour un acheteur précis
  dossierCible: <><path d="M11.5 21.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5h8l4.5 4.5v4"/><path d="M14 2.5V7h4.5"/><path d="M7.5 10h6M7.5 13h4M7.5 16h2.5" strokeWidth="1"/><circle cx="17" cy="17" r="4.3"/><circle cx="17" cy="17" r="2"/><circle cx="17" cy="17" r=".7" fill="currentColor" stroke="none"/></>,
  // Deux bulles — la conversation avec le conseiller
  bulles: <><path d="M3 5.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8.5L5.5 15v-2.5H5a2 2 0 0 1-2-2Z"/><path d="M17.8 8.5H19a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2v2.6l-3.1-2.6H11a2 2 0 0 1-2-2v-.8"/><path d="M7 8h.01M9 8h.01M11 8h.01" strokeWidth="2"/></>,
  // Loupe sur une cible — commercialisation ciblée
  loupeCible: <><circle cx="10" cy="10" r="6.6"/><circle cx="10" cy="10" r="3.6"/><circle cx="10" cy="10" r="1" fill="currentColor" stroke="none"/><path d="m14.8 14.8 5.7 5.7" strokeWidth="2.2"/></>,
  // Une personne en écoute une autre — conseil
  ecoute: <><circle cx="5.8" cy="12.6" r="2.2"/><path d="M2 21c.4-3 1.8-4.6 3.8-4.6s3.4 1.6 3.8 4.6"/><circle cx="18.2" cy="12.6" r="2.2"/><path d="M14.4 21c.4-3 1.8-4.6 3.8-4.6s3.4 1.6 3.8 4.6"/><path d="M3.6 2.6h6a1.2 1.2 0 0 1 1.2 1.2v1.8a1.2 1.2 0 0 1-1.2 1.2H6.4L4.6 8.3V6.8h-1a1.2 1.2 0 0 1-1.2-1.2V3.8a1.2 1.2 0 0 1 1.2-1.2Z"/><path d="M14 11.2a2.2 2.2 0 0 0 0 2.8M12.3 10a4 4 0 0 0 0 5.2"/></>,
  // Euro et flèche montante — valorisation
  euro: <><path d="M15.4 7.4a5.6 5.6 0 1 0 0 9.2"/><path d="M4.6 10.8h7.6M4.6 13.6h7.6"/><path d="M20 17V5m0 0-2 2m2-2 2 2"/></>,
  // Trois personnes en cravate — agents
  equipe: <><circle cx="12" cy="7.2" r="2.6"/><path d="M7.4 20.5c.5-4.3 2.3-6.5 4.6-6.5s4.1 2.2 4.6 6.5"/><path d="M12 14.2l-.9 1.4.9 3.4.9-3.4z" fill="currentColor" strokeWidth=".8"/><circle cx="5" cy="9.4" r="2.1"/><path d="M1.5 19.5c.4-3.3 1.7-4.9 3.5-4.9.7 0 1.3.2 1.8.6"/><path d="M5 14.9l-.6 1 .6 2.4.6-2.4z" fill="currentColor" strokeWidth=".7"/><circle cx="19" cy="9.4" r="2.1"/><path d="M22.5 19.5c-.4-3.3-1.7-4.9-3.5-4.9-.7 0-1.3.2-1.8.6"/><path d="M19 14.9l-.6 1 .6 2.4.6-2.4z" fill="currentColor" strokeWidth=".7"/></>,
  // Secteur — repère sur un plan
  /* La France tracée sur ses vraies côtes et frontières, Corse comprise,
     Paris en point plein (MAV, 27/10/2026). */
  france: <><path d="M12 1.7l1.2.6 1.4 1 1 .3 1.4 1.3 1.3.2 2.3 1-.7.9-.3 2.1-.9.3-.8 1.1-.7 1.3 1.3.3.3 1.2-.6 1.5.6 1.4.7 1-1.3 1.3-1 .2-1.4-.6-1-.2-1.5.4-.3 1.7-2-.1-1.6-.4-1.8-.3-1.7-1.1.7-2.2.1-2.2.1-1.6-1.3-1.2-.4-1-1.3-.6-1.6-.7-.7-.5.1-1.1 1.3-.4 1.2-.1 1.4.4.8-.1-.2-.7-.4-1.5.9.1.2.6 1.4.1.6-.4 1.3-1 .7-.7v-1.1z"/><path d="M22.3 18.9l.2 1.2-.4 2.2-.8-.9-.2-1.3z"/><circle cx="11.9" cy="6.6" r="1.2" fill="currentColor" stroke="none"/></>,
  secteur: <><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></>,
  // Technique — élévation d'immeuble, niveaux marqués
  technique: <><path d="M4.5 20.5V6.2l7.5-3.7 7.5 3.7v14.3" /><path d="M3 20.5h18" /><path d="M4.5 10.6h15M4.5 15.2h15" /><path d="M10.2 20.5v-3.4h3.6v3.4" /></>,
  // Financier — courbe de rendement
  financier: <><path d="M3.5 20.5h17" /><path d="M4 16.4l4.6-4.6 3.3 3.3 7.6-7.6" /><path d="M15 7.5h4.5V12" /><circle cx="19.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" /></>,
  // Constructibilité — volume bâti et surélévation en pointillé
  constructibilite: <><path d="M4 20.5V10h10v10.5"/><path d="M3 20.5h18"/><path d="M8.1 20.5v-3h1.8v3"/><path d="M5.9 12h1.6v1.6H5.9zM10.5 12h1.6v1.6h-1.6zM5.9 15.2h1.6v1.6H5.9zM10.5 15.2h1.6v1.6h-1.6z" strokeWidth="1"/><path d="M9 3.6H4V10M9 3.6h5V10" strokeDasharray="2 2"/><path d="M18 20.5V8.5m0 0-1.8 1.8M18 8.5l1.8 1.8"/></>,
  // Cible — le critère qui sélectionne
  cible: <><rect x="3.5" y="3.5" width="17" height="17" rx="1.5" /><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17" /><rect x="9.2" y="9.2" width="5.6" height="5.6" fill="currentColor" stroke="none" /></>,
  // Réseau d'acheteurs
  reseau: <><circle cx="12" cy="4.8" r="2.3" /><circle cx="4.8" cy="18" r="2.3" /><circle cx="19.2" cy="18" r="2.3" /><path d="M12 7.1v4.4m0 0-5.3 4.3M12 11.5l5.3 4.3" /></>,
  stats: <><path d="M3.5 20.5h17" /><path d="M6.8 20.5v-5.2M11.3 20.5V9.4M15.8 20.5v-7.6M20 20.5V5.2" /></>,
  augmentation: <><path d="M3.5 16.5 9 11l3.5 3.5L20.5 6.5" /><path d="M15.5 6.5h5v5" /></>,
  poignee: <><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></>,
  best: <><circle cx="12" cy="9" r="5.3" /><path d="m12 6.6 1 2 2.2.3-1.6 1.6.4 2.2-2-1.1-2 1.1.4-2.2L8.8 8.9l2.2-.3 1-2Z" /><path d="M8.4 13.8 7 21l5-2.5L17 21l-1.4-7.2" /></>,
  business: <><rect x="2.5" y="7.2" width="19" height="12.3" rx="2" /><path d="M8.4 7.2V5.6a1.8 1.8 0 0 1 1.8-1.8h3.6a1.8 1.8 0 0 1 1.8 1.8v1.6" /><path d="M2.5 12.4h19M10.4 12.4h3.2" /></>,
  immeubles: <><path d="M3.5 20.5V8l6-3.2v4.4L15 6.6v4l5.5-2.4v12.3" /><path d="M2.5 20.5h19" /><path d="M6.3 12.2v1.4M6.3 16.1v1.4M12 12.5v1.4M12 16.2v1.4M17.6 12.3v1.4M17.6 16.1v1.4" /></>,
  mail: <><rect x="2.5" y="4.8" width="19" height="14.4" rx="2.2" /><path d="m3.2 7 7.6 5.4a2 2 0 0 0 2.4 0L20.8 7" /></>,
  telephone: <><path d="M7.4 3.6 9.8 8l-2 2.1a13.6 13.6 0 0 0 6.1 6.1l2.1-2 4.4 2.4-.6 2.6a2 2 0 0 1-2.2 1.5C11.4 20 4 12.6 3.1 5.4a2 2 0 0 1 1.5-2.2l2.8-.6Z" /></>,
  calculatrice: <><rect x="4.5" y="2.8" width="15" height="18.4" rx="2" /><rect x="7.5" y="5.8" width="9" height="3.4" rx=".6" /><path d="M8.2 13h.01M12 13h.01M15.8 13h.01M8.2 17h.01M12 17h.01M15.8 17h.01" strokeWidth="2" /></>,
  dossier: <><path d="M3.5 7.2a2 2 0 0 1 2-2h4l2 2.4h7a2 2 0 0 1 2 2v9.2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" /><path d="M8 13.5h8M8 16.8h5" /></>,
};

export function Picto({
  nom,
  taille = 26,
  ...reste
}: { nom: NomPicto; taille?: number } & Omit<SVGProps<SVGSVGElement>, "ref">) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={taille}
      height={taille}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...reste}
    >
      {TRACES[nom]}
    </svg>
  );
}
