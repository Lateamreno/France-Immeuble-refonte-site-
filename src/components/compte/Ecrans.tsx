import Link from "next/link";
import type { ReactNode } from "react";
import { Picto, type NomPicto } from "@/components/Picto";
import { PhotoAgent } from "./PhotoAgent";
import type { Agent } from "@/lib/compte/donnees";
import { ETAPES_VENTE } from "@/lib/compte/vente";

/** L'en-tête d'un écran du compte : pas de hero (MAV, 30/10/2026), un titre et ses actions. */
export function TeteCompte({ surtitre, titre, retour, children }: {
  surtitre: string; titre: ReactNode; retour?: { href: string; nom: string }; children?: ReactNode;
}) {
  return (
    <header className="compte-tete">
      {retour && <Link href={retour.href} className="compte-tete__retour">‹ {retour.nom}</Link>}
      <p className="eyebrow">{surtitre}</p>
      <div className="compte-tete__ligne">
        <h1>{titre}</h1>
        {children && <div className="compte-tete__actions">{children}</div>}
      </div>
    </header>
  );
}

/** Un bloc de l'écran, avec son petit titre. */
export function Panneau({ titre, picto, action, children, className = "" }: {
  titre?: string; picto?: NomPicto; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`compte-panneau ${className}`}>
      {(titre || action) && (
        <div className="compte-panneau__tete">
          {titre && <h2 className="compte-panneau__titre">{picto && <Picto nom={picto} taille={18} />}{titre}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * La frise d'une vente (MAV, 30/10/2026) : estimation, mandat,
 * commercialisation, visites, offres, compromis, acte. `rang` de 1 à 7.
 */
export function Frise({ rang, compacte = false }: { rang: number; compacte?: boolean }) {
  return (
    <ol className={`frise${compacte ? " frise--compacte" : ""}`} aria-label={`Étape ${rang} sur ${ETAPES_VENTE.length} : ${ETAPES_VENTE[rang - 1]}`}>
      {ETAPES_VENTE.map((e, i) => {
        const etat = i + 1 < rang ? "faite" : i + 1 === rang ? "en-cours" : "a-venir";
        return (
          <li key={e} className={`frise__etape frise__etape--${etat}`} aria-current={etat === "en-cours" ? "step" : undefined}>
            <span className="frise__point" aria-hidden="true" />
            <span className="frise__nom">{e === "Commercialisation" ? "Commer­cialisation" : e}</span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * L'agent attitré, connu après le premier appel (§12.4). Sa photo est copiée
 * une fois dans le site et servie par lui (§16) ; ses initiales à défaut.
 */
export function CarteAgent({ agent }: { agent: Agent }) {
  const initiales = (agent.agent_nom ?? "FI").split(/\s+/).map((m) => m[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="carte-agent">
      <PhotoAgent initiales={initiales} photo={!!agent.agent_photo} />
      <div className="carte-agent__texte">
        <p className="carte-agent__nom">{agent.agent_nom ?? "Votre agent"}</p>
        {agent.agent_poste && <p className="carte-agent__poste">{agent.agent_poste}</p>}
        <p className="carte-agent__liens">
          {agent.agent_tel && <a href={`tel:${agent.agent_tel.replace(/[^\d+]/g, "")}`}><Picto nom="telephone" taille={16} />{agent.agent_tel}</a>}
          {agent.agent_email && <a href={`mailto:${agent.agent_email}`}><Picto nom="mail" taille={16} />{agent.agent_email}</a>}
        </p>
      </div>
    </div>
  );
}

/** Un chiffre clé : libellé en petites capitales, valeur en or. */
export function Chiffres({ items }: { items: [string, string | null | undefined][] }) {
  const visibles = items.filter(([, v]) => v);
  if (!visibles.length) return null;
  return (
    <dl className="compte-chiffres">
      {visibles.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  );
}

export function Vide({ picto, children }: { picto: NomPicto; children: ReactNode }) {
  return (
    <div className="compte-vide-bloc">
      <Picto nom={picto} taille={30} />
      <div>{children}</div>
    </div>
  );
}
