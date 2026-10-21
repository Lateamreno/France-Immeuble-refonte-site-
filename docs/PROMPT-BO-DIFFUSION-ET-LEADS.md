# Prompt à coller dans la session Claude Code du BO

> Tout ce qui suit la ligne ci-dessous est destiné à la session qui travaille
> sur le back-office France Immeuble. Copiez-le tel quel.

---

## Objectif

Ajouter **le site france-immeuble.fr comme seconde destination de diffusion**, à
côté de PleinBail, dans le panneau de diffusion existant (celui qui affiche
« En ligne », « Retirée », « à republier », « Voir l'annonce »).

Le site publie quatre choses, toutes déposées par le BO :

| Sur le site | Vient de | Destination |
|---|---|---|
| Biens à vendre | fiches immeuble diffusées | table `biens_a_vendre` |
| Vignettes « Sous offre » | mêmes fiches, statut avancé | table `biens_a_vendre`, `statut = 'sous_offre'` |
| Biens vendus | fiches passées au statut vendu | table `ventes` |
| Retraits | retrait, archivage, case décochée | suppression dans `biens_a_vendre` |

**Le site ne lit jamais le BO.** C'est le BO qui écrit dans la base du site.
Jamais l'inverse : aucune clé du BO ne doit aller côté site.

## Ce qui existe déjà — relevé le 21/10/2026

- Le pont vers PleinBail part de **`bo_immeuble`**, pas de `bo_annonce`. Côté
  PleinBail, chaque annonce porte `import_reference = "FI:<_id de bo_immeuble>"`.
- 15 fiches sont parties chez PleinBail : 14 au statut « 6 - Commercialisé
  (all) », 1 au statut « 10 - Acte programmé ». Il y a 30 fiches au statut 6
  non archivées : le pont applique donc déjà une sélection. **Reprendre
  exactement la même sélection**, ne pas en inventer une seconde.
- `bo_commercialisation.Portails_immobilier` vaut `["France Immeuble"]`.
- `bo_vente` contient 44 ventes publiées (2019 → 2026).

## 1 — L'interface : deux cases, cochées par défaut

Dans l'étape de publication, et sur chaque ligne du panneau de diffusion :

- ☑ **PleinBail**
- ☑ **Site France Immeuble**

Les deux cases sont **cochées par défaut**, et chacune se décoche seule. C'est
volontaire : l'oubli doit consister à ne pas décocher, pas à ne pas cocher.

Décocher « Site France Immeuble » retire le bien du site **au prochain dépôt**.
Il ne doit pas rester en ligne jusqu'à ce que quelqu'un y repense.

Journaliser qui a coché ou décoché quoi, et quand. Publier l'immeuble d'un
vendeur qui avait demandé la discrétion est une erreur qu'on veut pouvoir
retracer.

Ne pas réutiliser `DIFF - OffMarket` comme contraire de ces cases. Un bien peut
être sur PleinBail sans être sur le site, sans pour autant être off-market. Ce
sont trois informations distinctes.

## 2 — Le cycle de vie, statut par statut

| Statut `bo_immeuble` | Case site cochée | Action sur la base du site |
|---|---|---|
| 6 - Commercialisé (all), retenu par le pont | oui | upsert `biens_a_vendre`, `statut = 'en_vente'` |
| 7 Sous offre · 8 Compromis programmé · 9 Sous compromis · 10 Acte programmé | oui | upsert `biens_a_vendre`, `statut = 'sous_offre'` |
| 11 - VENDU | — | **supprimer** de `biens_a_vendre` **et** upsert dans `ventes` |
| 5 - Commercialisé (A/B) — off-market | — | supprimer de `biens_a_vendre` |
| 0 - RETIRé, archivé, ou case décochée | — | supprimer de `biens_a_vendre` |

À valider avec MAV : le passage en « sous offre » dès le statut 7. C'est ma
proposition, pas un relevé.

## 3 — La connexion

Base Supabase **du site** : projet « France Immeuble site »,
`https://omtkttpvfjsbnqsajcsp.supabase.co`.

Le BO a besoin de **la clé secrète de ce projet** (`sb_secret_…`), à ranger dans
les variables d'environnement **du BO** sous un nom explicite, par exemple
`SITE_FI_SUPABASE_URL` et `SITE_FI_SUPABASE_SECRET_KEY`. Le BO a le droit de
connaître la base du site ; le site n'a pas le droit de connaître celle du BO.

**Les tables existent déjà.** Elles sont créées par le repo du site
(`supabase/migrations/0002_projections.sql`). Le BO **ne crée ni ne modifie
aucune table** de cette base : il dépose seulement. Un seul repo possède les
migrations d'une base, sinon c'est la panne garantie. S'il manque une colonne,
demander à MAV de la faire ajouter côté site.

## 4 — Contrat de `biens_a_vendre`

| Colonne | Source | Règle |
|---|---|---|
| `id` | `bo_immeuble._id` | clé d'upsert |
| `slug` | à générer | **ne change plus jamais** une fois publié : c'est l'URL de la fiche, `/immeubles-a-vendre/<slug>/` |
| `statut` | statut BO | `'en_vente'` ou `'sous_offre'` (voir §2) |
| `titre` | le même que pour PleinBail | |
| `description` | la même que pour PleinBail | texte brut, paragraphes séparés par une ligne vide |
| `ville`, `dept` | adresse | `dept` sur deux caractères : `"06"`, `"93"` |
| `type` | | `"Immeuble de rapport"` par défaut |
| `surface` | m² | nombre |
| `lots`, `annee_construction` | | entiers |
| `loyer_hc_an` | loyer annuel HC actuel | euros |
| `prix_hai` | prix honoraires inclus | euros, > 0 |
| `rendement` | rendement brut actuel | **en %** : `8.98`, pas `0.0898` |
| `occupation` | taux d'occupation en surface | **en %** : `100`, pas `1` |
| `prix_m2` | | euros |
| `dpe` | | une lettre `A` à `G`, ou null |
| `travaux` | travaux à prévoir | texte libre, ou null |
| `images` | photos | chemins dans le coffre `biens` (voir §6) |
| `publie_le` | première publication | ne pas réécrire à chaque dépôt |
| `maj_le` | | `now()` à chaque dépôt |

⚠️ **Les unités.** PleinBail stocke rendement et occupation **en fractions**.
Recopiés tels quels, un immeuble plein s'afficherait « occupé à 1 % ». La base
du site rejette tout rendement hors de 1 à 40 % : un dépôt resté en fraction
échoue au lieu d'afficher « 0,09 % brut ». **Il faut multiplier par 100.**

## 5 — Contrat de `ventes`

| Colonne | Source |
|---|---|
| `id` | `_id` de la vente (`bo_vente`) ou de la fiche immeuble |
| `ville`, `dept` | adresse |
| `prix` | prix de vente honoraires inclus, euros |
| `date` | date de l'acte, `AAAA-MM-JJ` |
| `region` | `'idf'`, `'sud-ouest'` ou `'autre'` |
| `image` | chemin dans le coffre `ventes` (voir §6) |

Les 44 ventes actuelles y sont déjà chargées. Un upsert sur `id` ne crée pas de
doublon.

## 6 — Ce qui ne traverse JAMAIS

- ❌ **L'adresse** : rue, numéro, code postal complet. Commune et département
  suffisent. C'est aussi ce que fait PleinBail.
- ❌ **Les coordonnées GPS.**
- ❌ Le nom du propriétaire, ses coordonnées, sa société, le motif de vente.
- ❌ Le numéro de mandat, les honoraires internes, les notes.
- ❌ Tout identifiant qui permette de remonter à `bo_contact`.

**Les photos** : les copier dans le coffre du projet **du site** — `biens` pour
les biens à vendre, `ventes` pour les ventes — et les **renommer sur un
identifiant neutre**, par exemple `<_id>-1.jpg`. Les noms d'origine portent
parfois l'adresse : j'ai trouvé `Immeuble 47 rue des bas Fossés 77260 La Ferté
Sous Jouarre.jpg` dans `bo_vente`. Publier ce nom revient à publier l'adresse.
Supprimer les photos du coffre quand le bien est retiré.

## 7 — Robustesse

- **Upsert sur `id`** partout : un dépôt rejoué ne duplique rien.
- **Rapprochement complet une fois par nuit** : supprimer de `biens_a_vendre`
  toute ligne dont l'`id` n'est plus dans l'ensemble publié. Cela rattrape les
  retraits manqués.
- Un dépôt rejeté par une contrainte de la base doit être **journalisé et
  visible** dans le panneau de diffusion, par exemple avec la mention « à
  republier ». Il ne doit pas échouer en silence.
- Le site relit la base toutes les 10 minutes. Un bien publié apparaît donc en
  ligne au plus tard 10 minutes après le dépôt.

## 8 — Recette

1. Publier un bien test : il apparaît sur `/immeubles-a-vendre/` en moins de
   10 minutes, sans adresse, rendement et occupation en %, photos affichées.
2. Le passer en statut 7 : sa vignette porte « Sous offre ».
3. Décocher « Site France Immeuble » : il disparaît du site, et reste sur
   PleinBail.
4. Le passer en statut 11 : il disparaît des biens à vendre et apparaît dans
   `/immeubles-vendus/`.
5. Rejouer le dépôt deux fois : aucun doublon.
6. Ouvrir le coffre `biens` : aucun nom de fichier ne contient de rue.

---

## Second chantier — les formulaires du site alimentent le BO

C'est le dernier vrai blocage avant la mise en ligne du site : **aujourd'hui,
aucun formulaire n'arrive nulle part.**

Le site poste vers **un endpoint du BO qui ne sait qu'enregistrer**. Il n'a
aucune lecture, jamais. Un jeton volé ne permet que de créer de faux leads :
c'est du bruit, pas une fuite. D'où le **rate limiting obligatoire**.

### Vendre et Estimer → un immeuble en prospect

`POST` sur l'endpoint, corps JSON avec `type: "estimation"`, `ref` (uuid généré
par le site), `etat` (`"principal"` puis `"complement"`), identité, adresse,
surface, loyer annuel, détail des lots, travaux, échéance, `source`.

Créer un `bo_immeuble` au statut **« 1 - FORMULAIRE »**, qui le fait apparaître
dans le tableau de bord « prospects, formulaire à traiter ».

⚠️ **Le formulaire du site est en deux temps, et le visiteur ne le sait pas.**
Le premier envoi suffit à créer le lead. Le complément arrive ensuite **avec le
même `ref`** : il complète la fiche existante, sans créer de doublon. Si le
visiteur abandonne après le premier écran, le lead est déjà dans le BO.

⚠️ **Bug à ne pas reproduire** : dans l'ancien formulaire, les libellés
« bureaux » et « commerces » étaient inversés par rapport aux noms de champs.
Vérifier la correspondance avec une saisie témoin.

### Dépôt de recherche → un contact et une recherche

`type: "recherche"`. En une transaction :

1. **Chercher le `bo_contact` par email** avant d'en créer un : le fichier
   compte 3 834 contacts.
2. Créer la `bo_recherche` rattachée, au statut **D** (client inconnu).
3. Renseigner `Cible` à partir du profil déclaré : `Investisseur`, `Marchand de
   biens`, `Patrimonial` ou `Promoteur`.
4. Marquer la `source`, pour distinguer ces recherches de celles saisies par un
   agent.

### Contact depuis une fiche « à vendre »

`type: "contact"` avec `bien` (l'`id` de la fiche immeuble) et `bienTitre`.
Rattacher la demande à la fiche immeuble concernée, pour que l'agent sache de
quel bien on parle.

### Idempotence

L'endpoint est **idempotent sur `ref`**. Si le BO ne répond pas, le site garde
le lead dans sa file d'attente et réessaie ; un réessai ne doit jamais créer un
second prospect.

---

## Point en attente d'arbitrage de MAV — ne pas traiter sans son accord

Les trois compteurs de l'accueil du site (365, 1 372, 359) sont des comptes de
recherches par cible, figés. Valeurs réelles au 21/10 : Patrimonial 251,
Investisseur 1 107, Marchand de biens 428, Promoteur 180. Si MAV veut qu'ils se
mettent à jour seuls, il faudra une petite table de quatre entiers côté site.
