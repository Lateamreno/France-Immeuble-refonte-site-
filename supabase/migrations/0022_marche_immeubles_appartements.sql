-- Lot 110 (MAV, 13/11/2026 : « inclure la décote en pourcentage par rapport aux ventes
-- d'appartements ») : sur la ligne de chaque commune et de chaque année, les appartements vendus
-- seuls du même fichier DVF. Le nombre de ventes et le prix médian au m², publié à partir de
-- trente ventes. La page en tire la décote des immeubles vendus en bloc :
-- prix_m2_median ÷ appart_prix_m2_median − 1. Données publiques et agrégées, comme le reste de la
-- table ; la RLS de la migration 0019 (lecture seule) couvre les nouvelles colonnes.
alter table public.marche_immeubles add column if not exists appart_nb_ventes integer;
alter table public.marche_immeubles add column if not exists appart_prix_m2_median numeric;
