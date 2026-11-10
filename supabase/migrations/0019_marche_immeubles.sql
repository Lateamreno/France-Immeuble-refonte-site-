-- Lot 100 (MAV, 10/11/2026) : les ventes d'immeubles entiers repérées dans DVF, par commune
-- (arrondissements de Paris compris), pour les pages Paris et communes. Données publiques
-- (DVF, data.gouv.fr), recalculées chaque mois par /api/marche/immeubles/. Rien de personnel :
-- un nombre de ventes et des médianes.
create table if not exists public.marche_immeubles (
  code_insee text not null,
  annee int not null,
  nb_ventes int not null,
  prix_m2_median numeric,
  prix_median numeric,
  surface_mediane numeric,
  maj_le timestamptz not null default now(),
  primary key (code_insee, annee)
);
alter table public.marche_immeubles enable row level security;
drop policy if exists "lecture publique" on public.marche_immeubles;
create policy "lecture publique" on public.marche_immeubles for select to anon, authenticated using (true);
grant select on public.marche_immeubles to anon, authenticated;
