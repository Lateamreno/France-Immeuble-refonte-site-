import { NouvelleRecherche, RechercheEditable, TitreRecherche } from "@/components/compte/RechercheCompte";
import { Panneau, TeteCompte } from "@/components/compte/Ecrans";
import { Picto, type NomPicto } from "@/components/Picto";
import { ecranCompte } from "@/lib/compte/ecran";
import { euros, pct } from "@/lib/compte/vente";
import type { Recherche } from "@/lib/compte/donnees";
import { LIBELLE_DESTINATION } from "@/lib/annonce";
import { LIBELLE_OPERATION } from "@/lib/recherche-biens";

export const dynamic = "force-dynamic";

const operation = (cible: string | null) =>
  cible ? ((LIBELLE_OPERATION as Record<string, string>)[cible] ?? cible) : "Recherche";

/** « de 400 000 € à 5 600 000 € », « 2 000 000 € et plus », « jusqu'à 3 000 000 € » */
function budget(r: Recherche): string | null {
  if (r.prix_min == null && r.prix_max == null) return null;
  if (r.prix_max == null) return `${euros(r.prix_min)} et plus`;
  if (!r.prix_min) return `jusqu’à ${euros(r.prix_max)}`;
  return `de ${euros(r.prix_min)} à ${euros(r.prix_max)}`;
}

/** Les critères d'une recherche, un picto par information (retour #271, MAV, 05/11/2026). */
function criteres(r: Recherche): [NomPicto, string, string][] {
  const lieux = [
    ...r.villes,
    r.departements.length ? `${r.departements.length > 1 ? "départements" : "département"} ${r.departements.join(", ")}` : null,
  ].filter(Boolean);
  const l: [NomPicto, string, string | null][] = [
    ["cible", "Opération", operation(r.cible)],
    ["secteur", "Où", lieux.length ? lieux.join(", ") : "Toute la France"],
    ["euro", "Budget", budget(r)],
    ["stats", "Rendement", r.rendement_min != null ? `${pct(r.rendement_min)} et plus` : null],
    ["logement", "Occupation", r.occupation_min != null || r.occupation_max != null ? `${r.occupation_min ?? 0} à ${r.occupation_max ?? 100} %` : null],
    ["immeubles", "Immeubles", r.destinations.length
      ? r.destinations.map((d) => (LIBELLE_DESTINATION as Record<string, string>)[d] ?? d).join(", ")
      : null],
  ];
  return l.filter((x): x is [NomPicto, string, string] => !!x[2]);
}

/** Le titre par défaut : l'opération et le premier lieu. */
const titreParDefaut = (r: Recherche) =>
  [operation(r.cible), r.villes[0] ?? (r.departements[0] ? `département ${r.departements[0]}` : null)].filter(Boolean).join(" · ");

/** Mes recherches : le client les modifie et les renomme lui-même, chaque changement part au BO (§9.4). */
export default async function MesRecherches() {
  const { d } = await ecranCompte();
  const noms = new Map(
    d.saisies
      .filter((s) => s.type === "nom_recherche")
      .map((s) => [String(s.donnees.cle), String(s.donnees.nom ?? "")] as const),
  );
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
            <li key={r.cle} className="compte-carte compte-carte--recherche">
              <RechercheEditable valeurs={r}>
                <TitreRecherche cle={r.cle} nom={noms.get(r.cle) || null} defaut={titreParDefaut(r)} />
                <ul className="recherche-criteres">
                  {criteres(r).map(([picto, nom, valeur]) => (
                    <li key={nom}>
                      <Picto nom={picto} taille={18} />
                      <span className="recherche-criteres__nom">{nom}</span>
                      <span className="recherche-criteres__valeur">{valeur}</span>
                    </li>
                  ))}
                </ul>
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
