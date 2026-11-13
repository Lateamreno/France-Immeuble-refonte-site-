-- Lot 109 (MAV, 13/11/2026 : « il faut exclure les 25 % les plus chers et les 25 % les moins chers ») :
-- la fourchette du tableau des arrondissements laisse de côté le quart des ventes le moins cher et le
-- quart le plus cher. prix_m2_min et prix_m2_max restent : le moins cher et le plus cher de toutes les
-- ventes retenues.
alter table public.marche_immeubles add column if not exists prix_m2_bas numeric;
alter table public.marche_immeubles add column if not exists prix_m2_haut numeric;
