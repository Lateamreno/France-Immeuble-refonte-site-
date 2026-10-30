import { NouvelleRecherche, RechercheEditable } from "@/components/compte/RechercheCompte";
import { Panneau, TeteCompte } from "@/components/compte/Ecrans";
import { ecranCompte } from "@/lib/compte/ecran";
import { euros, pct } from "@/lib/compte/vente";
import type { Recherche } from "@/lib/compte/donnees";

export const dynamic = "force-dynamic";

function resume(r: Recherche): string {
  return [
    r.departements.length ? `Départements ${r.departements.join(", ")}` : null,
    r.villes.length ? r.villes.join(", ") : null,
    r.prix_min != null || r.prix_max != null
      ? `${r.prix_min != null ? `de ${euros(r.prix_min)}` : ""}${r.prix_max != null ? ` à ${euros(r.prix_max)}` : ""}`.trim()
      : null,
    r.rendement_min != null ? `rendement ${pct(r.rendement_min)} et plus` : null,
    r.destinations.length ? r.destinations.join(", ") : null,
  ].filter(Boolean).join(" · ");
}

/** Mes recherches : le client les modifie lui-même, chaque changement part au BO (§9.4). */
export default async function MesRecherches() {
  const { d } = await ecranCompte();
  return (
    <>
      <TeteCompte surtitre="Acheter" titre="Mes recherches" />
      {d.recherches.length === 0 ? (
        <Panneau>
          <p className="compte-calme">
            Pas encore de recherche. Ajoutez-en une : votre agent vous présente les immeubles qui y correspondent,
            souvent avant toute diffusion.
          </p>
        </Panneau>
      ) : (
        <ul className="compte-grille">
          {d.recherches.map((r) => (
            <li key={r.cle} className="compte-carte">
              <RechercheEditable valeurs={r}>
                <p className="compte-carte__titre">{r.cible ?? "Recherche"}</p>
                <p className="compte-carte__texte">{resume(r) || "Tous critères"}</p>
                {r.commentaire && <p className="compte-carte__note">{r.commentaire}</p>}
              </RechercheEditable>
            </li>
          ))}
        </ul>
      )}
      <div className="compte-action">
        <NouvelleRecherche ouverte={d.recherches.length === 0} />
      </div>
    </>
  );
}
