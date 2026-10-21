# Base Supabase du SITE

Ce dossier porte les migrations du projet Supabase **du site**, et de lui seul.

> **Jamais le projet du BO.** Le CRM contient les coordonnées de 1 372
> investisseurs. Le site ne détient aucune clé vers cette base — pas même en
> lecture seule (CLAUDE.md §2 et §16). Les migrations du BO vivent dans le repo
> du BO : deux repos qui migrent la même base, c'est la panne garantie.

## Mise en place

Projet : **France Immeuble site** — `omtkttpvfjsbnqsajcsp`, créé le 21/10/2026.

1. ✅ `0001_revue_feedback.sql` — appliquée.
2. ✅ `0002_projections.sql`, `0003_recits_ventes.sql`, `0004_contrat_bo.sql`
   et la graine des 44 ventes — appliquées le 21/10/2026 par le connecteur
   Supabase.
   `A-COLLER-SITE.sql` réunit les trois, rejouable sans risque : il sert à
   reconstruire la base, ou si le connecteur est indisponible. Généré par
   `node scripts/graine-ventes.mjs` : ne pas l'éditer à la main.

   ⚠️ Par le connecteur, `apply_migration` et toute requête contenant un
   `drop` expirent sans rien appliquer. `execute_sql` en petits morceaux, sans
   `drop`, passe. Conséquence : ces migrations n'apparaissent pas dans
   l'historique `supabase_migrations` (seule 0001 y figure).

   Vérifié après application : 44 ventes, 44 slugs ; avec la clé publiable,
   lecture des ventes et des biens OK, écriture et suppression refusées,
   `leads_outbox` et `bo_feedback` illisibles. Conseiller sécurité Supabase :
   aucune alerte hors « RLS sans policy » sur ces deux tables, voulu.
3. Variables Vercel, projet `france-immeuble-refonte-site` :

   | Variable | Environnements | État |
   |---|---|---|
   | `SITE_SUPABASE_URL` | Production, Preview, Development | ✅ posée |
   | `SITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | ✅ posée |
   | `SITE_SUPABASE_SECRET_KEY` | Production, Preview, Development — *Sensitive* | ✅ posée (la file des leads en a besoin en production) |
   | `BO_LEAD_ENDPOINT` | Production, Preview, Development | ⏳ MAV — l'adresse de dépôt du BO |
   | `BO_LEAD_TOKEN` | Production, Preview, Development — *Sensitive* | ⏳ MAV — jeton propre à cette adresse, **jamais une clé Supabase** (le code la refuse) |
   | `CRON_SECRET` | Production — *Sensitive* | facultatif : réserve la relance planifiée à Vercel |

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
| `ventes` | Ventes réalisées, faits et récits validés, déposés par le BO | lecture publique, écriture interdite |
| `biens_a_vendre` | Annonces cochées « France Immeuble » | lecture publique, écriture interdite |
| `leads_outbox` | Leads en attente si le BO ne répond pas | aucune policy : clé secrète seule |
| `offmarket` | Nombre d'immeubles off-market par commune, remplacé par le BO à 9 h et 19 h via `rpc/remplacer_offmarket` | lecture publique ; la fonction n'est exécutable qu'avec la clé secrète |

Buckets : `bo-files` (privé, captures de recette), `ventes` et `biens`
(publics, photos).

### Garde-fous portés par la base (0003)

- Un récit sans `recit_valide_le` est refusé : pas de publication sans
  relecture humaine (CLAUDE.md §8).
- Un titre, chapô, composition ou récit contenant « rue Victor-Hugo » ou
  « 92100 Boulogne » est refusé (§2).
- Le slug d'une vente, et depuis 0004 celui d'un bien à vendre, est généré par
  la base et ne change plus une fois posé : une URL indexée ne bouge pas (§10).
- `ventes.rue` refuse tout chiffre : la rue s'affiche sans le numéro (0004).
- 0005 : slugs de vente sans année (`immeuble-de-rapport-<commune>`), et trois
  faits de plus déposés par le BO : `loyer_potentiel` (€/an), `ecart_estimation`
  (% du prix de vente par rapport à l'estimation, de -100 à 100) et
  `delai_offre_jours` (mise en commercialisation → offre retenue).

Testé le 21/10/2026 sur un Postgres 16 local : fichier rejoué deux fois, rejoué
par-dessus l'ancienne version, et chacun des refus ci-dessus vérifié.

Schéma `public` et non `web` comme l'écrit le §2 : servir un second schéma par
l'API demande un réglage manuel du tableau de bord, qu'aucune migration ne
versionne. Les noms de table portent le rôle à la place du préfixe.

## À venir (feuille de route §14)

- `content.articles` — M3, import des 14 articles
- `web.stats`, `web.references`, `web.stats_villes` — M2, projections déposées
  par le BO
- `web.leads_outbox` — M4, file d'attente si le BO ne répond pas
