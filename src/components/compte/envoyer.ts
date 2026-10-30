/** Appel d'une route du compte depuis le navigateur. Jamais de jeton ici : la session est en cookie httpOnly. */
export async function envoyer(
  chemin: string,
  corps: unknown,
): Promise<{ ok: boolean; erreur?: string; [k: string]: unknown }> {
  try {
    const r = await fetch(chemin, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corps),
      credentials: "same-origin",
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; erreur?: string };
    if (r.ok && j.ok !== false) return { ...j, ok: true };
    return { ...j, ok: false, erreur: j.erreur ?? "Une erreur est survenue. Réessayez." };
  } catch {
    return { ok: false, erreur: "Connexion impossible. Vérifiez votre réseau et réessayez." };
  }
}

const TAILLE_MORCEAU = 4 * 1024 * 1024;
export const FORMATS_ACCEPTES = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.docx,.xlsx,.odt,.ods";

/**
 * Envoi d'un fichier en morceaux de 4 Mo vers NOTRE route (§10.1) : le
 * navigateur ne parle qu'au site. `extra` dit à quoi sert la pièce (immeuble et
 * catégorie, ou `pour: "message"`). Renvoie la réponse de la dernière étape.
 */
export async function televerser(
  f: File,
  extra: Record<string, unknown>,
  progres: (pct: number) => void = () => {},
): Promise<{ ok: boolean; erreur?: string; [k: string]: unknown }> {
  const debut = await envoyer("/api/compte/document/debut/", { ...extra, nom: f.name, taille: f.size });
  if (!debut.ok) return debut;
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
    if (!ok) return { ok: false, erreur: "L’envoi a été interrompu. Vérifiez votre connexion et réessayez." };
    progres(Math.round(((i + 1) / n) * 90));
  }
  const fin = await envoyer("/api/compte/document/fin/", { ...extra, depot, morceaux: n, nom: f.name });
  progres(100);
  return fin;
}
