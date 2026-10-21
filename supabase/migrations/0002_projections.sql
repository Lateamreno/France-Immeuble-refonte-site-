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
