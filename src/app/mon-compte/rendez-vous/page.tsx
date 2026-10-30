import { DemandeRendezVous } from "@/components/compte/RendezVous";
import { CarteAgent, Panneau, TeteCompte } from "@/components/compte/Ecrans";
import { choixImmeubles, ecranCompte, sujetDe } from "@/lib/compte/ecran";
import { CRENEAUX, OBJETS_RDV, jourEnClair } from "@/lib/compte/rendez-vous";

export const dynamic = "force-dynamic";

/**
 * Les rendez-vous (MAV, 30/10/2026) : une demande sur calendrier, que l'agent
 * confirme. L'agence et l'agent attitré sont prévenus tout de suite.
 */
export default async function RendezVous({ searchParams }: { searchParams: Promise<{ bien?: string; proposition?: string }> }) {
  const q = await searchParams;
  const { d } = await ecranCompte();
  const { biens, propositions } = choixImmeubles(d);
  const aujourdhui = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  const demandes = d.saisies.filter((s) => s.type === "rendez_vous" && String(s.donnees.date) >= aujourdhui);

  return (
    <>
      <TeteCompte surtitre="Agenda" titre="Rendez-vous" />
      {demandes.length > 0 && (
        <Panneau titre="Mes demandes" picto="agenda">
          <ul className="compte-liste">
            {demandes.map((r) => {
              const x = r.donnees as { date: string; creneau: keyof typeof CRENEAUX; objet: keyof typeof OBJETS_RDV; bien?: string; proposition?: string };
              const sujet = sujetDe(d, x.bien, x.proposition);
              return (
                <li key={r.ref}>
                  <strong>{jourEnClair(x.date)}</strong>
                  <span>{CRENEAUX[x.creneau]}</span>
                  <span>{OBJETS_RDV[x.objet]}{sujet ? ` · ${sujet}` : ""}</span>
                  <span className="compte-badge">À confirmer</span>
                </li>
              );
            })}
          </ul>
        </Panneau>
      )}
      <Panneau titre="Demander un rendez-vous" picto="agenda">
        {d.agent?.appele && <CarteAgent agent={d.agent} />}
        <DemandeRendezVous biens={biens} propositions={propositions} bien={q.bien} proposition={q.proposition} />
      </Panneau>
    </>
  );
}
