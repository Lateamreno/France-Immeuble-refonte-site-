-- Search Console (MAV, 20/11/2026 : « ce serait ultra judicieux pour que tu me fasses des rapports
-- réguliers »). La tâche /api/search-console/ relève chaque jour les performances du site dans la
-- recherche Google, avec le compte de service que MAV a créé (lecture seule, clé `GSC_CLE` dans
-- Vercel), et les range ici pour les rapports et le suivi du référencement des immeubles quand la
-- section des murs commerciaux sera en ligne.
--
-- Aucune donnée personnelle : des compteurs par jour, par page et par requête tapée dans Google.
-- Google retire lui-même les requêtes rares (anonymisées) : la somme de `gsc_requetes` d'une page est
-- donc inférieure à son total, qui est dans `gsc_pages`.

create table if not exists public.gsc_pages (
  jour date not null,
  page text not null,
  clics int not null default 0,
  impressions int not null default 0,
  position real,                 -- position moyenne de Google ce jour-là
  primary key (jour, page)
);

create table if not exists public.gsc_requetes (
  jour date not null,
  page text not null,
  requete text not null,
  clics int not null default 0,
  impressions int not null default 0,
  position real,
  primary key (jour, page, requete)
);

create index if not exists gsc_requetes_requete on public.gsc_requetes (requete);
create index if not exists gsc_requetes_jour on public.gsc_requetes (jour);

-- RLS sans aucune règle : ni le public ni un compte connecté ne lisent ces tables. Seule la clé de
-- service du serveur du site y écrit et y lit.
alter table public.gsc_pages enable row level security;
alter table public.gsc_requetes enable row level security;
