"use client";

/**
 * Sous une liste vide (retour #94) : le bouton qui lance « Enregistrer la
 * recherche » de la barre, au-dessus, pour recevoir les prochains biens.
 */
export function EnregistrerIci() {
  return (
    <button type="button" className="btn btn--primary" onClick={() => {
      const b = document.querySelector<HTMLButtonElement>(".enregistrer-recherche");
      b?.scrollIntoView({ behavior: "smooth", block: "center" });
      b?.click();
    }}>
      Enregistrer ma recherche
    </button>
  );
}
