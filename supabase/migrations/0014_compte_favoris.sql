-- 0014 — Favoris des immeubles à vendre (MAV, 31/10/2026 : « ajouter aux favoris, comme Plein Bail »).
--
-- `bien` est l'identifiant de `biens_a_vendre` (texte, déposé par le BO). Pas de
-- clé étrangère : un bien retiré de la vente disparaît de la table du BO, le
-- favori reste et la page ne le montre plus.
--   - lecture : le seul titulaire (compte = auth.uid()) ;
--   - écriture : le serveur du site (clé secrète), après vérification de la session.
-- Chaque ajout ou retrait part aussi au BO (type `favori`) : l'agent voit l'intérêt.
-- Rejouable sans risque.

create table if not exists public.compte_favoris (
  compte     uuid not null references auth.users(id) on delete cascade,
  bien       text not null check (char_length(bien) <= 80),
  ajoute_le  timestamptz not null default now(),
  primary key (compte, bien)
);

alter table public.compte_favoris enable row level security;
revoke all on public.compte_favoris from anon, authenticated;
grant select on public.compte_favoris to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'compte_favoris' and policyname = 'lecture par le titulaire') then
    create policy "lecture par le titulaire" on public.compte_favoris
      for select to authenticated using (compte = (select auth.uid()));
  end if;
end $$;
