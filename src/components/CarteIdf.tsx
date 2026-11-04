import Image from "next/image";
import { CARTE_VIEWBOX, REGIONS_FR } from "@/lib/carte-france";

/**
 * Le périmètre de la découpe (retour #159, puis MAV, 04/11/2026 : « je voyais un
 * truc comme sur la photo », la France vue de nuit). Chaque commune est un point
 * de lumière à sa population (INSEE, via geo.api.gouv.fr, Licence ouverte), dessiné
 * une fois en or sur noir et servi par le site (`/media/carte/france-nuit.webp`,
 * même projection que `carte-france.ts`). Par-dessus, le trait de l'Île-de-France
 * et Paris, en vectoriel pour rester nets.
 */
const PARIS = { x: 509.5, y: 236.6 };

export function CarteIdf() {
  const idf = REGIONS_FR["11"];
  return (
    <div className="carte-idf">
      <Image src="/media/carte/france-nuit.webp" alt="" fill sizes="(max-width: 899px) 360px, 520px" className="carte-idf__nuit" />
      <svg className="carte-idf__trait" viewBox={CARTE_VIEWBOX} role="img" aria-label="La France de nuit, l’Île-de-France et Paris en surbrillance">
        <path d={idf.d} className="carte-idf__idf" />
        <circle cx={PARIS.x} cy={PARIS.y} r="16" className="carte-idf__onde" />
        <line x1={PARIS.x + 18} y1={PARIS.y - 10} x2={PARIS.x + 120} y2={PARIS.y - 70} className="carte-idf__fil" />
        <text x={PARIS.x + 128} y={PARIS.y - 74} className="carte-idf__nom">Paris</text>
        <text x={PARIS.x + 128} y={PARIS.y - 44} className="carte-idf__sous">et l’Île-de-France</text>
      </svg>
    </div>
  );
}
