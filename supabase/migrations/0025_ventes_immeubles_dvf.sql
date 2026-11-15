-- Lot 125 (MAV, 15/11/2026) : les ventes d'immeubles de rapport de DVF à Paris, une par une, pour la
-- page /ventes-immeubles-paris/. Données publiques (DVF, licence ouverte) : la rue sans son numéro, la
-- date, le prix, la surface, les lots (type et surface) et une photo de rue libre (Panoramax).
-- Écrite par la tâche mensuelle /api/marche/ventes/ (clé du site, côté serveur) ; lecture seule pour
-- le public, comme marche_immeubles. Conditions de DVF : ce détail ne doit pas être indexé par les
-- moteurs de recherche ; le site ne le sert que par /api/ventes-dvf/, fermé aux robots.
create table if not exists public.ventes_immeubles_dvf (
  id text primary key,
  code_insee text not null,
  annee int not null,
  date_vente date not null,
  rue text,
  code_postal text,
  prix numeric not null,
  surface numeric not null,
  prix_m2 numeric not null,
  logements int not null,
  mixte boolean not null default false,
  lots jsonb not null default '[]'::jsonb,
  lat double precision,
  lon double precision,
  photo jsonb,
  -- La rue officielle et la photo ont été cherchées (BAN et Panoramax) : la tâche ne les recherche plus.
  enrichi boolean not null default false,
  maj_le timestamptz not null default now()
);

create index if not exists ventes_immeubles_dvf_code_annee on public.ventes_immeubles_dvf (code_insee, annee);

alter table public.ventes_immeubles_dvf enable row level security;
drop policy if exists "lecture publique" on public.ventes_immeubles_dvf;
create policy "lecture publique" on public.ventes_immeubles_dvf for select to anon, authenticated using (true);
