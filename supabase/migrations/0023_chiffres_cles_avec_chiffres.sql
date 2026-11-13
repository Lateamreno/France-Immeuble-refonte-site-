-- Lot 110 (relecture du 13/11/2026) : la table `chiffres` n'admettait que des lettres minuscules et
-- des tirets bas dans ses clés. Les clés par zone demandées au BO au lot 101
-- (`immeubles_traites_75`, `immeubles_traites_92012`, docs/PROMPT-BO-IMMEUBLES-ETUDIES.md) portent
-- des chiffres : leur dépôt était refusé, et la page Paris ne pouvait pas afficher les immeubles
-- parisiens étudiés. On admet les chiffres. Rien d'autre ne change : RLS, lecture publique et
-- écriture réservée au dépôt du BO restent celles de la migration 0007.
alter table public.chiffres drop constraint if exists chiffres_cle_check;
alter table public.chiffres add constraint chiffres_cle_check check (cle ~ '^[a-z0-9_]+$');
