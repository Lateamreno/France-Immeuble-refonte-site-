# Base Supabase du SITE

Ce dossier porte les migrations du projet Supabase **du site**, et de lui seul.

> **Jamais le projet du BO.** Le CRM contient les coordonnées de 1 372
> investisseurs. Le site ne détient aucune clé vers cette base — pas même en
> lecture seule (CLAUDE.md §2 et §16). Les migrations du BO vivent dans le repo
> du BO : deux repos qui migrent la même base, c'est la panne garantie.

## Mise en place

Projet : **France Immeuble site** — `omtkttpvfjsbnqsajcsp`, créé le 21/10/2026.

1. ✅ `0001_revue_feedback.sql` — appliquée.
2. ⏳ `A-COLLER-0002-et-ventes.sql` — à coller une fois dans l'éditeur SQL : les
   tables des projections, puis les 44 ventes. Rejouable sans risque.
3. Variables Vercel, projet `france-immeuble-refonte-site` :

   | Variable | Environnements | État |
   |---|---|---|
   | `SITE_SUPABASE_URL` | Production, Preview, Development | ✅ posée |
   | `SITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | ✅ posée |
   | `SITE_SUPABASE_SECRET_KEY` | **Preview, Development** — type *Sensitive* | ⏳ à poser |

### Pourquoi le préfixe `SITE_`

Le 21/10/2026, la session de développement contenait `SUPABASE_URL` et
`SUPABASE_SERVICE_ROLE_KEY` pointant sur **le projet du BO**, et le code du site
lisait des variables de même nom : un test local a écrit deux lignes dans le
CRM. Avec un préfixe distinct, une clé du BO présente dans l'environnement ne
peut plus être ramassée par erreur. Et `src/lib/supabase-site.ts` refuse en
plus toute URL contenant la référence du projet du BO — vérifié le jour même :
URL du BO dans `SITE_SUPABASE_URL` → 503 et refus journalisé.

### Pourquoi la clé secrète n'est pas en Production

Aujourd'hui, seul l'outil de recette en a besoin, et il ne s'affiche que hors
production. Les projections publiques se lisent avec la clé publiable. Elle
entrera en Production avec la file d'attente des leads, et pas avant : moins
une clé est déployée, moins elle fuit.

## Ce que contient la base aujourd'hui

| Table | Rôle | RLS |
|---|---|---|
| `bo_feedback` | Retours de recette (Mode Revue) | aucune policy : clé secrète seule |
| `ventes` | Ventes réalisées, déposées par le BO | lecture publique, écriture interdite |
| `biens_a_vendre` | Annonces cochées « France Immeuble » | lecture publique, écriture interdite |
| `leads_outbox` | Leads en attente si le BO ne répond pas | aucune policy : clé secrète seule |

Buckets : `bo-files` (privé, captures de recette), `ventes` (public, photos).

Schéma `public` et non `web` comme l'écrit le §2 : servir un second schéma par
l'API demande un réglage manuel du tableau de bord, qu'aucune migration ne
versionne. Les noms de table portent le rôle à la place du préfixe.

## À venir (feuille de route §14)

- `content.articles` — M3, import des 14 articles
- `web.stats`, `web.references`, `web.stats_villes` — M2, projections déposées
  par le BO
- `web.leads_outbox` — M4, file d'attente si le BO ne répond pas
