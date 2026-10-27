-- 0010 — Le dossier du vendeur en cours de saisie (retour #64 de MAV, 27/10/2026).
--
-- Après son estimation, le vendeur peut remplir en ligne l'état locatif de son
-- immeuble (lots, surfaces Carrez, loyers, DPE, taxe foncière). Le brouillon
-- est enregistré au fil de la saisie, pour qu'il puisse revenir plus tard.
--
-- Le brouillon ne contient que ce que le vendeur a lui-même tapé. Dès que le
-- dossier est validé et transmis au BO, son contenu est vidé : il ne reste que
-- l'adresse e-mail, le temps de confirmer le compte. La ligne disparaît une
-- fois le compte ouvert, 2 jours après la validation, ou 30 jours après la
-- dernière saisie (tâche quotidienne /api/lead/relance/).
--
-- Accès : le navigateur détient un jeton aléatoire dans un cookie httpOnly ;
-- la table n'en garde que l'empreinte SHA-256. Un compte connecté retrouve
-- aussi son dossier par `compte`.
--
-- Le code à 6 chiffres qui confirme l'adresse avant la création du compte est
-- compté ici (`codes`, `essais`) : au plus 5 envois et 5 essais par dossier.
-- Le code lui-même n'est jamais stocké : c'est Supabase Auth qui le vérifie.
--
-- RLS active, aucune politique : seule la clé secrète du site y lit et écrit.
-- Rejouable sans risque.

create table if not exists public.dossiers_vendeurs (
  empreinte       text primary key,
  ref             uuid not null,
  compte          uuid references auth.users(id) on delete cascade,
  email           text not null,
  identite        jsonb not null default '{}'::jsonb,
  donnees         jsonb not null default '{}'::jsonb,
  codes           integer not null default 0,
  code_envoye_le  timestamptz,
  code_type       text check (code_type in ('invite', 'magiclink')),
  essais          integer not null default 0,
  valide_le       timestamptz,
  cree_le         timestamptz not null default now(),
  maj_le          timestamptz not null default now()
);

create index if not exists dossiers_vendeurs_compte on public.dossiers_vendeurs (compte);
create index if not exists dossiers_vendeurs_maj on public.dossiers_vendeurs (maj_le);

alter table public.dossiers_vendeurs enable row level security;

comment on table public.dossiers_vendeurs is
  'Brouillon de l''état locatif saisi par un vendeur. Vidé dès transmission au BO, effacé au plus tard 30 jours après la dernière saisie.';
