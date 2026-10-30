import Link from "next/link";
import { EstimationForm } from "@/components/EstimationForm";
import { Chiffres, Frise, Panneau, TeteCompte, Vide } from "@/components/compte/Ecrans";
import { ecranCompte } from "@/lib/compte/ecran";
import { dateLongue, euros, nomImmeuble, pct, rangEtape } from "@/lib/compte/vente";

export const dynamic = "force-dynamic";

/** Mes immeubles : les ventes en cours, les estimations, le dossier en ligne. */
export default async function MesImmeubles() {
  const { d } = await ecranCompte();
  const seules = d.estimations.filter((e) => !e.bien_cle || !d.biens.some((b) => b.cle === e.bien_cle));

  return (
    <>
      <TeteCompte surtitre="Vendre" titre="Mes immeubles">
        <Link href="/mon-compte/dossier/" className="btn btn--primary">Mon dossier en ligne</Link>
      </TeteCompte>

      {d.biens.length === 0 && seules.length === 0 && (
        <Panneau>
          <Vide picto="immeubles">
            <p>Votre immeuble apparaît ici dès que votre agent l’a enregistré, avec son estimation et le suivi de la vente.</p>
            <p className="compte-form__aide">En attendant, remplissez l’état locatif dans votre dossier en ligne : votre agent s’en sert pour l’estimation.</p>
          </Vide>
        </Panneau>
      )}

      <ul className="compte-ventes compte-ventes--grandes">
        {d.biens.map((b) => {
          const est = d.estimations.find((e) => e.bien_cle === b.cle);
          const offres = d.offres.filter((o) => o.bien_cle === b.cle && (o.statut === "en_cours" || o.statut === "contre_offre")).length;
          return (
            <li key={b.cle}>
              <Link href={`/mon-compte/immeubles/${b.cle}/`} className="vente-carte">
                <div className="vente-carte__tete">
                  <div>
                    <p className="vente-carte__nom">{nomImmeuble(b)}</p>
                    <p className="vente-carte__type">{[b.type, b.lots ? `${b.lots} lots` : null].filter(Boolean).join(" · ")}</p>
                  </div>
                  {offres > 0 && <b className="pastille pastille--texte">{offres > 1 ? `${offres} offres` : "Une offre"}</b>}
                </div>
                <Frise rang={rangEtape(b.etape, b.visites, b.offres)} />
                <Chiffres items={[
                  ["Prix affiché", euros(b.prix)],
                  ["Estimation", euros(est?.valeur)],
                  ["Sollicités", b.sollicites != null ? String(b.sollicites) : null],
                  ["Visites", b.visites != null ? String(b.visites) : null],
                  ["Offres", b.offres != null ? String(b.offres) : null],
                ]} />
                <span className="vente-carte__ouvrir">Suivre la vente ›</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {seules.length > 0 && (
        <Panneau titre="Mes estimations" picto="calculatrice">
          <ul className="compte-liste">
            {seules.map((e) => (
              <li key={e.cle}>
                <strong>{euros(e.valeur)}</strong>
                {e.prix_m2 != null && <span>{euros(e.prix_m2)}/m²</span>}
                {e.rendement != null && <span>{pct(e.rendement)} brut</span>}
                {e.estimee_le && <span className="compte-carte__date">le {dateLongue(e.estimee_le)}</span>}
              </li>
            ))}
          </ul>
        </Panneau>
      )}

      <details className="compte-panneau compte-replie">
        <summary>Faire estimer un autre immeuble</summary>
        <EstimationForm formulaire="estimer" dansLeCompte />
      </details>
    </>
  );
}
