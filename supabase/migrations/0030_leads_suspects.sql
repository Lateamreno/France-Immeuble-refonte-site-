-- Formulaires envoyés par des robots (MAV, 23/11/2026 : « je reçois des faux formulaires »). Un envoi
-- jugé douteux par `src/lib/anti-robots.ts` (champ piège rempli, jeton absent ou faux, envoi trop
-- rapide, charabia) n'est pas jeté : il attend ici, sans e-mail à l'agence ni dépôt au BO, et il est
-- compté dans le rapport du lundi. Si un vrai visiteur s'y trouve, on le relâche à la main.
--
-- Données personnelles possibles (un vrai visiteur mal classé) : la tâche quotidienne
-- /api/lead/relance/ efface les lignes de plus de 30 jours.

create table if not exists public.leads_suspects (
  ref text primary key,
  recu_le timestamptz not null default now(),
  type text not null,
  motif text not null,
  contenu jsonb not null
);

create index if not exists leads_suspects_recu_le on public.leads_suspects (recu_le);

-- RLS sans aucune règle : seule la clé de service du serveur du site y écrit et y lit.
alter table public.leads_suspects enable row level security;
