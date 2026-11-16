-- Lot 134 (MAV, 16/11/2026 : « tu peux ajouter le nombre d'étages dans la description si on l'a quelque part »).
-- Le nombre de niveaux de l'immeuble vendu : plus haut bâtiment de la BD TOPO de l'IGN (Licence ouverte)
-- posé sur les parcelles cadastrales de l'acte. Null quand rien n'est trouvé ou sous trois niveaux
-- (rapprochement douteux). Écrit par la tâche mensuelle /api/marche/ventes/ ; lecture seule pour le public.
alter table public.ventes_immeubles_dvf add column if not exists niveaux smallint;
