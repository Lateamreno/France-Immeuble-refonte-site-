-- 0016 — Recherches comme au BO (retours #83 à #94, MAV, 02/11/2026).
--
-- Deux colonnes facultatives que le BO remplit à son rythme :
--  - `compte_recherches.occupation_min` / `occupation_max` : la fourchette
--    d'occupation d'une recherche, en %, pour l'afficher dans le compte ;
--  - `biens_a_vendre.operations` : à quel type d'acquéreur s'adresse un
--    immeuble (`Investisseur`, `Marchand de biens`), pour filtrer la liste.
-- Rien d'identifiant. Les politiques de lecture existantes s'appliquent.
--
-- Rejouable sans risque.

alter table public.compte_recherches
  add column if not exists occupation_min integer check (occupation_min is null or occupation_min between 0 and 100),
  add column if not exists occupation_max integer check (occupation_max is null or occupation_max between 0 and 100);

alter table public.biens_a_vendre
  add column if not exists operations text[] check (
    operations is null or operations <@ array['Investisseur', 'Marchand de biens']::text[]
  );
