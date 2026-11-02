# Demande à la session BO : annonces au niveau de Plein Bail (02/11/2026)

> **Livré par le BO le 02/11/2026 (contrat §14).** Toutes les colonnes du §1 sauf `ges`,
> `ges_min` (pas de GES au lot dans le BO) et `remonte_le` (pas de geste « remonter »).
> `charges_copro` = charges d'exploitation hors taxe foncière (monopropriété) : le site les
> libelle « Charges ». `occupation_lots` exclut caves, parkings, annexes et lots rattachés.
> `prix_precedent` / `prix_baisse_le` seulement pour une baisse après la première mise en
> ligne. `biens_lots` remplacée à chaque dépôt ; `charges_mois` et `disponible_le` toujours
> nuls ; `loyer_marche_mois` pour les lots vides seulement ; un lot sans numéro devient
> « Lot <rang> ». `offre_acquereur` et `message` avec `annonce` : 422 « Annonce inconnue ou
> plus en ligne. » si le bien n'est plus en ligne au BO. Le site ne met pas ce dépôt en file
> et répond au client que l'immeuble vient de sortir de la vente ; l'agence reçoit l'alerte.
> Le vendeur voit le nom de l'offrant, la société d'abord : la feuille d'offre le dit.

MAV veut que la page Immeubles à vendre du site reprenne le moteur de recherche
et la fiche annonce de Plein Bail. Le contrat (§3) prévoit déjà que le site
reçoive « exactement ce que reçoit Plein Bail, sans adresse ». La base du site
a ouvert les colonnes pour le recevoir (migration 0015, posée le 02/11). Tout
est facultatif : le site affiche ce qui arrive et cache le reste.

## 1. Colonnes en plus sur `biens_a_vendre`

| Colonne | Contenu | Remarque |
|---|---|---|
| `code_postal` | 5 chiffres | situe la commune ; le site fait un lien Google Maps « code postal + ville » |
| `commune_population` | entier (INSEE) | filtre « type de ville » |
| `loyer_hc_an_potentiel` | € par an | loyer réel des lots occupés + loyer de marché des lots vides |
| `rendement_potentiel` | **pourcentage** (9.39) | loyer potentiel ÷ (prix HAI + travaux) ; c'est lui que le site filtre, trie et affiche |
| `travaux_total` | € | 0 = aucun ; filtre avec / sans travaux |
| `dpe` / `dpe_min` | A à G | `dpe` reste la **pire** classe des lots, `dpe_min` la meilleure |
| `ges` / `ges_min` | A à G | même règle |
| `occupation_lots` | % | occupation par nombre de lots (`occupation` reste celle par surface) |
| `type_dominant` | `habitation`, `commercial`, `bureau` | plus de 70 % de la surface |
| `mixte` | booléen | plusieurs usages |
| `monopropriete` | booléen | |
| `taxe_fonciere`, `taxe_fonciere_recuperable` | € par an | la part récupérable = TEOM |
| `charges_copro`, `charges_copro_recuperables` | € par an | |
| `prix_net_vendeur`, `honoraires` | € | sinon le site déduit 5 % du net vendeur |
| `prix_precedent`, `prix_baisse_le` | €, date | badge « Prix baissé » pendant 30 jours |
| `remonte_le` | date | remise en tête de liste ; **ne jamais réécrire `publie_le`** |

## 2. Nouvelle table `biens_lots` : l'état locatif

Une ligne par lot, clé `(bien, numero)`, `bien` = `id` de `biens_a_vendre`.
Remplacez les lots d'un bien à chaque dépôt (suppression puis insertion). La
suppression du bien efface ses lots.

`numero` (« Lot 3 »), `ordre`, `type` (`habitation`, `commerce`, `bureau`,
`activite`, `parking`, `cave`, `autre`), `typologie` (« T2 »), `etage`,
`statut` (`occupe`, `libre`), `bail` (`nu`, `meuble`, `commercial`,
`professionnel`, `derogatoire`, `mixte`, `saisonnier`, `autre`), `bail_debut`,
`bail_fin`, `surface`, `loyer_hc_mois`, `charges_mois`, `loyer_marche_mois`
(lot vide), `disponible_le`, `etat` (`bon`, `a_rafraichir`, `a_renover`),
`travaux` (€), `dpe`.

**Jamais de nom de locataire ni d'enseigne** : la table n'a pas de colonne pour
en recevoir.

## 3. Deux envois du site à lire

- `offre_acquereur` sur une annonce porte maintenant, en plus du §13 :
  `offrant: { prenom, nom, societe? }`, `montant_finance`, `condition_pret`,
  `condition_visite` (booléens), `profil_joint` (le client demande que son
  profil investisseur accompagne l'offre). `conditions` reprend ces conditions
  en clair, une par ligne. Validité au choix 7, 15, 30 ou 45 jours.
- `message` peut porter `annonce` (l'`id` de `biens_a_vendre`) : une question
  posée depuis le bouton « Contacter » de la fiche. Merci de rattacher la
  conversation au bien.
