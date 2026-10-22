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
