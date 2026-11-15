-- Lot 114 (MAV, 15/11/2026 : « pour le calcul du rendement 2023 et 2024 il faudra prendre en base
-- les loyers moyens de l'époque »). Le loyer de marché des appartements de l'année, à côté des ventes
-- d'immeubles de la même année : carte des loyers de l'État (ANIL, indicateurs de loyers d'annonce
-- par commune, édition de l'année), toutes tailles, charges comprises, en €/m² par mois. Pour la
-- ligne tout Paris (75056), moyenne des vingt arrondissements pondérée par le nombre d'annonces.
-- Données publiques ; la table reste en lecture seule pour le public (RLS de la migration 0019).
alter table public.marche_immeubles
  add column if not exists loyer_m2 numeric,
  add column if not exists loyer_millesime int;
