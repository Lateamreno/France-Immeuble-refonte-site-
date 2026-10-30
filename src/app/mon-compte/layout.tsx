import { Coquille } from "@/components/compte/Coquille";
import { sessionCourante } from "@/lib/compte/auth";
import { donneesCompte } from "@/lib/compte/donnees";
import { conversationsEnAttente, nouveauxBiens, profils } from "@/lib/compte/profil";

/**
 * Le cadre de l'espace client, posé seulement quand quelqu'un est connecté.
 * Sans session (connexion, lien d'activation, dossier ouvert depuis le
 * formulaire d'estimation), la page s'affiche seule.
 */
export default async function LayoutCompte({ children }: { children: React.ReactNode }) {
  const s = await sessionCourante();
  if (!s) return <>{children}</>;
  const d = await donneesCompte(s.jeton);
  const { vendeur, acheteur } = profils(d);
  return (
    <Coquille vendeur={vendeur} acheteur={acheteur} nouveauxBiens={nouveauxBiens(d)} messagesAgent={conversationsEnAttente(d)}>
      {children}
    </Coquille>
  );
}
