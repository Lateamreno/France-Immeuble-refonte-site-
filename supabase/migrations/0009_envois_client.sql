-- 0009 — Le garde-fou des e-mails envoyés au client après une estimation.
--
-- MAV, 27/10/2026 : après le formulaire d'estimation, le client reçoit un
-- e-mail avec la liste des pièces et l'accès à son espace, créé pour lui.
-- Le formulaire est public : sans limite, n'importe qui pourrait faire
-- envoyer cet e-mail en boucle à une adresse qui n'a rien demandé. Une
-- adresse reçoit donc au plus un e-mail par 24 heures.
--
-- On garde l'empreinte de l'adresse (SHA-256), pas l'adresse : la table ne
-- contient aucune donnée personnelle lisible.
--
-- RLS active, aucune politique : seule la clé secrète du site y lit et écrit.
-- Rejouable sans risque.

create table if not exists public.envois_client (
  empreinte  text primary key,
  dernier    timestamptz not null default now(),
  nombre     integer not null default 1
);

alter table public.envois_client enable row level security;

comment on table public.envois_client is
  'Garde-fou : au plus un e-mail automatique par adresse et par 24 h. Empreinte SHA-256 de l''adresse, jamais l''adresse.';
