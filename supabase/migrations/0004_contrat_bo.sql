-- 0004 — Contrat site ↔ BO validé par MAV le 21/10/2026.
--
-- Le contrat de référence est versionné dans le dépôt du BO (docs/CONTRAT-SITE.md).
-- Cette migration en porte la part qui touche la base DU SITE :
--
-- 1. biens_a_vendre : le slug est généré et figé par la base, comme pour les
--    ventes. Le BO n'a plus à l'inventer.
-- 2. ventes.rue : MAV a décidé d'afficher la rue SANS le numéro
--    (« rue des Bas-Fossés »). Elle vit dans son propre champ ; le contrôle
--    d'anonymat sur titre, chapô, composition et récit reste en place. La base
--    refuse une rue qui contient un chiffre.
-- 3. offmarket : le nombre d'immeubles off-market par commune, remplacé en
--    entier par le BO à 9 h et 19 h. Ni type, ni lots, ni prix.
--
-- Rejouable sans risque.

-- 1 --------------------------------------------------------------------------
create or replace function public.biens_slug()
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
    base := 'immeuble-de-rapport-' || public.slugifier(new.ville) || '-' || new.dept;
    new.slug := base;
    while exists (select 1 from public.biens_a_vendre where slug = new.slug and id <> new.id) loop
      n := n + 1;
      new.slug := base || '-' || n;
    end loop;
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'biens_slug') then
    create trigger biens_slug before insert or update on public.biens_a_vendre
      for each row execute function public.biens_slug();
  end if;
end $$;

-- 2 --------------------------------------------------------------------------
alter table public.ventes
  add column if not exists rue text check (rue is null or rue !~ '[0-9]');

-- 3 --------------------------------------------------------------------------
create table if not exists public.offmarket (
  commune        text not null,
  dept           text not null,
  -- Paris, Lyon, Marseille : « 18e arrondissement ». Ailleurs : null.
  arrondissement text,
  nombre         integer not null check (nombre > 0),
  maj_le         timestamptz not null default now()
);
create unique index if not exists offmarket_lieu_idx
  on public.offmarket (dept, commune, coalesce(arrondissement, ''));
alter table public.offmarket enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'offmarket' and policyname = 'lecture publique') then
    create policy "lecture publique" on public.offmarket
      for select to anon, authenticated using (true);
  end if;
end $$;

-- Remplacement en un seul geste. Un DELETE puis un INSERT séparés laisseraient
-- la page vide (« 0 immeuble off-market ») le temps du dépôt. Appelée par le
-- BO avec la clé secrète :
--   POST /rest/v1/rpc/remplacer_offmarket  {"lignes":[{"commune":…,"dept":…,
--   "arrondissement":null,"nombre":2}, …]}
-- Personne d'autre ne peut l'exécuter.
create or replace function public.remplacer_offmarket(lignes jsonb)
returns integer language plpgsql set search_path = '' as $$
declare
  n integer;
begin
  delete from public.offmarket where true;
  insert into public.offmarket (commune, dept, arrondissement, nombre)
    select l->>'commune', l->>'dept', nullif(l->>'arrondissement', ''), (l->>'nombre')::integer
    from jsonb_array_elements(lignes) as l;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.remplacer_offmarket(jsonb) from public, anon, authenticated;
