import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/Eyebrow";
import { Picto, type NomPicto } from "@/components/Picto";
import { Acces } from "@/components/compte/Acces";
import { NouveauMotDePasse } from "@/components/compte/Actions";
import { DemanderAppel } from "@/components/compte/Messagerie";
import { CarteAgent, Chiffres, Frise, Panneau, TeteCompte } from "@/components/compte/Ecrans";
import { sessionCourante } from "@/lib/compte/auth";
import { donneesCompte } from "@/lib/compte/donnees";
import { conversations, TITRE_APPEL } from "@/lib/compte/messagerie";
import { profils } from "@/lib/compte/profil";
import { nomProposition } from "@/lib/compte/ecran";
import { CATEGORIES } from "@/lib/compte/categories";
import { dateCourte, euros, nomImmeuble, pct, rangEtape } from "@/lib/compte/vente";
import { SITE } from "@/lib/site";

/**
 * /mon-compte/ — l'accueil de l'espace client (option B, MAV, 30/10/2026).
 *
 * Sans session : l'écran de connexion, sans hero. Connecté : ce qui demande
 * une action d'abord, puis l'agent, la vente en cours, les biens proposés et
 * les derniers messages. Tout est lu dans les tables `compte_*` avec le jeton
 * de la personne : la base ne rend que ses lignes (§2).
 */
export const metadata: Metadata = {
  title: { absolute: "Mon compte | France Immeuble" },
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE.url}/mon-compte/` },
};

/** Les pièces qui comptent pour l'estimation ; « Autre », plans et photos sont en plus. */
const ESSENTIELLES = CATEGORIES.filter((c) => !["autre", "plans", "photos"].includes(c.cle));

export default async function MonCompte({ searchParams }: { searchParams: Promise<{ etat?: string }> }) {
  const { etat } = await searchParams;
  const session = await sessionCourante();

  if (!session) {
    return (
      <section className="section section--noir-2 compte-entree">
        <div className="container split">
          <div>
            <Eyebrow>Espace client</Eyebrow>
            <h1>Votre <span className="accent">espace</span> France Immeuble</h1>
            <ul className="compte-atouts">
              <li>Acheteur : vos recherches, les immeubles qu’on vous propose, vos offres en ligne.</li>
              <li>Vendeur : la vente pas à pas, votre estimation détaillée, les offres reçues.</li>
              <li>Une messagerie avec votre agent et vos rendez-vous.</li>
              <li>Le dépôt des pièces de votre immeuble, directement au coffre de l’agence.</li>
            </ul>
          </div>
          <Acces etat={etat} />
        </div>
      </section>
    );
  }

  const { utilisateur, jeton } = session;
  const d = await donneesCompte(jeton);
  const { vendeur, acheteur } = profils(d);
  const fils = conversations(d);
  const appelDemande = fils.some((c) => c.titre === TITRE_APPEL);

  // « À faire » : ce que le client a à regarder ou à envoyer.
  const aFaire: { href: string; picto: NomPicto; texte: string }[] = [];
  for (const o of d.offres.filter((x) => x.statut === "en_cours" || x.statut === "contre_offre")) {
    const b = d.biens.find((x) => x.cle === o.bien_cle);
    aFaire.push({
      href: `/mon-compte/immeubles/${o.bien_cle ?? ""}/?onglet=offres`, picto: "poignee",
      texte: `Une offre à ${euros(o.prix_hai) ?? "étudier"}${b ? ` pour ${nomImmeuble(b)}` : ""}`,
    });
  }
  const aRegarder = d.propositions.filter((p) => !p.reponse && (p.etat === "disponible" || p.etat === "sous_offre"));
  if (aRegarder.length) {
    aFaire.push({
      href: "/mon-compte/biens/?filtre=nouveaux", picto: "immeubles",
      texte: aRegarder.length > 1 ? `${aRegarder.length} immeubles proposés à regarder` : `Un immeuble proposé : ${nomProposition(aRegarder[0])}`,
    });
  }
  for (const c of fils.filter((x) => x.aLire).slice(0, 2)) {
    aFaire.push({ href: `/mon-compte/messages/${c.id}/`, picto: "bulles", texte: `Réponse de votre agent : ${c.titre}` });
  }
  for (const b of d.biens) {
    const manquent = ESSENTIELLES.filter((c) => !d.documents.some((x) => x.bien_cle === b.cle && x.categorie === c.cle));
    if (manquent.length) {
      aFaire.push({
        href: `/mon-compte/immeubles/${b.cle}/?onglet=documents`, picto: "dossier",
        texte: `${manquent.length} pièce${manquent.length > 1 ? "s" : ""} à déposer pour ${nomImmeuble(b)}`,
      });
    }
  }

  return (
    <>
      <TeteCompte surtitre="Mon espace" titre={<>Votre <span className="accent">espace</span></>}>
        <Link href="/mon-compte/messages/?nouveau=1" className="btn btn--primary">Écrire à l’agence</Link>
      </TeteCompte>

      {etat === "bienvenue" && <p className="compte-note">Votre adresse est vérifiée : votre compte est ouvert.</p>}
      {etat === "dossier-envoye" && (
        <p className="compte-note">Votre compte est ouvert et votre agent a reçu votre dossier. Votre estimation s’affichera ici dès qu’il l’aura validée.</p>
      )}
      {(etat === "nouveau-mot-de-passe" || etat === "choisir-mot-de-passe") && (
        <div className="compte-panneau"><NouveauMotDePasse premier={etat === "choisir-mot-de-passe"} /></div>
      )}

      <div className="compte-grille-accueil">
        <Panneau titre="À faire" picto="valide" className="compte-afaire">
          {aFaire.length ? (
            <ul className="afaire">
              {aFaire.slice(0, 6).map((x) => (
                <li key={x.href + x.texte}>
                  <Link href={x.href}><Picto nom={x.picto} taille={20} /><span>{x.texte}</span><span className="afaire__ouvrir" aria-hidden="true">›</span></Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="compte-calme">Rien ne vous attend. Vous serez prévenu par e-mail dès qu’il y a du nouveau.</p>
          )}
        </Panneau>

        {d.agent?.appele ? (
          <Panneau titre="Votre agent" picto="profil">
            <CarteAgent agent={d.agent} />
            <div className="compte-panneau__pied">
              <Link href="/mon-compte/messages/?nouveau=1" className="lien-discret">Lui écrire</Link>
              <Link href="/mon-compte/rendez-vous/" className="lien-discret">Prendre rendez-vous</Link>
            </div>
          </Panneau>
        ) : acheteur ? (
          <Panneau titre="Accès prioritaire" picto="telephone" className="carte-appel">
            <p className="carte-appel__texte">
              Un appel de quelques minutes avec un agent vous ouvre les biens <strong>off-market</strong> et
              l’envoi des dossiers <strong>en priorité</strong>.
            </p>
            {appelDemande ? (
              <p className="compte-confirme">Votre demande est partie : un agent vous appelle.</p>
            ) : (
              <DemanderAppel telephone={utilisateur.user_metadata?.telephone} />
            )}
          </Panneau>
        ) : (
          <Panneau titre="L’agence" picto="profil">
            <p className="compte-calme">Un agent suit votre dossier. Écrivez-lui ou demandez un rendez-vous, il vous répond ici.</p>
            <div className="compte-panneau__pied">
              <a href={SITE.telHref} className="lien-discret">{SITE.tel}</a>
              <Link href="/mon-compte/rendez-vous/" className="lien-discret">Prendre rendez-vous</Link>
            </div>
          </Panneau>
        )}
      </div>

      {vendeur && (
        <Panneau titre="Mes immeubles" picto="immeubles" action={<Link href="/mon-compte/immeubles/" className="lien-discret">Tout voir</Link>}>
          {d.biens.length ? (
            <ul className="compte-ventes">
              {d.biens.map((b) => {
                const estimation = d.estimations.find((e) => e.bien_cle === b.cle);
                return (
                  <li key={b.cle}>
                    <Link href={`/mon-compte/immeubles/${b.cle}/`} className="vente-carte">
                      <div className="vente-carte__tete">
                        <p className="vente-carte__nom">{nomImmeuble(b)}</p>
                        <p className="vente-carte__type">{[b.type, b.lots ? `${b.lots} lots` : null].filter(Boolean).join(" · ")}</p>
                      </div>
                      <Frise rang={rangEtape(b.etape, b.visites, b.offres)} compacte />
                      <Chiffres items={[
                        ["Estimation", euros(estimation?.valeur)],
                        ["Acquéreurs sollicités", b.sollicites != null ? String(b.sollicites) : null],
                        ["Visites", b.visites != null ? String(b.visites) : null],
                        ["Offres", b.offres != null ? String(b.offres) : null],
                      ]} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="compte-calme">
              Votre estimation est entre les mains de votre agent. Elle s’affichera ici, avec le suivi de la vente.
            </p>
          )}
        </Panneau>
      )}

      {acheteur && (
        <Panneau titre="Biens proposés" picto="loupe" action={<Link href="/mon-compte/biens/" className="lien-discret">Tout voir</Link>}>
          {d.propositions.length ? (
            <ul className="compte-mini-biens">
              {d.propositions.slice(0, 3).map((p) => (
                <li key={p.cle}>
                  <Link href={`/mon-compte/biens/${p.cle}/`}>
                    <span className="mini-bien__nom">{nomProposition(p)}</span>
                    <span className="mini-bien__chiffres">{[euros(p.prix), p.rendement != null ? `${pct(p.rendement)} brut` : null].filter(Boolean).join(" · ")}</span>
                    {!p.reponse && (p.etat === "disponible" || p.etat === "sous_offre") && <b className="pastille pastille--texte">Nouveau</b>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="compte-calme">
              Les immeubles que votre agent sélectionne pour vous arrivent ici, souvent avant toute diffusion.{" "}
              {!d.recherches.length && <Link href="/mon-compte/recherches/" className="lien-discret">Déposer ma recherche</Link>}
            </p>
          )}
        </Panneau>
      )}

      <Panneau titre="Messages" picto="bulles" action={<Link href="/mon-compte/messages/" className="lien-discret">Tout voir</Link>}>
        {fils.length ? (
          <ul className="compte-mini-fils">
            {fils.slice(0, 3).map((c) => (
              <li key={c.id}>
                <Link href={`/mon-compte/messages/${c.id}/`} className={c.aLire ? "est-a-lire" : undefined}>
                  <span className="mini-fil__titre">{c.titre}</span>
                  <span className="mini-fil__extrait">{c.dernier.de === "agent" ? `${c.dernier.auteur ?? "L’agence"} : ` : "Vous : "}{c.dernier.texte}</span>
                  <span className="mini-fil__date">{dateCourte(c.dernier.envoye_le)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="compte-calme">Une question sur un immeuble, un document, une visite : écrivez à l’agence, la réponse arrive ici et par e-mail.</p>
        )}
      </Panneau>
    </>
  );
}
