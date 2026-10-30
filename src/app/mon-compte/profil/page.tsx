import Link from "next/link";
import { Deconnexion, FermerCompte, NouveauMotDePasse } from "@/components/compte/Actions";
import { Preferences, ProfilInvestisseur } from "@/components/compte/Profil";
import { Panneau, TeteCompte } from "@/components/compte/Ecrans";
import { ecranCompte } from "@/lib/compte/ecran";
import { profils } from "@/lib/compte/profil";

export const dynamic = "force-dynamic";

/** Mon profil : coordonnées, profil investisseur, notifications, sécurité. */
export default async function MonProfil() {
  const { s, d } = await ecranCompte();
  const u = s.utilisateur;
  const { acheteur } = profils(d);
  const profil = d.saisies.find((x) => x.type === "profil_investisseur");

  return (
    <>
      <TeteCompte surtitre="Mon compte" titre="Mon profil" />
      <div className="compte-grille-profil">
        <Panneau titre="Mes coordonnées" picto="profil">
          <dl className="coordonnees">
            <div><dt>Nom</dt><dd>{[u.user_metadata?.prenom, u.user_metadata?.nom].filter(Boolean).join(" ") || "À compléter"}</dd></div>
            <div><dt>E-mail</dt><dd>{u.email}</dd></div>
            <div><dt>Téléphone</dt><dd>{u.user_metadata?.telephone || "À compléter"}</dd></div>
          </dl>
          <p className="compte-form__aide">
            Un changement ? <Link href="/mon-compte/messages/?nouveau=1&titre=Mes%20coordonn%C3%A9es" className="lien-discret">Écrivez-nous</Link>,
            votre agent met votre fiche à jour.
          </p>
        </Panneau>

        <Panneau titre="Notifications" picto="mail" className="ancre" >
          <span id="notifications" className="ancre__cible" />
          <Preferences actuelles={u.app_metadata?.notifications ?? {}} />
        </Panneau>
      </div>

      {acheteur && (
        <Panneau titre="Profil investisseur" picto="financier" className="ancre">
          <span id="investisseur" className="ancre__cible" />
          <p className="compte-calme">
            Facultatif. Il accompagne vos offres : le vendeur sait à qui il a affaire, votre offre pèse plus.
          </p>
          <ProfilInvestisseur actuel={(profil?.donnees as Record<string, never>) ?? null} envoyeLe={profil?.envoye_le ?? null} />
        </Panneau>
      )}

      <div className="compte-grille-profil">
        <Panneau titre="Mot de passe" picto="reglages">
          <NouveauMotDePasse />
        </Panneau>
        <Panneau titre="Session" picto="sortie">
          <p className="compte-calme">Connecté avec <strong>{u.email}</strong>.</p>
          <Deconnexion />
          <FermerCompte />
        </Panneau>
      </div>
    </>
  );
}
