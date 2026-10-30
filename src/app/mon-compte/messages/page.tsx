import Link from "next/link";
import { NouvelleConversation } from "@/components/compte/Messagerie";
import { Panneau, TeteCompte, Vide } from "@/components/compte/Ecrans";
import { choixImmeubles, ecranCompte, sujetDe } from "@/lib/compte/ecran";
import { conversations } from "@/lib/compte/messagerie";
import { dateCourte, heure } from "@/lib/compte/vente";

export const dynamic = "force-dynamic";

const quand = (iso: string) => {
  const jour = new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  return jour === new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }) ? heure(iso) : dateCourte(iso);
};

/**
 * La messagerie (MAV, 30/10/2026) : plusieurs conversations nommées,
 * rattachables à un immeuble. `?nouveau=1` ouvre une conversation, avec
 * l'immeuble (`bien`, `proposition`) et le titre déjà choisis.
 */
export default async function Messages({
  searchParams,
}: {
  searchParams: Promise<{ nouveau?: string; bien?: string; proposition?: string; titre?: string }>;
}) {
  const q = await searchParams;
  const { d } = await ecranCompte();
  const fils = conversations(d);
  const { biens, propositions } = choixImmeubles(d);
  const nouveau = q.nouveau === "1" || fils.length === 0;

  return (
    <>
      <TeteCompte surtitre="Messagerie" titre="Messages" />
      <div className="compte-action">
        <NouvelleConversation key={`${q.bien ?? ""}${q.proposition ?? ""}`} ouverte={nouveau} biens={biens} propositions={propositions}
          bien={q.bien} proposition={q.proposition}
          titre={q.titre ?? (q.bien || q.proposition ? sujetDe(d, q.bien, q.proposition) ?? "" : "")} />
      </div>
      {fils.length === 0 ? (
        <Panneau>
          <Vide picto="bulles">
            <p>Vos échanges avec l’agence s’afficheront ici. Chaque message part aussi par e-mail, avec tout l’historique.</p>
          </Vide>
        </Panneau>
      ) : (
        <ul className="fils">
          {fils.map((c) => {
            const sujet = sujetDe(d, c.bien_cle, c.proposition);
            return (
              <li key={c.id}>
                <Link href={`/mon-compte/messages/${c.id}/`} className={`fil-ligne${c.aLire ? " est-a-lire" : ""}`}>
                  <span className="fil-ligne__titre">{c.titre}</span>
                  {sujet && <span className="fil-ligne__sujet">{sujet}</span>}
                  <span className="fil-ligne__extrait">
                    {c.dernier.enCours ? "En cours d’envoi · " : c.dernier.de === "agent" ? `${c.dernier.auteur ?? "L’agence"} : ` : "Vous : "}
                    {c.dernier.texte}
                  </span>
                  <span className="fil-ligne__date">{quand(c.dernier.envoye_le)}</span>
                  {c.aLire && <b className="pastille" aria-label="Nouveau message">1</b>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
