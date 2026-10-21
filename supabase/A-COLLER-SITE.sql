-- ============================================================================
-- À COLLER EN UNE FOIS dans l'éditeur SQL du projet « France Immeuble site ».
-- 1) les tables (0002), 2) les fiches de vente et leurs récits (0003),
-- 3) les 44 ventes. Rejouable sans risque : si une version précédente a
-- déjà été collée, recoller celle-ci ne casse ni ne duplique rien.
-- Fichier généré par scripts/graine-ventes.mjs — ne pas l'éditer à la main.
-- ============================================================================

-- 0002 — Les projections que le BO dépose, et la file d'attente des leads.
--
-- CLAUDE.md §2 : le site ne lit jamais le CRM. Le BO DÉPOSE ici une copie
-- appauvrie ; le site lit cette copie et rien d'autre.
--
-- Schéma `public` et non `web` comme l'écrit le §2 : servir un second schéma
-- par l'API demande de l'ajouter aux « exposed schemas » dans le tableau de bord,
-- une étape manuelle de plus et un réglage qu'une migration ne versionne pas. Les
-- noms de table portent le rôle à la place du préfixe.
--
-- Test de validation du §2 : si un attaquant aspire toute cette base, il obtient
-- des ventes déjà affichées sur le site, des annonces déjà publiques, et une file
-- de leads vide en temps normal (purgée dès transmission). Rien qu'il ne pouvait
-- lire en visitant le site — à la file près, protégée par la RLS.

-- ---------------------------------------------------------------------------
-- Ventes réalisées. Commune, département, prix, date, photo. JAMAIS la rue.
-- ---------------------------------------------------------------------------
create table if not exists public.ventes (
  id          text primary key,              -- _id de bo_vente
  ville       text not null,
  dept        text not null,
  prix        numeric not null check (prix > 0),
  date        date not null,
  region      text not null default 'autre'
              check (region in ('idf', 'sud-ouest', 'autre')),
  -- Chemin dans le bucket public `ventes` de CE projet, renommé sur un
  -- identifiant neutre : les noms d'origine portent parfois l'adresse.
  image       text,
  depose_le   timestamptz not null default now()
);
create index if not exists ventes_date_idx on public.ventes (date desc);

-- ---------------------------------------------------------------------------
-- Biens à vendre. Le BO y dépose EXACTEMENT ce que son pont envoie déjà à
-- PleinBail — les fiches `bo_immeuble` au statut « 6 - Commercialisé (all) »
-- retenues par ce pont — sauf si la case « France Immeuble » est décochée.
-- Même jeu d'informations que PleinBail, et comme PleinBail : PAS d'adresse,
-- PAS de coordonnées GPS.
-- ---------------------------------------------------------------------------
create table if not exists public.biens_a_vendre (
  id                  text primary key,      -- _id de bo_immeuble (le pont PleinBail
                                             -- l'envoie sous la forme « FI:<id> »)
  slug                text not null unique,
  statut              text not null default 'en_vente'
                      check (statut in ('en_vente', 'sous_offre')),
  titre               text not null,
  description         text,
  ville               text not null,
  dept                text not null,
  type                text not null default 'Immeuble de rapport',
  surface             numeric,               -- m², comme sur PleinBail
  lots                integer,
  annee_construction  integer,
  loyer_hc_an         numeric,
  prix_hai            numeric not null check (prix_hai > 0),
  -- POURCENTAGES, pas fractions : 8,98 et non 0,0898 ; 100 et non 1.
  -- PleinBail stocke des fractions. Un rendement brut d'immeuble de rapport
  -- sous 1 % n'existe pas : la contrainte rejette donc bruyamment un dépôt
  -- resté en fraction, au lieu de laisser afficher « 0,09 % brut ».
  rendement           numeric check (rendement is null or rendement between 1 and 40),
  occupation          numeric check (occupation is null or occupation between 0 and 100),
  prix_m2             numeric,
  dpe                 text check (dpe is null or dpe in ('A','B','C','D','E','F','G')),
  travaux             text,                  -- travaux à prévoir, texte libre
  -- Chemins dans le bucket public `biens` de CE projet. Les noms de fichier
  -- sont neutres : ceux d'origine portent parfois l'adresse.
  images              text[] not null default '{}',
  publie_le           timestamptz not null default now(),
  maj_le              timestamptz not null default now()
);
create index if not exists biens_a_vendre_publie_idx on public.biens_a_vendre (publie_le desc);

-- ---------------------------------------------------------------------------
-- RLS : lecture publique des deux projections, et RIEN d'autre.
-- La clé publiable peut lire ; seule la clé secrète (le BO, via son dépôt)
-- peut écrire. Aucune policy INSERT/UPDATE/DELETE n'est créée.
-- ---------------------------------------------------------------------------
alter table public.ventes enable row level security;
alter table public.biens_a_vendre enable row level security;

drop policy if exists "lecture publique" on public.ventes;
create policy "lecture publique" on public.ventes
  for select to anon, authenticated using (true);

drop policy if exists "lecture publique" on public.biens_a_vendre;
create policy "lecture publique" on public.biens_a_vendre
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- File d'attente des leads (§2) : si le BO ne répond pas, le lead attend ici,
-- avec réessai, et il est SUPPRIMÉ dès transmission. On ne perd jamais un lead.
-- Données personnelles : RLS activée et AUCUNE policy. Seule la clé secrète,
-- côté serveur, y accède.
-- ---------------------------------------------------------------------------
create table if not exists public.leads_outbox (
  id               bigint generated by default as identity primary key,
  ref              uuid not null unique,     -- idempotence : un réessai ne duplique pas
  type             text not null check (type in ('estimation', 'recherche', 'contact')),
  payload          jsonb not null,
  tentatives       integer not null default 0,
  derniere_erreur  text,
  cree_le          timestamptz not null default now(),
  prochain_essai   timestamptz not null default now()
);
create index if not exists leads_outbox_essai_idx on public.leads_outbox (prochain_essai);
alter table public.leads_outbox enable row level security;

-- ---------------------------------------------------------------------------
-- Coffres des photos : `ventes` (biens vendus) et `biens` (biens à vendre).
-- PUBLICS en lecture : ces images sont affichées sur le site, servies par
-- /_next/image sur notre domaine. Les captures de recette restent dans
-- `bo-files`, privé.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('ventes', 'ventes', true), ('biens', 'biens', true)
on conflict (id) do nothing;

-- 0003 — Une fiche par vente, et le récit qui la raconte.
--
-- Chaque vente devient une page : /immeubles-vendus/<slug>/. Le BO y dépose,
-- en plus de la commune, du prix et de la date, les faits de la vente (type,
-- lots, occupation, rendement, profil de l'acquéreur, déroulé de la
-- commercialisation) et un récit rédigé à partir de ces faits.
--
-- Deux règles portées par la base, pas par la bonne volonté :
--
-- 1. RELECTURE HUMAINE (CLAUDE.md §8). Un récit ne peut exister sans date de
--    validation. Le BO génère un brouillon ; il ne le dépose qu'après la
--    validation de MAV. Le site n'indexe une fiche que si son récit est validé.
--
-- 2. ANONYMAT (§2). Commune, arrondissement, fourchettes : jamais la rue. Un
--    récit qui contient « rue Victor-Hugo » ou « 92100 Boulogne » est REJETÉ
--    par la base, et le BO affiche le rejet au lieu de publier.
--
-- Rejouable sans risque.

alter table public.ventes
  add column if not exists slug                 text,
  add column if not exists titre                text,
  add column if not exists type                 text,
  -- Paris, Lyon, Marseille : « 18e arrondissement ». Ailleurs : null.
  add column if not exists arrondissement       text,
  add column if not exists lots                 integer check (lots is null or lots between 1 and 500),
  -- « 6 appartements et 2 commerces en pied d'immeuble »
  add column if not exists composition          text,
  -- Fourchette arrondie par le BO (tranches de 100 m²), jamais la surface exacte.
  add column if not exists surface_min          integer,
  add column if not exists surface_max          integer,
  -- « fin XIXe », « années 1930 » — l'époque situe sans identifier.
  add column if not exists epoque               text,
  add column if not exists dpe                  text check (dpe is null or dpe in ('A','B','C','D','E','F','G')),
  -- POURCENTAGES, pas fractions (même piège que biens_a_vendre).
  add column if not exists occupation           numeric check (occupation is null or occupation between 0 and 100),
  add column if not exists rendement            numeric check (rendement is null or rendement between 1 and 40),
  add column if not exists profil_acquereur     text check (profil_acquereur is null or profil_acquereur in
                                                  ('Investisseur', 'Marchand de biens', 'Patrimonial', 'Promoteur')),
  add column if not exists profil_vendeur       text check (profil_vendeur is null or profil_vendeur in
                                                  ('Particulier', 'Indivision', 'Société', 'Institutionnel')),
  -- 'off_market' : fichier d'acquéreurs seul · 'diffusion' : annonces · 'mixte'
  add column if not exists mode_commercialisation text check (mode_commercialisation is null or
                                                  mode_commercialisation in ('off_market', 'diffusion', 'mixte')),
  -- Signature du mandat → signature du compromis.
  add column if not exists delai_semaines       integer check (delai_semaines is null or delai_semaines between 0 and 260),
  add column if not exists acquereurs_sollicites integer check (acquereurs_sollicites is null or acquereurs_sollicites >= 0),
  add column if not exists visites              integer check (visites is null or visites >= 0),
  add column if not exists offres               integer check (offres is null or offres >= 0),
  add column if not exists chapo                text,
  add column if not exists recit                text,
  add column if not exists seo_title            text check (seo_title is null or char_length(seo_title) <= 70),
  add column if not exists seo_desc             text check (seo_desc is null or char_length(seo_desc) <= 170),
  add column if not exists recit_valide_le      timestamptz;

do $$
begin
  -- Pas de récit sans relecture humaine.
  if not exists (select 1 from pg_constraint where conname = 'ventes_recit_valide') then
    alter table public.ventes add constraint ventes_recit_valide
      check (recit is null or recit_valide_le is not null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ventes_surface_ordre') then
    alter table public.ventes add constraint ventes_surface_ordre
      check (surface_min is null or surface_max is null or surface_min < surface_max);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Garde-fou d'anonymat. Refuse dans les textes publiés :
--   • un type de voie suivi d'un nom propre (« rue Victor-Hugo », « Avenue
--     de la République ») — une majuscule suivie d'une minuscule, pour laisser
--     passer « le passage du DPE de F à D » ;
--   • un code postal suivi d'une commune (« 92100 Boulogne »).
-- « une place de parking » ou « 48 000 € de loyer » passent.
-- ---------------------------------------------------------------------------
create or replace function public.texte_sans_adresse(t text)
returns boolean language sql immutable set search_path = '' as $$
  select t is null or not (
    t ~ '(^|[^[:alpha:]])([Rr]ue|[Aa]venue|[Bb]oulevard|[Bb]d|[Ii]mpasse|[Aa]ll[ée]e|[Pp]lace|[Qq]uai|[Cc]hemin|[Cc]ours|[Pp]assage|[Ss]quare|[Vv]illa|[Rr]oute|[Ss]entier|[Cc]it[ée])\s+(de\s+la\s+|de\s+l[''’]|du\s+|des\s+|de\s+|d[''’])?[[:upper:]][[:lower:]]'
    or t ~ '(^|[^0-9])[0-9]{5}\s+[[:upper:]]'
  );
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ventes_sans_adresse') then
    alter table public.ventes add constraint ventes_sans_adresse check (
      public.texte_sans_adresse(titre) and public.texte_sans_adresse(chapo)
      and public.texte_sans_adresse(recit) and public.texte_sans_adresse(composition)
      and public.texte_sans_adresse(seo_title) and public.texte_sans_adresse(seo_desc)
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Slug : l'URL de la fiche. Généré par la base si le BO n'en envoie pas, et
-- FIGÉ ensuite — changer une URL indexée fait perdre son trafic (§10).
-- Forme : immeuble-de-rapport-<commune>-<année>, suffixe -2, -3… si besoin.
-- Les 44 ventes de départ reçoivent leur slug par la graine, calculé par la
-- même règle que le repli du site (src/lib/biens.ts).
-- ---------------------------------------------------------------------------
create or replace function public.slugifier(t text)
returns text language sql immutable set search_path = '' as $$
  select trim(both '-' from regexp_replace(
    lower(translate(t,
      'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖòóôõöÙÚÛÜùúûüÝýÿŒœÆæ',
      'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOoooooUUUUuuuuYyyOoAa')),
    '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.ventes_slug()
returns trigger language plpgsql set search_path = '' as $$
declare
  base text;
  n integer := 1;
begin
  if tg_op = 'UPDATE' and old.slug is not null then
    new.slug := old.slug;          -- une URL publiée ne change plus
    return new;
  end if;
  if new.slug is null or new.slug = '' then
    base := 'immeuble-de-rapport-' || public.slugifier(new.ville) || '-' || extract(year from new.date)::int;
    new.slug := base;
    while exists (select 1 from public.ventes where slug = new.slug and id <> new.id) loop
      n := n + 1;
      new.slug := base || '-' || n;
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists ventes_slug on public.ventes;
create trigger ventes_slug before insert or update on public.ventes
  for each row execute function public.ventes_slug();

create unique index if not exists ventes_slug_idx on public.ventes (slug);

-- Graine : les 44 ventes publiées, déposées une fois à la main.
--
-- Générée par `scripts/graine-ventes.mjs` depuis `content/ventes.json`, lui-même
-- produit par `scripts/import-ventes.mjs` à partir de données déjà publiques.
-- Commune, département, prix, date, photo, slug — jamais la rue.
--
-- Rejouable sans risque : un identifiant déjà présent est mis à jour, pas
-- dupliqué, et son slug ne bouge pas (déclencheur `ventes_slug`). Les faits et
-- les récits, eux, viendront du BO : la graine ne les touche pas.
insert into public.ventes (id, slug, ville, dept, prix, date, region, image) values
  ('1770399214615x503126108178184600', 'immeuble-de-rapport-drancy-2026', 'Drancy', '93', 1830000, '2026-01-29', 'idf', null),
  ('1759415257565x773122913575258200', 'immeuble-de-rapport-marseille-2025', 'Marseille', '13', 725000, '2025-09-02', 'autre', null),
  ('1728482821456x180769683730137800', 'immeuble-de-rapport-thourotte-2024', 'Thourotte', '60', 464000, '2024-10-03', 'autre', null),
  ('1714127809491x692275012323336600', 'immeuble-de-rapport-soisy-sous-montmorency-2024', 'Soisy-sous-Montmorency', '95', 1900000, '2024-04-25', 'idf', '/media/ventes/soisy-sous-montmorency-2024-04.webp'),
  ('1711556920318x713984127115866900', 'immeuble-de-rapport-la-ferte-sous-jouarre-2024', 'La Ferté-sous-Jouarre', '77', 295000, '2024-03-21', 'idf', '/media/ventes/la-ferte-sous-jouarre-2024-05.webp'),
  ('1702370829846x541047242733592640', 'immeuble-de-rapport-paris-2023-2', 'Paris', '75', 1178000, '2023-11-26', 'idf', '/media/ventes/paris-2023-06.webp'),
  ('1698394747161x661699532477846900', 'immeuble-de-rapport-caen-2023', 'Caen', '14', 550000, '2023-10-22', 'autre', '/media/ventes/caen-2023-07.webp'),
  ('1685957192123x986641831410547000', 'immeuble-de-rapport-hagondange-2023', 'Hagondange', '57', 2250000, '2023-06-01', 'autre', '/media/ventes/hagondange-2023-08.webp'),
  ('1680105387909x809076517670156700', 'immeuble-de-rapport-cormeilles-en-parisis-2023', 'Cormeilles-en-Parisis', '95', 1235000, '2023-03-23', 'idf', '/media/ventes/cormeilles-en-parisis-2023-09.webp'),
  ('1678328218598x686360348083279400', 'immeuble-de-rapport-paris-2023', 'Paris', '75', 2310000, '2023-01-22', 'idf', '/media/ventes/paris-2023-10.webp'),
  ('1678328220775x397464235204552100', 'immeuble-de-rapport-les-mureaux-2023', 'Les Mureaux', '78', 1430000, '2023-01-18', 'idf', '/media/ventes/les-mureaux-2023-11.webp'),
  ('1678328208630x406181873818593400', 'immeuble-de-rapport-tourcoing-2023', 'Tourcoing', '59', 200000, '2023-01-15', 'autre', '/media/ventes/tourcoing-2023-12.webp'),
  ('1678328156558x217930356502384670', 'immeuble-de-rapport-pontoise-2023', 'Pontoise', '95', 865000, '2023-01-15', 'idf', '/media/ventes/pontoise-2023-13.webp'),
  ('1678328210694x433456060422805250', 'immeuble-de-rapport-lille-2023', 'Lille', '59', 240000, '2023-01-15', 'autre', '/media/ventes/lille-2023-14.webp'),
  ('1678328216615x397498683920769700', 'immeuble-de-rapport-cognac-2023', 'Cognac', '16', 332000, '2023-01-11', 'sud-ouest', '/media/ventes/cognac-2023-15.webp'),
  ('1678328196542x189886248738439600', 'immeuble-de-rapport-conflans-sainte-honorine-2023', 'Conflans-Sainte-Honorine', '78', 1975000, '2023-01-04', 'idf', '/media/ventes/conflans-sainte-honorine-2023-16.webp'),
  ('1678328214676x307064430920134460', 'immeuble-de-rapport-marmande-2022', 'Marmande', '47', 1600000, '2022-12-11', 'sud-ouest', '/media/ventes/marmande-2022-17.webp'),
  ('1678328212633x941845906701144400', 'immeuble-de-rapport-bruyeres-sur-oise-2022', 'Bruyères-sur-Oise', '95', 3015000, '2022-11-29', 'idf', '/media/ventes/bruyeres-sur-oise-2022-18.webp'),
  ('1678328204638x982944469461879400', 'immeuble-de-rapport-juziers-2022', 'Juziers', '78', 830000, '2022-11-14', 'idf', '/media/ventes/juziers-2022-19.webp'),
  ('1678328222800x146136227420650370', 'immeuble-de-rapport-pierrelatte-2022', 'Pierrelatte', '26', 710000, '2022-10-26', 'autre', '/media/ventes/pierrelatte-2022-20.webp'),
  ('1678328206613x368151229353391300', 'immeuble-de-rapport-orsay-2022', 'Orsay', '91', 1580000, '2022-07-11', 'idf', '/media/ventes/orsay-2022-21.webp'),
  ('1678328200550x820712182429036000', 'immeuble-de-rapport-draveil-2022', 'Draveil', '91', 720000, '2022-06-29', 'idf', '/media/ventes/draveil-2022-22.webp'),
  ('1678328194517x780244101241242900', 'immeuble-de-rapport-migennes-2022', 'Migennes', '89', 285000, '2022-06-02', 'autre', '/media/ventes/migennes-2022-23.webp'),
  ('1678328180422x141215125878339180', 'immeuble-de-rapport-noisy-le-sec-2022', 'Noisy-le-Sec', '93', 709000, '2022-05-09', 'idf', '/media/ventes/noisy-le-sec-2022-24.webp'),
  ('1678328202592x757546018338103600', 'immeuble-de-rapport-bordeaux-2021-2', 'Bordeaux', '33', 1570000, '2021-12-30', 'sud-ouest', '/media/ventes/bordeaux-2021-25.webp'),
  ('1678328192498x544452858062463000', 'immeuble-de-rapport-vaux-sur-seine-2021', 'Vaux-sur-Seine', '78', 755000, '2021-12-13', 'idf', '/media/ventes/vaux-sur-seine-2021-26.webp'),
  ('1678328198556x862913882393084700', 'immeuble-de-rapport-antibes-2021', 'Antibes', '06', 1004000, '2021-11-25', 'autre', '/media/ventes/antibes-2021-27.webp'),
  ('1678328184432x692143576041660500', 'immeuble-de-rapport-asnieres-sur-seine-2021', 'Asnières-sur-Seine', '92', 1417500, '2021-11-04', 'idf', '/media/ventes/asnieres-sur-seine-2021-28.webp'),
  ('1678328188472x905252191757168300', 'immeuble-de-rapport-migennes-2021', 'Migennes', '89', 280000, '2021-09-07', 'autre', '/media/ventes/migennes-2021-29.webp'),
  ('1678328182476x572217439368344600', 'immeuble-de-rapport-chateau-renard-2021', 'Château-Renard', '45', 352500, '2021-06-24', 'autre', '/media/ventes/chateau-renard-2021-30.webp'),
  ('1678328176461x529546113349445700', 'immeuble-de-rapport-gisors-2021', 'Gisors', '27', 555000, '2021-06-02', 'autre', '/media/ventes/gisors-2021-31.webp'),
  ('1678328190479x429071181429240260', 'immeuble-de-rapport-chambly-2021-2', 'Chambly', '60', 619355, '2021-04-25', 'autre', '/media/ventes/chambly-2021-32.webp'),
  ('1678328166905x557672446525689500', 'immeuble-de-rapport-chambly-2021', 'Chambly', '60', 980645, '2021-04-25', 'autre', '/media/ventes/chambly-2021-33.webp'),
  ('1678328168648x348511001410339650', 'immeuble-de-rapport-bordeaux-2021', 'Bordeaux', '33', 745000, '2021-02-18', 'sud-ouest', '/media/ventes/bordeaux-2021-34.webp'),
  ('1678328174569x462154276188006200', 'immeuble-de-rapport-paris-2020-2', 'Paris', '75', 2750000, '2020-12-17', 'idf', '/media/ventes/paris-2020-35.webp'),
  ('1678328178447x303953828907493250', 'immeuble-de-rapport-paris-2020', 'Paris', '75', 6400000, '2020-12-15', 'idf', '/media/ventes/paris-2020-36.webp'),
  ('1678328172464x163864905569869760', 'immeuble-de-rapport-chateau-renard-2020', 'Château-Renard', '45', 110000, '2020-12-10', 'autre', '/media/ventes/chateau-renard-2020-37.webp'),
  ('1678328170488x579271156054734300', 'immeuble-de-rapport-laroche-saint-cydroine-2020', 'Laroche-Saint-Cydroine', '89', 350000, '2020-11-30', 'autre', '/media/ventes/laroche-saint-cydroine-2020-38.webp'),
  ('1678328186419x967772389178094200', 'immeuble-de-rapport-massy-2020', 'Massy', '91', 1960000, '2020-07-30', 'idf', '/media/ventes/massy-2020-39.webp'),
  ('1678328155594x968843847922484800', 'immeuble-de-rapport-spicheren-2020', 'Spicheren', '57', 560000, '2020-07-26', 'autre', '/media/ventes/spicheren-2020-40.webp'),
  ('1678328164576x723007967804778600', 'immeuble-de-rapport-pantin-2019', 'Pantin', '93', 2625000, '2019-10-22', 'idf', '/media/ventes/pantin-2019-41.webp'),
  ('1678328158503x904799243512276900', 'immeuble-de-rapport-thiais-2019', 'Thiais', '94', 550000, '2019-09-19', 'idf', '/media/ventes/thiais-2019-42.webp'),
  ('1678328162582x655370553263949600', 'immeuble-de-rapport-melun-2019', 'Melun', '77', 530000, '2019-09-18', 'idf', '/media/ventes/melun-2019-43.webp'),
  ('1678328160664x627874502867022700', 'immeuble-de-rapport-nevers-2019', 'Nevers', '58', 273000, '2019-09-18', 'autre', '/media/ventes/nevers-2019-44.webp')
on conflict (id) do update set
  slug = excluded.slug, ville = excluded.ville, dept = excluded.dept, prix = excluded.prix,
  date = excluded.date, region = excluded.region, image = excluded.image,
  depose_le = now();
