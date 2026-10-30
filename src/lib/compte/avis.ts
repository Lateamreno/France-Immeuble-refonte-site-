// Serveur uniquement : clé secrète du site.
import { configSite } from "../supabase-site";
import { envoyerAuClient } from "../notifications";
import { utilisateurParId } from "./auth";
import { nouveauMessage, nouveauxBiensProposes, nouvelleOffre } from "./courriels";
import { requeteSite as sb } from "./saisies";
import { euros, nomImmeuble } from "./vente";

/**
 * Prévenir le client par e-mail de ce que le BO vient de déposer dans son
 * compte (MAV, 30/10/2026) : un message de l'agent, un immeuble proposé, une
 * offre transmise. Contrat §12.2 : c'est l'affaire du site, qui voit arriver
 * les lignes ; le BO n'écrit pas au client.
 *
 * Chaque ligne n'est annoncée qu'une fois (`compte_avis`). Une ligne de plus
 * de trois jours n'est plus annoncée : à la mise en service, personne ne
 * reçoit d'e-mail pour un message ancien. Le client peut couper chaque type
 * d'e-mail dans Mon profil ; la ligne est alors marquée sans e-mail, pour
 * qu'il ne reçoive pas tout l'arriéré en le rallumant.
 */

type Source = "compte_messages" | "compte_propositions" | "compte_offres";
type LigneMessage = { compte: string; cle: string; conversation: string; titre: string | null; envoye_le: string };
type LigneProposition = { compte: string; cle: string; commune: string | null; dept: string | null; type: string | null; lots: number | null; prix: number | null };
type LigneOffre = { compte: string; cle: string; bien_cle: string | null; prix_hai: number | null };
type Fil = { de: "client" | "agent"; auteur: string | null; texte: string; envoye_le: string };

const lire = async <T>(chemin: string): Promise<T[]> => (await (await sb(chemin)).json()) as T[];

async function dejaAvises(source: Source, cles: string[]): Promise<Set<string>> {
  if (!cles.length) return new Set();
  const l = await lire<{ cle: string }>(`compte_avis?select=cle&source=eq.${source}&cle=in.(${cles.join(",")})`);
  return new Set(l.map((x) => x.cle));
}

async function marquer(lignes: { compte: string; source: Source; cle: string }[]) {
  if (!lignes.length) return;
  await sb("compte_avis", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(lignes),
  });
}

export async function aviserClients(): Promise<{ messages: number; biens: number; offres: number }> {
  const total = { messages: 0, biens: 0, offres: 0 };
  if (!configSite()) return total;
  const depuis = new Date(Date.now() - 3 * 86_400_000).toISOString();

  const [messages, propositions, offres] = await Promise.all([
    lire<LigneMessage>(`compte_messages?select=compte,cle,conversation,titre,envoye_le&de=eq.agent&envoye_le=gte.${depuis}&order=envoye_le.asc&limit=300`),
    lire<LigneProposition>(`compte_propositions?select=compte,cle,commune,dept,type,lots,prix&propose_le=gte.${depuis}&limit=300`),
    lire<LigneOffre>(`compte_offres?select=compte,cle,bien_cle,prix_hai&transmise_le=gte.${depuis.slice(0, 10)}&limit=300`),
  ]);
  const [vusM, vusP, vusO] = await Promise.all([
    dejaAvises("compte_messages", messages.map((m) => m.cle)),
    dejaAvises("compte_propositions", propositions.map((p) => p.cle)),
    dejaAvises("compte_offres", offres.map((o) => o.cle)),
  ]);
  const nouveaux = {
    messages: messages.filter((m) => !vusM.has(m.cle)),
    propositions: propositions.filter((p) => !vusP.has(p.cle)),
    offres: offres.filter((o) => !vusO.has(o.cle)),
  };
  const comptes = [...new Set([...nouveaux.messages, ...nouveaux.propositions, ...nouveaux.offres].map((x) => x.compte))].slice(0, 50);

  for (const compte of comptes) {
    const u = await utilisateurParId(compte);
    const fait: { compte: string; source: Source; cle: string }[] = [];
    const prefs = u?.app_metadata?.notifications ?? {};
    const peutEcrire = !!u?.email && !!u.email_confirmed_at;

    // Une conversation, un e-mail, avec tout l'historique.
    const msgs = nouveaux.messages.filter((m) => m.compte === compte);
    for (const conversation of new Set(msgs.map((m) => m.conversation))) {
      const lignes = msgs.filter((m) => m.conversation === conversation);
      if (peutEcrire && prefs.messages !== false) {
        const fil = await lire<Fil>(`compte_messages?select=de,auteur,texte,envoye_le&compte=eq.${compte}&conversation=eq.${conversation}&order=envoye_le.asc&limit=50`);
        const c = nouveauMessage(lignes[0].titre || "Conversation avec l’agence", fil, conversation);
        if (await envoyerAuClient({ a: u!.email, sujet: c.sujet, html: c.html, text: c.text })) total.messages++;
      }
      fait.push(...lignes.map((m) => ({ compte, source: "compte_messages" as const, cle: m.cle })));
    }

    const props = nouveaux.propositions.filter((p) => p.compte === compte);
    if (props.length) {
      if (peutEcrire && prefs.biens !== false) {
        const c = nouveauxBiensProposes(props.map((p) =>
          [p.type ?? "Immeuble", nomImmeuble(p), p.lots ? `${p.lots} lots` : null, euros(p.prix)].filter(Boolean).join(", ")));
        if (await envoyerAuClient({ a: u!.email, sujet: c.sujet, html: c.html, text: c.text })) total.biens += props.length;
      }
      fait.push(...props.map((p) => ({ compte, source: "compte_propositions" as const, cle: p.cle })));
    }

    for (const o of nouveaux.offres.filter((x) => x.compte === compte)) {
      if (peutEcrire && prefs.offres !== false) {
        const b = o.bien_cle
          ? (await lire<{ commune: string | null; dept: string | null }>(`compte_biens?select=commune,dept&compte=eq.${compte}&cle=eq.${o.bien_cle}&limit=1`))[0]
          : undefined;
        const c = nouvelleOffre(b ? nomImmeuble(b) : "votre immeuble", euros(o.prix_hai), o.bien_cle);
        if (await envoyerAuClient({ a: u!.email, sujet: c.sujet, html: c.html, text: c.text })) total.offres++;
      }
      fait.push({ compte, source: "compte_offres", cle: o.cle });
    }
    // Un compte effacé entre-temps n'a plus de ligne à marquer.
    if (u) await marquer(fait);
  }
  return total;
}
