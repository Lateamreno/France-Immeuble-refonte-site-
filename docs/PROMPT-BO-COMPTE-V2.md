# Demande à la session BO : compte client v2 (30/10/2026)

Le site a livré l'espace client v2 (option B). Tout ce que le client saisit part
déjà au BO par l'adresse de dépôt des leads. Voici ce qui reste à faire de votre
côté, du plus urgent au moins urgent.

## 1. Lire les trois formats du §13 (aujourd'hui en 503, gardés en file par le site)

- `rendez_vous` : demande sur calendrier (date, `creneau` matin / apres_midi / soir,
  `objet` visite / estimation / signature / autre, `texte`, `bien` ou `proposition`).
- `offre_acquereur` : offre au curseur sur un bien proposé (`proposition`, `montant`,
  `financement`, `apport`, `validite_jours`, `conditions`, `pieces: []`). Le site
  ajoute `bienTitre` pour lisibilité ; vous pouvez l'ignorer.
- `profil_investisseur` : un nouvel envoi remplace le précédent.

Répondre 200 seulement une fois l'envoi enregistré (règle du §11.1).

## 2. Une demande d'appel arrive comme un `message`

Titre « Demande d'appel », texte « Je souhaite être appelé, de préférence le matin,
au 06… ». Elle vient d'un acquéreur non encore appelé. Merci de la faire remonter en
tête des Questions. Après l'appel, `compte_agent.appele = true` et les champs de
l'agent remplis : le site affiche alors sa carte et le met en copie des alertes.

## 3. Nouvelles projections à déposer (tables à créer côté site sur votre feu vert)

| Table | Contenu | Usage dans le compte |
|---|---|---|
| `compte_rendez_vous` | date, créneau, objet, `etat` demande / confirme / annule, `bien_cle` | « Mes demandes » passe de « À confirmer » à « Confirmé » |
| `compte_mandats` | `bien_cle`, `etat` envoye / signe, `signe_le`, `document` (PDF dans `documents-clients/<compte>/mandats/<cle>.pdf`) | onglet Mandat de l'immeuble |
| `compte_visites` | `bien_cle`, `visite_le`, `retour` (texte **anonymisé** : jamais de nom ni de société), `interet` faible / moyen / fort | « Retours de visite » de la vue d'ensemble |
| `compte_dossiers_bien` | `proposition`, `nom`, `categorie`, `document` (PDF dans `documents-clients/<compte>/dossiers/…`) | documents d'un bien ouverts dès l'envoi du dossier |

Même forme que les autres `compte_*` : clé `(compte, cle)`, lecture par le seul
titulaire, écriture par vous. Le site sert les PDF par son propre serveur, après
avoir vérifié que la ligne appartient au compte et que le chemin commence par
`<compte>/`.

## 4. Prévenir le site après un dépôt (facultatif, recommandé)

Le site envoie lui-même les e-mails « Nouveau message », « Un immeuble vous est
proposé », « Une offre pour votre immeuble ». Il les envoie à chaque action d'un
client et une fois par jour. Pour que le client soit prévenu dans la minute :

```
POST https://www.france-immeuble.fr/api/compte/avis/
Authorization: Bearer <CRON_SECRET du site>
```

juste après un dépôt contenant une ligne `de = 'agent'`, une proposition ou une
offre transmise. La route ne renvoie que des compteurs. Si vous préférez ne pas
détenir ce secret, dites-le : on passera par un déclencheur dans la base du site.

## 5. Ce que votre tableau du 30/10 laisse « à faire », côté site

Le site est prêt à afficher ces données dès qu'elles arrivent. Proposition de noms, à
confirmer dans le contrat :

- **Dates de la frise** : colonnes `mandat_le`, `offre_acceptee_le`, `compromis_le`, `acte_le`
  (date, nullables) sur `compte_biens`. Le site les affichera sous chaque étape.
- **Estimation détaillée** : sur `compte_estimations`, `valeur_basse`, `valeur_haute`,
  `loyer_marche` (€/m²/an), `delai_jours`, et une table `compte_comparables` (commune, lots,
  surface, prix au m², année ; jamais d'adresse ni de nom).
- **Retours de visite**, **mandat**, **rendez-vous confirmés**, **documents des biens** : voir §3.

## 6. Données du secteur (estimation détaillée)

Le site calcule aujourd'hui les repères du département à partir des ventes déjà
publiées (prix médian au m², rendement, délai jusqu'à l'offre, écart à
l'estimation). Si vous voulez des repères plus fins (commune, arrondissement),
déposez-les dans `web.stats_villes`, sans donnée nominative.
