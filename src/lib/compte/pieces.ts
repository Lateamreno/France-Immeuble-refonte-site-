// Serveur uniquement.
import { extension, FORMATS, TAILLE_MAX, TAILLE_MORCEAU } from "./stockage";

/** Les catégories de pièces du §10.2, dans l'ordre où le compte les présente. */
export const CATEGORIES = [
  { cle: "titre", titre: "Titre de propriété", aide: "L’acte notarié d’acquisition." },
  { cle: "baux", titre: "Baux en cours", aide: "Un fichier par bail, ou un seul pour tous." },
  { cle: "diagnostics", titre: "Diagnostics", aide: "DPE, amiante, plomb, électricité, gaz, même anciens." },
  { cle: "taxe", titre: "Taxe foncière", aide: "Le dernier avis." },
  { cle: "charges", titre: "Charges et travaux", aide: "Appels de charges, devis, factures récentes." },
  { cle: "autre", titre: "Autre pièce", aide: "Tout document utile à la vente." },
] as const;

export type CleCategorie = (typeof CATEGORIES)[number]["cle"];
export const estCategorie = (c: string): c is CleCategorie => CATEGORIES.some((x) => x.cle === c);

/** Vérifie un dépôt annoncé ; renvoie un message d'erreur, ou null. */
export function controlerAnnonce(nom: string, taille: number): string | null {
  if (!FORMATS[extension(nom)]) {
    return "Format refusé. Envoyez un PDF, une image (JPEG, PNG, WebP, HEIC), un fichier Word, Excel ou OpenDocument.";
  }
  if (!Number.isFinite(taille) || taille <= 0) return "Le fichier est vide.";
  if (taille > TAILLE_MAX) return "Le fichier dépasse 25 Mo.";
  return null;
}

export const nombreDeMorceaux = (taille: number) => Math.max(1, Math.ceil(taille / TAILLE_MORCEAU));

/**
 * Le contenu correspond-il à l'extension ? On lit les premiers octets : un
 * exécutable renommé en « .pdf » ne passe pas.
 */
export function contenuConforme(nom: string, o: Uint8Array): boolean {
  const ext = extension(nom);
  const debut = (...octets: number[]) => octets.every((b, i) => o[i] === b);
  const ascii = (d: number, s: string) => [...s].every((c, i) => o[d + i] === c.charCodeAt(0));
  switch (ext) {
    case "pdf": return ascii(0, "%PDF");
    case "jpg": case "jpeg": return debut(0xff, 0xd8, 0xff);
    case "png": return debut(0x89, 0x50, 0x4e, 0x47);
    case "webp": return ascii(0, "RIFF") && ascii(8, "WEBP");
    case "heic": case "heif": return ascii(4, "ftyp");
    case "docx": case "xlsx": case "odt": case "ods": return debut(0x50, 0x4b, 0x03, 0x04);
    case "doc": case "xls": return debut(0xd0, 0xcf, 0x11, 0xe0);
    default: return false;
  }
}
