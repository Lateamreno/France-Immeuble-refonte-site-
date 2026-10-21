# Base Supabase du SITE

Ce dossier porte les migrations du projet Supabase **du site**, et de lui seul.

> **Jamais le projet du BO.** Le CRM contient les coordonnées de 1 372
> investisseurs. Le site ne détient aucune clé vers cette base — pas même en
> lecture seule (CLAUDE.md §2 et §16). Les migrations du BO vivent dans le repo
> du BO : deux repos qui migrent la même base, c'est la panne garantie.

## Mise en place

1. Créer le projet `france-immeuble-site` dans l'organisation **La Team Reno**,
   région `eu-west-1` (la même que les autres, pour la latence et le RGPD).
2. Jouer les migrations de `migrations/`, dans l'ordre des numéros, depuis
   l'éditeur SQL du tableau de bord.
3. Poser dans Vercel, sur le projet `france-immeuble-refonte-site` :

   | Variable | Valeur | Environnements |
   |---|---|---|
   | `SUPABASE_URL` | `https://<ref>.supabase.co` | Preview + Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | la clé `service_role` du projet | Preview + Development |

   **Pas en Production.** L'outil de recette ne s'affiche que hors production
   (`VERCEL_ENV !== "production"`) : la clé n'a donc rien à faire dans le
   runtime du site public. Moins elle est déployée, moins elle fuit.

   La clé `service_role` contourne la RLS. Elle ne doit jamais apparaître dans
   une variable `NEXT_PUBLIC_*`, ni être lue côté navigateur.

## Ce que contient la base aujourd'hui

| Table | Rôle |
|---|---|
| `bo_feedback` | Retours de recette posés sur les écrans (Mode Revue) |

RLS activée, aucune policy : seule la clé `service_role`, utilisée dans les
route handlers serveur, écrit et lit.

## À venir (feuille de route §14)

- `content.articles` — M3, import des 14 articles
- `web.stats`, `web.references`, `web.stats_villes` — M2, projections déposées
  par le BO
- `web.leads_outbox` — M4, file d'attente si le BO ne répond pas
