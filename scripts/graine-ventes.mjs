/* Graine des ventes et fichier SQL à coller dans le projet Supabase du site.

   1. Attribue à chaque vente de `content/ventes.json` son slug — l'URL de sa
      fiche, /immeubles-vendus/<slug>/. Un slug déjà attribué n'est JAMAIS
      recalculé : une URL indexée ne change plus (CLAUDE.md §10).
   2. Régénère `supabase/seed/ventes.sql`.
   3. Assemble `supabase/A-COLLER-SITE.sql` : migrations 0002 et suivantes,
      puis la graine. Tout est rejouable.

   Règle de slug, identique au déclencheur `ventes_slug` (migration 0005) :
   immeuble-de-rapport-<commune>, puis -2, -3… par ordre chronologique. Pas
   d'année : MAV ne veut aucune date de vente affichée, URL comprise
   (retour du 21/10/2026). `ancienSlug` garde l'adresse à l'année des 44
   premières fiches, redirigée vers la nouvelle.

   Usage : node scripts/graine-ventes.mjs */
import fs from 'node:fs/promises';

const JSON_VENTES = 'content/ventes.json';
const ventes = JSON.parse(await fs.readFile(JSON_VENTES, 'utf8'));

const slugifier = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/œ/gi, 'oe').replace(/æ/gi, 'ae')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const pris = new Set(ventes.filter((v) => v.slug).map((v) => v.slug));
const chrono = ventes.slice().sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
for (const v of chrono) {
  if (v.slug) continue;
  const base = `immeuble-de-rapport-${slugifier(v.ville)}`;
  let s = base, n = 1;
  while (pris.has(s)) s = `${base}-${++n}`;
  v.slug = s;
  pris.add(s);
}
await fs.writeFile(JSON_VENTES, JSON.stringify(ventes, null, 2) + '\n');

const q = (x) => (x === null || x === undefined ? 'null' : `'${String(x).replace(/'/g, "''")}'`);
const lignes = ventes.map((v) =>
  `  (${q(v.id)}, ${q(v.slug)}, ${q(v.ville)}, ${q(v.dept)}, ${v.prix}, ${q(v.date)}, ${q(v.region)}, ${q(v.image)})`);

const graine = `-- Graine : les ${ventes.length} ventes publiées, déposées une fois à la main.
--
-- Générée par \`scripts/graine-ventes.mjs\` depuis \`content/ventes.json\`, lui-même
-- produit par \`scripts/import-ventes.mjs\` à partir de données déjà publiques.
-- Commune, département, prix, date, photo, slug — jamais la rue.
--
-- Rejouable sans risque : un identifiant déjà présent est mis à jour, pas
-- dupliqué, et son slug ne bouge pas (déclencheur \`ventes_slug\`). Les faits et
-- les récits, eux, viendront du BO : la graine ne les touche pas.
insert into public.ventes (id, slug, ville, dept, prix, date, region, image) values
${lignes.join(',\n')}
on conflict (id) do update set
  slug = excluded.slug, ville = excluded.ville, dept = excluded.dept, prix = excluded.prix,
  date = excluded.date, region = excluded.region, image = excluded.image,
  depose_le = now();
`;
await fs.writeFile('supabase/seed/ventes.sql', graine);

// Toutes les migrations à partir de 0002 (0001 est appliquée à part).
const noms = (await fs.readdir('supabase/migrations')).filter((f) => /^\d{4}_.*\.sql$/.test(f) && f >= '0002').sort();
const migrations = await Promise.all(noms.map((f) => fs.readFile(`supabase/migrations/${f}`, 'utf8')));
const coller = `-- ============================================================================
-- À COLLER EN UNE FOIS dans l'éditeur SQL du projet « France Immeuble site ».
-- les migrations ${noms.map((f) => f.slice(0, 4)).join(', ')}, puis les ${ventes.length} ventes. Rejouable sans risque : si une version précédente a
-- déjà été collée, recoller celle-ci ne casse ni ne duplique rien.
-- Fichier généré par scripts/graine-ventes.mjs — ne pas l'éditer à la main.
-- ============================================================================

${migrations.map((m) => m.trim()).join('\n\n')}

${graine.trim()}
`;
await fs.writeFile('supabase/A-COLLER-SITE.sql', coller);
console.log(`${ventes.length} ventes, ${pris.size} slugs, A-COLLER-SITE.sql écrit`);
