# Prompt pour la session Claude du back-office

> À coller dans la session qui travaille sur le **BO** (projet Supabase
> `france-immeuble-bo`). Ce document décrit ce que le BO doit produire ; il ne
> décrit pas ce que fait le site, qui est déjà en place.
>
> **Règle qui ne se négocie pas** : le site ne lit jamais le CRM. Le BO
> **dépose** une copie appauvrie dans la base du site, et **reçoit** les leads
> par un endpoint qui ne sait qu'écrire. Aucune clé du BO ne doit se trouver
> dans l'environnement du site, pas même en lecture seule.

---

## Contexte mesuré le 21 octobre 2026

Relevé fait sur la base, pas sur des souvenirs :

| | |
|---|---|
| Immeubles au total | 1 864 |
| En commercialisation (statut 5 ou 6), non archivés | **30** |
| Annonces « En cours de diffusion » | **2**, toutes deux cochées off-market |
| Annonces avec `DIFF - Online (FI)` à vrai | **0**, depuis toujours |
| Ventes dans `bo_vente` | 44, de 2019-09 à 2026-01 |
| Recherches acquéreurs | 1 968, portées par 1 203 acquéreurs distincts |

Autrement dit : **le site n'a jamais porté d'annonce**, et la page « Biens à
vendre » restera vide tant que personne ne cochera la case.

---

## Chantier 1 — Diffusion multi-sites : PleinBail **et** France Immeuble

### Ce qui existe déjà

`bo_annonce` porte des drapeaux de diffusion par canal :
`DIFF - Online (FI)`, `DIFF - Online (SL)`, `DIFF - Online (LBP)`,
`DIFF - Online (LBC)`, `DIFF - OffMarket`.

`bo_commercialisation` porte `Portails_immobilier`, un tableau qui vaut
aujourd'hui `["France Immeuble"]` sur 68 lignes.

### Ce qu'il faut

Une **étape de publication** au moment où on lance la commercialisation, avec
les deux destinations **cochées par défaut** et décochables une par une :

- ☑ **PleinBail** — `pleinbail.fr`
- ☑ **France Immeuble** — `france-immeuble.fr`

Décocher les deux revient à un mandat off-market : il ne part qu'au fichier
d'acquéreurs, par proposition directe. C'est le cas le plus fréquent et il doit
rester possible en un clic.

### Points d'attention

1. **Ne pas réutiliser `DIFF - OffMarket` comme inverse des deux cases.** Un
   bien peut être diffusé sur PleinBail et pas sur France Immeuble sans être
   off-market pour autant. Les trois informations sont distinctes.
2. **Décocher doit dépublier.** Si la case France Immeuble passe à faux, le bien
   doit disparaître de la projection au prochain dépôt, pas y rester jusqu'à ce
   que quelqu'un y pense.
3. **Journaliser qui a coché quoi et quand.** Publier l'immeuble d'un vendeur
   qui avait demandé la discrétion est le genre d'erreur qu'on veut pouvoir
   reconstituer.
4. **Une case décochée par défaut ne sert à rien.** MAV a demandé les deux
   cochées : c'est volontaire, l'oubli doit être de ne pas décocher, pas de ne
   pas cocher.

---

## Chantier 2 — La projection `public.biens_a_vendre`

Le BO écrit dans la base Supabase **du site** — projet « France Immeuble site »,
`omtkttpvfjsbnqsajcsp`, table `public.biens_a_vendre`. **La table existe déjà**
(migration `0002`, dans le repo du site) : le BO ne la crée pas, il y dépose. Un
seul repo possède les migrations d'une base, sinon c'est la panne garantie.

Le BO a besoin pour cela de la clé secrète du projet **du site**. C'est le sens
autorisé : le BO connaît le site, le site ne connaît pas le BO.

### Le contrat (déjà en place, pour référence)

```sql
create table if not exists public.biens_a_vendre (
  id              text primary key,   -- _id de bo_annonce
  slug            text not null unique,
  titre           text not null,
  ville           text not null,
  dept            text not null,      -- « 75 », « 92 »…
  type            text not null,      -- « Immeuble de rapport », « Immeuble mixte »
  surface_carrez  numeric,
  lots            integer,
  loyer_hc_an     numeric,
  prix_hai        numeric not null,
  rendement       numeric,            -- brut affiché, en %
  occupation      numeric,            -- % de la surface Carrez, null si libre
  prix_m2         numeric,
  travaux         boolean default false,
  images          text[] not null default '{}',
  publie_le       timestamptz not null default now()
);
alter table public.biens_a_vendre enable row level security;
-- lecture publique, aucune policy d'écriture : seule la clé secrète écrit
```

### Ce qui ne traverse JAMAIS la frontière

- ❌ **L'adresse** — `EMP - Adresse`, `adresse_rue`, `adresse_numero_rue`.
  Commune et département situent le bien ; la rue identifie son propriétaire.
  C'est aussi ce que fait PleinBail.
- ❌ Le nom du propriétaire, son contact, sa société, son motif de vente.
- ❌ `G - Motif de la vente`, `OBJ - *`, les notes internes, les honoraires.
- ❌ Tout identifiant permettant de remonter à `bo_contact`.

### Les photos

Les photos vivent sur S3 et Bubble. **Le site ne sert aucune image hébergée
ailleurs que sur son domaine.** Le dépôt doit donc :

1. copier le fichier dans le bucket du projet Supabase **du site** ;
2. le **renommer sur un identifiant neutre**. Les noms d'origine portent parfois
   l'adresse — j'ai trouvé `Immeuble 47 rue des bas Fossés 77260 La Ferté Sous
   Jouarre.jpg` dans `bo_vente`. Publier ce nom de fichier revient à publier
   l'adresse ;
3. écrire dans `images` le chemin dans ce bucket, pas l'URL S3.

### Fréquence

Un dépôt à chaque changement d'état d'annonce suffit — il y a 2 annonces
actives, pas 2 000. Un rattrapage complet une fois par nuit couvre les oublis.

---

## Chantier 3 — Les formulaires du site alimentent le BO

Le site poste vers **un endpoint du BO qui ne sait faire qu'une chose :
enregistrer**. Pas de lecture, jamais. Une fente de boîte aux lettres, pas une
porte. Conséquence assumée : un jeton volé permet de créer de faux leads, c'est
du bruit, pas une fuite — d'où le **rate limiting obligatoire**.

### 3.1 — Vendre et Estimer → un immeuble en prospect

`POST /api/lead/estimation`

```jsonc
{
  "ref": "uuid",            // genere par le site, idempotence
  "etat": "principal",      // ou "complement", voir plus bas
  "prenom": "", "nom": "", "email": "", "telephone": "",
  "adresse": "", "codePostal": "",
  "surface": 0, "loyerAnnuel": 0,
  "lotsHabitation": 0, "lotsBureaux": 0, "lotsCommerces": 0, "lotsActivite": 0,
  "travaux": "", "echeance": "",
  "source": "site/estimer" // ou "site/vendre"
}
```

Côté BO : créer un `bo_immeuble` au statut **« 1 - FORMULAIRE »**, qui le fait
apparaître dans le dashboard « prospects, formulaire à traiter ».

⚠️ **Le formulaire du site est en deux temps et le visiteur ne le sait pas.**
Le premier écran suffit à créer le lead ; le complément arrive ensuite, avec le
même `ref`. L'endpoint doit donc **accepter un second appel sur le même `ref`
et compléter la fiche existante**, sans créer de doublon. Si le visiteur
abandonne après le premier écran, le lead est déjà chez vous — c'est tout
l'intérêt du découpage.

⚠️ **Bug à ne pas reprendre** : dans l'ancien formulaire, les libellés
« bureaux » et « commerces » étaient **inversés** par rapport aux noms de
champs. Vérifier la correspondance en recette, avec une saisie témoin.

### 3.2 — Dépôt de recherche → un contact et une recherche

`POST /api/lead/recherche`

```jsonc
{
  "ref": "uuid",
  "prenom": "", "nom": "", "email": "", "telephone": "",
  "ticket": "", "financement": "", "profil": "",
  "secteurs": [], "rendementMin": 0,
  "source": "site/off-market"
}
```

Côté BO, en une transaction :

1. **Chercher un `bo_contact` par email** avant d'en créer un. Le fichier compte
   3 834 contacts et 1 203 acquéreurs : un doublon par dépôt de recherche le
   pollue vite.
2. Créer la **`bo_recherche`** rattachée, au statut **D** (client inconnu).
3. Renseigner `Cible` à partir du profil déclaré — les valeurs existantes sont
   `Investisseur`, `Marchand de biens`, `Patrimonial`, `Promoteur`.
4. Marquer `source` pour distinguer ces recherches de celles saisies par un
   agent.

### 3.3 — Le message affiché au visiteur après dépôt

Texte demandé par MAV, à afficher **côté site** une fois la recherche
enregistrée :

> Vous venez de créer une recherche, vous êtes dans notre base. Vous y êtes pour
> l'instant en **client inconnu** : pour accéder aux meilleurs dossiers,
> demandez à être rappelé ou contactez-nous.

C'est moi qui le place sur le site ; je le note ici pour que les deux côtés
disent la même chose du statut D.

### 3.4 — File d'attente côté site

Si le BO ne répond pas, le lead part dans `public.leads_outbox` côté site, avec
alerte et réessai, purgée dès transmission. **On ne perd jamais un lead** —
c'est le canal d'acquisition n°1. L'endpoint doit donc être **idempotent sur
`ref`** : un réessai ne doit pas créer un second prospect.

---

## Chantier 4 — Les trois compteurs de la page d'accueil

Point trouvé en explorant, et qui demande un arbitrage avant toute reprise.

La page d'accueil affiche trois compteurs sous le titre « ce que le réseau
recherche » : **365** immeubles patrimoniaux, **1 372** investissements, **359**
opérations marchandes. Ce ne sont pas des ventes : ce sont des **comptes de
recherches par cible**, figés à une date ancienne.

Valeurs réelles aujourd'hui :

| Cible | Affiché sur le site | Réel |
|---|---|---|
| Patrimonial | 365 | **251** |
| Investisseur | 1 372 | **1 107** |
| Marchand de biens | 359 | **428** |
| Promoteur | — | **180** |

Le « 1 372 investisseurs en base » cité partout vient donc du même endroit. Le
chiffre le plus défendable serait **1 203 acquéreurs distincts porteurs d'une
recherche**, ou **1 968 recherches**.

Si MAV veut que ces compteurs vivent, il faut une projection
`public.stats_recherches` (quatre entiers, aucune donnée nominative). Tant qu'il
n'a pas tranché, je n'ai touché à aucun de ces trois chiffres sur le site.

---

## Ordre de passage suggéré

1. **3.1 et 3.2**, les leads. C'est le dernier vrai verrou avant la bascule DNS :
   aujourd'hui aucun formulaire du site n'arrive nulle part.
2. **1**, l'étape de publication. Sans elle, « Biens à vendre » reste vide.
3. **2**, la projection. Elle n'a d'objet qu'une fois qu'il y a quelque chose à
   publier.
4. **4**, les compteurs, après arbitrage.

## Prérequis

Le projet Supabase **du site** existe depuis le 21/10 (`omtkttpvfjsbnqsajcsp`),
et ses tables sont définies dans le repo du site. Tous les chantiers peuvent
démarrer.
