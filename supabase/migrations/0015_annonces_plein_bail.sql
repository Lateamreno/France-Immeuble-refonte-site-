-- 0015 — Immeubles à vendre : le jeu complet de Plein Bail (MAV, 31/10/2026).
--
-- MAV a demandé de reproduire le moteur de recherche et la fiche annonce de
-- Plein Bail. Le contrat (§3) dit déjà que le site reçoit « exactement ce que
-- reçoit Plein Bail, sans adresse ». Cette migration ouvre les colonnes qui
-- manquaient pour le recevoir. Toutes sont facultatives : le BO peut les
-- remplir à son rythme, la page affiche ce qui arrive et cache le reste.
--
-- Rien d'identifiant : pas d'adresse, pas de coordonnées, pas de nom de
-- locataire ni de vendeur. Le code postal et la population de la commune
-- situent sans désigner l'immeuble.
--
-- Rejouable sans risque.

alter table public.biens_a_vendre
  add column if not exists code_postal          text check (code_postal is null or code_postal ~ '^[0-9]{5}$'),
  -- Population de la commune (INSEE), pour le filtre « type de ville ».
  add column if not exists commune_population   integer check (commune_population is null or commune_population >= 0),
  -- Loyer annuel HC potentiel : loyer réel des lots occupés, loyer de marché des lots vides.
  add column if not exists loyer_hc_an_potentiel numeric check (loyer_hc_an_potentiel is null or loyer_hc_an_potentiel >= 0),
  -- POURCENTAGE, comme `rendement` : loyer potentiel / (prix + travaux).
  add column if not exists rendement_potentiel  numeric check (rendement_potentiel is null or rendement_potentiel between 1 and 40),
  -- Total des travaux prévus en euros (lots et parties communes). 0 = aucun.
  add column if not exists travaux_total        numeric check (travaux_total is null or travaux_total >= 0),
  -- `dpe` reste la PIRE classe des lots ; `dpe_min` la meilleure.
  add column if not exists dpe_min              text check (dpe_min is null or dpe_min in ('A','B','C','D','E','F','G')),
  add column if not exists ges                  text check (ges is null or ges in ('A','B','C','D','E','F','G')),
  add column if not exists ges_min              text check (ges_min is null or ges_min in ('A','B','C','D','E','F','G')),
  -- Occupation par nombre de lots, en % (`occupation` est celle par surface).
  add column if not exists occupation_lots      numeric check (occupation_lots is null or occupation_lots between 0 and 100),
  -- Type dominant (règle des 70 % de la surface) et drapeau mixte.
  add column if not exists type_dominant        text check (type_dominant is null or type_dominant in ('habitation','commercial','bureau')),
  add column if not exists mixte                boolean,
  add column if not exists monopropriete        boolean,
  -- Charges annuelles. `_recuperable` = la part refacturée aux locataires
  -- (TEOM pour la taxe foncière, charges locatives pour la copropriété).
  add column if not exists taxe_fonciere        numeric check (taxe_fonciere is null or taxe_fonciere >= 0),
  add column if not exists taxe_fonciere_recuperable numeric check (taxe_fonciere_recuperable is null or taxe_fonciere_recuperable >= 0),
  add column if not exists charges_copro        numeric check (charges_copro is null or charges_copro >= 0),
  add column if not exists charges_copro_recuperables numeric check (charges_copro_recuperables is null or charges_copro_recuperables >= 0),
  -- Le prix décomposé. À défaut, le site déduit 5 % du net vendeur.
  add column if not exists prix_net_vendeur     numeric check (prix_net_vendeur is null or prix_net_vendeur > 0),
  add column if not exists honoraires           numeric check (honoraires is null or honoraires >= 0),
  -- Baisse de prix : badge « Prix baissé » pendant 30 jours.
  add column if not exists prix_precedent       numeric check (prix_precedent is null or prix_precedent > 0),
  add column if not exists prix_baisse_le       timestamptz,
  -- Remise en tête de liste décidée dans le BO. `publie_le` n'est jamais réécrit.
  add column if not exists remonte_le           timestamptz;

create index if not exists biens_a_vendre_dept_idx on public.biens_a_vendre (dept);

-- ---------------------------------------------------------------------------
-- L'état locatif, lot par lot, comme sur Plein Bail. Jamais de nom de
-- locataire ni d'enseigne : la table n'a pas de colonne pour en recevoir.
-- Lecture publique, écriture par la seule clé secrète (le BO), comme
-- `biens_a_vendre`. Le BO remplace les lots d'un bien à chaque dépôt.
-- ---------------------------------------------------------------------------
create table if not exists public.biens_lots (
  bien              text not null references public.biens_a_vendre (id) on delete cascade,
  numero            text not null check (length(numero) between 1 and 40),
  ordre             integer,
  type              text not null check (type in ('habitation','commerce','bureau','activite','parking','cave','autre')),
  typologie         text check (typologie is null or length(typologie) <= 40),   -- « T2 », « Studio »
  etage             text check (etage is null or length(etage) <= 20),
  -- 'occupe' ou 'libre' ; `bail` dit la nature du bail en place.
  statut            text not null default 'occupe' check (statut in ('occupe','libre')),
  bail              text check (bail is null or bail in ('nu','meuble','commercial','professionnel','derogatoire','mixte','saisonnier','autre')),
  bail_debut        date,
  bail_fin          date,
  surface           numeric check (surface is null or surface >= 0),
  loyer_hc_mois     numeric check (loyer_hc_mois is null or loyer_hc_mois >= 0),
  charges_mois      numeric check (charges_mois is null or charges_mois >= 0),
  -- Loyer de marché estimé pour un lot vide (sert au loyer potentiel).
  loyer_marche_mois numeric check (loyer_marche_mois is null or loyer_marche_mois >= 0),
  disponible_le     date,
  etat              text check (etat is null or etat in ('bon','a_rafraichir','a_renover')),
  travaux           numeric check (travaux is null or travaux >= 0),
  dpe               text check (dpe is null or dpe in ('A','B','C','D','E','F','G')),
  maj_le            timestamptz not null default now(),
  primary key (bien, numero)
);

alter table public.biens_lots enable row level security;
drop policy if exists "lecture publique" on public.biens_lots;
create policy "lecture publique" on public.biens_lots
  for select to anon, authenticated using (true);
