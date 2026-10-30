import Link from "next/link";
import { CarteBien } from "@/components/CarteBien";
import { Panneau, TeteCompte, Vide } from "@/components/compte/Ecrans";
import { ecranCompte } from "@/lib/compte/ecran";
import { biensAVendre, prix } from "@/lib/biens";
import { dateLongue } from "@/lib/compte/vente";

export const dynamic = "force-dynamic";

/**
 * Mes favoris (MAV, 31/10/2026, comme Plein Bail) : les immeubles à vendre
 * mis de côté depuis la page publique, et les offres faites en ligne dessus.
 * Un favori dont l'immeuble n'est plus en vente n'apparaît plus.
 */
export default async function MesFavoris() {
  const { d } = await ecranCompte();
  const enLigne = await biensAVendre();
  const parId = new Map(enLigne.map((b) => [b.id, b]));
  const favoris = d.favoris.map((f) => parId.get(f.bien)).filter((b): b is NonNullable<typeof b> => !!b);
  const offres = d.saisies
    .filter((s) => s.type === "offre_acquereur" && typeof s.donnees.annonce === "string")
    .map((s) => ({ s, b: parId.get(String(s.donnees.annonce)) }));

  return (
    <>
      <TeteCompte surtitre="Acheter" titre="Mes favoris">
        <Link href="/immeubles-a-vendre/" className="btn btn--primary">Chercher un immeuble</Link>
      </TeteCompte>

      {offres.length > 0 && (
        <Panneau titre="Mes offres sur les annonces" picto="poignee">
          <ul className="compte-liste">
            {offres.map(({ s, b }) => (
              <li key={s.ref}>
                <strong>{prix(Number(s.donnees.montant))}</strong>
                {b ? <Link className="lien-discret" href={`/immeubles-a-vendre/${b.slug}/`}>{b.ville} ({b.dept}), {b.lots ? `${b.lots} lots` : b.type}</Link> : <span>Immeuble retiré de la vente</span>}
                <span className="compte-carte__date">le {dateLongue(s.envoye_le)}</span>
                <span className="compte-badge">À confirmer avec l’agent</span>
              </li>
            ))}
          </ul>
        </Panneau>
      )}

      {favoris.length === 0 ? (
        <Panneau>
          <Vide picto="coeur">
            <p>Touchez le cœur d’une annonce pour la garder ici. Votre agent voit les immeubles qui vous intéressent.</p>
            <p><Link className="lien-discret" href="/immeubles-a-vendre/">Voir les immeubles à vendre</Link></p>
          </Vide>
        </Panneau>
      ) : (
        <ul className="biens-liste compte-correspondants">
          {favoris.map((b, i) => <li key={b.id}><CarteBien b={b} rang={i} /></li>)}
        </ul>
      )}
    </>
  );
}
