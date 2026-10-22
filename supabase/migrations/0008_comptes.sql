-- 0008 — Le compte client et les pièces du propriétaire.
--
-- Contrat BO (docs/CONTRAT-SITE.md du dépôt du BO), §9.5, §10.4 et §10.5,
-- lots 4 et 5 validés par MAV le 22/10/2026.
--
-- Le compte est un utilisateur de Supabase Auth DU SITE : `compte` est son
-- identifiant (auth.users.id), le même UUID que le site envoie au BO.
--
-- Règles d'accès, posées par la base et non par le code :
--   - lecture : le seul titulaire du compte (compte = auth.uid()) ;
--   - écriture : la clé secrète du site, que détient le BO pour ses dépôts.
--     Aucune politique d'écriture : ni la clé publiable ni un compte connecté
--     ne peuvent écrire, seule la clé secrète (qui contourne la RLS) le peut.
-- Les lignes d'un compte disparaissent avec lui (on delete cascade).
--
-- Clés neutres : `cle` est un UUID tiré par le BO, jamais un identifiant du BO.
--
-- Rejouable sans risque.

-- §9.5 -----------------------------------------------------------------------
create table if not exists public.compte_recherches (
  compte         uuid not null references auth.users(id) on delete cascade,
  cle            uuid not null,
  cible          text,
  departements   text[] not null default '{}',
  villes         text[] not null default '{}',
  prix_min       numeric,
  prix_max       numeric,
  rendement_min  numeric,
  destinations   text[] not null default '{}',
  commentaire    text,
  maj_le         timestamptz not null default now(),
  primary key (compte, cle)
);

create table if not exists public.compte_propositions (
  compte      uuid not null references auth.users(id) on delete cascade,
  cle         uuid not null,
  bien        text,                    -- id de biens_a_vendre si le bien est en ligne
  commune     text,
  dept        text,
  type        text,
  lots        integer,
  prix        numeric,
  rendement   numeric,
  propose_le  timestamptz,
  reponse     text check (reponse in ('interesse', 'visite', 'pas_pour_moi')),
  repondu_le  timestamptz,
  etat        text not null default 'disponible'
              check (etat in ('disponible', 'sous_offre', 'vendu', 'retire')),
  maj_le      timestamptz not null default now(),
  primary key (compte, cle)
);

create table if not exists public.compte_demandes (
  compte      uuid not null references auth.users(id) on delete cascade,
  cle         uuid not null,
  bien        text,
  titre       text,
  etat        text not null default 'en_attente'
              check (etat in ('en_attente', 'dossier_envoye', 'close')),
  demande_le  timestamptz,
  maj_le      timestamptz not null default now(),
  primary key (compte, cle)
);

create table if not exists public.compte_biens (
  compte      uuid not null references auth.users(id) on delete cascade,
  cle         uuid not null,
  commune     text,
  dept        text,
  type        text,
  lots        integer,
  etape       text,                    -- estimation, mandat signé, en commercialisation, sous offre, vendu
  prix        numeric,
  sollicites  integer,
  visites     integer,
  offres      integer,
  bien        text,                    -- id de biens_a_vendre si le bien est en ligne
  maj_le      timestamptz not null default now(),
  primary key (compte, cle)
);

create table if not exists public.compte_estimations (
  compte      uuid not null references auth.users(id) on delete cascade,
  cle         uuid not null,
  bien_cle    uuid,                    -- cle de compte_biens
  valeur      numeric,
  prix_m2     numeric,
  rendement   numeric,
  estimee_le  timestamptz,
  primary key (compte, cle)
);

-- §10.4 ----------------------------------------------------------------------
create table if not exists public.compte_documents (
  compte     uuid not null references auth.users(id) on delete cascade,
  cle        uuid not null,
  bien_cle   uuid,                     -- cle de compte_biens
  categorie  text not null
             check (categorie in ('titre', 'baux', 'diagnostics', 'taxe', 'charges', 'autre')),
  nom        text not null,
  recu_le    timestamptz not null default now(),
  primary key (compte, cle)
);

-- Accès ----------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['compte_recherches', 'compte_propositions', 'compte_demandes',
                           'compte_biens', 'compte_estimations', 'compte_documents'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke all on public.%I from authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    if not exists (select 1 from pg_policies where tablename = t and policyname = 'lecture par le titulaire') then
      execute format(
        'create policy "lecture par le titulaire" on public.%I for select to authenticated using (compte = (select auth.uid()))',
        t);
    end if;
  end loop;
end $$;

-- §10.5 : le seau privé des pièces déposées ----------------------------------
-- Aucune politique sur storage.objects pour ce seau : ni lecture publique, ni
-- lecture ou écriture par un compte connecté. Seule la route du site (clé
-- secrète) y écrit, sous `<compte>/`, et le BO y lit puis efface.
-- 25 Mo par fichier, formats du §10.2.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'depots-proprietaires', 'depots-proprietaires', false, 26214400,
  array[
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
