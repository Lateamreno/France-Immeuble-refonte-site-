-- 0007 — Les chiffres affichés sur le site viennent du BO (MAV, 22/10/2026).
--
-- Le BO les dépose deux fois par jour, à 9 h et 19 h, en même temps que la
-- table `offmarket` : upsert sur `cle`. Le site les lit avec la clé publiable
-- et garde ses dernières valeurs connues si la table est vide.
--
-- Clés attendues aujourd'hui :
--   investisseurs            acquéreurs dans le fichier (tous profils)
--   recherches_patrimonial   recherches actives, profil Patrimonial
--   recherches_investisseur  recherches actives, profil Investisseur
--   recherches_marchand      recherches actives, profil Marchand de biens
--   recherches_promoteur     recherches actives, profil Promoteur
-- Une clé inconnue du site est simplement ignorée.
--
-- Rejouable sans risque.
create table if not exists public.chiffres (
  cle     text primary key check (cle ~ '^[a-z_]+$'),
  valeur  numeric not null check (valeur >= 0),
  maj_le  timestamptz not null default now()
);
alter table public.chiffres enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'chiffres' and policyname = 'lecture publique') then
    create policy "lecture publique" on public.chiffres
      for select to anon, authenticated using (true);
  end if;
end $$;
