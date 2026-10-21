-- 0003 — Une fiche par vente, et le récit qui la raconte.
--
-- Chaque vente devient une page : /immeubles-vendus/<slug>/. Le BO y dépose,
-- en plus de la commune, du prix et de la date, les faits de la vente (type,
-- lots, occupation, rendement, profil de l'acquéreur, déroulé de la
-- commercialisation) et un récit rédigé à partir de ces faits.
--
-- Deux règles portées par la base, pas par la bonne volonté :
--
-- 1. RELECTURE HUMAINE (CLAUDE.md §8). Un récit ne peut exister sans date de
--    validation. Le BO génère un brouillon ; il ne le dépose qu'après la
--    validation de MAV. Le site n'indexe une fiche que si son récit est validé.
--
-- 2. ANONYMAT (§2). Commune, arrondissement, fourchettes : jamais la rue. Un
--    récit qui contient « rue Victor-Hugo » ou « 92100 Boulogne » est REJETÉ
--    par la base, et le BO affiche le rejet au lieu de publier.
--
-- Rejouable sans risque.

alter table public.ventes
  add column if not exists slug                 text,
  add column if not exists titre                text,
  add column if not exists type                 text,
  -- Paris, Lyon, Marseille : « 18e arrondissement ». Ailleurs : null.
  add column if not exists arrondissement       text,
  add column if not exists lots                 integer check (lots is null or lots between 1 and 500),
  -- « 6 appartements et 2 commerces en pied d'immeuble »
  add column if not exists composition          text,
  -- Fourchette arrondie par le BO (tranches de 100 m²), jamais la surface exacte.
  add column if not exists surface_min          integer,
  add column if not exists surface_max          integer,
  -- « fin XIXe », « années 1930 » — l'époque situe sans identifier.
  add column if not exists epoque               text,
  add column if not exists dpe                  text check (dpe is null or dpe in ('A','B','C','D','E','F','G')),
  -- POURCENTAGES, pas fractions (même piège que biens_a_vendre).
  add column if not exists occupation           numeric check (occupation is null or occupation between 0 and 100),
  add column if not exists rendement            numeric check (rendement is null or rendement between 1 and 40),
  add column if not exists profil_acquereur     text check (profil_acquereur is null or profil_acquereur in
                                                  ('Investisseur', 'Marchand de biens', 'Patrimonial', 'Promoteur')),
  add column if not exists profil_vendeur       text check (profil_vendeur is null or profil_vendeur in
                                                  ('Particulier', 'Indivision', 'Société', 'Institutionnel')),
  -- 'off_market' : fichier d'acquéreurs seul · 'diffusion' : annonces · 'mixte'
  add column if not exists mode_commercialisation text check (mode_commercialisation is null or
                                                  mode_commercialisation in ('off_market', 'diffusion', 'mixte')),
  -- Signature du mandat → signature du compromis.
  add column if not exists delai_semaines       integer check (delai_semaines is null or delai_semaines between 0 and 260),
  add column if not exists acquereurs_sollicites integer check (acquereurs_sollicites is null or acquereurs_sollicites >= 0),
  add column if not exists visites              integer check (visites is null or visites >= 0),
  add column if not exists offres               integer check (offres is null or offres >= 0),
  add column if not exists chapo                text,
  add column if not exists recit                text,
  add column if not exists seo_title            text check (seo_title is null or char_length(seo_title) <= 70),
  add column if not exists seo_desc             text check (seo_desc is null or char_length(seo_desc) <= 170),
  add column if not exists recit_valide_le      timestamptz;

do $$
begin
  -- Pas de récit sans relecture humaine.
  if not exists (select 1 from pg_constraint where conname = 'ventes_recit_valide') then
    alter table public.ventes add constraint ventes_recit_valide
      check (recit is null or recit_valide_le is not null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ventes_surface_ordre') then
    alter table public.ventes add constraint ventes_surface_ordre
      check (surface_min is null or surface_max is null or surface_min < surface_max);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Garde-fou d'anonymat. Refuse dans les textes publiés :
--   • un type de voie suivi d'un nom propre (« rue Victor-Hugo », « Avenue
--     de la République ») — une majuscule suivie d'une minuscule, pour laisser
--     passer « le passage du DPE de F à D » ;
--   • un code postal suivi d'une commune (« 92100 Boulogne »).
-- « une place de parking » ou « 48 000 € de loyer » passent.
-- ---------------------------------------------------------------------------
create or replace function public.texte_sans_adresse(t text)
returns boolean language sql immutable as $$
  select t is null or not (
    t ~ '(^|[^[:alpha:]])([Rr]ue|[Aa]venue|[Bb]oulevard|[Bb]d|[Ii]mpasse|[Aa]ll[ée]e|[Pp]lace|[Qq]uai|[Cc]hemin|[Cc]ours|[Pp]assage|[Ss]quare|[Vv]illa|[Rr]oute|[Ss]entier|[Cc]it[ée])\s+(de\s+la\s+|de\s+l[''’]|du\s+|des\s+|de\s+|d[''’])?[[:upper:]][[:lower:]]'
    or t ~ '(^|[^0-9])[0-9]{5}\s+[[:upper:]]'
  );
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ventes_sans_adresse') then
    alter table public.ventes add constraint ventes_sans_adresse check (
      public.texte_sans_adresse(titre) and public.texte_sans_adresse(chapo)
      and public.texte_sans_adresse(recit) and public.texte_sans_adresse(composition)
      and public.texte_sans_adresse(seo_title) and public.texte_sans_adresse(seo_desc)
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Slug : l'URL de la fiche. Généré par la base si le BO n'en envoie pas, et
-- FIGÉ ensuite — changer une URL indexée fait perdre son trafic (§10).
-- Forme : immeuble-de-rapport-<commune>-<année>, suffixe -2, -3… si besoin.
-- Les 44 ventes de départ reçoivent leur slug par la graine, calculé par la
-- même règle que le repli du site (src/lib/biens.ts).
-- ---------------------------------------------------------------------------
create or replace function public.slugifier(t text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(
    lower(translate(t,
      'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖòóôõöÙÚÛÜùúûüÝýÿŒœÆæ',
      'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOoooooUUUUuuuuYyyOoAa')),
    '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.ventes_slug()
returns trigger language plpgsql as $$
declare
  base text;
  n integer := 1;
begin
  if tg_op = 'UPDATE' and old.slug is not null then
    new.slug := old.slug;          -- une URL publiée ne change plus
    return new;
  end if;
  if new.slug is null or new.slug = '' then
    base := 'immeuble-de-rapport-' || public.slugifier(new.ville) || '-' || extract(year from new.date)::int;
    new.slug := base;
    while exists (select 1 from public.ventes where slug = new.slug and id <> new.id) loop
      n := n + 1;
      new.slug := base || '-' || n;
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists ventes_slug on public.ventes;
create trigger ventes_slug before insert or update on public.ventes
  for each row execute function public.ventes_slug();

create unique index if not exists ventes_slug_idx on public.ventes (slug);
