-- Lot 135 (MAV, 16/11/2026 : « ok pour […] années de construction »). L'année de construction du plus haut
-- bâtiment de la parcelle (BD TOPO de l'IGN, `date_d_apparition`, souvent arrondie à la décennie), gardée
-- seulement quand ses niveaux le sont (trois au moins). Écrite par la tâche mensuelle /api/marche/ventes/.
alter table public.ventes_immeubles_dvf add column if not exists annee_construction smallint;
