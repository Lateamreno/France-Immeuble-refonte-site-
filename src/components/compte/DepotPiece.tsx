"use client";

import { useId, useRef, useState } from "react";
import { envoyer } from "./envoyer";

const TAILLE_MORCEAU = 4 * 1024 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx,.xls,.xlsx,.odt,.ods";

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
    const debut = await envoyer("/api/compte/document/debut/", { bien, categorie, nom: f.name, taille: f.size });
    if (!debut.ok) { setEtat("erreur"); setMessage(debut.erreur ?? ""); return; }
    const depot = String(debut.depot);
    const n = Number(debut.morceaux);
    for (let i = 0; i < n; i++) {
      const morceau = f.slice(i * TAILLE_MORCEAU, (i + 1) * TAILLE_MORCEAU);
      let ok = false;
      for (let essai = 0; essai < 3 && !ok; essai++) {
        try {
          const r = await fetch(
            `/api/compte/document/morceau/?depot=${depot}&n=${i}&nom=${encodeURIComponent(f.name)}`,
            { method: "PUT", body: morceau, credentials: "same-origin", headers: { "content-type": "application/octet-stream" } },
          );
          ok = r.ok;
        } catch { ok = false; }
      }
      if (!ok) { setEtat("erreur"); setMessage("L’envoi a été interrompu. Vérifiez votre connexion et réessayez."); return; }
      setProgres(Math.round(((i + 1) / n) * 90));
    }
    const fin = await envoyer("/api/compte/document/fin/", { depot, morceaux: n, bien, categorie, nom: f.name });
    setProgres(100);
    if (!fin.ok) { setEtat("erreur"); setMessage(fin.erreur ?? ""); return; }
    setEtat(fin.stocke === "bo" ? "ok" : "attente");
  }

  return (
    <div className="depot">
      <input
        ref={champ}
        id={`${uid}-f`}
        type="file"
        accept={ACCEPT}
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
