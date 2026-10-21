-- 0006 — Surface exacte des ventes (décision de MAV du 21/10/2026).
--
-- MAV préfère la surface au m² près à la tranche de 100 m². `surface_min` et
-- `surface_max` restent pour les ventes que le BO dépose encore en tranche ;
-- le site affiche `surface` dès qu'elle est renseignée.
--
-- Rejouable sans risque.
alter table public.ventes
  add column if not exists surface numeric check (surface is null or surface > 0);
