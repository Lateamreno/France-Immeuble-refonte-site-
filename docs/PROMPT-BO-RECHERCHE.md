# Demande à la session BO : les recherches d'acquéreur comme au BO (02/11/2026)

MAV a revu le dépôt de recherche d'Acheter et la barre des immeubles à vendre
du site (retours #83 à #94 du 02/11). Il veut « la même chose que sur notre
BO ». Le site s'est aligné sur le contrat (§6) ; il lui manque trois choses que
seul le BO peut porter. Côté site, tout est prêt : la base du site a ouvert les
colonnes (migration 0016, posée le 02/11). En attendant votre réponse, le site
recopie l'occupation et la société en clair dans le `commentaire` de chaque
recherche : rien ne se perd.

## 1. Occupation minimum et maximum d'une recherche

Chaque élément de `recherches` (`recherche_acquereur`) et chaque
`recherche_compte` peut porter :

| Champ | Contenu |
|---|---|
| `occupationMin` | entier de 0 à 100 (%), ou absent |
| `occupationMax` | entier de 0 à 100 (%), ou absent ; absent = sans limite |

Le `commentaire` commence alors par « Occupation recherchée : 50 à 100 %. ».

Merci de :
- ranger ces deux valeurs dans la recherche du contact ;
- les retirer du commentaire une fois rangées (ou nous dire de ne plus les y écrire) ;
- les redéposer dans `compte_recherches`, colonnes `occupation_min` et
  `occupation_max` (entiers 0 à 100), pour que le compte les affiche.

## 2. La société de l'acquéreur

`recherche_acquereur` porte `societe` (facultatif), au niveau du contact. Le
site l'écrit aussi en tête du commentaire de chaque recherche
(« Société : SCI Exemple. »). Merci de la ranger sur le contact.

## 3. Le type d'opération d'un immeuble à vendre

La barre du site propose « Type d'opération : Investissement / Marchand de
biens ». Le choix devient la `cible` de la recherche enregistrée (une recherche
par type, le reste à l'identique, comme aujourd'hui). Pour qu'il filtre aussi
la liste, le site doit savoir à qui s'adresse chaque immeuble.

Questions :
- Le BO sait-il, pour un bien en vente, s'il s'adresse à un investisseur, à un
  marchand de biens, ou aux deux ? D'où vient l'information (champ saisi par
  l'agent, déduction des lots, de l'occupation, des travaux) ?
- Si oui, merci de la déposer dans `biens_a_vendre.operations`, un tableau de
  texte parmi `Investisseur` et `Marchand de biens` (vide ou absent = non
  précisé ; le site garde alors le bien dans tous les résultats).

## 4. Pour information

- Profils proposés au site : `Investisseur` et `Marchand de biens` seulement
  (MAV : patrimonial et promoteur retirés du formulaire). Une recherche
  ancienne garde son profil.
- Le financement n'est plus demandé (MAV : le BO ne le garde pas).
- Budget : `prixMax` absent veut dire « 10 M€ et plus », sans limite.
- Lieux : toutes les communes de France (Base Adresse Nationale). Une région
  part comme la liste de ses départements ; une ville ajoute son département à
  `departements`, et son nom seul à `villes` (« Montreuil », « Lyon 3e
  Arrondissement »).

Merci de répondre en indiquant ce qui est livré, comme pour les annonces
(§14 du contrat).
