import Link from "next/link";
import { EstimationForm } from "@/components/EstimationForm";
import { Chiffres, Frise, Panneau, TeteCompte, Vide } from "@/components/compte/Ecrans";
import { OuvrirSurAncre } from "@/components/compte/OuvrirSurAncre";
import { ecranCompte } from "@/lib/compte/ecran";
import { demandesEnCours, nomDemande, resumeDemande } from "@/lib/compte/immeubles";
import { dateLongue, euros, millions, nomImmeuble, pct, rangEtape } from "@/lib/compte/vente";
import { fourchetteDe } from "@/lib/compte/fourchette";

export const dynamic = "force-dynamic";

/**
 * Mes immeubles : chaque immeuble du client, dès l'envoi du formulaire
 * d'estimation (retours #261 et #274, MAV, 05/11/2026), puis tel que le BO
 * le suit (frise de la vente, offres). Un clic ouvre l'immeuble : estimation,
 * état locatif, documents.
 */
export default async function MesImmeubles() {
  const { d } = await ecranCompte();
  const seules = d.estimations.filter((e) => !e.bien_cle || !d.biens.some((b) => b.cle === e.bien_cle));
  const demandes = demandesEnCours(d);
  const fourchettes = await Promise.all(demandes.map((x) => fourchetteDe(x.c)));
  const vide = d.biens.length === 0 && demandes.length === 0 && seules.length === 0;

  return (
    <>
      <TeteCompte surtitre="Vendre" titre="Mes immeubles">
        {!vide && <a href="#ajouter" className="btn btn--primary">Faire estimer un immeuble</a>}
      </TeteCompte>

      {vide && (
        <Panneau>
          <Vide picto="immeubles">
            <p>Faites estimer votre immeuble ci-dessous : il apparaît ici dès l’envoi, avec son état locatif à remplir et vos documents.</p>
          </Vide>
        </Panneau>
      )}

      {(d.biens.length > 0 || demandes.length > 0) && (
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
          {demandes.map(({ ref, envoye_le, c }, i) => {
            const lots = c.dossier?.lots.length ?? 0;
            const fo = fourchettes[i];
            return (
              <li key={ref}>
                <Link href={`/mon-compte/immeubles/${ref}/`} className="vente-carte">
                  <div className="vente-carte__tete">
                    <div>
                      <p className="vente-carte__nom">{nomDemande(c)}</p>
                      <p className="vente-carte__type">{resumeDemande(c) || "Demande d’estimation"}</p>
                    </div>
                    <b className="pastille pastille--texte">{c.dossier_envoye_le ? "État locatif terminé" : c.dossier_transmis_le ? "État locatif commencé" : "État locatif à remplir"}</b>
                  </div>
                  <Frise rang={1} />
                  <Chiffres items={[
                    fo.etat === "prete"
                      ? ["Estimation provisoire", `${millions(fo.f.basse)} à ${millions(fo.f.haute)}`]
                      : ["Estimation", fo.etat === "agent" ? "Visite d’un agent nécessaire" : "En cours"],
                    ["Loyer annuel HC", euros(c.loyerAnnuel)],
                    ["Surface", c.surface ? `${Math.round(c.surface).toLocaleString("fr-FR")} m²` : null],
                    ["Lots remplis", lots ? String(lots) : null],
                    ["Demande", `le ${dateLongue(envoye_le)}`],
                  ]} />
                  <span className="vente-carte__ouvrir">Ouvrir l’immeuble ›</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

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

      {/* Retour #275 : connecté, le formulaire ne redemande ni le nom, ni l'e-mail, ni le téléphone. */}
      <OuvrirSurAncre id="ajouter" ouvert={vide}>
        <summary>{vide ? "Faire estimer mon immeuble" : "Faire estimer un autre immeuble"}</summary>
        <EstimationForm formulaire="estimer" dansLeCompte />
      </OuvrirSurAncre>
    </>
  );
}
