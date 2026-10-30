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

## 2 bis. Deux envois de plus (31/10)

- `coordonnees` : le client change lui-même son prénom, son nom, son téléphone ou son
  e-mail depuis Mon profil (MAV, 30/10). `{ type, ref, compte, prenom, nom, telephone, email,
  ancien_email? }`. `ancien_email` n'est présent que si l'adresse a changé (elle a été prouvée
  par un code envoyé à la nouvelle adresse). Merci de mettre la fiche contact à jour ; 503
  tant que vous ne le lisez pas.
- `message` porte désormais des `pieces` (§12.3) : cinq au plus, sous `<compte>/` dans le seau
  `depots-proprietaires`. Le site a vérifié le format réel de chaque fichier et refusé les
  anciens .doc/.xls, les .docx/.xlsx/.odt à macros et les PDF qui contiennent du code ou un
  fichier caché. À ranger avec le contact (au coffre de l'immeuble s'il y en a un), puis à
  effacer du seau.

## 2 ter. Rendez-vous : destinataires de l'alerte (MAV, 30/10)

Quand le client a un agent attitré, l'alerte d'une demande de rendez-vous part à l'agent et
à ma.voci@, sans contact@. Sans agent attitré, elle part à contact@ et à ma.voci@.

## 4. Prévenir le site après un dépôt (validé par MAV le 30/10)

Le site envoie lui-même les e-mails « Nouveau message », « Un immeuble vous est
proposé », « Une offre pour votre immeuble ». Il les envoie à chaque action d'un
client et une fois par jour. Pour que le client soit prévenu dans la minute :

```
POST https://www.france-immeuble.fr/api/compte/avis/
Authorization: Bearer <AVIS_SECRET>
```

juste après un dépôt contenant une ligne `de = 'agent'`, une proposition ou une
offre transmise. `AVIS_SECRET` est un secret à part, posé par MAV dans les deux
projets Vercel : il n'ouvre que cette route (la relance des leads garde son propre
secret). La route ne renvoie que des compteurs ; un appel en trop est sans effet.

## 4 bis. Photo de l'agent

Gardez `agent_photo` en adresse https publique de la photo. Le site la télécharge une
seule fois, la range chez lui et la sert lui-même. Une nouvelle photo = une nouvelle
adresse (le site garde la photo par adresse).

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
