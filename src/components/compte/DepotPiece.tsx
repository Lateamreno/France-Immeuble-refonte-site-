"use client";

import { useId, useRef, useState } from "react";
import { FORMATS_ACCEPTES, televerser } from "./envoyer";


/**
 * « Déposer » une pièce dans une catégorie (§10.1).
 *
 * Le fichier part en morceaux de 4 Mo vers NOTRE route, jamais directement
 * vers un stockage tiers : le navigateur ne parle qu'au site, et chaque
 * morceau tient sous la limite des fonctions Vercel. La route réunit les
 * morceaux, vérifie le contenu, pose la pièce dans le seau privé et prévient
 * le BO, qui la range au coffre de l'immeuble puis l'efface du site.
 */
export function DepotPiece({ bien, categorie, titre }: { bien: string; categorie: string; titre: string }) {
  const uid = useId();
  const champ = useRef<HTMLInputElement>(null);
  const [etat, setEtat] = useState<"repos" | "envoi" | "ok" | "attente" | "erreur">("repos");
  const [progres, setProgres] = useState(0);
  const [message, setMessage] = useState("");
  const [nom, setNom] = useState("");

  async function deposer(f: File) {
    setNom(f.name);
    setEtat("envoi");
    setProgres(0);
    setMessage("");
    const fin = await televerser(f, { bien, categorie }, setProgres);
    if (!fin.ok) { setEtat("erreur"); setMessage(fin.erreur ?? ""); return; }
    setEtat(fin.stocke === "bo" ? "ok" : "attente");
  }

  return (
    <div className="depot">
      <input
        ref={champ}
        id={`${uid}-f`}
        type="file"
        accept={FORMATS_ACCEPTES}
        className="depot__champ"
        aria-label={`Déposer : ${titre}`}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) deposer(f);
          e.target.value = "";
        }}
      />
      <button type="button" className="btn btn--primary btn--petit" disabled={etat === "envoi"}
        onClick={() => champ.current?.click()}>
        {etat === "envoi" ? `Envoi… ${progres} %` : "Déposer"}
      </button>
      {etat === "ok" && <p className="depot__msg">« {nom} » est reçue par l’agence.</p>}
      {etat === "attente" && <p className="depot__msg">« {nom} » est envoyée ; elle apparaîtra ici dès que l’agence l’aura rangée.</p>}
      {etat === "erreur" && <p className="depot__msg depot__msg--err" role="alert">{message}</p>}
    </div>
  );
}
