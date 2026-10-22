// Serveur uniquement.
import { deposerLead } from "../leads";
import { marquerRattache, uuidDe, type Utilisateur } from "./auth";

/**
 * Rattache le compte à son contact dans le BO (§9.1, type `compte` du §9.4).
 *
 * Seulement quand l'adresse est vérifiée : sans cela, taper l'e-mail d'un
 * autre suffirait à voir ses propositions. Une seule fois : la date est notée
 * dans les métadonnées d'administration du compte, que l'utilisateur ne peut
 * pas modifier lui-même. La `ref` est dérivée du compte : un second envoi, si
 * la note n'a pas pu être posée, retombe sur le même dépôt et le BO l'ignore.
 */
export async function rattacher(u: Utilisateur): Promise<void> {
  if (!u.email_confirmed_at || u.app_metadata?.rattache_le) return;
  const issue = await deposerLead({
    type: "compte",
    ref: uuidDe(`compte|${u.id}`),
    compte: u.id,
    email: u.email,
    prenom: u.user_metadata?.prenom ?? "",
    nom: u.user_metadata?.nom ?? "",
    telephone: u.user_metadata?.telephone ?? "",
  });
  if (issue === "perdu") return;
  try {
    await marquerRattache(u.id);
  } catch (e) {
    console.error("[compte] rattachement envoyé mais non noté —", e);
  }
}
