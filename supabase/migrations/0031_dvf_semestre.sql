-- MAV, 23/11/2026 : « vois si t'as pas les données du premier semestre 2026 pour les ajouter ». L'État
-- publie DVF deux fois par an ; le premier semestre 2026 est paru le 12/10/2026 dans le fichier brut
-- (valeursfoncieres-2026-s1), pas encore dans la version géolocalisée que lit la tâche mensuelle.
-- Ces deux tables portent une année incomplète, à part des tables de l'année entière : les pages qui
-- publient « en {année} » ne les lisent pas par erreur. Mêmes colonnes, plus les mois couverts.
-- Remplacées par l'année entière quand la tâche mensuelle la trouvera (elle efface alors ces lignes).
create table if not exists public.marche_immeubles_semestre (
  code_insee text not null,
  annee int not null,
  -- Mois couverts depuis janvier (6 : premier semestre).
  mois int not null,
  nb_ventes int,
  prix_m2_median numeric,
  prix_m2_bas numeric,
  prix_m2_haut numeric,
  prix_median numeric,
  surface_mediane numeric,
  appart_nb_ventes int,
  appart_prix_m2_median numeric,
  maj_le timestamptz not null default now(),
  primary key (code_insee, annee, mois)
);
alter table public.marche_immeubles_semestre enable row level security;
drop policy if exists "lecture publique" on public.marche_immeubles_semestre;
create policy "lecture publique" on public.marche_immeubles_semestre for select to anon, authenticated using (true);

create table if not exists public.ventes_immeubles_dvf_semestre (like public.ventes_immeubles_dvf including defaults);
alter table public.ventes_immeubles_dvf_semestre add primary key (id);
alter table public.ventes_immeubles_dvf_semestre add column if not exists mois int not null default 6;
alter table public.ventes_immeubles_dvf_semestre enable row level security;
drop policy if exists "lecture publique" on public.ventes_immeubles_dvf_semestre;
create policy "lecture publique" on public.ventes_immeubles_dvf_semestre for select to anon, authenticated using (true);
