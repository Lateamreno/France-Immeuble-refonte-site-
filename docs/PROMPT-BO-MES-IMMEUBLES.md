# Demande à la session BO : « Mes immeubles » et fiabilité des dépôts (05/11/2026)

Audit de l'espace client fait le 05/11/2026 après les retours #261 à #278 de MAV
(« c'est super important »). Le site a corrigé sa part (lot 82). Voici ce qui
reste de votre côté, du plus urgent au moins urgent.

## 1. Incident du 05/11/2026 à 00:41:34 UTC : un compte vidé d'un coup

Les journaux de la base du site montrent, pour le compte `4d98c56b-…` (MAV), une
suite de `DELETE ?compte=eq.<compte>` sans dépôt avant, en moins d'une seconde, sur
`compte_recherches`, `compte_propositions`, `compte_demandes`, `compte_biens`,
`compte_estimations`, `compte_documents`, `compte_offres`, `compte_messages`,
`compte_mandats`, `compte_visites`, `compte_dossiers_bien`. Seul `compte_agent` a été
redéposé. Quatre minutes plus tôt (00:37), le même compte avait quatre recherches.

Pour le client, c'est un compte qui se vide sans raison : ses recherches et ses
messages disparaissent. Merci de :

- trouver pourquoi la projection de ce compte est revenue vide (contact fusionné ?
  rattachement changé ? requête en erreur traitée comme « rien à déposer » ?) ;
- **ne jamais vider une table du compte quand la lecture du contact a échoué** :
  en cas d'erreur, ne rien toucher et réessayer au passage suivant. Ne retirer une
  ligne que si elle a vraiment disparu du CRM ;
- redéposer le compte de MAV.

## 2. Un immeuble dans le compte dès l'estimation

MAV (retours #261, #274) : « Les immeubles devraient tous apparaître sur la page
directement […] dès le moment où j'ai rempli un formulaire d'estimation. »

Le site le fait maintenant tout seul avec sa copie (`compte_saisies`, type
`estimation`). Pour que la fiche du BO prenne le relais :

- dès qu'une `estimation` arrive avec `compte` (ou dès qu'un compte est rattaché à un
  contact qui a des immeubles à « 1 - FORMULAIRE »), déposez l'immeuble dans
  `compte_biens` avec `etape = "estimation"` ;
- remplissez la nouvelle colonne **`compte_biens.ref`** (migration 0017 du site) avec la
  `ref` de l'estimation dont l'immeuble est issu. Le site cache alors sa copie et
  affiche votre fiche (frise, estimation, offres) à la place. Sans `ref`, le client
  verrait l'immeuble deux fois ;
- déposez l'estimation chiffrée dans `compte_estimations` (`bien_cle`) dès que l'agent
  l'a validée.

## 3. L'état locatif peut maintenant être renvoyé, et viser un immeuble déjà déposé

Toujours `type: "estimation"`, `etat: "dossier"`, même format de lots qu'avant.
Deux nouveautés :

- le client peut le **renvoyer** autant qu'il veut depuis son compte (onglet État
  locatif de l'immeuble) : chaque envoi **remplace** le précédent pour cet immeuble,
  sans écraser ce qu'un agent a saisi lui-même ;
- pour un immeuble que vous avez déjà déposé sans `ref`, l'envoi porte **`bien`** (la
  `cle` de `compte_biens`) et une `ref` calculée par le site, que vous ne connaissez
  pas : rattachez les lots à `bien`.

### 3 bis. L'état locatif arrive aussi pendant la saisie (lot 85, MAV, 05/11/2026)

Le client n'a plus besoin de valider pour que ses lots vous parviennent. Le site dépose le
même `etat: "dossier"` (même `ref`, même format de lots) **pendant la saisie**, avec
**`enCours: true`** : toutes les 45 s au plus, quand le client quitte la page ou appuie sur
« Enregistrer », et chaque nuit pour un brouillon modifié puis abandonné. Un client qui ne crée
pas de compte vous a donc quand même transmis ses lots.

- Chaque dépôt **remplace** l'état locatif de l'immeuble, comme un renvoi.
- `enCours: true` = saisie pas terminée : pas d'alerte, pas de tâche pour l'agent. Le dépôt
  final (sans `enCours`) arrive quand le client valide ou appuie sur « J'ai terminé », avec
  l'alerte habituelle à l'agence.
- Le site n'envoie un nouveau dépôt que si les lots ont changé. Attendez-vous quand même à
  plusieurs dépôts par immeuble : répondez 200 à chacun, le rate limiting ne doit pas les
  refuser (comptez une dizaine par client et par heure au plus).

## 4. Pièces d'un immeuble pas encore déposé

Le type `document` peut porter **`refEstimation`** à la place de `bien` : la pièce
concerne l'immeuble créé par cette estimation. Même rangement, même effacement du
seau qu'avant. Tant que vous ne lisez pas ce champ, répondez 503 : le dépôt attend
dans la file du site, la pièce dans le seau.

## 5. Nom d'une recherche

Nouveau type, sans e-mail à l'agence :

```json
{ "type": "recherche_nom", "ref": "<uuid>", "compte": "<uuid>", "cle": "<cle de compte_recherches>", "nom": "Rive droite, 12 lots" }
```

Le client renomme sa recherche au crayon (retour #271). Un `nom` vide rend son titre
d'origine. Gardez-le sur la recherche ; si vous voulez le redéposer, dites-le : le
site ajoutera une colonne `compte_recherches.nom`.

## 6. Le passage en C ouvre l'accès

MAV (retour #270) : « valider mon accès » doit disparaître « dès que le BO a validé et
passé le client en C ». Le site se fie à `compte_agent.appele`. Merci de le passer à
`true` dès que l'acquéreur est en C (et pas seulement quand un appel est noté), avec
les champs de l'agent attitré.

## 7. Recherche en double « Marchand de biens »

Retour #269 : l'ancien formulaire du site pouvait envoyer une recherche « Marchand de
biens » restée cachée quand le client revenait en arrière pour ne garder
qu'« Investissement ». C'est corrigé côté site. S'il en reste dans le CRM pour MAV,
merci de la retirer.
