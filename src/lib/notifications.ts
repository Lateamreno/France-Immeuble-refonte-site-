// Serveur uniquement : lit SENDGRID_API_KEY.

/**
 * Alerte de l'agence à chaque formulaire (MAV, 22/10/2026) : contact@ et
 * ma.voci@ reçoivent un e-mail par formulaire rempli, quel qu'il soit.
 *
 * C'est le site qui l'envoie, au moment où il reçoit le formulaire, et non le
 * BO : si le BO est en panne, l'alerte part quand même, avec la mention
 * « en attente de transmission ». Une demande ne peut plus passer inaperçue.
 *
 * L'alerte va à l'agence seulement. Aucun e-mail automatique ne part vers le
 * visiteur (contrat BO §6 et §9.1) ; « Répondre » écrit au client, grâce au
 * Reply-To.
 *
 * Envoi par l'API de SendGrid, avec une clé restreinte à « Mail Send ». Sans
 * les variables, rien ne part et rien ne casse.
 */

import type { Issue } from "./leads";

type Lead = Record<string, unknown>;
export type Contexte = { email?: string; prenom?: string; nom?: string; telephone?: string };

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

const echap = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const texte = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

const euros = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && n > 0 ? `${Math.round(n).toLocaleString("fr-FR")} €` : texte(v);
};

/** Libellés des champs, dans l'ordre où l'alerte les présente. */
const CHAMPS: [string, string, ((v: unknown) => string)?][] = [
  ["prenom", "Prénom"], ["nom", "Nom"], ["email", "E-mail"], ["telephone", "Téléphone"],
  ["projet", "Projet"], ["bienTitre", "Bien concerné"],
  ["numero", "N°"], ["rue", "Rue"], ["codePostal", "Code postal"], ["ville", "Ville"],
  ["surface", "Surface (m²)"], ["loyerAnnuel", "Loyers annuels HC", euros],
  ["lotsHabitation", "Lots habitation"], ["lotsCommerces", "Lots commerces"],
  ["lotsBureaux", "Lots bureaux"], ["lotsActivite", "Lots activité"],
  ["occupation", "Occupation"], ["travaux", "Travaux"], ["echeance", "Échéance de vente"],
  ["valeurEstimee", "Valeur estimée par le propriétaire", euros],
  ["cible", "Profil"], ["departements", "Départements"], ["villes", "Villes"],
  ["prixMin", "Prix minimum", euros], ["prixMax", "Prix maximum", euros],
  ["rendementMin", "Rendement minimum (%)"], ["destinations", "Destinations"],
  ["action", "Action"], ["reponse", "Réponse"], ["prix", "Prix proposé", euros],
  ["categorie", "Catégorie de pièce"], ["fichier", "Fichier"],
  ["message", "Message"], ["commentaire", "Commentaire"],
];

const REPONSES: Record<string, string> = {
  interesse: "Intéressé", visite: "Demande une visite", pas_pour_moi: "Pas pour moi",
};
const PIECES: Record<string, string> = {
  titre: "Titre de propriété", baux: "Baux", diagnostics: "Diagnostics",
  taxe: "Taxe foncière", charges: "Charges et travaux", autre: "Autre pièce",
};

const qui = (l: Lead) => [texte(l.prenom), texte(l.nom)].filter(Boolean).join(" ");

function objet(l: Lead): string {
  const ville = texte(l.ville);
  switch (l.type) {
    case "estimation":
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
    if (cle === "reponse") v = REPONSES[texte(v)] ?? v;
    if (cle === "categorie") v = PIECES[texte(v)] ?? v;
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

function corps(l: Lead, issue: Issue): { html: string; text: string } {
  const blocs: { titre: string; lignes: [string, string][] }[] = [
    { titre: "", lignes: lignes(l) },
    ...recherches(l).map((r, i) => ({ titre: `Recherche ${i + 1}`, lignes: r })),
  ];
  // Le routage du site ne vaut que pour une estimation (code postal, valeur, loyer).
  const piste = l.type === "estimation" ? (l.verdict as { piste?: string } | undefined)?.piste : undefined;
  const notes = [
    piste ? `Orientation calculée par le site : ${piste}` : "",
    l.compte ? "Envoyé depuis un compte client vérifié." : "",
    issue === "file" ? "Le BO n'a pas répondu : la demande attend dans la file du site et sera transmise automatiquement." : "",
    issue === "perdu" ? "La demande n'a pu être enregistrée ni par le BO ni dans la file du site. Cet e-mail en est la seule trace : à saisir à la main." : "",
    issue === "refuse" ? "Le BO a refusé ce dépôt ; le site a effacé la pièce et prévenu le propriétaire." : "",
  ].filter(Boolean);

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0A0A0A">
${blocs
  .filter((b) => b.lignes.length)
  .map(
    (b) => `${b.titre ? `<p style="margin:16px 0 4px;font-weight:bold">${echap(b.titre)}</p>` : ""}<table cellpadding="6" style="border-collapse:collapse">
${b.lignes.map(([k, v]) => `<tr><td style="color:#555;vertical-align:top;white-space:nowrap">${echap(k)}</td><td>${echap(v).replace(/\n/g, "<br>")}</td></tr>`).join("\n")}
</table>`,
  )
  .join("\n")}
${notes.map((n) => `<p style="color:#555">${echap(n)}</p>`).join("\n")}
<p style="color:#888;font-size:12px">Reçu par le site le ${echap(new Date(texte(l.recuLe) || Date.now()).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }))}. Référence ${echap(texte(l.ref))}.</p>
</div>`;
  const text = [
    ...blocs.flatMap((b) => [b.titre, ...b.lignes.map(([k, v]) => `${k} : ${v}`)].filter(Boolean)),
    "",
    ...notes,
    `Référence ${texte(l.ref)}`,
  ].join("\n");
  return { html, text };
}

/**
 * Envoie l'alerte d'un formulaire. Ne lève jamais : une alerte ratée est
 * journalisée, le formulaire, lui, a déjà suivi son chemin.
 */
export async function alerter(lead: Lead, issue: Issue, contexte: Contexte = {}): Promise<boolean> {
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
  const { html, text } = corps(l, issue);
  const repondreA = texte(l.email);
  try {
    const r = await fetch(`${cfg.api}/v3/mail/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: cfg.a.map((email) => ({ email })) }],
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
