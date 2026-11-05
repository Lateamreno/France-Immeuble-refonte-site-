-- Retour #266 (MAV, 05/11/2026) : l'état locatif part au BO au fil de la saisie,
-- sans attendre « Valider ». Le site retient ce qui a été transmis (empreinte
-- du dossier) pour ne renvoyer que ce qui a changé, et rattraper chaque nuit
-- un brouillon modifié puis quitté avant son envoi.
alter table public.dossiers_vendeurs
  add column if not exists transmis_le timestamptz,
  add column if not exists transmis_empreinte text;
