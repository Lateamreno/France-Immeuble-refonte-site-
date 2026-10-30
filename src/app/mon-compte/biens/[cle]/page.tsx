import Link from "next/link";
import { notFound } from "next/navigation";
import { ReponseProposition } from "@/components/compte/Actions";
import { OffreAuCurseur } from "@/components/compte/Curseurs";
import { Chiffres, Panneau, TeteCompte } from "@/components/compte/Ecrans";
import { ecranCompte, nomProposition } from "@/lib/compte/ecran";
import { biensAVendre } from "@/lib/biens";
import { dateLongue, euros, nomImmeuble, pct } from "@/lib/compte/vente";

export const dynamic = "force-dynamic";

const ETATS = { disponible: "Disponible", sous_offre: "Sous offre", vendu: "Vendu", retire: "Retiré" };
const FINANCEMENTS: Record<string, string> = { comptant: "comptant", pret: "avec prêt", mixte: "apport et prêt" };

/**
 * La fiche d'un bien proposé : la réponse en un geste, l'offre au curseur
 * (MAV, 30/10/2026), la question ou la visite. L'acquéreur ne voit jamais le
 * nom ni le montant des offres des autres (contrat §7).
 */
export default async function BienPropose({ params }: { params: Promise<{ cle: string }> }) {
  const { cle } = await params;
  const { d } = await ecranCompte();
  const p = d.propositions.find((x) => x.cle === cle);
  if (!p) notFound();
  const annonce = p.bien ? (await biensAVendre()).find((x) => x.id === p.bien) : undefined;
  const ouvert = p.etat === "disponible" || p.etat === "sous_offre";
  const offres = d.saisies.filter((s) => s.type === "offre_acquereur" && s.donnees.proposition === p.cle);
  const dossier = d.demandes.find((x) => x.bien && x.bien === p.bien);
  const profil = d.saisies.some((s) => s.type === "profil_investisseur");

  return (
    <>
      <TeteCompte surtitre={p.type ?? "Bien proposé"} titre={nomImmeuble(p)} retour={{ href: "/mon-compte/biens/", nom: "Biens proposés" }}>
        <span className={`compte-badge compte-badge--${p.etat}`}>{ETATS[p.etat]}</span>
      </TeteCompte>

      <div className="fiche-bien">
        <div className="fiche-bien__principal">
          <Panneau titre="L’immeuble" picto="immeubles">
            <Chiffres items={[
              ["Prix", euros(p.prix)],
              ["Rendement brut", p.rendement != null ? pct(p.rendement) : null],
              ["Lots", p.lots != null ? String(p.lots) : null],
              ["Loyer annuel", p.prix && p.rendement ? euros((Number(p.prix) * Number(p.rendement)) / 100) : null],
            ]} />
            <p className="compte-form__aide">{nomProposition(p)}{p.propose_le ? ` · proposé le ${dateLongue(p.propose_le)}` : ""}</p>
            <div className="compte-panneau__pied">
              {annonce && <Link className="lien-discret" href={`/immeubles-a-vendre/${annonce.slug}/`}>Voir l’annonce et les photos</Link>}
            </div>
          </Panneau>

          {ouvert && (
            <Panneau titre="Votre avis" picto="valide">
              <ReponseProposition cle={p.cle} actuelle={p.reponse} />
            </Panneau>
          )}

          <Panneau titre="Documents" picto="dossier">
            <p className="compte-calme">
              {dossier?.etat === "dossier_envoye"
                ? `Votre agent vous a envoyé le dossier${dossier.demande_le ? ` (demande du ${dateLongue(dossier.demande_le)})` : ""}. Les documents s’ouvriront aussi ici.`
                : "Les documents de l’immeuble (baux, diagnostics, plans) s’ouvrent ici dès que votre agent vous a envoyé le dossier."}
            </p>
          </Panneau>
        </div>

        <aside className="fiche-bien__cote">
          {offres.length > 0 && (
            <Panneau titre="Mes offres" picto="poignee">
              <ul className="compte-liste">
                {offres.map((o) => (
                  <li key={o.ref}>
                    <strong>{euros(Number(o.donnees.montant))}</strong>
                    <span>{FINANCEMENTS[String(o.donnees.financement)] ?? ""}</span>
                    <span className="compte-carte__date">le {dateLongue(o.envoye_le)}</span>
                  </li>
                ))}
              </ul>
              <p className="compte-form__aide">Votre agent vous rappelle pour la confirmer avant de la transmettre.</p>
            </Panneau>
          )}
          {ouvert && <OffreAuCurseur proposition={p.cle} prix={p.prix != null ? Number(p.prix) : null} rendement={p.rendement != null ? Number(p.rendement) : null} />}
          {ouvert && !profil && (
            <p className="compte-form__aide">
              Une offre convainc mieux avec votre profil investisseur. <Link href="/mon-compte/profil/#investisseur" className="lien-discret">Le remplir</Link>
            </p>
          )}
          <Panneau>
            <div className="compte-panneau__pied compte-panneau__pied--colonne">
              <Link className="btn btn--outline" href={`/mon-compte/messages/?nouveau=1&proposition=${p.cle}`}>Poser une question</Link>
              {ouvert && <Link className="lien-discret" href={`/mon-compte/rendez-vous/?proposition=${p.cle}`}>Demander une visite</Link>}
            </div>
          </Panneau>
        </aside>
      </div>
    </>
  );
}
