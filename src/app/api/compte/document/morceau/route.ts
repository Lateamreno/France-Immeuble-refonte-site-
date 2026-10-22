import { NextResponse } from "next/server";
import { deposerObjet, extension, FORMATS, TAILLE_MORCEAU } from "@/lib/compte/stockage";
import { exigerCompte, refus, UUID } from "@/lib/compte/requete";

export const runtime = "nodejs";

/**
 * Un morceau d'au plus 4 Mo : une fonction Vercel n'accepte pas un corps de
 * plus de 4,5 Mo, et une pièce peut en faire 25. Les morceaux sont rangés
 * sous `<compte>/morceaux/<dépôt>/`, toujours sous la clé du compte connecté :
 * le chemin est construit ici, jamais reçu du navigateur.
 */
export async function PUT(req: Request) {
  const s = await exigerCompte(req);
  if (s instanceof NextResponse) return s;
  const url = new URL(req.url);
  const depot = url.searchParams.get("depot") ?? "";
  const n = Number(url.searchParams.get("n"));
  const nom = url.searchParams.get("nom") ?? "";
  const type = FORMATS[extension(nom)];
  if (!UUID.test(depot) || !Number.isInteger(n) || n < 0 || n > 6 || !type) {
    return refus("Morceau illisible.", 422);
  }
  const corps = new Uint8Array(await req.arrayBuffer());
  if (corps.byteLength === 0 || corps.byteLength > TAILLE_MORCEAU) return refus("Morceau trop gros.", 413);
  try {
    await deposerObjet(`${s.utilisateur.id}/morceaux/${depot}/${n}`, corps, type);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pièces] morceau non déposé —", e);
    return refus("Envoi interrompu. Réessayez.", 503);
  }
}
