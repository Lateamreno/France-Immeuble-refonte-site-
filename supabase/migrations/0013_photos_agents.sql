-- 0013 — Photos des agents attitrés (MAV, 30/10/2026).
--
-- Le BO donne l'adresse https de la photo (contrat §12.4). Le site la copie
-- une fois ici et la sert lui-même : aucune image hors du domaine (§16).
-- Seau privé, sans politique : seule la clé secrète du site y lit et écrit.
-- Rejouable sans risque.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos-agents', 'photos-agents', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
