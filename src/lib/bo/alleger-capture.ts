/**
 * Allège une capture avant l'envoi d'un retour (04/11/2026). Une capture d'écran
 * collée pèse souvent plus de 1 Mo en PNG, et l'envoi d'un retour passe par une
 * action serveur limitée en taille : le retour partait en erreur (React #441).
 * L'image est ramenée à 1 800 px de large au plus et réencodée en WebP, ce qui
 * la garde lisible pour quelques centaines de Ko. Une image déjà légère part
 * telle quelle ; si le navigateur ne sait pas réencoder, l'original part.
 */
const LARGEUR_MAX = 1800;
const POIDS_LEGER = 350 * 1024;

export async function allegerCapture(f: File): Promise<File> {
  if (!f.type.startsWith("image/") || f.type === "image/svg+xml") return f;
  try {
    const bmp = await createImageBitmap(f);
    const echelle = Math.min(1, LARGEUR_MAX / bmp.width);
    if (echelle === 1 && f.size <= POIDS_LEGER) { bmp.close(); return f; }
    const w = Math.round(bmp.width * echelle), h = Math.round(bmp.height * echelle);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bmp.close(); return f; }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", 0.85));
    if (!blob || blob.size >= f.size) return f;
    const nom = (f.name || "capture").replace(/\.[a-z0-9]+$/i, "") + ".webp";
    return new File([blob], nom, { type: "image/webp" });
  } catch {
    return f;
  }
}

export const allegerCaptures = (fs: File[]) => Promise.all(fs.map(allegerCapture));
