/* Export ponctuel des ventes publiees : le BO depose, le site ne lit jamais le
   CRM a l'execution. Ici je fais le depot a la main, une fois, pour des donnees
   deja publiques (l'iframe Bubble les affiche aujourd'hui).
   Les noms de fichiers d'origine portent parfois l'adresse exacte : tout est
   renomme sur un identifiant neutre. */
import fs from 'node:fs/promises';
import sharp from 'sharp';

const SRC = process.env.SRC, OUT = process.env.OUT, MEDIA = process.env.MEDIA;
const ventes = JSON.parse(await fs.readFile(SRC, 'utf8'));
await fs.mkdir(MEDIA, { recursive: true });

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const sortie = [];
let rate = 0;
for (const [i, v] of ventes.entries()) {
  const url = v.photo.startsWith('//') ? 'https:' + v.photo : v.photo;
  const annee = new Date(v.date).getUTCFullYear();
  const nom = `${slug(v.ville)}-${annee}-${String(i + 1).padStart(2, '0')}`;
  let image = null;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    await sharp(buf).rotate().resize(1200, 900, { fit: 'cover', position: 'centre' })
      .webp({ quality: 76 }).toFile(`${MEDIA}/${nom}.webp`);
    image = `/media/ventes/${nom}.webp`;
  } catch (e) {
    rate++; console.log(`  photo indisponible : ${v.ville} ${annee} — ${e.message}`);
  }
  sortie.push({
    id: v.id, ville: v.ville, dept: v.dept, prix: v.prix,
    date: v.date.slice(0, 10), annee,
    region: v.idf ? 'idf' : v.bordeaux ? 'sud-ouest' : 'autre',
    image,
  });
}
await fs.writeFile(OUT, JSON.stringify(sortie, null, 2) + '\n');
console.log(`${sortie.length} ventes ecrites, ${sortie.length - rate} photos reprises, ${rate} manquantes`);
