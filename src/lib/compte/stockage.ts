// Serveur uniquement : clé secrète du site.
import { configSite } from "../supabase-site";

/**
 * Le seau privé `depots-proprietaires` (contrat BO §10). Aucune politique
 * d'accès : seule la clé secrète y lit ou écrit. Le site y pose une pièce,
 * le BO la range dans le coffre de l'immeuble puis l'efface. Le site n'en
 * garde rien.
 */
export const SEAU = "depots-proprietaires";

/** Formats du §10.2, par extension : le type annoncé par le navigateur ne fait pas foi. */
export const FORMATS: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
};

export const TAILLE_MAX = 25 * 1024 * 1024;
/** Un morceau tient sous la limite de corps des fonctions Vercel (4,5 Mo). */
export const TAILLE_MORCEAU = 4 * 1024 * 1024;

export const extension = (nom: string) => nom.toLowerCase().match(/\.([a-z0-9]{1,5})$/)?.[1] ?? "";

/** « Bail rue X (2).PDF » → « bail-rue-x-2.pdf » : un nom sûr pour un chemin. */
export function nomDeFichier(nom: string): string {
  const ext = extension(nom);
  const base = nom
    .replace(/\.[^.]*$/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "piece";
  return `${base}.${ext}`;
}

function cfg() {
  const c = configSite();
  if (!c) throw new Error("base du site non configurée (SITE_SUPABASE_SECRET_KEY)");
  return c;
}

const chemin = (objet: string) => objet.split("/").map(encodeURIComponent).join("/");

export async function deposerObjet(objet: string, corps: Uint8Array, type: string): Promise<void> {
  const c = cfg();
  const r = await fetch(`${c.url}/storage/v1/object/${SEAU}/${chemin(objet)}`, {
    method: "POST",
    headers: { apikey: c.cle, Authorization: `Bearer ${c.cle}`, "Content-Type": type, "x-upsert": "true" },
    body: corps as BodyInit,
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`stockage ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

export async function lireObjet(objet: string): Promise<Uint8Array | null> {
  const c = cfg();
  const r = await fetch(`${c.url}/storage/v1/object/${SEAU}/${chemin(objet)}`, {
    headers: { apikey: c.cle, Authorization: `Bearer ${c.cle}` },
    cache: "no-store",
  });
  if (r.status === 404 || r.status === 400) return null;
  if (!r.ok) throw new Error(`stockage ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

/** Le seau privé où le BO dépose les documents remis au client (offres : contrat §12.1). */
export const SEAU_CLIENTS = "documents-clients";

/** Un document du seau des clients, lu par le serveur. null s'il n'existe pas. */
export async function lireDocumentClient(objet: string): Promise<Uint8Array | null> {
  const c = cfg();
  const r = await fetch(`${c.url}/storage/v1/object/${SEAU_CLIENTS}/${chemin(objet)}`, {
    headers: { apikey: c.cle, Authorization: `Bearer ${c.cle}` },
    cache: "no-store",
  });
  if (r.status === 404 || r.status === 400) return null;
  if (!r.ok) throw new Error(`stockage ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

/** Efface des objets du seau. Ne lève pas : un effacement raté est journalisé. */
export async function effacerObjets(objets: string[]): Promise<void> {
  if (objets.length === 0) return;
  try {
    const c = cfg();
    const r = await fetch(`${c.url}/storage/v1/object/${SEAU}`, {
      method: "DELETE",
      headers: { apikey: c.cle, Authorization: `Bearer ${c.cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: objets }),
      cache: "no-store",
    });
    if (!r.ok) console.error(`[stockage] effacement refusé ${r.status}`);
  } catch (e) {
    console.error("[stockage] effacement impossible —", e);
  }
}

/** Les objets sous un dossier (un niveau, `limite` au plus). */
export async function listerDossier(dossier: string, limite = 1000): Promise<{ name: string; id: string | null; created_at?: string }[]> {
  const c = cfg();
  const r = await fetch(`${c.url}/storage/v1/object/list/${SEAU}`, {
    method: "POST",
    headers: { apikey: c.cle, Authorization: `Bearer ${c.cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: dossier, limit: limite, offset: 0 }),
    cache: "no-store",
  });
  if (!r.ok) return [];
  return (await r.json()) as { name: string; id: string | null; created_at?: string }[];
}

/** Tout ce qui est rangé sous `<compte>/`, morceaux en attente compris. */
export async function viderCompte(compte: string): Promise<void> {
  const objets: string[] = [];
  for (const o of await listerDossier(`${compte}/`)) {
    if (o.id) objets.push(`${compte}/${o.name}`);
    else {
      // Un « dossier » : les morceaux d'un dépôt interrompu.
      for (const sous of await listerDossier(`${compte}/${o.name}/`)) {
        if (sous.id) objets.push(`${compte}/${o.name}/${sous.name}`);
        else for (const m of await listerDossier(`${compte}/${o.name}/${sous.name}/`)) {
          if (m.id) objets.push(`${compte}/${o.name}/${sous.name}/${m.name}`);
        }
      }
    }
  }
  await effacerObjets(objets);
}

/**
 * Morceaux d'un dépôt interrompu (fenêtre fermée en plein envoi) : effacés
 * après 24 h par la tâche quotidienne. Les pièces complètes, elles, restent
 * jusqu'à ce que le BO les range ; c'est lui qui les efface (§10.1).
 */
export async function nettoyerMorceaux(ageMax = 24 * 3600_000): Promise<number> {
  const limite = Date.now() - ageMax;
  const vieux: string[] = [];
  for (const compte of await listerDossier("")) {
    if (compte.id) continue;
    for (const depot of await listerDossier(`${compte.name}/morceaux/`)) {
      if (depot.id) continue;
      for (const m of await listerDossier(`${compte.name}/morceaux/${depot.name}/`)) {
        if (m.id && m.created_at && Date.parse(m.created_at) < limite) {
          vieux.push(`${compte.name}/morceaux/${depot.name}/${m.name}`);
        }
      }
    }
  }
  await effacerObjets(vieux);
  return vieux.length;
}
