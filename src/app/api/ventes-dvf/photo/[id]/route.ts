import sharp from "sharp";
import { API_PANORAMAX } from "@/lib/panoramax";

/**
 * La photo de façade d'une vente d'immeuble (lot 125), servie depuis notre domaine : une photo de rue
 * Panoramax (licence libre, auteur cité sous la photo), cadrée sur l'immeuble. Une photo à 360° est
 * découpée dans la direction de l'immeuble (`cap`, en degrés) ; une photo ordinaire est servie entière.
 * Mise en cache un an : une photo Panoramax ne change pas.
 */
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Largeur de la vue découpée dans une photo à 360°, en degrés. */
const CHAMP = 80;

/**
 * Le bas de la photo flouté en fondu : le rez-de-chaussée, où se lisent le numéro de l'immeuble,
 * les enseignes des commerces et les passants (MAV, 15/11/2026 : « au pire on modifie la photo […]
 * avec filigrane ou floutage »). La page ne montre que la rue, sans numéro.
 */
async function flouterLeBas(net: Buffer): Promise<Buffer> {
  const { width = 800, height = 600 } = await sharp(net).metadata();
  const masque = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="0.66" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  const flou = await sharp(net).blur(16).ensureAlpha().composite([{ input: masque, blend: "dest-in" }]).png().toBuffer();
  return sharp(net).composite([{ input: flou }]).webp({ quality: 72 }).toBuffer();
}

type Item = { assets?: Record<string, { href?: string }>; properties?: Record<string, unknown> };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const capBrut = Number(new URL(req.url).searchParams.get("cap"));
  if (!UUID.test(id) || !Number.isFinite(capBrut) || capBrut < 0 || capBrut >= 360) return new Response(null, { status: 404 });
  try {
    const r = await fetch(`${API_PANORAMAX}/search?ids=${id}&limit=1`, { signal: AbortSignal.timeout(10_000) });
    if (!r.ok) return new Response(null, { status: 502 });
    const item = ((await r.json()) as { features?: Item[] }).features?.[0];
    const p = item?.properties ?? {};
    const champPhoto = Number((p["pers:interior_orientation"] as { field_of_view?: number } | undefined)?.field_of_view ?? 0);
    const panorama = champPhoto >= 360;
    const src = panorama ? item?.assets?.hd?.href : (item?.assets?.sd?.href ?? item?.assets?.hd?.href);
    if (!src || !/^https:\/\/[a-z0-9.-]+\//.test(src)) return new Response(null, { status: 404 });
    const img = Buffer.from(await (await fetch(src, { signal: AbortSignal.timeout(20_000) })).arrayBuffer());
    let sortie: Buffer;
    if (panorama) {
      const { width = 0, height = 0 } = await sharp(img).metadata();
      if (!width || !height) return new Response(null, { status: 404 });
      // Le centre de l'image regarde dans la direction de prise de vue (`view:azimuth`).
      const azimut = Number(p["view:azimuth"] ?? 0);
      const ecart = ((capBrut - azimut + 540) % 360) - 180;
      const largeur = Math.round((width * CHAMP) / 360);
      const centre = Math.round(width / 2 + (ecart / 360) * width);
      // Les étages, pas la rue : la vue s'arrête juste sous l'horizon, au-dessus des portes, pour ne
      // pas montrer le numéro de l'immeuble (la page n'affiche que la rue, sans numéro).
      const haut = Math.round(height * 0.1);
      const hauteur = Math.round(height * 0.37);
      // Une vue à cheval sur le bord de l'image : on accole l'image à elle-même.
      const double = await sharp({ create: { width: width * 2, height, channels: 3, background: "#000" } })
        .composite([{ input: img, left: 0, top: 0 }, { input: img, left: width, top: 0 }])
        .jpeg()
        .toBuffer();
      const gauche = (((centre - largeur / 2) % width) + width) % width;
      sortie = await flouterLeBas(await sharp(double).extract({ left: Math.round(gauche), top: haut, width: largeur, height: hauteur }).resize({ width: 800 }).toBuffer());
    } else {
      sortie = await flouterLeBas(await sharp(img).resize({ width: 800, withoutEnlargement: true }).toBuffer());
    }
    return new Response(new Uint8Array(sortie), {
      headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable" },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
