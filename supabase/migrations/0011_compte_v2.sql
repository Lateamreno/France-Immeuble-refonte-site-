-- 0011 — Compte client v2 : offres reçues, messagerie, agent attitré.
--
-- Contrat BO (docs/CONTRAT-SITE.md du dépôt du BO), §11.3 et §12, validés par
-- MAV le 30/10/2026. Même forme que les tables `compte_*` de 0008 :
--   - clé (compte, cle), lignes effacées avec le compte ;
--   - lecture : le seul titulaire du compte (compte = auth.uid()) ;
--   - écriture : la clé secrète du site, que détient le BO pour ses dépôts.
--     Aucune politique d'écriture.
--
-- Rejouable sans risque.

-- §12.1 : les offres transmises par l'agent à un vendeur ----------------------
create table if not exists public.compte_offres (
  compte            uuid not null references auth.users(id) on delete cascade,
  cle               uuid not null,
  bien_cle          uuid,                -- cle de compte_biens
  acquereur         text,                -- nom porté sur l'offre (la société d'abord)
  recue_le          date,
  valable_jours     integer,
  valable_jusqu_au  date,
  prix_hai          numeric,
  net_vendeur       numeric,
  honoraires        numeric,
  statut            text not null default 'en_cours'
                    check (statut in ('en_cours', 'contre_offre', 'acceptee', 'refusee', 'compromis', 'vendu')),
  document          text,                -- chemin du PDF dans le seau documents-clients
  transmise_le      date,
  maj_le            timestamptz not null default now(),
  primary key (compte, cle)
);

-- §12.2 : la messagerie agent ↔ client, fil complet déposé par le BO ----------
create table if not exists public.compte_messages (
  compte        uuid not null references auth.users(id) on delete cascade,
  cle           uuid not null,
  conversation  uuid not null,
  titre         text,
  bien_cle      uuid,
  pieces        text[] not null default '{}',
  de            text not null check (de in ('client', 'agent')),
  auteur        text,
  texte         text not null check (char_length(texte) <= 5000),
  envoye_le     timestamptz not null,
  maj_le        timestamptz not null default now(),
  primary key (compte, cle)
);
create index if not exists compte_messages_conversation on public.compte_messages (compte, conversation, envoye_le);

-- §12.4 : l'agent attitré, une ligne par compte -------------------------------
-- `appele` ouvre l'off-market. Tant qu'il est faux, les champs de l'agent sont
-- nuls. La lettre de qualification du BO ne traverse jamais.
create table if not exists public.compte_agent (
  compte       uuid not null references auth.users(id) on delete cascade,
  cle          uuid not null,
  appele       boolean not null default false,
  agent_nom    text,
  agent_poste  text,
  agent_tel    text,
  agent_email  text,
  agent_photo  text,
  maj_le       timestamptz not null default now(),
  primary key (compte, cle)
);

-- §11.3 : plans et photos du dossier vendeur entrent au coffre -----------------
alter table public.compte_documents drop constraint if exists compte_documents_categorie_check;
alter table public.compte_documents add constraint compte_documents_categorie_check
  check (categorie in ('titre', 'baux', 'diagnostics', 'taxe', 'charges', 'autre', 'plans', 'photos'));

-- Accès ----------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['compte_offres', 'compte_messages', 'compte_agent'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke all on public.%I from authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    if not exists (select 1 from pg_policies where tablename = t and policyname = 'lecture par le titulaire') then
      execute format(
        'create policy "lecture par le titulaire" on public.%I for select to authenticated using (compte = (select auth.uid()))',
        t);
    end if;
  end loop;
end $$;

-- §12.1 : le seau privé des documents remis aux clients ------------------------
-- Le BO y dépose le PDF d'une offre sous `<compte>/offres/<cle>.pdf`. Aucune
-- politique sur storage.objects : le site le sert au seul titulaire, par un
-- lien signé de courte durée fabriqué côté serveur.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents-clients', 'documents-clients', false, 26214400, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
