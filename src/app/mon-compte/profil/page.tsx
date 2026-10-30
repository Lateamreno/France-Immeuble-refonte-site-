import { Deconnexion, FermerCompte, NouveauMotDePasse } from "@/components/compte/Actions";
import { Coordonnees, Preferences, ProfilInvestisseur } from "@/components/compte/Profil";
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
          <Coordonnees prenom={u.user_metadata?.prenom ?? ""} nom={u.user_metadata?.nom ?? ""}
            telephone={u.user_metadata?.telephone ?? ""} email={u.email} />
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
