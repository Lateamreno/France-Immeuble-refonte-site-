-- 0017 — Mes immeubles dès le formulaire (retours #261, #274, MAV, 05/11/2026).
--
-- « Les immeubles devraient tous apparaître sur la page directement […] dès le
-- moment où j'ai rempli un formulaire d'estimation. » Jusqu'ici, un immeuble
-- n'apparaissait dans le compte qu'une fois déposé par le BO (`compte_biens`).
--
--  - `compte_saisies` accepte deux types de plus :
--      `estimation`    : la copie d'une estimation envoyée par un client
--                        connecté (ou dont le compte s'ouvre avec le dossier).
--                        Rue sans numéro, code postal, ville, lots, surface,
--                        loyer, état locatif. Effacée dès que le BO dépose
--                        l'immeuble avec la même `ref`, et avec le compte.
--      `nom_recherche` : le nom qu'un client donne à une de ses recherches
--                        (retour #271), en attendant que le BO le redépose.
--  - `compte_biens.ref` : la `ref` de l'estimation dont l'immeuble est issu.
--    Le BO la renseigne ; le site cache alors sa copie.
--
-- Mêmes règles d'accès que 0012 : lecture par le seul titulaire, écriture par
-- le serveur du site. Rejouable sans risque.

alter table public.compte_saisies drop constraint if exists compte_saisies_type_check;
alter table public.compte_saisies add constraint compte_saisies_type_check check (
  type in ('message', 'rendez_vous', 'offre_acquereur', 'profil_investisseur', 'estimation', 'nom_recherche')
);

alter table public.compte_biens add column if not exists ref uuid;
create index if not exists compte_biens_ref on public.compte_biens (compte, ref);
