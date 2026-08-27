import facadeCoucher from "@/assets/images/facade-coucher.webp";
import fenetresHeureBleue from "@/assets/images/fenetres-heure-bleue.webp";
import toursContrePlongee from "@/assets/images/tours-contre-plongee.webp";
import interieurToits from "@/assets/images/interieur-toits.webp";
import toitsAeriens from "@/assets/images/toits-aeriens.webp";
import skylineCrepuscule from "@/assets/images/skyline-crepuscule.webp";

/**
 * Visuels du site — CLAUDE.md §16 : les images vivent dans le repo et sont
 * servies depuis notre domaine, jamais depuis un hébergeur tiers.
 *
 * Chaque entrée porte son texte alternatif : une image décorative reste une
 * image, et un lecteur d'écran ne doit pas tomber sur un nom de fichier.
 */
export const VISUELS = {
  facadeCoucher: {
    src: facadeCoucher,
    alt: "Façade haussmannienne parisienne en pierre de taille, éclairée par la lumière rasante du coucher de soleil",
  },
  fenetresHeureBleue: {
    src: fenetresHeureBleue,
    alt: "Immeuble parisien à l’heure bleue, fenêtres éclairées une à une sur une façade sombre",
  },
  toursContrePlongee: {
    src: toursContrePlongee,
    alt: "Tours de bureaux en verre vues en contre-plongée, reflets dorés du soleil couchant",
  },
  interieurToits: {
    src: interieurToits,
    alt: "Vue depuis un intérieur parisien à travers de hautes fenêtres sur les toits au soleil couchant",
  },
  toitsAeriens: {
    src: toitsAeriens,
    alt: "Vue aérienne des toits de zinc parisiens à l’heure dorée, cheminées et lucarnes à perte de vue",
  },
  skylineCrepuscule: {
    src: skylineCrepuscule,
    alt: "Horizon parisien au crépuscule, silhouettes d’immeubles se détachant sur une lueur bronze",
  },
} as const;
