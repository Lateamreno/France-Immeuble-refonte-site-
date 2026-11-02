# Demande à la session BO : les recherches d'acquéreur comme au BO (02/11/2026)

MAV a revu le dépôt de recherche d'Acheter et la barre des immeubles à vendre
(retours #83 à #94 du 02/11). Il veut « la même chose que sur notre BO ». Le
site s'est aligné sur le contrat (§6) ; il lui manque quatre choses que seul le
BO peut porter. En attendant, le site recopie chaque valeur en clair dans le
`commentaire` de la recherche : rien ne se perd.

## 1. Occupation minimum et maximum d'une recherche

`recherche_acquereur` (chaque élément de `recherches`) et `recherche_compte`
portent maintenant :

| Champ | Contenu |
|---|---|
| `occupationMin` | entier de 0 à 100 (%), ou absent |
| `occupationMax` | entier de 0 à 100 (%), ou absent ; absent = sans limite |

Le `commentaire` commence alors par « Occupation recherchée : 50 à 100 %. ».
Merci de ranger ces deux champs dans la recherche, de les retirer du
commentaire si vous les lisez, et de les redéposer dans `compte_recherches`
(`occupation_min`, `occupation_max`) pour que le compte les affiche.

## 2. La société de l'acquéreur

`recherche_acquereur` porte `societe` (facultatif), au niveau du contact. Le
site l'écrit aussi en tête du commentaire de chaque recherche
(« Société : SCI Exemple. »). Merci de la ranger sur le contact.

## 3. Le type d'opération d'un immeuble à vendre

La barre propose « Type d'opération : Investissement / Marchand de biens ». Ce
choix devient la `cible` de la recherche enregistrée (une recherche par type,
le reste à l'identique, comme aujourd'hui). Il ne filtre pas encore la liste :
`biens_a_vendre` ne dit pas à quel type d'acquéreur un immeuble s'adresse. Si
le BO le sait, une colonne `operations text[]` (`Investisseur`, `Marchand de
biens`) permettrait au site de filtrer.

## 4. Pour information

- Profils proposés au site : `Investisseur` et `Marchand de biens` seulement
  (MAV : patrimonial et promoteur retirés du formulaire). Une recherche
  ancienne garde son profil.
- Le financement n'est plus demandé (MAV : le BO ne le garde pas).
- Budget : `prixMax` absent veut dire « 10 M€ et plus », sans limite.
- Lieux : toutes les communes de France (Base Adresse Nationale). Une région
  part comme la liste de ses départements ; une ville ajoute son département à
  `departements`, et son nom seul à `villes`.
