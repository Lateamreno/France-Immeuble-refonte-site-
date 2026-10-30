/** Les demandes de rendez-vous (contrat §13). Sans dépendance serveur : le calendrier s'en sert aussi. */

export const CRENEAUX = { matin: "Le matin", apres_midi: "L’après-midi", soir: "En fin de journée" } as const;
export const OBJETS_RDV = {
  visite: "Une visite",
  estimation: "Mon estimation",
  signature: "Une signature",
  autre: "Autre chose",
} as const;

/** Jusqu'où le calendrier propose des jours. */
export const JOURS_OUVERTS = 45;

const iso = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });

/** Les jours qu'on peut demander : de demain à 45 jours, sauf le dimanche. */
export function joursProposes(depuis = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(depuis.getTime());
  for (let i = 1; i <= JOURS_OUVERTS; i++) {
    d.setTime(depuis.getTime() + i * 86_400_000);
    const j = iso(d);
    if (new Date(`${j}T12:00:00Z`).getUTCDay() !== 0) out.push(j);
  }
  return out;
}

export const jourOuvert = (j: string) => /^\d{4}-\d{2}-\d{2}$/.test(j) && joursProposes().includes(j);

export const jourEnClair = (j: string) =>
  new Date(`${j}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
