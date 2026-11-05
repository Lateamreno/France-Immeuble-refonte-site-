import Link from "next/link";
import { notFound } from "next/navigation";
import { Picto } from "@/components/Picto";
import { ProposerPrix } from "@/components/compte/Actions";
import { DepotPiece } from "@/components/compte/DepotPiece";
import { EstimationAuCurseur } from "@/components/compte/Curseurs";
import { Chiffres, Frise, Panneau, TeteCompte, Vide } from "@/components/compte/Ecrans";
import { CATEGORIES } from "@/lib/compte/categories";
import { ecranCompte } from "@/lib/compte/ecran";
import { secteurDe } from "@/lib/compte/secteur";
import { biensAVendre } from "@/lib/biens";
import { DossierForm } from "@/components/dossier/DossierForm";
import { dossierInitial } from "@/lib/dossier/modele";
import { copieDuBien, demandesEnCours, departementDe, nomDemande, resumeDemande, type DemandeEstimation } from "@/lib/compte/immeubles";
import type { DonneesCompte } from "@/lib/compte/donnees";
import { fourchetteDe, type EtatFourchette } from "@/lib/compte/fourchette";
import { ETAPES_VENTE, STATUTS_OFFRE, dateCourte, dateLongue, euros, millions, nomImmeuble, pct, rangEtape } from "@/lib/compte/vente";

export const dynamic = "force-dynamic";

const ONGLETS = [
  ["apercu", "Vue d’ensemble"],
  ["estimation", "Estimation"],
  ["offres", "Offres"],
  ["documents", "Documents"],
  ["etat-locatif", "État locatif"],
  ["mandat", "Mandat"],
] as const;
type Onglet = (typeof ONGLETS)[number][0];

/**
 * Un immeuble du vendeur, en onglets (option B, MAV, 30/10/2026) : la frise
 * de la vente, l'estimation au curseur avec les données du secteur, les
 * offres reçues avec leur document, les pièces, l'état locatif et le mandat.
 */
export default async function Immeuble({
  params,
  searchParams,
}: {
  params: Promise<{ cle: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  const [{ cle }, { onglet: demande }] = await Promise.all([params, searchParams]);
  const { d } = await ecranCompte();
  const b = d.biens.find((x) => x.cle === cle);
  const onglet: Onglet = (ONGLETS.find(([k]) => k === demande)?.[0] ?? "apercu");
  if (!b) {
    // Une estimation envoyée que le BO n'a pas encore déposée (retour #261).
    const dem = demandesEnCours(d).find((x) => x.ref === cle);
    if (!dem) notFound();
    return <ImmeubleDemande dem={dem} d={d} onglet={onglet} />;
  }
  const copie = copieDuBien(d, b);

  const estimation = d.estimations.find((e) => e.bien_cle === b.cle);
  const offres = d.offres.filter((o) => o.bien_cle === b.cle);
  const pieces = d.documents.filter((x) => x.bien_cle === b.cle);
  const rang = rangEtape(b.etape, b.visites, b.offres);
  const ouvertes = offres.filter((o) => o.statut === "en_cours" || o.statut === "contre_offre").length;
  const annonce = b.bien ? (await biensAVendre()).find((x) => x.id === b.bien) : undefined;

  return (
    <>
      <TeteCompte surtitre={[b.type, b.lots ? `${b.lots} lots` : null].filter(Boolean).join(" · ") || "Mon immeuble"}
        titre={nomImmeuble(b)} retour={{ href: "/mon-compte/immeubles/", nom: "Mes immeubles" }}>
        <Link href={`/mon-compte/messages/?nouveau=1&bien=${b.cle}`} className="btn btn--primary">Écrire à mon agent</Link>
      </TeteCompte>

      <nav className="onglets-bien" aria-label="Rubriques de l’immeuble">
        {ONGLETS.map(([k, nom]) => (
          <Link key={k} href={`/mon-compte/immeubles/${b.cle}/${k === "apercu" ? "" : `?onglet=${k}`}`}
            className={`onglet-bien${k === onglet ? " est-actif" : ""}`} aria-current={k === onglet ? "page" : undefined}>
            {nom}
            {k === "offres" && ouvertes > 0 && <b className="pastille">{ouvertes}</b>}
          </Link>
        ))}
      </nav>

      {onglet === "apercu" && (
        <>
          <Panneau titre="Où en est la vente" picto="stats">
            <Frise rang={rang} />
            <p className="frise__legende">Étape en cours : <strong>{ETAPES_VENTE[rang - 1]}</strong>{b.etape ? ` (${b.etape})` : ""}</p>
          </Panneau>
          <Panneau titre="Les chiffres" picto="euro">
            <Chiffres items={[
              ["Prix affiché", euros(b.prix)],
              ["Estimation", euros(estimation?.valeur)],
              ["Acquéreurs sollicités", b.sollicites != null ? String(b.sollicites) : null],
              ["Visites", b.visites != null ? String(b.visites) : null],
              ["Offres reçues", b.offres != null ? String(b.offres) : null],
            ]} />
            <div className="compte-panneau__pied">
              {annonce && <Link className="lien-discret" href={`/immeubles-a-vendre/${annonce.slug}/`}>Voir l’annonce</Link>}
              <ProposerPrix bien={b.cle} />
              <Link className="lien-discret" href={`/mon-compte/rendez-vous/?bien=${b.cle}`}>Prendre rendez-vous</Link>
            </div>
          </Panneau>
          <Panneau titre="Retours de visite" picto="bulles">
            <p className="compte-calme">
              {b.visites
                ? "Les retours des visiteurs s’afficheront ici, sans leur nom, dès que votre agent les aura notés."
                : "Après chaque visite, le retour du visiteur s’affiche ici, sans son nom."}
            </p>
          </Panneau>
        </>
      )}

      {onglet === "estimation" && <OngletEstimation dept={b.dept} estimation={estimation} />}

      {onglet === "offres" && (
        offres.length === 0 ? (
          <Panneau>
            <Vide picto="poignee">
              <p>Aucune offre pour l’instant. Chaque offre que votre agent vous transmet arrive ici, avec son document, et par e-mail.</p>
            </Vide>
          </Panneau>
        ) : (
          <ul className="offres">
            {offres.map((o) => {
              const ecart = o.prix_hai && estimation?.valeur ? ((Number(o.prix_hai) - Number(estimation.valeur)) / Number(estimation.valeur)) * 100 : null;
              const jours = o.valable_jusqu_au ? Math.ceil((new Date(`${o.valable_jusqu_au}T23:59:59`).getTime() - Date.now()) / 86_400_000) : null;
              return (
                <li key={o.cle} className={`compte-panneau offre offre--${o.statut}`}>
                  <div className="offre__tete">
                    <div>
                      <p className="offre__montant">{euros(o.prix_hai) ?? "Offre"}</p>
                      <p className="offre__qui">{o.acquereur ?? "Acquéreur"}{o.recue_le ? ` · reçue le ${dateLongue(o.recue_le)}` : ""}</p>
                    </div>
                    <span className={`compte-badge compte-badge--${o.statut}`}>{STATUTS_OFFRE[o.statut]}</span>
                  </div>
                  <Chiffres items={[
                    ["Net vendeur", euros(o.net_vendeur)],
                    ["Honoraires", euros(o.honoraires)],
                    ["Face à l’estimation", ecart != null ? `${ecart > 0 ? "+" : ""}${pct(Math.round(ecart * 10) / 10)}` : null],
                    [jours != null && jours > 0 ? `Valable encore ${jours} jour${jours > 1 ? "s" : ""}` : "Validité",
                      jours != null ? (jours > 0 ? `au ${dateCourte(o.valable_jusqu_au)}` : "Expirée") : o.valable_jours ? `${o.valable_jours} jours` : null],
                  ]} />
                  <div className="compte-panneau__pied">
                    {o.document && (
                      <a className="btn btn--primary" href={`/api/compte/offre-document/${o.cle}/`} target="_blank" rel="noopener">
                        Lire l’offre (PDF)
                      </a>
                    )}
                    <Link className="lien-discret" href={`/mon-compte/messages/?nouveau=1&bien=${b.cle}&titre=${encodeURIComponent(`Offre de ${o.acquereur ?? "l’acquéreur"}`)}`}>
                      En parler à mon agent
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}

      {onglet === "documents" && (
        <Panneau titre="Pièces à nous transmettre" picto="dossier">
          <ul className="compte-pieces">
            {CATEGORIES.map((c) => {
              const recues = pieces.filter((x) => x.categorie === c.cle);
              return (
                <li key={c.cle} className="compte-piece">
                  <div className="compte-piece__texte">
                    <span className="compte-piece__nom">{recues.length > 0 && <Picto nom="valide" taille={16} />}{c.titre}</span>
                    <span className="compte-piece__aide">{c.aide}</span>
                    {recues.map((x) => (
                      <span key={x.cle} className="compte-piece__recue">{x.nom} · reçue le {dateLongue(x.recu_le)}</span>
                    ))}
                  </div>
                  <DepotPiece bien={b.cle} categorie={c.cle} titre={c.titre} />
                </li>
              );
            })}
          </ul>
        </Panneau>
      )}

      {onglet === "etat-locatif" && (
        <EtatLocatif cle={b.cle} nom={nomImmeuble(b)} initial={copie?.c.dossier ?? dossierInitial({ habitation: b.lots ?? 1 })}
          envoyeLe={copie?.c.dossier_envoye_le} />
      )}

      {onglet === "mandat" && (
        <Panneau titre="Mandat de vente" picto="dossier">
          <ol className="etapes-mandat">
            <li className={rang >= 2 ? "est-faite" : ""}>Envoyé pour signature dans DocuSign</li>
            <li className={rang >= 2 ? "est-faite" : ""}>Signé</li>
            <li>Copie signée disponible ici</li>
          </ol>
          <p className="compte-calme">
            {rang >= 2
              ? "Le PDF du mandat signé s’affichera ici dès que l’agence l’aura déposé."
              : "Votre agent vous envoie le mandat dans DocuSign. Vous le signez en ligne, sa copie s’affiche ensuite ici."}
          </p>
        </Panneau>
      )}
    </>
  );
}

async function OngletEstimation({ dept, estimation }: { dept: string | null; estimation?: { valeur: number | null; prix_m2: number | null; rendement: number | null; estimee_le: string | null } }) {
  const s = await secteurDe(dept);
  return (
    <>
      {estimation?.valeur ? (
        <Panneau titre={`Notre estimation${estimation.estimee_le ? ` du ${dateLongue(estimation.estimee_le)}` : ""}`} picto="calculatrice">
          <EstimationAuCurseur valeur={Number(estimation.valeur)} prixM2={estimation.prix_m2 != null ? Number(estimation.prix_m2) : null}
            rendement={estimation.rendement != null ? Number(estimation.rendement) : null} />
        </Panneau>
      ) : (
        <Panneau>
          <Vide picto="calculatrice">
            <p>Votre agent prépare l’estimation. Elle s’affichera ici, avec un curseur pour voir l’effet du prix sur le rendement et votre net vendeur.</p>
          </Vide>
        </Panneau>
      )}
      {s && (
        <Panneau titre={`Le marché : ${s.nom}`} picto="secteur">
          <Chiffres items={[
            ["Immeubles vendus par l’agence", String(s.ventes)],
            ["Prix médian au m²", euros(s.prixM2)],
            ["Rendement médian", s.rendement != null ? pct(s.rendement) : null],
            ["Délai médian jusqu’à l’offre", s.delaiJours != null ? `${Math.round(s.delaiJours)} jours` : null],
            ["Offre retenue face à l’estimation", s.ecart != null ? `${s.ecart > 0 ? "+" : ""}${pct(s.ecart)}` : null],
            ["En vente en ce moment", s.enVente ? String(s.enVente) : null],
          ]} />
          {s.exemples.length > 0 && (
            <ul className="compte-liste">
              {s.exemples.map((x, i) => (
                <li key={i}>
                  <strong>{x.ville}</strong>
                  <span>{[x.lots ? `${x.lots} lots` : null, x.surface ? `${Math.round(x.surface)} m²` : null].filter(Boolean).join(" · ")}</span>
                  <span>{euros(x.prix)}</span>
                  <span className="compte-carte__date">{x.annee}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="compte-form__aide">Ventes réalisées par France Immeuble dans le département, telles que publiées sur le site.</p>
        </Panneau>
      )}
    </>
  );
}

/** L'état locatif, à remplir sur place (retours #261 et #277). */
function EtatLocatif({ cle, nom, initial, envoyeLe }: {
  cle: string; nom: string; initial: ReturnType<typeof dossierInitial>; envoyeLe?: string;
}) {
  return (
    <section className="compte-panneau compte-etat-locatif">
      <p className="compte-calme">
        Lot par lot : type, surface, loyer, bail, DPE. Votre agent s’en sert pour l’estimation et pour présenter
        l’immeuble aux acquéreurs. Tout est enregistré au fur et à mesure.
      </p>
      <DossierForm initial={initial} adresse={nom} connecte dejaValide={false} cible={cle} envoyeLe={envoyeLe} />
    </section>
  );
}

const ONGLETS_DEMANDE = [
  ["apercu", "Vue d’ensemble"],
  ["estimation", "Estimation"],
  ["etat-locatif", "État locatif"],
  ["documents", "Documents"],
] as const;

/**
 * Un immeuble que le client a fait estimer, avant son dépôt par le BO : ce
 * qu'il a envoyé, l'estimation en cours avec le marché du département, l'état
 * locatif à remplir et les pièces à déposer.
 */
async function ImmeubleDemande({ dem, d, onglet: demande }: { dem: DemandeEstimation; d: DonneesCompte; onglet: string }) {
  const { ref, envoye_le, c } = dem;
  const onglet = ONGLETS_DEMANDE.find(([k]) => k === demande)?.[0] ?? "apercu";
  const nom = nomDemande(c);
  const pieces = [
    ...(c.pieces ?? []),
    ...d.documents.filter((x) => x.bien_cle === ref).map((x) => ({ nom: x.nom, categorie: x.categorie, recu_le: x.recu_le })),
  ];
  const lotsAnnonces = c.lots ?? {};
  const initial = c.dossier ?? dossierInitial({
    habitation: lotsAnnonces.habitation ?? 0, bureau: lotsAnnonces.bureau ?? 0,
    commerce: lotsAnnonces.commerce ?? 0, local_activite: lotsAnnonces.local_activite ?? 0,
  });
  const adresse = [c.rue, [c.codePostal, c.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const fo = await fourchetteDe(c);

  return (
    <>
      <TeteCompte surtitre={resumeDemande(c) || "Mon immeuble"} titre={nom} retour={{ href: "/mon-compte/immeubles/", nom: "Mes immeubles" }}>
        <Link href={`/mon-compte/messages/?nouveau=1&titre=${encodeURIComponent(`Mon immeuble, ${nom}`)}`} className="btn btn--primary">Écrire à mon agent</Link>
      </TeteCompte>

      <nav className="onglets-bien" aria-label="Rubriques de l’immeuble">
        {ONGLETS_DEMANDE.map(([k, n]) => (
          <Link key={k} href={`/mon-compte/immeubles/${ref}/${k === "apercu" ? "" : `?onglet=${k}`}`}
            className={`onglet-bien${k === onglet ? " est-actif" : ""}`} aria-current={k === onglet ? "page" : undefined}>
            {n}
          </Link>
        ))}
      </nav>

      {onglet === "apercu" && (
        <>
          <Panneau titre="Où en est la vente" picto="stats">
            <Frise rang={1} />
            <p className="frise__legende">Étape en cours : <strong>{ETAPES_VENTE[0]}</strong>. Demande envoyée le {dateLongue(envoye_le)}.</p>
          </Panneau>
          {fo.etat === "prete" && (
            <Panneau titre="Première fourchette" picto="calculatrice">
              <p className="fourchette__montant">{millions(fo.f.basse)} à {millions(fo.f.haute)}</p>
              <p className="compte-form__aide">
                Calcul automatique, prix de vente à la découpe.{" "}
                <Link className="lien-discret" href={`/mon-compte/immeubles/${ref}/?onglet=estimation`}>Comment la lire</Link>
              </p>
            </Panneau>
          )}
          <Panneau titre="Ce que vous nous avez indiqué" picto="immeubles">
            <Chiffres items={[
              ["Adresse", adresse || null],
              ["Lots", resumeDemande(c).split(" · ")[0] || null],
              ["Surface habitable", c.surface ? `${Math.round(c.surface).toLocaleString("fr-FR")} m²` : null],
              ["Loyer annuel HC", euros(c.loyerAnnuel)],
              ["Travaux", c.travaux || null],
              ["Vente", c.echeance || null],
            ]} />
          </Panneau>
          <Panneau titre="À faire" picto="dossier">
            <ul className="afaire">
              <li>
                <Link href={`/mon-compte/immeubles/${ref}/?onglet=etat-locatif`}>
                  <Picto nom={c.dossier_envoye_le ? "valide" : "logement"} taille={20} />
                  <span>{c.dossier_envoye_le ? `État locatif envoyé le ${dateLongue(c.dossier_envoye_le)}` : "Remplir l’état locatif, lot par lot"}</span>
                  <span className="lien-discret">{c.dossier_envoye_le ? "Modifier" : "Remplir"}</span>
                </Link>
              </li>
              <li>
                <Link href={`/mon-compte/immeubles/${ref}/?onglet=documents`}>
                  <Picto nom={pieces.length ? "valide" : "dossier"} taille={20} />
                  <span>{pieces.length ? `${pieces.length} pièce${pieces.length > 1 ? "s" : ""} envoyée${pieces.length > 1 ? "s" : ""}` : "Déposer les baux, la taxe foncière, les plans, les photos"}</span>
                  <span className="lien-discret">Déposer</span>
                </Link>
              </li>
            </ul>
          </Panneau>
        </>
      )}

      {onglet === "estimation" && (
        <>
          <PanneauFourchette fo={fo} cle={ref} />
          <OngletEstimation dept={departementDe(c.codePostal)} />
        </>
      )}

      {onglet === "etat-locatif" && <EtatLocatif cle={ref} nom={adresse || nom} initial={initial} envoyeLe={c.dossier_envoye_le} />}

      {onglet === "documents" && (
        <Panneau titre="Pièces à nous transmettre" picto="dossier">
          <ul className="compte-pieces">
            {CATEGORIES.map((cat) => {
              const recues = pieces.filter((x) => x.categorie === cat.cle);
              return (
                <li key={cat.cle} className="compte-piece">
                  <div className="compte-piece__texte">
                    <span className="compte-piece__nom">{recues.length > 0 && <Picto nom="valide" taille={16} />}{cat.titre}</span>
                    <span className="compte-piece__aide">{cat.aide}</span>
                    {recues.map((x, i) => (
                      <span key={i} className="compte-piece__recue">{x.nom} · envoyée le {dateLongue(x.recu_le)}</span>
                    ))}
                  </div>
                  <DepotPiece bien={ref} categorie={cat.cle} titre={cat.titre} />
                </li>
              );
            })}
          </ul>
        </Panneau>
      )}
    </>
  );
}

/**
 * La première fourchette, avec ce qu'elle vaut (MAV, 05/11/2026 : « attention,
 * les données secteur sont automatiques et non vérifiées, et les chiffres ne
 * correspondent qu'au prix de la découpe ; il faut adapter à l'immeuble puis
 * aux attentes des clients en termes de rentabilité »).
 */
function PanneauFourchette({ fo, cle }: { fo: EtatFourchette; cle: string }) {
  if (fo.etat === "etat-locatif") {
    return (
      <Panneau titre="Première fourchette" picto="calculatrice">
        <p className="compte-calme">
          Remplissez et envoyez l’état locatif, avec les surfaces Carrez : une première fourchette s’affiche ici,
          calculée sur les ventes du secteur.
        </p>
        <div className="compte-panneau__pied">
          <Link className="btn btn--primary" href={`/mon-compte/immeubles/${cle}/?onglet=etat-locatif`}>Remplir l’état locatif</Link>
        </div>
      </Panneau>
    );
  }
  if (fo.etat === "sans-marche") {
    return (
      <Panneau titre="Première fourchette" picto="calculatrice">
        <p className="compte-calme">Pas assez de ventes publiques dans le secteur pour un calcul automatique. Votre agent vous donne son estimation.</p>
      </Panneau>
    );
  }
  const f = fo.f;
  const lieu = f.echelle === "commune" ? "de la commune" : "du département";
  return (
    <Panneau titre="Première fourchette" picto="calculatrice">
      <p className="fourchette__montant">{millions(f.basse)} à {millions(f.haute)}</p>
      <Chiffres items={[
        ["Surface Carrez de l’état locatif", `${f.surface.toLocaleString("fr-FR")} m²`],
        [`Prix médian au m² ${lieu}`, euros(f.prixM2)],
        ["Ventes prises en compte", f.nbVentes != null ? `${f.nbVentes}${f.fenetreMois ? ` en ${f.fenetreMois} mois` : ""}` : null],
        ["Rendement brut à ces prix", f.rendementBas != null && f.rendementHaut != null ? `${pct(f.rendementBas)} à ${pct(f.rendementHaut)}` : null],
      ]} />
      <div className="fourchette__avertissement" role="note">
        <Picto nom="reglages" taille={20} />
        <div>
          <p><strong>Une fourchette automatique, à prendre avec précaution.</strong></p>
          <p>
            Les données du secteur sont automatiques et non vérifiées : prix médian des appartements vendus,
            relevé dans les ventes publiques (DVF). Ce prix correspond à une vente à la découpe, appartement par
            appartement.
          </p>
          <p>
            Un immeuble vendu en bloc ne se vend pas à ce prix. Votre agent l’adapte d’abord à l’immeuble (état,
            occupation, baux, travaux), puis au rendement qu’attendent les investisseurs. C’est son estimation qui
            fait foi.
          </p>
        </div>
      </div>
    </Panneau>
  );
}
