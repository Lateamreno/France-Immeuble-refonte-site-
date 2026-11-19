# Réponse du site au contrat du BO §19 : les statistiques d'une annonce

> Lot 141, 19/11/2026. À reporter dans `docs/CONTRAT-SITE.md` du dépôt du BO (le site ne peut pas
> y écrire). Le contrat fait foi ; ce document dit ce que le site a mis en place.

## La table

`public.annonce_stats_jour`, base du site (projet `omtkttpvfjsbnqsajcsp`), **créée le 19/11/2026**
(migration `supabase/migrations/0028_annonce_stats_jour.sql`). Elle est vide tant que le code qui
compte n'est pas en production : il attend l'accord de MAV.

Clé : (`bien_id`, `jour`). Une ligne n'existe que si quelque chose a été compté ce jour-là pour cette
annonce : un jour sans ligne vaut zéro partout.

| Colonne | Type | Ce qu'elle compte |
|---|---|---|
| `bien_id` | text | `biens_a_vendre.id` |
| `jour` | date | le jour **à Paris** |
| `impressions` | int | l'annonce est apparue dans une liste : `/immeubles-a-vendre/` (résultats et « en dehors de votre recherche »), la ligne « Nos immeubles de rapport à vendre » de la page Acheter, les biens similaires en bas d'une fiche, « En vente sur le site et dans vos critères » du compte acquéreur. Une fois par chargement de liste. |
| `vues` | int | la fiche ouverte, **une fois par visiteur et par heure** |
| `visiteurs` | int | visiteurs distincts de la fiche dans la journée |
| `clics_telephone` | int | « Voir le n° », puis tout clic sur un numéro (`tel:`) pendant qu'on est sur la fiche : la carte d'action, la barre du téléphone, « Appeler » de la section du dossier, le numéro de la barre de menu. Les deux comptent : « Voir le n° » puis le numéro font 2. |
| `clics_dossier` | int | « Contacter » (carte d'action et barre du téléphone), qui mène à la demande du dossier. L'envoi du formulaire, lui, arrive au BO par `/api/site/lead` comme avant. Le site ne propose aucune pièce à télécharger sur une fiche. |
| `partages` | int | la feuille de partage du téléphone, ou une entrée du menu de partage de l'ordinateur (copier le lien, WhatsApp, e-mail, SMS) |
| `positions_somme` | bigint | somme des rangs dans les listes (1 = première annonce de la liste). **Position moyenne = `positions_somme / impressions`** (conseil de mesure du §19). |
| `maj_le` | timestamptz | dernière mise à jour de la ligne |

## Lire la table depuis le BO

Avec la clé de service du site que le BO a déjà. RLS activée sans aucune règle : ni la clé publique,
ni un compte connecté n'y ont accès.

```
GET {SITE_SUPABASE_URL}/rest/v1/annonce_stats_jour
    ?bien_id=eq.{id}&jour=gte.2026-11-01&jour=lte.2026-11-30&order=jour
```

Pour un total sur la période : additionner les colonnes. **Ne pas additionner `visiteurs`** d'un jour
à l'autre en parlant de « visiteurs distincts du mois » : un même visiteur revenu trois jours compte
trois fois (le site ne peut pas le reconnaître d'un jour à l'autre, c'est voulu). Écrire « visites »
ou « visiteurs par jour ».

## Ce qui n'est pas compté

- **Robots et aperçus de liens** : rien n'est compté sans script exécuté dans la page, et le serveur
  écarte encore les agents utilisateurs de robots, d'outils et d'aperçus (WhatsApp, Messenger,
  Telegram, Slack, LinkedIn, iMessage…) ainsi que les navigateurs pilotés.
- **L'équipe** : chaque membre ouvre une fois `https://www.france-immeuble.fr/api/stats/equipe/` sur
  chaque navigateur et chaque téléphone qu'il utilise. Un cookie (`fi_equipe`, valeur « 1 », 400 jours)
  exclut ce navigateur. `?retirer=1` l'efface.
- **Les aperçus Vercel** : seule la production compte.
- **Les identifiants inconnus** : seuls les `biens_a_vendre.id` en ligne au moment du clic sont gardés.
- **Les préchargements** du navigateur.

## Sans donnée personnelle

- `annonce_stats_jour` ne contient que des compteurs.
- Le dédoublonnage des vues et des visiteurs passe par une empreinte calculée par le serveur du site :
  un HMAC-SHA256 de la date, de l'adresse IP et du navigateur, avec un secret du serveur. Elle change
  chaque jour et ne permet pas de retrouver l'adresse IP. Elle est rangée dans
  `annonce_stats_empreintes` (même protection) et **effacée chaque matin** par la tâche quotidienne
  (`purger_stats_annonces`). L'adresse IP n'est jamais écrite.
- Le navigateur ne garde rien : ni cookie de mesure, ni stockage local.

## Pas fait, à la demande

- **Recherches sans résultat** (conseil du §19) : non fait. Proposition : une table
  `recherches_sans_resultat_jour` (jour, critères normalisés, nombre), à faire si MAV le veut.
- **Impressions côté serveur** : les pages de liste sont en cache (rendues une fois toutes les 10
  minutes), le serveur ne voit donc pas chaque chargement. Les impressions partent du navigateur, une
  fois la liste affichée ; un visiteur dont le navigateur bloque les scripts n'est pas compté.
