import Link from "next/link";
import { CarteBien } from "@/components/CarteBien";
import { Panneau, TeteCompte, Vide } from "@/components/compte/Ecrans";
import { ecranCompte, nomProposition } from "@/lib/compte/ecran";
import { biensCorrespondants } from "@/lib/compte/correspondances";
import { biensAVendre } from "@/lib/biens";
import { dateLongue, euros, pct } from "@/lib/compte/vente";
import type { Proposition } from "@/lib/compte/donnees";

export const dynamic = "force-dynamic";

const ETATS = { disponible: "Disponible", sous_offre: "Sous offre", vendu: "Vendu", retire: "Retiré" };
const REPONSES = { interesse: "Intéressé", visite: "Visite demandée", pas_pour_moi: "Pas pour moi" };
const ETATS_DEMANDE = { en_attente: "En attente", dossier_envoye: "Dossier envoyé", close: "Close" };

const FILTRES: [string, string, (p: Proposition) => boolean][] = [
  ["tous", "Tous", () => true],
  ["nouveaux", "À regarder", (p) => !p.reponse && (p.etat === "disponible" || p.etat === "sous_offre")],
  ["interesse", "Intéressé", (p) => p.reponse === "interesse" || p.reponse === "visite"],
  ["clos", "Vendus ou retirés", (p) => p.etat === "vendu" || p.etat === "retire"],
];

/** Les immeubles que l'agent a proposés au client (§9.2), avec un filtre simple. */
export default async function BiensProposes({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const { filtre: f } = await searchParams;
  const { d } = await ecranCompte();
  const enLigne = await biensAVendre();
  const filtre = FILTRES.find(([k]) => k === f) ?? FILTRES[0];
  const liste = d.propositions.filter(filtre[2]);
  const correspondants = biensCorrespondants(enLigne, d.recherches);
  const offresFaites = new Set(d.saisies.filter((s) => s.type === "offre_acquereur").map((s) => String(s.donnees.proposition)));

  return (
    <>
      <TeteCompte surtitre="Acheter" titre="Biens proposés">
        <Link href="/mon-compte/recherches/" className="btn btn--primary">Mes recherches</Link>
      </TeteCompte>

      {d.propositions.length > 0 && (
        <nav className="filtres" aria-label="Filtrer les biens">
          {FILTRES.map(([k, nom, test]) => (
            <Link key={k} href={k === "tous" ? "/mon-compte/biens/" : `/mon-compte/biens/?filtre=${k}`}
              className="choice" aria-current={filtre[0] === k ? "true" : undefined}>
              {nom} <small>{d.propositions.filter(test).length}</small>
            </Link>
          ))}
        </nav>
      )}

      {d.propositions.length === 0 ? (
        <Panneau>
          <Vide picto="loupe">
            <p>Votre agent vous présente ici les immeubles qui correspondent à vos recherches, souvent avant toute diffusion.</p>
            <p><Link href="/mon-compte/recherches/" className="lien-discret">Déposer ou préciser ma recherche</Link></p>
          </Vide>
        </Panneau>
      ) : liste.length === 0 ? (
        <p className="compte-calme">Aucun bien dans ce filtre.</p>
      ) : (
        <ul className="biens-proposes">
          {liste.map((p) => (
            <li key={p.cle}>
              <Link href={`/mon-compte/biens/${p.cle}/`} className={`bien-propose bien-propose--${p.etat}`}>
                <div className="bien-propose__tete">
                  <span className={`compte-badge compte-badge--${p.etat}`}>{ETATS[p.etat]}</span>
                  {!p.reponse && (p.etat === "disponible" || p.etat === "sous_offre") && <b className="pastille pastille--texte">Nouveau</b>}
                </div>
                <p className="bien-propose__nom">{nomProposition(p)}</p>
                <p className="bien-propose__chiffres">
                  {euros(p.prix) && <span>{euros(p.prix)}</span>}
                  {p.rendement != null && <span>{pct(p.rendement)} brut</span>}
                </p>
                <p className="bien-propose__pied">
                  {p.propose_le ? `Proposé le ${dateLongue(p.propose_le)}` : ""}
                  {p.reponse && ` · ${REPONSES[p.reponse]}`}
                  {offresFaites.has(p.cle) && " · Offre envoyée"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {d.demandes.length > 0 && (
        <Panneau titre="Mes demandes de dossier" picto="dossier">
          <ul className="compte-liste">
            {d.demandes.map((x) => (
              <li key={x.cle}>
                <span>{x.titre ?? "Demande de dossier"}</span>
                <span className={`compte-badge compte-badge--${x.etat}`}>{ETATS_DEMANDE[x.etat]}</span>
                {x.demande_le && <span className="compte-carte__date">le {dateLongue(x.demande_le)}</span>}
              </li>
            ))}
          </ul>
        </Panneau>
      )}

      {correspondants.length > 0 && (
        <Panneau titre="En vente sur le site et dans vos critères" picto="cible">
          <ul className="biens-liste compte-correspondants">
            {correspondants.map((b, i) => <li key={b.id}><CarteBien b={b} rang={i} /></li>)}
          </ul>
        </Panneau>
      )}
    </>
  );
}
