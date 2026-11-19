-- Lot 141 (demande du BO, contrat §19, 19/11/2026) : les statistiques d'une annonce, par jour, pour
-- le rapport de commercialisation que le BO envoie au propriétaire. Le site compte, le BO lit avec la
-- clé de service qu'il a déjà ; il n'écrit pas ici.
--
-- Sans donnée personnelle : `annonce_stats_jour` ne garde que des compteurs. Le dédoublonnage des vues
-- (par visiteur et par heure) et des visiteurs (par jour) passe par `annonce_stats_empreintes` : une
-- empreinte calculée par le serveur du site (HMAC de la date, de l'adresse IP et du navigateur, avec un
-- secret du serveur), qui change chaque jour et ne permet pas de retrouver l'adresse IP. Ces empreintes
-- sont effacées le lendemain (`purger_stats_annonces`, tâche quotidienne /api/lead/relance/).
--
-- Pas de clé étrangère vers `biens_a_vendre` : une annonce vendue ou retirée quitte cette table, et ses
-- statistiques doivent rester pour le rapport.

create table if not exists public.annonce_stats_jour (
  bien_id text not null,                    -- biens_a_vendre.id
  jour date not null,                       -- jour à Paris
  impressions int not null default 0,       -- l'annonce est apparue dans une liste, une fois par chargement de liste
  vues int not null default 0,              -- la fiche ouverte, une fois par visiteur et par heure
  visiteurs int not null default 0,         -- visiteurs distincts de la fiche dans la journée
  clics_telephone int not null default 0,   -- « Voir le n° » ou un clic sur le numéro, depuis la fiche
  clics_dossier int not null default 0,     -- « Contacter » (demande du dossier) depuis la fiche
  partages int not null default 0,          -- partage natif du téléphone, copie du lien, WhatsApp, e-mail, SMS
  positions_somme bigint not null default 0, -- somme des rangs dans les listes (1 = premier) ; position moyenne = positions_somme / impressions
  maj_le timestamptz not null default now(),
  primary key (bien_id, jour)
);

create index if not exists annonce_stats_jour_jour on public.annonce_stats_jour (jour);

create table if not exists public.annonce_stats_empreintes (
  bien_id text not null,
  jour date not null,
  cle text not null,         -- « j » : visiteur du jour ; « h0 » à « h23 » : vue de cette heure
  empreinte text not null,
  primary key (bien_id, jour, cle, empreinte)
);

-- RLS sans aucune règle : ni le public ni un compte connecté ne lisent ou n'écrivent ces tables. Seule la
-- clé de service y accède (le serveur du site par la fonction ci-dessous, le BO en lecture).
alter table public.annonce_stats_jour enable row level security;
alter table public.annonce_stats_empreintes enable row level security;
revoke all on public.annonce_stats_jour from anon, authenticated;
revoke all on public.annonce_stats_empreintes from anon, authenticated;

-- Un événement : « impression » (plusieurs annonces, dans l'ordre de la liste), « vue », « telephone »,
-- « dossier » ou « partage » (une annonce). Le jour et l'heure sont ceux de Paris, donnés par le serveur.
create or replace function public.noter_stat_annonce(
  p_evenement text, p_biens text[], p_empreinte text, p_jour date, p_heure int
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i int;
  b text;
  n int;
begin
  if p_biens is null or array_length(p_biens, 1) is null then
    return;
  end if;

  if p_evenement = 'impression' then
    for i in 1 .. array_length(p_biens, 1) loop
      insert into annonce_stats_jour as s (bien_id, jour, impressions, positions_somme)
      values (p_biens[i], p_jour, 1, i)
      on conflict (bien_id, jour) do update
        set impressions = s.impressions + 1, positions_somme = s.positions_somme + i, maj_le = now();
    end loop;
    return;
  end if;

  b := p_biens[1];

  if p_evenement = 'vue' then
    if p_empreinte is null or p_heure is null or p_heure < 0 or p_heure > 23 then
      return;
    end if;
    insert into annonce_stats_empreintes values (b, p_jour, 'h' || p_heure, p_empreinte) on conflict do nothing;
    get diagnostics n = row_count;
    if n > 0 then
      insert into annonce_stats_jour as s (bien_id, jour, vues) values (b, p_jour, 1)
      on conflict (bien_id, jour) do update set vues = s.vues + 1, maj_le = now();
    end if;
    insert into annonce_stats_empreintes values (b, p_jour, 'j', p_empreinte) on conflict do nothing;
    get diagnostics n = row_count;
    if n > 0 then
      insert into annonce_stats_jour as s (bien_id, jour, visiteurs) values (b, p_jour, 1)
      on conflict (bien_id, jour) do update set visiteurs = s.visiteurs + 1, maj_le = now();
    end if;
  elsif p_evenement = 'telephone' then
    insert into annonce_stats_jour as s (bien_id, jour, clics_telephone) values (b, p_jour, 1)
    on conflict (bien_id, jour) do update set clics_telephone = s.clics_telephone + 1, maj_le = now();
  elsif p_evenement = 'dossier' then
    insert into annonce_stats_jour as s (bien_id, jour, clics_dossier) values (b, p_jour, 1)
    on conflict (bien_id, jour) do update set clics_dossier = s.clics_dossier + 1, maj_le = now();
  elsif p_evenement = 'partage' then
    insert into annonce_stats_jour as s (bien_id, jour, partages) values (b, p_jour, 1)
    on conflict (bien_id, jour) do update set partages = s.partages + 1, maj_le = now();
  end if;
end;
$$;

-- Les empreintes ne survivent pas au lendemain : seul le compteur reste.
create or replace function public.purger_stats_annonces() returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  delete from annonce_stats_empreintes where jour < (now() at time zone 'Europe/Paris')::date;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.noter_stat_annonce(text, text[], text, date, int) from public, anon, authenticated;
revoke all on function public.purger_stats_annonces() from public, anon, authenticated;
grant execute on function public.noter_stat_annonce(text, text[], text, date, int) to service_role;
grant execute on function public.purger_stats_annonces() to service_role;
