-- 0005 — Retours de MAV du 21/10/2026 sur les biens vendus.
--
-- 1. Aucune date de vente affichée, URL comprise : le slug d'une vente ne porte
--    plus l'année (immeuble-de-rapport-<commune>, puis -2, -3…). Les 44 fiches
--    de départ changent d'adresse une seule fois, le jour de leur mise en ligne,
--    avant toute indexation (noindex, hors sitemap) ; l'ancienne adresse
--    redirige vers la nouvelle (src/lib/biens.ts, `ancienSlug`).
-- 2. Trois faits de plus par vente, déposés par le BO :
--    • loyer_potentiel : loyer annuel HC potentiel, en euros ;
--    • ecart_estimation : écart entre le prix de vente et l'estimation, en %
--      (+3 = vendu 3 % au-dessus de l'estimation) ;
--    • delai_offre_jours : jours entre la mise en commercialisation (statut
--      Commercialisé A/B/C/D) et la réception de l'offre retenue.
--
-- Rejouable sans risque.

alter table public.ventes
  add column if not exists loyer_potentiel   numeric check (loyer_potentiel is null or loyer_potentiel > 0),
  add column if not exists ecart_estimation  numeric check (ecart_estimation is null or ecart_estimation between -100 and 100),
  add column if not exists delai_offre_jours integer check (delai_offre_jours is null or delai_offre_jours between 0 and 1825);

create or replace function public.ventes_slug()
returns trigger language plpgsql set search_path = '' as $$
declare
  base text;
  n integer := 1;
begin
  if tg_op = 'UPDATE' and old.slug is not null then
    new.slug := old.slug;          -- une URL publiée ne change plus
    return new;
  end if;
  if new.slug is null or new.slug = '' then
    base := 'immeuble-de-rapport-' || public.slugifier(new.ville);
    new.slug := base;
    while exists (select 1 from public.ventes where slug = new.slug and id <> new.id) loop
      n := n + 1;
      new.slug := base || '-' || n;
    end loop;
  end if;
  return new;
end $$;

-- Les 44 fiches de départ : nouvelle adresse, une fois. Le déclencheur fige les
-- slugs ; il est suspendu le temps de ce seul changement.
alter table public.ventes disable trigger ventes_slug;
update public.ventes v set slug = n.slug
from (values
  ('1770399214615x503126108178184600', 'immeuble-de-rapport-drancy'),
  ('1759415257565x773122913575258200', 'immeuble-de-rapport-marseille'),
  ('1728482821456x180769683730137800', 'immeuble-de-rapport-thourotte'),
  ('1714127809491x692275012323336600', 'immeuble-de-rapport-soisy-sous-montmorency'),
  ('1711556920318x713984127115866900', 'immeuble-de-rapport-la-ferte-sous-jouarre'),
  ('1702370829846x541047242733592640', 'immeuble-de-rapport-paris-4'),
  ('1698394747161x661699532477846900', 'immeuble-de-rapport-caen'),
  ('1685957192123x986641831410547000', 'immeuble-de-rapport-hagondange'),
  ('1680105387909x809076517670156700', 'immeuble-de-rapport-cormeilles-en-parisis'),
  ('1678328218598x686360348083279400', 'immeuble-de-rapport-paris-3'),
  ('1678328220775x397464235204552100', 'immeuble-de-rapport-les-mureaux'),
  ('1678328208630x406181873818593400', 'immeuble-de-rapport-tourcoing'),
  ('1678328156558x217930356502384670', 'immeuble-de-rapport-pontoise'),
  ('1678328210694x433456060422805250', 'immeuble-de-rapport-lille'),
  ('1678328216615x397498683920769700', 'immeuble-de-rapport-cognac'),
  ('1678328196542x189886248738439600', 'immeuble-de-rapport-conflans-sainte-honorine'),
  ('1678328214676x307064430920134460', 'immeuble-de-rapport-marmande'),
  ('1678328212633x941845906701144400', 'immeuble-de-rapport-bruyeres-sur-oise'),
  ('1678328204638x982944469461879400', 'immeuble-de-rapport-juziers'),
  ('1678328222800x146136227420650370', 'immeuble-de-rapport-pierrelatte'),
  ('1678328206613x368151229353391300', 'immeuble-de-rapport-orsay'),
  ('1678328200550x820712182429036000', 'immeuble-de-rapport-draveil'),
  ('1678328194517x780244101241242900', 'immeuble-de-rapport-migennes-2'),
  ('1678328180422x141215125878339180', 'immeuble-de-rapport-noisy-le-sec'),
  ('1678328202592x757546018338103600', 'immeuble-de-rapport-bordeaux-2'),
  ('1678328192498x544452858062463000', 'immeuble-de-rapport-vaux-sur-seine'),
  ('1678328198556x862913882393084700', 'immeuble-de-rapport-antibes'),
  ('1678328184432x692143576041660500', 'immeuble-de-rapport-asnieres-sur-seine'),
  ('1678328188472x905252191757168300', 'immeuble-de-rapport-migennes'),
  ('1678328182476x572217439368344600', 'immeuble-de-rapport-chateau-renard-2'),
  ('1678328176461x529546113349445700', 'immeuble-de-rapport-gisors'),
  ('1678328190479x429071181429240260', 'immeuble-de-rapport-chambly-2'),
  ('1678328166905x557672446525689500', 'immeuble-de-rapport-chambly'),
  ('1678328168648x348511001410339650', 'immeuble-de-rapport-bordeaux'),
  ('1678328174569x462154276188006200', 'immeuble-de-rapport-paris-2'),
  ('1678328178447x303953828907493250', 'immeuble-de-rapport-paris'),
  ('1678328172464x163864905569869760', 'immeuble-de-rapport-chateau-renard'),
  ('1678328170488x579271156054734300', 'immeuble-de-rapport-laroche-saint-cydroine'),
  ('1678328186419x967772389178094200', 'immeuble-de-rapport-massy'),
  ('1678328155594x968843847922484800', 'immeuble-de-rapport-spicheren'),
  ('1678328164576x723007967804778600', 'immeuble-de-rapport-pantin'),
  ('1678328158503x904799243512276900', 'immeuble-de-rapport-thiais'),
  ('1678328162582x655370553263949600', 'immeuble-de-rapport-melun'),
  ('1678328160664x627874502867022700', 'immeuble-de-rapport-nevers')
) as n(id, slug)
where v.id = n.id and v.slug is distinct from n.slug;
alter table public.ventes enable trigger ventes_slug;
