import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Repondre } from "@/components/compte/Messagerie";
import { TeteCompte } from "@/components/compte/Ecrans";
import { ecranCompte, sujetDe } from "@/lib/compte/ecran";
import { conversations } from "@/lib/compte/messagerie";
import { dateLongue, heure } from "@/lib/compte/vente";

export const dynamic = "force-dynamic";

/** Une conversation : le fil, du plus ancien au plus récent, et la réponse en bas. */
export default async function Conversation({ params }: { params: Promise<{ conversation: string }> }) {
  const { conversation } = await params;
  const { d } = await ecranCompte();
  const c = conversations(d).find((x) => x.id === conversation);
  if (!c) notFound();
  const sujet = sujetDe(d, c.bien_cle, c.proposition);
  const lien = c.bien_cle && d.biens.some((b) => b.cle === c.bien_cle)
    ? `/mon-compte/immeubles/${c.bien_cle}/`
    : c.proposition ? `/mon-compte/biens/${c.proposition}/` : null;

  let jour = "";
  return (
    <>
      <TeteCompte surtitre={sujet ?? "Conversation"} titre={c.titre} retour={{ href: "/mon-compte/messages/", nom: "Messages" }}>
        {lien && <Link href={lien} className="lien-discret">Voir l’immeuble</Link>}
      </TeteCompte>
      <ol className="fil" aria-label="Messages">
        {c.fil.map((m) => {
          const j = dateLongue(m.envoye_le) ?? "";
          const separateur = j !== jour;
          jour = j;
          return (
            <Fragment key={m.cle}>
              {separateur && <li className="fil__jour">{j}</li>}
              <li className={`fil__bloc fil__bloc--${m.de}`}>
                <div className="fil__bulle">
                  <p className="fil__auteur">{m.de === "agent" ? m.auteur ?? "France Immeuble" : "Vous"} · {heure(m.envoye_le)}{m.enCours ? " · en cours d’envoi" : ""}</p>
                  <p className="fil__texte">{m.texte}</p>
                </div>
              </li>
            </Fragment>
          );
        })}
      </ol>
      <Repondre conversation={c.id} />
      <p className="compte-form__aide">Votre message part à l’agence, et une copie vous arrive par e-mail avec l’historique.</p>
    </>
  );
}
