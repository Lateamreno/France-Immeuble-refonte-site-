// Serveur uniquement : lit SENDGRID_API_KEY.

/**
 * Alerte de l'agence à chaque formulaire (MAV, 22/10/2026) : contact@ et
 * ma.voci@ reçoivent un e-mail par formulaire rempli, quel qu'il soit.
 *
 * C'est le site qui l'envoie, au moment où il reçoit le formulaire, et non le
 * BO : si le BO est en panne, l'alerte part quand même, avec la mention
 * « en attente de transmission ». Une demande ne peut plus passer inaperçue.
 *
 * « Répondre » écrit au client, grâce au Reply-To.
 *
 * Un seul e-mail part vers le visiteur : celui qui suit une estimation, avec
 * la liste des pièces et l'accès à son espace (MAV, 27/10/2026). Il est écrit
 * dans `compte/accueil.ts` et passe par `envoyerAuClient` ci-dessous.
 *
 * Envoi par l'API de SendGrid, avec une clé restreinte à « Mail Send ». Sans
 * les variables, rien ne part et rien ne casse.
 */

import type { Issue } from "./leads";
import { COULEURS, echap, gabarit, piedTexte } from "./courriel";
import { COLONNES_LOT, lotEnClair } from "./dossier/modele";

type Lead = Record<string, unknown>;
export type Contexte = { email?: string; prenom?: string; nom?: string; telephone?: string };

/**
 * Ce qui accompagne une alerte sans partir au BO : l'agent attitré en copie
 * (rendez-vous, messages : MAV, 30/10/2026) et l'historique de la conversation.
 */
export type OptionsAlerte = {
  copie?: string[];
  /**
   * Rendez-vous (MAV, 31/10/2026) : avec un agent attitré, l'alerte part à
   * l'agent et à ma.voci@, sans contact@ ; sans agent, à contact@ seulement.
   */
  regleRendezVous?: boolean;
  historique?: { de: "client" | "agent"; auteur: string | null; texte: string; envoye_le: string }[];
};

function config() {
  const cle = process.env.SENDGRID_API_KEY?.trim();
  const de = process.env.SITE_NOTIF_FROM?.trim();
  const a = (process.env.SITE_NOTIF_DESTINATAIRES ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => EMAIL.test(x));
  if (!cle || !de || a.length === 0) return null;
  // Une clé SendGrid commence par « SG. ». Toute autre chose (une clé de base
  // en particulier) n'a rien à faire ici.
  if (!cle.startsWith("SG.")) {
    console.error("[alerte] SENDGRID_API_KEY n'a pas la forme d'une clé SendGrid. Envoi suspendu.");
    return null;
  }
  // L'adresse de l'API ne se change que pour la recette locale.
  const api = (process.env.SENDGRID_API_URL ?? "https://api.sendgrid.com").replace(/\/+$/, "");
  if (!/^https:\/\//.test(api) && !/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(api)) return null;
  return { cle, de, a, api };
}

const EMAIL = /^[^\s@,]+@[^\s@,]+\.[^\s@,]{2,}$/;

const texte = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

const euros = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && n > 0 ? `${Math.round(n).toLocaleString("fr-FR")} €` : texte(v);
};

/** Libellés des champs, dans l'ordre où l'alerte les présente. */
const CHAMPS: [string, string, ((v: unknown) => string)?][] = [
  ["_qui", "Nom"], ["email", "E-mail"], ["telephone", "Téléphone"],
  ["projet", "Projet"], ["bienTitre", "Bien concerné"],
  ["_adresse", "Adresse"],
  ["surface", "Surface habitable totale (m²)"], ["loyerAnnuel", "Loyers annuels HC", euros],
  ["lotsHabitation", "Lots habitation"], ["lotsCommerces", "Lots commerces"],
  ["lotsBureaux", "Lots bureaux"], ["lotsActivite", "Lots entrepôts / activité"],
  ["occupation", "Occupation"], ["travaux", "Travaux"], ["echeance", "Échéance de vente"],
  ["valeurEstimee", "Valeur estimée par le propriétaire", euros],
  ["cible", "Profil"], ["departements", "Départements"], ["villes", "Villes"],
  ["prixMin", "Prix minimum", euros], ["prixMax", "Prix maximum", euros],
  ["rendementMin", "Rendement minimum (%)"], ["destinations", "Destinations"],
  ["action", "Action"], ["reponse", "Réponse"], ["prix", "Prix proposé", euros],
  ["categorie", "Catégorie de pièce"], ["fichier", "Fichier"],
  ["taxeFonciere", "Taxe foncière annuelle", euros], ["teom", "Dont TEOM récupérée", euros],
  ["montant", "Montant proposé", euros], ["financement", "Financement"], ["apport", "Apport", euros],
  ["validite_jours", "Validité de l’offre (jours)"], ["conditions", "Conditions"],
  ["date", "Date souhaitée"], ["creneau", "Créneau"], ["objet", "Objet"],
  ["achat_en", "Achète en"], ["societe", "Société"], ["siren", "SIREN"],
  ["immeubles_detenus", "Immeubles détenus"], ["budget", "Budget", euros],
  ["presentation", "Présentation"], ["ancien_email", "Ancienne adresse"],
  ["titre", "Conversation"], ["texte", "Message"], ["pieces", "Pièces jointes"],
  ["message", "Description"], ["commentaire", "Commentaire"],
];

/** Les codes du contrat (§13) en clair. */
const CODES: Record<string, Record<string, string>> = {
  creneau: { matin: "Matin", apres_midi: "Après-midi", soir: "En fin de journée" },
  objet: { visite: "Visite", estimation: "Estimation", signature: "Signature", autre: "Autre" },
  financement: { comptant: "Comptant", pret: "Prêt", mixte: "Apport et prêt" },
  achat_en: { nom_propre: "En nom propre", societe: "En société" },
};

const REPONSES: Record<string, string> = {
  interesse: "Intéressé", visite: "Demande une visite", pas_pour_moi: "Pas pour moi",
};
const PIECES: Record<string, string> = {
  titre: "Titre de propriété", baux: "Baux", diagnostics: "Diagnostics",
  taxe: "Taxe foncière", charges: "Charges et travaux", plans: "Plans", photos: "Photos", autre: "Autre pièce",
};

const dateFr = (v: unknown) => {
  const d = new Date(`${texte(v)}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? texte(v)
    : d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
};

const qui = (l: Lead) => [texte(l.prenom), texte(l.nom)].filter(Boolean).join(" ");

function objet(l: Lead): string {
  const ville = texte(l.ville);
  switch (l.type) {
    case "estimation":
      if (l.etat === "dossier") {
        const n = Array.isArray(l.lots) ? l.lots.length : 0;
        return `Dossier en ligne : ${n} lot${n > 1 ? "s" : ""}${ville ? `, ${ville}` : ""}${qui(l) ? ` (${qui(l)})` : ""}`;
      }
      return l.etat === "complement"
        ? `Complément d'estimation${ville ? ` : ${ville}` : ""}${qui(l) ? ` (${qui(l)})` : ""}`
        : `Nouvelle ${l.formulaire === "vendre" ? "demande de vente" : "estimation"}${ville ? ` : ${ville}` : ""}${qui(l) ? ` (${qui(l)})` : ""}`;
    case "recherche_acquereur":
      return `Nouvelle recherche acquéreur${qui(l) ? ` : ${qui(l)}` : ""}`;
    case "contact":
      return l.bien
        ? `Demande de dossier : ${texte(l.bienTitre) || "bien à vendre"}${qui(l) ? ` (${qui(l)})` : ""}`
        : `Nouveau message de contact${texte(l.telephone) ? ` : ${texte(l.telephone)}` : ""}`;
    case "compte":
      return `Nouveau compte client${qui(l) ? ` : ${qui(l)}` : ""}`;
    case "recherche_compte":
      return `Recherche ${l.action === "supprimer" ? "supprimée" : "enregistrée"} depuis le compte${qui(l) ? ` : ${qui(l)}` : ""}`;
    case "reponse":
      return `Réponse à une proposition : ${REPONSES[texte(l.reponse)] ?? texte(l.reponse)}${qui(l) ? ` (${qui(l)})` : ""}`;
    case "prix_proprietaire":
      return `Prix proposé par un propriétaire : ${euros(l.prix)}${qui(l) ? ` (${qui(l)})` : ""}`;
    case "document":
      return `Pièce déposée : ${PIECES[texte(l.categorie)] ?? texte(l.categorie)}${qui(l) ? ` (${qui(l)})` : ""}`;
    case "message":
      return `Message du compte : ${texte(l.titre) || "conversation"}${qui(l) ? ` (${qui(l)})` : ""}`;
    case "rendez_vous":
      return `Demande de rendez-vous : ${dateFr(l.date)}${qui(l) ? ` (${qui(l)})` : ""}`;
    case "offre_acquereur":
      return `Offre d'achat en ligne : ${euros(l.montant)}${qui(l) ? ` (${qui(l)})` : ""}`;
    case "profil_investisseur":
      return `Profil investisseur${qui(l) ? ` : ${qui(l)}` : ""}`;
    case "favori":
      return `Favori ${l.action === "retirer" ? "retiré" : "ajouté"} : ${texte(l.bienTitre)}${qui(l) ? ` (${qui(l)})` : ""}`;
    case "coordonnees":
      return `Coordonnées modifiées par le client${qui(l) ? ` : ${qui(l)}` : ""}`;
    case "compte_supprime":
      return `Compte client fermé${qui(l) ? ` : ${qui(l)}` : ""}`;
    default:
      return "Nouveau formulaire du site";
  }
}

const MENTION: Record<Issue, string> = {
  bo: "",
  file: " · en attente de transmission au BO",
  perdu: " · NON ENREGISTRÉ, à saisir à la main",
  refuse: " · refusée par le BO",
};

function lignes(l: Lead): [string, string][] {
  const out: [string, string][] = [];
  for (const [cle, libelle, format] of CHAMPS) {
    let v: unknown = l[cle];
    // Le nom et l'adresse sur une ligne chacun : l'alerte se lit d'un coup d'œil.
    if (cle === "_qui") v = qui(l);
    if (cle === "_adresse") {
      v = [[texte(l.numero), texte(l.rue)].filter(Boolean).join(" "), [texte(l.codePostal), texte(l.ville)].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ");
    }
    if (cle === "reponse") v = REPONSES[texte(v)] ?? v;
    if (cle === "categorie") v = PIECES[texte(v)] ?? v;
    if (CODES[cle]) v = CODES[cle][texte(v)] ?? v;
    if (cle === "pieces" && Array.isArray(v)) v = (v as { nom?: string }[]).map((x) => texte(x?.nom)).filter(Boolean);
    if (cle === "date" && l.type === "rendez_vous") v = dateFr(v);
    if (Array.isArray(v)) v = v.join(", ");
    const s = format ? format(v) : texte(v);
    if (s) out.push([libelle, s]);
  }
  return out;
}

function recherches(l: Lead): [string, string][][] {
  const rs = Array.isArray(l.recherches) ? (l.recherches as Lead[]) : [];
  return rs.map((r) => lignes(r));
}

/** Le titre de l'alerte, en tête du message : l'objet sans le nom. */
function titre(l: Lead): string {
  return objet(l).replace(/ \([^)]*\)$/, "");
}

/** Les valeurs qu'on touche du doigt : appeler, écrire. */
function valeurHtml(libelle: string, v: string): string {
  const lien = `color:${COULEURS.texte};text-decoration:underline`;
  if (libelle === "Téléphone") return `<a href="tel:${echap(v.replace(/[^\d+]/g, ""))}" style="${lien}">${echap(v)}</a>`;
  if (libelle === "E-mail") return `<a href="mailto:${echap(v)}" style="${lien}">${echap(v)}</a>`;
  return echap(v).replace(/\n/g, "<br>");
}

function tableau(lignes: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 20px">
${lignes
  .map(
    ([k, v]) => `<tr><td style="padding:9px 14px 9px 0;border-bottom:1px solid ${COULEURS.filet};vertical-align:top;white-space:nowrap;font-size:13px;color:${COULEURS.doux}">${echap(k)}</td><td style="padding:9px 0;border-bottom:1px solid ${COULEURS.filet};vertical-align:top;font-size:15px;color:${COULEURS.texte}">${valeurHtml(k, v)}</td></tr>`,
  )
  .join("\n")}
</table>`;
}

/** L'état locatif d'un dossier en ligne : un lot par ligne, comme sur la page de saisie. */
function tableauLots(lots: unknown[]): string {
  const cellule = (v: string, entete = false) =>
    `<td style="padding:7px 8px;border-bottom:1px solid ${COULEURS.filet};font-size:${entete ? 11 : 13}px;${entete ? `color:${COULEURS.doux};text-transform:uppercase;letter-spacing:.06em;` : `color:${COULEURS.texte};`}white-space:nowrap">${echap(v)}</td>`;
  return `<p style="margin:8px 0 8px;font-weight:bold">État locatif</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 20px">
<tr>${COLONNES_LOT.map((c) => cellule(c, true)).join("")}</tr>
${lots.map((x) => `<tr>${lotEnClair(x).map((c) => cellule(c)).join("")}</tr>`).join("\n")}
</table>`;
}

/** Le fil d'une conversation, du plus ancien au plus récent (MAV : « avec l'historique »). */
export function filHtml(fil: NonNullable<OptionsAlerte["historique"]>): string {
  if (!fil.length) return "";
  return `<p style="margin:8px 0 8px;font-weight:bold">Historique</p>
${fil
  .map((m) => {
    const quand = new Date(m.envoye_le).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
    const nom = m.de === "agent" ? m.auteur || "France Immeuble" : "Le client";
    return `<div style="margin:0 0 10px;padding:10px 14px;border-left:3px solid ${m.de === "agent" ? COULEURS.or : COULEURS.filet};background:${m.de === "agent" ? "transparent" : COULEURS.filet}">
<p style="margin:0 0 4px;font-size:12px;color:${COULEURS.doux}">${echap(nom)} · ${echap(quand)}</p>
<p style="margin:0;font-size:14px;color:${COULEURS.texte}">${echap(m.texte).replace(/\n/g, "<br>")}</p></div>`;
  })
  .join("\n")}`;
}

export function filTexte(fil: NonNullable<OptionsAlerte["historique"]>): string[] {
  return fil.flatMap((m) => [
    `${m.de === "agent" ? m.auteur || "France Immeuble" : "Le client"}, ${new Date(m.envoye_le).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} :`,
    m.texte,
    "",
  ]);
}

function corps(l: Lead, issue: Issue, historique: NonNullable<OptionsAlerte["historique"]> = []): { html: string; text: string } {
  const blocs: { titre: string; lignes: [string, string][] }[] = [
    { titre: "", lignes: lignes(l) },
    ...recherches(l).map((r, i) => ({ titre: `Recherche ${i + 1}`, lignes: r })),
  ];
  const lots = Array.isArray(l.lots) ? (l.lots as unknown[]) : [];
  // Le routage du site ne vaut que pour une estimation (code postal, valeur, loyer).
  // Depuis le retour #60 (27/10/2026), le loyer n'arrive qu'avec le complément :
  // sur le premier envoi, hors Île-de-France, l'orientation n'est pas encore connue.
  const v = l.type === "estimation" ? (l.verdict as { piste?: string; idf?: boolean } | undefined) : undefined;
  const enAttente = l.etat === "principal" && !texte(l.loyerAnnuel) && !v?.idf;
  const piste = v?.piste ? (enAttente ? "à préciser, le loyer arrive avec le complément" : v.piste) : undefined;
  const notes = [
    piste ? `Orientation calculée par le site : ${piste}` : "",
    l.compte ? "Envoyé depuis un compte client vérifié." : "",
    issue === "file" ? "Le BO n'a pas répondu : la demande attend dans la file du site et sera transmise automatiquement." : "",
    issue === "perdu" ? "La demande n'a pu être enregistrée ni par le BO ni dans la file du site. Cet e-mail en est la seule trace : à saisir à la main." : "",
    issue === "refuse" ? "Le BO a refusé ce dépôt ; le site a effacé la pièce et prévenu le propriétaire." : "",
  ].filter(Boolean);
  const recu = new Date(texte(l.recuLe) || Date.now()).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  const alerte = issue === "perdu" || issue === "refuse";

  const html = gabarit({
    apercu: [qui(l), texte(l.telephone), texte(l.ville)].filter(Boolean).join(" · ") || titre(l),
    largeur: lots.length ? 720 : 560,
    corps: `<p style="margin:0 0 4px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:${COULEURS.orProfond}">Site france-immeuble.fr</p>
<p style="margin:0 0 20px;font-size:21px;line-height:1.3;font-weight:bold">${echap(titre(l))}</p>
${alerte ? `<p style="margin:0 0 20px;padding:12px 14px;border-left:3px solid ${COULEURS.or};background:${COULEURS.filet};font-weight:bold">${echap(notes.at(-1) ?? "")}</p>` : ""}
${blocs
  .filter((b) => b.lignes.length)
  .map((b) => `${b.titre ? `<p style="margin:8px 0 6px;font-weight:bold">${echap(b.titre)}</p>` : ""}${tableau(b.lignes)}`)
  .join("\n")}
${lots.length ? tableauLots(lots) : ""}
${filHtml(historique)}
${notes
  .filter((n) => !alerte || n !== notes.at(-1))
  .map((n) => `<p style="margin:0 0 8px;font-size:13px;color:${COULEURS.doux}">${echap(n)}</p>`)
  .join("\n")}
<p style="margin:16px 0 0;font-size:12px;color:${COULEURS.doux}">Reçu par le site le ${echap(recu)}. Référence ${echap(texte(l.ref))}. « Répondre » écrit au client.</p>`,
  });
  const text = [
    titre(l),
    "",
    ...blocs.flatMap((b) => [b.titre, ...b.lignes.map(([k, val]) => `${k} : ${val}`)].filter(Boolean)),
    ...(lots.length ? ["", "État locatif", ...lots.map((x) => lotEnClair(x).filter(Boolean).join(" · "))] : []),
    ...(historique.length ? ["", "Historique", ...filTexte(historique)] : []),
    "",
    ...notes,
    `Reçu le ${recu}. Référence ${texte(l.ref)}`,
    "",
    piedTexte(),
  ].join("\n");
  return { html, text };
}

/**
 * Envoie l'alerte d'un formulaire. Ne lève jamais : une alerte ratée est
 * journalisée, le formulaire, lui, a déjà suivi son chemin.
 */
export async function alerter(lead: Lead, issue: Issue, contexte: Contexte = {}, options: OptionsAlerte = {}): Promise<boolean> {
  const cfg = config();
  if (!cfg) return false;
  // Le compte connu du site complète ce que le formulaire ne porte pas.
  // Pour une pièce, `nom` est le nom du fichier : il passe dans `fichier`.
  const piece = lead.type === "document";
  const l: Lead = {
    ...lead,
    fichier: piece ? lead.nom : undefined,
    prenom: texte(lead.prenom) || contexte.prenom,
    nom: (piece ? "" : texte(lead.nom)) || contexte.nom,
    email: texte(lead.email) || contexte.email,
    telephone: texte(lead.telephone) || contexte.telephone,
  };
  const { html, text } = corps(l, issue, options.historique);
  const repondreA = texte(l.email);
  // L'agent attitré en copie, sans doublon avec les destinataires habituels.
  const copie = (options.copie ?? []).map((x) => x.trim().toLowerCase()).filter((x) => EMAIL.test(x));
  const accueil = cfg.a.filter((x) => /^contact@/i.test(x));
  const habituels = !options.regleRendezVous ? cfg.a
    : copie.length ? cfg.a.filter((x) => !/^contact@/i.test(x))
    : accueil.length ? accueil : cfg.a;
  const a = [...habituels, ...copie]
    .filter((x, i, t) => t.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i);
  try {
    const r = await fetch(`${cfg.api}/v3/mail/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: a.map((email) => ({ email })) }],
        from: { email: cfg.de, name: "Site France Immeuble" },
        ...(EMAIL.test(repondreA) ? { reply_to: { email: repondreA, ...(qui(l) ? { name: qui(l) } : {}) } } : {}),
        subject: (objet(l) + MENTION[issue]).slice(0, 200),
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
        tracking_settings: {
          click_tracking: { enable: false, enable_text: false },
          open_tracking: { enable: false },
          subscription_tracking: { enable: false },
          ganalytics: { enable: false },
        },
        categories: ["site-alerte"],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (r.status === 202 || r.ok) return true;
    console.error(`[alerte] SendGrid ${r.status} : ${(await r.text()).slice(0, 200)}`);
    return false;
  } catch (e) {
    console.error("[alerte] envoi impossible —", e instanceof Error ? e.message : e);
    return false;
  }
}

/**
 * Un e-mail au client (seul cas : après une estimation, voir `compte/accueil.ts`).
 * Il part de contact@, et « Répondre » écrit à l'agence. Ne lève jamais.
 */
export async function envoyerAuClient(m: {
  a: string;
  nom?: string;
  sujet: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const cfg = config();
  if (!cfg || !EMAIL.test(m.a)) return false;
  try {
    const r = await fetch(`${cfg.api}/v3/mail/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: m.a, ...(m.nom ? { name: m.nom } : {}) }] }],
        from: { email: cfg.de, name: "France Immeuble" },
        reply_to: { email: cfg.de, name: "France Immeuble" },
        subject: m.sujet.slice(0, 200),
        content: [
          { type: "text/plain", value: m.text },
          { type: "text/html", value: m.html },
        ],
        // Pas de suivi : le lien d'accès ne doit pas transiter par un domaine de SendGrid.
        tracking_settings: {
          click_tracking: { enable: false, enable_text: false },
          open_tracking: { enable: false },
          subscription_tracking: { enable: false },
          ganalytics: { enable: false },
        },
        categories: ["site-client"],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (r.status === 202 || r.ok) return true;
    console.error(`[client] SendGrid ${r.status} : ${(await r.text()).slice(0, 200)}`);
    return false;
  } catch (e) {
    console.error("[client] envoi impossible —", e instanceof Error ? e.message : e);
    return false;
  }
}
