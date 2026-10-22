import type { Metadata } from "next";
import Link from "next/link";
import { HeroMedia } from "@/components/HeroMedia";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { CarteBien } from "@/components/CarteBien";
import { EstimationForm } from "@/components/EstimationForm";
import { Acces } from "@/components/compte/Acces";
import { Deconnexion, FermerCompte, NouveauMotDePasse, ProposerPrix, ReponseProposition } from "@/components/compte/Actions";
import { NouvelleRecherche, RechercheEditable } from "@/components/compte/RechercheCompte";
import { DepotPiece } from "@/components/compte/DepotPiece";
import { sessionCourante } from "@/lib/compte/auth";
import { donneesCompte, type DonneesCompte, type Recherche } from "@/lib/compte/donnees";
import { biensCorrespondants } from "@/lib/compte/correspondances";
import { CATEGORIES } from "@/lib/compte/pieces";
import { biensAVendre, prix } from "@/lib/biens";
import { VISUELS } from "@/lib/visuels";
import { SITE } from "@/lib/site";

/**
 * /mon-compte/ — le compte client du site (contrat BO §9 et §10).
 *
 * Un seul compte pour acquéreurs et propriétaires. Tout ce qu'il montre est
 * lu dans les tables `compte_*` avec le jeton de la personne : la base ne
 * rend que ses lignes. Le BO y dépose ; le site ne lit jamais le CRM (§2).
 * Page hors index : elle est propre à chacun.
 */
export const metadata: Metadata = {
  title: { absolute: "Mon compte | France Immeuble" },
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE.url}/mon-compte/` },
};

const date = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }) : null;
const pct = (n: number | null | undefined) =>
  n == null ? null : `${Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const euros = (n: number | null | undefined) => (n == null ? null : prix(Number(n)));

const ETATS_PROPOSITION = { disponible: "Disponible", sous_offre: "Sous offre", vendu: "Vendu", retire: "Retiré" };
const ETATS_DEMANDE = { en_attente: "En attente", dossier_envoye: "Dossier envoyé", close: "Close" };

function resumeRecherche(r: Recherche): string {
  const morceaux = [
    r.departements.length ? `Départements ${r.departements.join(", ")}` : null,
    r.villes.length ? r.villes.join(", ") : null,
    r.prix_min != null || r.prix_max != null
      ? `${r.prix_min != null ? `de ${euros(r.prix_min)}` : ""}${r.prix_max != null ? ` à ${euros(r.prix_max)}` : ""}`.trim()
      : null,
    r.rendement_min != null ? `rendement ${pct(r.rendement_min)} et plus` : null,
    r.destinations.length ? r.destinations.join(", ") : null,
  ];
  return morceaux.filter(Boolean).join(" · ");
}

export default async function MonCompte({ searchParams }: { searchParams: Promise<{ etat?: string }> }) {
  const { etat } = await searchParams;
  const session = await sessionCourante();

  if (!session) {
    return (
      <>
        <HeroMedia image={VISUELS.interieurToits.src} alt={VISUELS.interieurToits.alt}>
          <>
            <Eyebrow>Espace client</Eyebrow>
            <h1>
              Votre <span className="accent">compte</span> France Immeuble
            </h1>
            <p className="lead">
              Acquéreur, retrouvez vos recherches et les immeubles que nous vous avons présentés.
              Propriétaire, suivez la vente de votre immeuble et déposez vos pièces.
            </p>
          </>
        </HeroMedia>
        <section className="section section--noir-2">
          <div className="container split">
            <div>
              <Eyebrow>Un seul compte</Eyebrow>
              <h2>Pour acheter comme pour vendre</h2>
              <ul className="compte-atouts">
                <li>Vos recherches, que vous modifiez vous-même.</li>
                <li>Les immeubles qu’on vous a proposés, y compris off-market.</li>
                <li>L’estimation de votre immeuble dès qu’un agent l’a validée.</li>
                <li>Le suivi de la vente : acquéreurs sollicités, visites, offres.</li>
                <li>Le dépôt des pièces de votre immeuble, directement au coffre de l’agence.</li>
              </ul>
              <p className="muted">
                Aucun e-mail automatique : nous vous écrivons quand un agent a quelque chose à vous
                envoyer, c’est tout.
              </p>
            </div>
            <Acces etat={etat} />
          </div>
        </section>
      </>
    );
  }

  const { utilisateur, jeton } = session;
  const [d, enLigne] = await Promise.all([donneesCompte(jeton), biensAVendre()]);
  const slugs = new Map(enLigne.map((b) => [b.id, b.slug]));
  const correspondants = biensCorrespondants(enLigne, d.recherches);
  const prenom = utilisateur.user_metadata?.prenom || "";

  return (
    <>
      <HeroMedia image={VISUELS.interieurToits.src} alt={VISUELS.interieurToits.alt}>
        <>
          <Eyebrow>Mon compte</Eyebrow>
          <h1>
            Bonjour{prenom ? " " : ""}<span className="accent">{prenom || ""}</span>
          </h1>
          <p className="lead">
            Vos recherches, les immeubles que nous vous avons proposés et le suivi de vos immeubles.
          </p>
          <div className="btn-row">
            <Button href="#acheter">Mes recherches</Button>
            <Button href="#vendre" variant="outline">Mes immeubles</Button>
          </div>
        </>
      </HeroMedia>

      {(etat === "bienvenue" || etat === "nouveau-mot-de-passe") && (
        <section className="section section--noir compte-bandeau">
          <div className="container container--narrow">
            {etat === "bienvenue" ? (
              <p className="compte-note">Votre adresse est vérifiée : votre compte est ouvert.</p>
            ) : (
              <NouveauMotDePasse />
            )}
          </div>
        </section>
      )}

      <Acheteur d={d} slugs={slugs} correspondants={correspondants} />
      <Proprietaire d={d} slugs={slugs} />

      <section className="section section--noir">
        <div className="container compte-reglages">
          <div>
            <Eyebrow>Mon compte</Eyebrow>
            <p>
              Connecté avec <strong>{utilisateur.email}</strong>
            </p>
            <Deconnexion />
          </div>
          <FermerCompte />
        </div>
      </section>
    </>
  );
}

function Acheteur({
  d,
  slugs,
  correspondants,
}: {
  d: DonneesCompte;
  slugs: Map<string, string>;
  correspondants: Awaited<ReturnType<typeof biensAVendre>>;
}) {
  return (
    <section id="acheter" className="section section--noir-2">
      <div className="container">
        <div className="section__head">
          <Eyebrow>Acheter</Eyebrow>
          <h2>Mes recherches</h2>
        </div>

        {d.recherches.length === 0 ? (
          <p className="compte-vide">
            Pas encore de recherche. Ajoutez-en une : votre agent vous présente les immeubles qui y
            correspondent, souvent avant toute diffusion.
          </p>
        ) : (
          <ul className="compte-grille">
            {d.recherches.map((r) => (
              <li key={r.cle} className="compte-carte">
                <RechercheEditable valeurs={r}>
                  <p className="compte-carte__titre">{r.cible ?? "Recherche"}</p>
                  <p className="compte-carte__texte">{resumeRecherche(r) || "Tous critères"}</p>
                  {r.commentaire && <p className="compte-carte__note">{r.commentaire}</p>}
                </RechercheEditable>
              </li>
            ))}
          </ul>
        )}
        <div className="compte-action">
          <NouvelleRecherche ouverte={d.recherches.length === 0} />
        </div>

        <h3 className="compte-sous-titre">Les immeubles qu’on vous a proposés</h3>
        {d.propositions.length === 0 ? (
          <p className="compte-vide">Aucun immeuble proposé pour l’instant.</p>
        ) : (
          <ul className="compte-grille">
            {d.propositions.map((p) => {
              const slug = p.bien ? slugs.get(p.bien) : undefined;
              return (
                <li key={p.cle} className="compte-carte">
                  <span className={`compte-badge compte-badge--${p.etat}`}>{ETATS_PROPOSITION[p.etat]}</span>
                  <p className="compte-carte__titre">
                    {p.commune ?? "Commune"} {p.dept && <span className="compte-carte__dept">({p.dept})</span>}
                  </p>
                  <p className="compte-carte__texte">
                    {[p.type, p.lots ? `${p.lots} lots` : null].filter(Boolean).join(" · ")}
                  </p>
                  <p className="compte-carte__chiffres">
                    {euros(p.prix) && <span>{euros(p.prix)}</span>}
                    {pct(p.rendement) && <span>{pct(p.rendement)} brut</span>}
                  </p>
                  {p.propose_le && <p className="compte-carte__date">Proposé le {date(p.propose_le)}</p>}
                  {slug && <Link className="lien-discret" href={`/immeubles-a-vendre/${slug}/`}>Voir la fiche</Link>}
                  {(p.etat === "disponible" || p.etat === "sous_offre") && (
                    <ReponseProposition cle={p.cle} actuelle={p.reponse} />
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {d.demandes.length > 0 && (
          <>
            <h3 className="compte-sous-titre">Mes demandes de dossier</h3>
            <ul className="compte-liste">
              {d.demandes.map((x) => (
                <li key={x.cle}>
                  <span>{x.titre ?? "Demande de dossier"}</span>
                  <span className={`compte-badge compte-badge--${x.etat}`}>{ETATS_DEMANDE[x.etat]}</span>
                  {x.demande_le && <span className="compte-carte__date">le {date(x.demande_le)}</span>}
                </li>
              ))}
            </ul>
          </>
        )}

        {correspondants.length > 0 && (
          <>
            <h3 className="compte-sous-titre">En ligne et dans vos critères</h3>
            <ul className="biens-liste compte-correspondants">
              {correspondants.map((b, i) => (
                <li key={b.id}>
                  <CarteBien b={b} rang={i} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function Proprietaire({ d, slugs }: { d: DonneesCompte; slugs: Map<string, string> }) {
  return (
    <section id="vendre" className="section section--noir-3">
      <div className="container">
        <div className="section__head">
          <Eyebrow>Vendre</Eyebrow>
          <h2>Mes immeubles</h2>
        </div>

        {d.biens.length === 0 ? (
          <p className="compte-vide">
            Aucun immeuble confié pour l’instant. Faites estimer le vôtre ci-dessous : il apparaîtra
            ici, avec son estimation dès qu’un agent l’aura validée.
          </p>
        ) : (
          <div className="compte-biens">
            {d.biens.map((b) => {
              const slug = b.bien ? slugs.get(b.bien) : undefined;
              const estimations = d.estimations.filter((e) => e.bien_cle === b.cle);
              const pieces = d.documents.filter((x) => x.bien_cle === b.cle);
              return (
                <article key={b.cle} className="compte-bien">
                  <header className="compte-bien__tete">
                    <div>
                      <p className="compte-carte__titre">
                        {b.commune ?? "Votre immeuble"} {b.dept && <span className="compte-carte__dept">({b.dept})</span>}
                      </p>
                      <p className="compte-carte__texte">
                        {[b.type, b.lots ? `${b.lots} lots` : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {b.etape && <span className="compte-badge">{b.etape}</span>}
                  </header>
                  <dl className="compte-bien__chiffres">
                    {euros(b.prix) && <div><dt>Prix affiché</dt><dd>{euros(b.prix)}</dd></div>}
                    {b.sollicites != null && <div><dt>Acquéreurs sollicités</dt><dd>{b.sollicites}</dd></div>}
                    {b.visites != null && <div><dt>Visites</dt><dd>{b.visites}</dd></div>}
                    {b.offres != null && <div><dt>Offres</dt><dd>{b.offres}</dd></div>}
                  </dl>
                  {estimations.map((e) => (
                    <p key={e.cle} className="compte-estimation">
                      Estimation{e.estimee_le ? ` du ${date(e.estimee_le)}` : ""} :{" "}
                      <strong>{euros(e.valeur)}</strong>
                      {e.prix_m2 != null && ` · ${euros(e.prix_m2)}/m²`}
                      {e.rendement != null && ` · ${pct(e.rendement)} brut`}
                    </p>
                  ))}
                  <div className="compte-bien__liens">
                    {slug && <Link className="lien-discret" href={`/immeubles-a-vendre/${slug}/`}>Voir l’annonce</Link>}
                    <ProposerPrix bien={b.cle} />
                  </div>

                  <h4 className="compte-pieces__titre">Pièces à nous transmettre</h4>
                  <ul className="compte-pieces">
                    {CATEGORIES.map((c) => {
                      const recues = pieces.filter((x) => x.categorie === c.cle);
                      return (
                        <li key={c.cle} className="compte-piece">
                          <div className="compte-piece__texte">
                            <span className="compte-piece__nom">{c.titre}</span>
                            <span className="compte-piece__aide">{c.aide}</span>
                            {recues.map((x) => (
                              <span key={x.cle} className="compte-piece__recue">
                                {x.nom} · reçue le {date(x.recu_le)}
                              </span>
                            ))}
                          </div>
                          <DepotPiece bien={b.cle} categorie={c.cle} titre={c.titre} />
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        )}

        {d.estimations.some((e) => !e.bien_cle || !d.biens.some((b) => b.cle === e.bien_cle)) && (
          <>
            <h3 className="compte-sous-titre">Mes estimations</h3>
            <ul className="compte-liste">
              {d.estimations
                .filter((e) => !e.bien_cle || !d.biens.some((b) => b.cle === e.bien_cle))
                .map((e) => (
                  <li key={e.cle}>
                    <strong>{euros(e.valeur)}</strong>
                    {e.prix_m2 != null && <span>{euros(e.prix_m2)}/m²</span>}
                    {e.rendement != null && <span>{pct(e.rendement)} brut</span>}
                    {e.estimee_le && <span className="compte-carte__date">le {date(e.estimee_le)}</span>}
                  </li>
                ))}
            </ul>
          </>
        )}

        <div className="compte-estimer split">
          <div>
            <h3 className="compte-sous-titre">Estimer mon immeuble</h3>
            <p className="muted">
              Gratuit et sans engagement. Votre demande arrive à l’agence rattachée à votre compte ;
              l’estimation s’affiche ici dès qu’un agent l’a validée.
            </p>
          </div>
          <EstimationForm formulaire="estimer" dansLeCompte />
        </div>
      </div>
    </section>
  );
}
