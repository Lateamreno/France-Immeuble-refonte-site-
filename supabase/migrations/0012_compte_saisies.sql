-- 0012 — Compte client v2 : ce que le client a envoyé, et les e-mails déjà partis.
--
-- `compte_saisies` : la copie de ce que le client vient d'envoyer depuis son
-- compte (message, demande de rendez-vous, offre, profil investisseur). Elle
-- ne sert qu'à le lui montrer tant que le BO ne l'a pas redéposé (contrat BO
-- §12.2 : « le site peut afficher un message du client en cours d'envoi »).
-- La source qui fait foi reste le BO. Effacée avec le compte.
--   - lecture : le seul titulaire (compte = auth.uid()) ;
--   - écriture : le serveur du site (clé secrète). Aucune politique d'écriture.
--
-- `compte_avis` : les lignes déposées par le BO dont le client a déjà été
-- prévenu par e-mail (nouveau message, nouveau bien, nouvelle offre). Personne
-- ne la lit avec le jeton d'un client : RLS sans politique.
--
-- Rejouable sans risque.

create table if not exists public.compte_saisies (
  compte     uuid not null references auth.users(id) on delete cascade,
  ref        uuid not null,
  type       text not null check (type in ('message', 'rendez_vous', 'offre_acquereur', 'profil_investisseur')),
  donnees    jsonb not null default '{}'::jsonb,
  envoye_le  timestamptz not null default now(),
  primary key (compte, ref)
);
create index if not exists compte_saisies_type on public.compte_saisies (compte, type, envoye_le desc);

create table if not exists public.compte_avis (
  compte    uuid not null references auth.users(id) on delete cascade,
  source    text not null check (source in ('compte_messages', 'compte_propositions', 'compte_offres')),
  cle       uuid not null,
  avise_le  timestamptz not null default now(),
  primary key (compte, source, cle)
);

alter table public.compte_saisies enable row level security;
alter table public.compte_avis enable row level security;
revoke all on public.compte_saisies from anon, authenticated;
revoke all on public.compte_avis from anon, authenticated;
grant select on public.compte_saisies to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'compte_saisies' and policyname = 'lecture par le titulaire') then
    create policy "lecture par le titulaire" on public.compte_saisies
      for select to authenticated using (compte = (select auth.uid()));
  end if;
end $$;
