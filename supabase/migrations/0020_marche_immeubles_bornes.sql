-- Lot 107 (MAV, 12/11/2026, retour #303) : le moins cher et le plus cher au m² des ventes
-- d'immeubles retenues, à côté de la médiane, pour le tableau des arrondissements de Paris.
alter table public.marche_immeubles add column if not exists prix_m2_min numeric;
alter table public.marche_immeubles add column if not exists prix_m2_max numeric;
