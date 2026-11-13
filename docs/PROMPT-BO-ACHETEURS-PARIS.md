# Demande à la session BO : acheteurs d'immeubles parisiens (13/11/2026)

MAV, 13/11/2026, en relisant la page `/vendre-un-immeuble/paris/` :

- retour #299, sur le chapeau du hero : « notre réseau de X acheteurs parisiens (mettre le vrai
  chiffre d'acheteurs d'immeuble à PARIS dans notre base IDF y compris) » ;
- retour #300, sur la première preuve : « Uniquement les acheteurs paris et IDF stp et dire du
  coup que c'est les acheteurs d'immeubles parisiens » ;
- retour #331, sous les cartes de la vente : « faut dire le nombre d'acquéreurs qu'on a pour les
  immeubles à Paris en marchand, investi et patrimonial ».

Le site ne peut pas compter ces acquéreurs : il ne lit rien du BO (CLAUDE.md §2). C'est au BO de
déposer le résultat.

## Ce que le site attend

Dans la table `chiffres` de la base du site, celle où le BO dépose déjà `investisseurs`,
`immeubles_traites` et les `recherches_*` à 9 h et 19 h, quatre nouvelles lignes au même format
(`cle`, `valeur`, `maj_le`) :

| `cle` | `valeur` |
|---|---|
| `acheteurs_paris` | nombre d'acquéreurs distincts dont au moins une recherche active couvre Paris |
| `acheteurs_paris_investisseur` | même périmètre, recherches de profil Investissement |
| `acheteurs_paris_marchand` | même périmètre, recherches de profil Marchand de biens |
| `acheteurs_paris_patrimonial` | même périmètre, recherches de profil Patrimonial |

### Définition exacte

- **Un acquéreur compte une fois**, quel que soit le nombre de ses recherches.
- **Une recherche couvre Paris** quand sa localisation contient au moins l'un de ces lieux : la
  commune de Paris, un arrondissement de Paris, le département 75, ou l'Île-de-France entière.
  Une recherche limitée à d'autres départements (92, 93, 94…) ou à d'autres communes ne compte
  pas, même en Île-de-France. Une recherche sans localisation, ou sur la France entière, ne compte
  pas non plus (à faire confirmer par MAV).
- **Recherche active** : la même définition que pour les `recherches_*` déjà déposées (une
  recherche en cours, ni archivée ni clôturée).
- **Par profil** : le profil est celui de la recherche qui couvre Paris. Un acquéreur qui a deux
  recherches parisiennes de profils différents compte dans chacun des deux profils, et une seule
  fois dans `acheteurs_paris`. Le site n'additionne pas les trois profils : leur somme peut être
  supérieure ou inférieure au total.
- **Le vrai chiffre**, sans arrondi (MAV : « mettre le vrai chiffre »). C'est la différence avec
  `investisseurs`, qui reste à 1 500 (décision de MAV du 26/10/2026).
- Un entier, rien d'autre : ni nom, ni société, ni liste, ni identifiant. C'est un agrégat
  anonyme (CLAUDE.md §2, décision de MAV du 04/11/2026 sur les agrégats).
- Un compte à zéro : déposer 0. Le site ne l'affiche pas et revient au chiffre global. Si une clé
  n'est plus calculée, supprimer sa ligne : une ancienne valeur resterait affichée.

### Rythme

Avec les autres chiffres, à 9 h et 19 h, par le même dépôt. Pas de tâche à part.

## Ce que fait le site

Lecture dans `src/lib/chiffres.ts` (`acheteursParis`, `acheteursParisPar`), sur la seule page
`/vendre-un-immeuble/paris/`.

| | Tant que la clé manque | Dès qu'elle est déposée |
|---|---|---|
| Chapeau du hero | « un réseau de 1 500 acheteurs d'immeubles » (`investisseurs`) | « un réseau de N acheteurs d'immeubles parisiens » |
| Première preuve | « 1 500 acheteurs d'immeubles dans notre base » | « N acheteurs d'immeubles parisiens dans notre base » |
| Chapeau de la vente | « auprès de nos 1 500 acheteurs » | « auprès de nos N acheteurs d'immeubles parisiens » |
| Description de la page | « auprès de 1 500 acheteurs » | « auprès de N acheteurs » |
| Investisseurs | « `recherches_investisseur` recherches en cours, partout en France » | « N acheteurs pour Paris » |
| Marchands de biens | « `recherches_marchand` recherches en cours en Île-de-France » | « N acheteurs pour Paris » |
| Acheteurs patrimoniaux | « `recherches_patrimonial` recherches en cours à Paris et dans les Hauts-de-Seine » | « N acheteurs pour Paris » |

- Chaque clé est lue à part : un profil déposé s'affiche même si les autres manquent.
- Aucun chiffre de repli n'est inventé : sans la clé, le site garde le chiffre qu'il affichait
  déjà, avec son vrai libellé.
- Le changement est en ligne sous 10 minutes après le dépôt, sans redéploiement.
- La FAQ de la page garde le chiffre global (« notre base compte 1 500 acheteurs d'immeubles »).

## Frontière de sécurité

Rien ne change : le BO dépose, le site ne demande rien au BO et ne détient aucune clé vers sa
base. Si la base du site était aspirée, ces quatre lignes ne livreraient que des nombres déjà
affichés sur la page.

## Réponse attendue de la session BO

1. La confirmation des quatre clés et la date du premier dépôt.
2. La définition retenue pour « recherche active », et si les acquéreurs qui n'ont pas encore eu
   leur premier appel avec un agent sont comptés (à faire trancher par MAV s'il y a un doute).
3. Les quatre valeurs du premier dépôt, pour contrôler l'affichage.
4. Ce que vous faites des recherches sans localisation ou sur la France entière.
