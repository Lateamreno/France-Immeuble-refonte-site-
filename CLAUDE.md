# CLAUDE.md — Refonte site France Immeuble

> **Version du 27 août 2026 (rév. 4 — sortie de WordPress, Next.js sur Vercel, frontière de sécurité site/BO.)**
> Spec de référence, à la racine du repo.
>
> **Cette révision remplace intégralement la rév. 3.** Trois décisions l'ont rendue caduque :
> on quitte WordPress, le site devient une application Next.js, et les données sensibles
> restent derrière une frontière étanche. L'ancienne numérotation des milestones est annulée.
> Ce qui reste inchangé : les design tokens (§3), la typographie (§4) et les boutons (§5),
> validés et verrouillés.

---

## 1. Contexte

Refonte de **france-immeuble.fr** — agence de vente d'immeubles de rapport, 66 avenue des
Champs-Élysées, Paris 8e. Le site actuel tourne sur WordPress (OVH) + Elementor + thème
custom `hono-theme`, design daté de 2021.

L'objectif dépasse la refonte visuelle : construire un site **piloté depuis les sessions
Claude Code**, sans intervention manuelle dans un back-office WordPress, capable de porter
des landing pages SEO, un blog alimenté par un outil externe, des données dynamiques, et
à terme un espace client.

### Architecture cible

```
                    france-immeuble.fr  (www = canonique)
                              │
                    ┌─────────▼─────────┐
                    │  Next.js / Vercel │   ce repo
                    └─────────┬─────────┘
                              │ lit
                    ┌─────────▼─────────┐
                    │ Supabase « SITE » │   articles publiés, références
                    │                   │   anonymisées, compteurs, leads
                    └─────────▲─────────┘
                              │ DÉPOSE (sens unique)
                    ┌─────────┴─────────┐
                    │  Supabase « BO »  │   CRM : acquéreurs, vendeurs,
                    │  (autre domaine)  │   mandats, transactions
                    └───────────────────┘
```

- **Stack** : Next.js (App Router) déployé sur Vercel, contenu et données dans Supabase.
- **Le domaine reste `france-immeuble.fr`.** Aucun changement de nom de domaine, aucune
  redirection 301 de migration. Le `.fr` est un exact-match de la marque sur le TLD du
  pays des clients : c'est un actif, pas une contrainte.
- **Le canonique est `https://www.france-immeuble.fr/`** — ne jamais inverser vers l'apex.
- Le domaine reste enregistré chez OVH ; seuls les enregistrements DNS pointent vers Vercel.
- **Développement en sessions cloud** (claude.ai/code), y compris depuis mobile. Le déploiement
  se fait par `git push` → preview Vercel → validation → production.

### Ce qui disparaît de la rév. 3

- ❌ La contrainte « HTML/CSS/JS pur statique, interdiction absolue de framework ». Elle
  n'existait que pour permettre le collage dans un bloc Gutenberg. Sans WordPress, elle
  n'a plus d'objet.
- ❌ Le script `push-to-wp.js` et l'API REST WordPress.
- ❌ Le copier-coller dans un bloc « HTML personnalisé ».

---

## 2. Frontière de sécurité site ↔ BO

**Section prioritaire. Aucune décision de développement ne doit l'affaiblir.**

Le CRM contient les coordonnées de **1 372 investisseurs** et de vendeurs particuliers. Le
site est public et exposé. Les deux ne doivent jamais partager une base.

### Le principe

> **Le site ne peut rien demander au BO. Le BO dépose ce qu'il accepte de rendre public.**

### Pourquoi deux projets Supabase et pas deux schémas

La RLS protège contre une requête mal écrite avec la clé publique. Elle ne protège en rien
contre le **vol d'une variable d'environnement** — clé `service_role` fuitée dans un log,
dépendance npm compromise, projet Vercel piraté. Cette clé contourne la RLS et donne la
base entière.

Dès que l'environnement du site détient une clé capable d'atteindre le CRM, compromettre le
site revient à compromettre le CRM. **Un schéma est une cloison logique, pas un mur.**

D'où : **deux projets Supabase distincts**. Le site ne détient **aucune** clé vers la base
du BO — pas même en lecture seule. Il n'y a rien à voler et aucun chemin réseau à emprunter.

### Ce qui traverse la frontière (BO → site)

Le BO pousse une **copie appauvrie**, jamais une vue sur la donnée réelle :

| Projection | Contenu | Ce qu'elle ne contient jamais |
|---|---|---|
| `web.stats` | 3 entiers : acquéreurs, vendus, en vente | tout le reste |
| `web.references` | arrondissement, nb de lots, fourchette de surface, année | adresse, nom, prix exact |
| `web.stats_villes` | agrégats par commune pour les pages géo | toute donnée nominative |
| `content.articles` | articles publiés | — |

**Test de validation de l'architecture** : si un attaquant aspire intégralement la base du
site, il obtient des articles déjà publics, des compteurs déjà affichés en page d'accueil et
des références déjà anonymisées. **Rien qu'il ne pouvait lire en visitant le site.**

L'objectif n'est pas « c'est bien protégé », c'est **« il n'y a rien à voler »**.

### Anonymisation des références

Publier « immeuble vendu, 12 rue X, 8 lots, 2,4 M€ » identifie le vendeur et l'acheteur.
Ce n'est pas qu'un sujet RGPD : on ne peut pas promettre la discrétion off-market en page
Vendre et publier le détail en page Références.

**Règle** : arrondissement et non rue, fourchettes et non montants exacts, jamais de nom.

> **Décision MAV du 21/10/2026 (contrat BO, `docs/CONTRAT-SITE.md` du dépôt BO)** : pour les
> ventes réalisées, la **rue sans numéro** est affichée (« rue des Bas-Fossés »), dans son
> propre champ `ventes.rue`, jamais dans un texte. La base refuse une rue qui contient un
> chiffre. Le numéro, les noms et l'adresse dans les récits restent interdits.
> Même jour : la **surface exacte** remplace la fourchette pour les ventes (`ventes.surface`).

### Le sens difficile : les leads (site → BO)

C'est le seul flux où de la donnée personnelle circule vers le BO.

- Le formulaire poste vers **un endpoint du BO qui ne sait faire qu'une chose : enregistrer
  un lead.** Pas de lecture, jamais. Une fente de boîte aux lettres, pas une porte.
- Conséquence assumée : un jeton volé permet de créer de faux leads. C'est du bruit, pas une
  fuite. **Rate limiting obligatoire** sur cet endpoint.
- Si le BO ne répond pas, le lead part dans une file d'attente côté site (`web.leads_outbox`),
  avec alerte et réessai, purgée dès transmission. **On ne perd jamais un lead** — c'est le
  canal d'acquisition n°1.

### Espace client (plus tard)

Un acquéreur connecté veut voir « les immeubles qu'on m'a envoyés ». Cette donnée vit dans le
CRM : c'est la vraie mise à l'épreuve de l'architecture.

**La règle ne change pas** : le site ne lit pas le CRM. Le BO **projette, acquéreur par
acquéreur**, uniquement ce que cet acquéreur a déjà le droit de voir. La RLS garantit qu'il
ne voit que ses lignes. Toujours du dépôt, jamais de la lecture.

### Garde-fous non négociables

- **RLS activée sur toutes les tables**, sans exception. La clé `anon` est publique par
  conception : la RLS est la seule protection.
- **Jamais de clé `service_role` côté navigateur**, jamais dans une variable `NEXT_PUBLIC_*`.
  Les écritures passent par des route handlers serveur.
- Le site lit des **vues dédiées**, jamais des tables brutes.
- **Le BO est hébergé sur un domaine complètement distinct** — pas un sous-domaine de
  `france-immeuble.fr`. Sinon une faille XSS sur le site public peut atteindre ses cookies.
- **Projets Vercel séparés**, variables d'environnement qui ne se croisent jamais.
- **Un seul repo possède les migrations** de chaque base. Deux projets qui migrent la même
  base, c'est la panne garantie.

---

## 3. Design tokens (charte 2026 — inchangés, verrouillés)

À déclarer une seule fois, en feuille globale. Les noms de variables sont **identiques à ceux
de la marque travaux du groupe** : cohérence inter-projets, seul le réglage de largeur du
display diffère.

```css
:root{
  /* Fonds & structure */
  --color-noir:#0A0A0A;
  --color-noir-2:#121110;
  --color-noir-3:#1B1917;
  --color-creme:#EFE9DE;
  --color-gris:#8E8A84;
  --color-ligne:#282522;

  /* Accent bronze — couleur unique, relief par degrade monochrome */
  --color-bronze:#C19B6E;
  --color-bronze-clair:#E6D4BD;
  --color-bronze-clair-2:#D4B894;
  --color-bronze-hover:#9C7C54;
  --color-bronze-profond:#7A5C3E;

  /* Typographie — Archivo est une police VARIABLE.
     La famille et le reglage d'axe sont declares separement (voir bloc ci-dessous). */
  --font-display:"Archivo", ui-sans-serif, system-ui, sans-serif;
  --display-wdth:118;   /* axe de largeur — VERROUILLE 07/08/2026 */
  --display-wght:900;   /* graisse — VERROUILLE 26/08/2026 (option C) */
  --font-body:"Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono-site:"JetBrains Mono", ui-monospace, monospace;

  /* Boutons */
  --radius-pill:999px;
  --btn-padding:18px 36px;
  --btn-shadow:0 8px 24px rgba(0,0,0,0.15);
}

/* Tout element de titrage DOIT porter ce reglage.
   Sans font-variation-settings, Archivo s'affiche en largeur standard (wdth 100)
   et le titrage perd son caractere. */
h1, h2, h3, .h-display, .stat-number{
  font-family:var(--font-display);
  font-variation-settings:"wdth" var(--display-wdth), "wght" var(--display-wght);
  letter-spacing:-0.015em;
  line-height:1.04;
}
```

### Règles de couleur

- **Le bronze `#C19B6E` est la SEULE couleur d'accent.** Le relief s'obtient par dégradés
  monochromes clair → profond, ombres colorées et halos — **jamais par une seconde couleur vive**.
- Les 3 noirs empilent des sections sombres successives sans aplat plat.
- `--color-ligne` = bordures sur fond sombre. `--color-gris` = texte secondaire.
- Sur fond crème, le texte secondaire se dérive des tokens
  (`color-mix(in srgb, var(--color-noir) 62%, var(--color-creme))`), jamais par un gris inventé.
- **Le blanc pur n'est admis que comme couleur de texte sur bouton à fond sombre** (§5), et
  pour le papier des polaroïds de la vitrine d'accueil (token `--color-papier`, MAV, 22/10/2026) :
  c'est un objet photographié, pas une couleur d'interface.
- **Couleurs mortes** : `#D9BF7D`, `#D98F7D`, `#0C2432`, `#BD9091`, `#000000`, `#CCCCCC`,
  `#EFEFEF`, `#F8F8F8`.
- **Le site actuellement en ligne utilise l'ancienne charte** — ne jamais s'en inspirer.

### Signature visuelle groupe

- Filet vertical bronze 1-2 px à gauche des blocs importants.
- Surtitres en petites capitales espacées (`letter-spacing: 0.15em`), bronze, `--font-mono-site`.

---

## 4. Typographie — polices dans le repo

Les 4 woff2 variables sont dans **`/assets/fonts/`**, sous-ensemblées au latin étendu.
**Ne rien remplacer, ne jamais découper par graisse.**

| Fichier | Rôle | Axes | Poids |
|---|---|---|---|
| `Archivo[wdth,wght].woff2` | Display — H1-H3, chiffres clés | `wght` 100-900 · `wdth` 62-125 | 145 Ko |
| `Inter[opsz,wght].woff2` | Body — texte, nav, boutons, formulaires | `wght` 100-900 · `opsz` 14-32 | 199 Ko |
| `JetBrainsMono[wght].woff2` | Data — chiffres, surtitres, labels | `wght` 100-800 | 45 Ko |
| `Caveat[wght].woff2` | Écriture des légendes de polaroïds, rien d'autre (MAV, 22/10/2026). Non préchargée : seul l'accueil s'en sert | `wght` 400-700 | 75 Ko |

```css
@font-face{font-family:"Archivo";src:url("/assets/fonts/Archivo[wdth,wght].woff2") format("woff2-variations");font-weight:100 900;font-stretch:62% 125%;font-display:swap}
@font-face{font-family:"Inter";src:url("/assets/fonts/Inter[opsz,wght].woff2") format("woff2-variations");font-weight:100 900;font-display:swap}
@font-face{font-family:"JetBrains Mono";src:url("/assets/fonts/JetBrainsMono[wght].woff2") format("woff2-variations");font-weight:100 800;font-display:swap}
```

**INTERDIT** : `<link>` vers `fonts.googleapis.com`, `@import` d'une CDN de polices,
`next/font/google`. Deux raisons : la maîtrise du chargement, et l'exposition d'IP
utilisateurs à un tiers (RGPD, déjà sanctionné en Europe). Utiliser `next/font/local`
sur les fichiers du repo.

**Décisions verrouillées :**
- Display = **Archivo variable à `wdth` 118 / `wght` 900** — substitut libre de GT America
  Extended (aucune licence Grilli Type détenue). La marque travaux du groupe utilise la même
  famille en `wdth` 100 : parenté de groupe, marques non jumelles.
- **Archivo Black est ÉCARTÉE** : famille statique, sans axe de largeur. L'utiliser ferait
  perdre l'extension `wdth` 118 qui justifie tout le choix typographique.
- Réversibilité : si une licence GT America est acquise, ne modifier que `--font-display`
  et le `@font-face` correspondant.

---

## 5. Boutons — règle groupe, sans exception

- **Forme** : pilule stricte, `border-radius: var(--radius-pill)` sur les 4 côtés. Jamais 8 px.
- **Texte centré** horizontalement, même avec icône. Icône à droite, `gap: 10px`.
- **Padding** : `var(--btn-padding)`.
- **Couleur — décision de MAV du 22/10/2026, remplace la règle fond clair / fond sombre** :
  les boutons sont **pleins `--color-bronze`, texte `--color-noir`**, sur tous les fonds,
  hover `--color-bronze-clair-2`. Plus de contour, plus de texte blanc.
- **Deux boutons côte à côte** (MAV, 22/10/2026) : seul le plus important est or. L'autre
  est **noir texte or** (`--color-noir` / `--color-bronze`) sur tous les fonds : il contraste
  avec le bouton or. Filet or de 1 px sur fond sombre pour dessiner sa forme. Un bouton seul
  est toujours or.
- **Jamais de flèche** dans un bouton.
- **Centrés** dans leur bloc, sauf dans le hero où ils suivent le texte aligné à gauche.
- Focus clavier visible obligatoire :
  `outline: 2px solid var(--color-bronze-clair); outline-offset: 3px`.

---

### Hero — modèle unique (MAV, 22/10/2026)

Chaque page, et toute page future, ouvre sur le hero de `/acheter-un-immeuble/` (composant
`HeroMedia`) : image pleine largeur et **pleine hauteur d'écran** (`100svh`), titre de 56 px
au plus (lisible d'un coup d'œil, deux à trois lignes), surtitre or clair,
titre blanc avec les **mots importants en or** (`<span className="accent">`), courte
description blanche, petite flèche or discrète vers le bas. La barre de menu, fixe, est
transparente au-dessus du hero et devient noire floutée au défilement.

Les **chiffres** affichés (bandeau de preuve) sont en or, chacun avec un picto or **sans
cercle** qui en dit l'intention, et viennent du BO (table `chiffres`, déposée à 9 h et 19 h).

**Vitrine des ventes de l'accueil** (MAV, 22/10/2026) : la vente du milieu en grand, les
voisines plus petites, inclinées et dans l'ombre, flèches et glisser. Cartes en **polaroïds**
(MAV, 25/10/2026) : cadre blanc, légende en Caveat, petit tampon « VENDU » or à l'encre
irrégulière en haut à droite de la photo. La version **vignettes** (photo pleine, ville en
blanc, département et prix de vente en or) est validée et gardée de côté :
`forme="vignettes"` sur `VitrineAccueil`.

**Sections d'un écran** (MAV, 26/10/2026) : chaque section, ordinateur et téléphone, remplit
au moins la hauteur de l'écran **sous la barre de menu** (`min-height:var(--ecran)`, soit
`100svh - --header-h`, MAV, 27/10/2026 ; contenu centré verticalement), comme le hero, pour que ce qui se lit ensemble arrive ensemble. Pas de défilement forcé par section :
on se cale sur la hauteur d'écran. Une section plus haute que l'écran est à resserrer (ligne
qui défile, contenu allégé) : `.section--ecran` la cale sur un écran, modèle sur les atouts
de la page Vendre. Outils (27/10/2026) : `grid--ligne-mob` (cartes en ligne au téléphone),
`media--fond-mob` (photo en fond fondu au téléphone), `tete-2col`, `steps--frise`,
LigneDefilante `marches` pour toute liste longue (références, articles, étapes).
Exceptions voulues : « Vendez votre immeuble » de l'accueil dépasse au téléphone, texte
entier, les deux boutons l'un au-dessus de l'autre collés en bas de l'écran pendant qu'il
défile (MAV : « Lire la suite », personne ne clique) ; l'échantillon des Références garde sur
ordinateur sa longue liste par région et département (MAV : « c'était pas mal comme
avant »), repliée en deux lignes qui glissent au téléphone. Suites courtes (méthode de
Vendre) : verticales au téléphone. Suites longues (mission de la Découpe) : grille 3 × 2 sur
ordinateur, ligne qui glisse au téléphone.

**Sections crème** (MAV, 22/10/2026) : une section crème ne reste pas un aplat de texte et de
cartes. Elle porte une image, photo d'immeuble ou de personnes, ou immeuble détouré
(composant `TeteMedia` à côté du titre).
Pas de photo dans toutes les sections (MAV, 27/10/2026) : chargé à l'œil et lourd à charger.
Une section porte au plus une couche d'image : photo fondue en fond **ou** photos dans les cartes.

## 6. Structure du site

**Contrainte client** : chaque lien du menu haut mène à une page qui **convertit**. Aucune
page du menu principal ne doit être bourrée de texte SEO.

```
Accueil                     /
Vendre ▾                    /vendre-un-immeuble/
    Vendre à Paris          /vendre-un-immeuble/paris/
    Vendre à Neuilly        /vendre-un-immeuble/neuilly-sur-seine/
    Vendre à Boulogne       /vendre-un-immeuble/boulogne-billancourt/
    Vendre à la découpe     /vendre-a-la-decoupe/
Estimer ▾                   /estimer-un-immeuble/
Acheter ▾                   /acheter-un-immeuble/
    Déposer ma recherche    /acheter-un-immeuble/deposer-ma-recherche/
    Immeubles loués         /acheter-un-immeuble/immeuble-loue/
Références                  /immeubles-vendus/
Contact                     /contactez-nous/
```

**Trois arbitrages à retenir :**

- **La découpe reste sous Vendre.** C'est une façon de vendre. En top-level elle dilue un
  menu déjà chargé et crée deux chemins vers la même URL. À rouvrir si le volume de recherche
  sur « vente à la découpe » le justifie — argument recevable, pas a priori.
- **Références entre au menu.** 365 immeubles vendus, c'est la meilleure preuve du site, et
  aujourd'hui une iframe Bubble à zéro contenu indexable. C'est la principale réserve de
  contenu à données propriétaires.
- **Acheter ne montre aucun bien publiquement.** Tout le discours vendeur repose sur
  l'off-market : lister des immeubles en public démonterait l'argument devant le vendeur.
  La page vend l'accès ; les biens ne sont visibles qu'en compte connecté. C'est ce qui
  justifie l'espace client, et chaque compte créé enrichit le fichier qui fait la valeur de
  l'offre vendeur.

**Le survol doit être un tap sur mobile.** Pas de `:hover` au doigt — conception mobile d'abord.

---

## 7. Pages villes — deux niveaux

### Le partage des rôles

- **Page menu** (`/vendre-un-immeuble/`) : **transformation pure**. Elle a explicitement
  abandonné toute ambition SEO (voir §11 — les articles de blog rankent à sa place). Elle ne
  se dispute donc rien avec ses pages filles.
- **Pages villes** : **SEO + transformation**. Ce sont elles qui vont chercher les requêtes
  géolocalisées.

### Le principe de rédaction

Ce qui fait ranker n'est pas la longueur, c'est **la quantité d'information que personne
d'autre ne peut publier**. Une page de 400 mots avec de vraies transactions bat une
dissertation générique de 2 000 mots.

**Sur ces pages, SEO et transformation ne se disputent pas la place.** L'accroche affiche la
statistique locale — « 12 immeubles vendus à Boulogne-Billancourt » — et non le 365 global.
Ce chiffre est simultanément ce qui rend la page unique pour Google et ce qui rend la promesse
crédible pour le vendeur local. Le même bloc fait les deux métiers.

Composition type, dense en information et légère en prose :

- bloc de données : transactions dans la commune, rendements constatés, délais moyens ;
- FAQ réellement locale : le droit de préemption urbain diffère selon la commune, l'encadrement
  des loyers concerne Paris et pas Boulogne, les profils d'acquéreurs varient ;
- données structurées schema.org (`LocalBusiness`, `FAQPage`, `ItemList`).

### Le risque à ne jamais oublier

Trois pages identiques à un mot près, c'est la définition exacte des **doorway pages** —
politique anti-spam nommée explicitement par Google. Désindexation, voire préjudice au domaine.

### Règles opérationnelles

- **Pas de page ville sans données ville** : minimum 3 transactions dans la commune.
- **Gabarit + 3 champs rédigés à la main**, stockés en base et non en dur : accroche propre à
  la ville, note de marché local (2-3 phrases), 3-4 questions de FAQ spécifiques. Ajouter une
  ville = remplir trois champs.
- **Un seul axe d'abord : vendre × villes.** Ne pas construire la matrice complète sur pari :
  « vendre immeuble Boulogne » et « estimer immeuble Boulogne » auraient les mêmes données
  locales et le même argumentaire — profil type du duplicate qui se cannibalise. On rouvre
  l'axe estimation après 3 mois si les requêtes se comportent différemment.
- **Règle d'élagage** : une page sans **aucune impression après 3 mois** est une doorway page
  aux yeux de Google. On la retire. Sans cette règle on accumule du poids mort.
- **Croissance ensuite par arrondissement** (« vendre immeuble Paris 18e ») — troisième niveau,
  pas le point de départ, mais c'est là que se trouvent le volume et les données.

---

## 8. Contenu & pipeline Mindstardust

Le contenu vit dans **Supabase (projet SITE)**, pas en fichiers markdown versionnés. Mindstardust
écrit déjà dans Supabase : lui faire committer via l'API GitHub et déclencher un build serait
un détour. On perd le versioning git du contenu, on gagne la publication depuis l'outil,
l'édition depuis mobile et zéro build à attendre.

**Le SEO n'en souffre pas** : les pages restent servies en statique, un webhook Supabase
déclenche la revalidation à la demande de la page concernée.

```
Mindstardust → content.articles (statut: brouillon)
      ↓  relecture humaine — obligatoire
statut: publié → webhook Supabase → revalidation Next.js → en ligne
```

### La relecture n'est pas de la bureaucratie

**Publier de l'article généré en volume est exactement la cible du système « helpful content »
de Google.** Le même piège que les doorway pages, sous une autre forme.

Ce qui différencie France Immeuble, ce n'est pas le volume : c'est d'être seul à disposer de
365 transactions réelles. Un article nourri de ces chiffres est inattaquable ; dix articles
génériques tirent le domaine vers le bas. **Des données propriétaires, pas du volume.**

### Modèle de contenu

Chaque article porte, dès la première migration : `slug`, `seo_title`, `seo_desc`, `canonical`,
`h1`, `og_image`, `statut`, `published_at`, `updated_at`, `type`. Le schéma doit pouvoir
**reproduire à l'identique** les métadonnées des 22 URLs existantes (§10).

---

## 9. Formulaires & leads

Canal d'acquisition n°1 — à ne pas improviser.

- Formulaire d'estimation **multi-étapes** : une question par écran, barre de progression,
  validation par étape.
- Structure (MAV, 27/10/2026) : partie 1 (prénom, nom, e-mail vérifié, téléphone avec
  indicatif pays, +33 par défaut et 0 accepté, adresse suggérée par la Base Adresse Nationale
  via `/api/adresse/`, description) : **le lead part dès cette partie**. Le visiteur ne sait
  pas qu'il y a une suite. Partie 2 (lots habitation / bureaux / commerces / entrepôts,
  surface habitable totale, loyer HC total, travaux, « je veux vendre ») → écran final :
  un agent appelle sous 48 h, liste des pièces à préparer, envoi par e-mail ou dépôt dans
  l'espace client. Les entrepôts vont dans le champ `lotsActivite` du BO.
- ⚠️ **Bug à ne pas reproduire** : dans le formulaire actuel, les libellés « bureaux » et
  « commerces » sont **inversés** par rapport aux noms de champs. Vérifier la correspondance.
- Soumission via **route handler serveur** → endpoint du BO (§2). Jamais d'écriture directe
  depuis le navigateur.
- **Event GTM sur soumission réussie** (`form_submit_estimation`). Le tracking de conversion
  était défaillant : point à sécuriser.
- Formspree est **abandonné** — le BO reçoit directement.
- **Alerte de l'agence à chaque formulaire** (MAV, 22/10/2026) : le site envoie lui-même un
  e-mail à `contact@` et `ma.voci@` (SendGrid, depuis `contact@france-immeuble.fr`,
  Reply-To = le client), quel que soit le formulaire, même si le BO est en panne
  (`src/lib/notifications.ts`). Réglages : `docs/COMPTE-CONFIGURATION.md`.
- **E-mail au client après une estimation et compte créé pour lui** (MAV, 27/10/2026) :
  un agent appelle sous 48 h, liste des pièces, lien d'accès à l'espace client
  (`src/lib/compte/accueil.ts`, page `/mon-compte/activer/`). **Seulement quand la partie 2
  est remplie** (surface et loyer : de quoi estimer), hors PleinBail. Arrêté après la
  partie 1, le visiteur ne reçoit rien : l'agent l'appelle. Une adresse reçoit au plus un
  e-mail par 24 h (table `envois_client`, empreinte de l'adresse). C'est le seul e-mail
  automatique vers un visiteur.
- **Comptes vendeurs jamais ouverts supprimés après 30 jours** (`src/lib/compte/purge.ts`,
  tâche quotidienne `/api/lead/relance/`). Les comptes créés par le visiteur lui-même
  (acquéreurs) ne sont jamais purgés (MAV, 27/10/2026).
- **Aucun prénom dans les messages des formulaires** (MAV, 27/10/2026 : « c'est insultant »).
  Pas de « Merci Claire » ; l'e-mail au client commence par « Bonjour, ».
- Dépôt de recherche acquéreur en trois étapes courtes : critères, budget, coordonnées.

---

## 10. Reprise de l'existant — objectif zéro perte

**Refaire un site ne fait pas perdre de trafic ; changer les URLs en fait perdre.** Les 22 URLs
existantes sont reprises **au caractère près**, avec leurs titles, metas et canonicals. Aucune
perte n'est budgétée : elle s'autoriserait à être moins rigoureuse.

### ⚠️ Les articles ne sont PAS sous `/blog/`

Les 14 articles sont **à la racine du site**. `/blog/` existe mais n'est que la page de listing.
Toute règle de routage par préfixe `/blog/*` est donc fausse.

### Inventaire complet (source : backup WordPress du 26/08/2026)

| Type | ID WP | URL |
|---|---|---|
| page | 6 | `/` |
| page | 9 | `/blog/` |
| page | 964 | `/contactez-nous/` |
| page | 997 | `/estimer-un-immeuble/` |
| page | 1428 | `/immeubles-vendus/` |
| page | 1232 | `/mentions-legales-2/` |
| page | 1461 | `/plan-du-site/` |
| page | 1081 | `/vendre-un-immeuble/` |
| post | 2095 | `/comment-choisir-agence-immobiliere-pour-vendre-immeuble/` |
| post | 1208 | `/comment-estimer-un-immeuble-de-rapport/` |
| post | 1195 | `/comment-vendre-plus-cher-a-un-promoteur/` |
| post | 2003 | `/comment-vendre-un-immeuble-a-paris/` |
| post | 1217 | `/comment-vendre-un-immeuble-de-rapport/` |
| post | 1976 | `/comment-vendre-un-immeuble-plus-cher/` |
| post | 1179 | `/delegation-de-mandat-pourquoi-y-recourir/` |
| post | 1211 | `/droit-de-preemption-lors-de-la-vente-dun-immeuble-en-bloc/` |
| post | 1171 | `/immeuble-dhabitation-ou-immeuble-de-bureaux/` |
| post | 1214 | `/immeuble-insalubre-ou-en-etat-de-peril-que-faire/` |
| post | 1183 | `/immobilier-off-market-tout-ce-quil-faut-savoir/` |
| post | 2013 | `/impact-de-la-hausse-des-taux-sur-les-immeubles-en-bloc/` |
| post | 1204 | `/pourquoi-acheter-un-immeuble-en-bloc/` |
| post | 2126 | `/vendre-un-immeuble-avec-un-mauvais-dpe/` |

### Homepage — title et meta à conserver À L'IDENTIQUE

```
Title : Vente Immeuble de Rapport Paris & France | France Immeuble
Meta  : Agence n°1 spécialisée dans la vente d'immeubles de rapport en France. Réseau de 1 500+ acheteurs. Estimation gratuite et confidentielle en 48h. Off-market.
H1    : L'agence dédiée aux immeubles
```

Le H1 et les textes clés sont préservés sémantiquement. Le design est libre.

### Baseline SEO

Search Console, 12 mois glissants au 6 août 2026 : **6 443 clics / 320 081 impressions**,
78 % de trafic hors marque.

| | Clics/an | Part |
|---|---|---|
| Homepage (110 226 impressions, CTR 0,92 %, position 8,67) | ~1 014 | 16 % |
| Blog + pages diverses | ~5 413 | ≤ 84 % |
| `/estimer-un-immeuble/` | 9 | ~0 % |
| `/vendre-un-immeuble/` | 7 | ~0 % |
| `/immeubles-vendus/` | ~0 | iframe, zéro contenu indexable |
| `/contactez-nous/` | 0 | noindex |

> **Correction rév. 3** : le §5 précédent annonçait « 92 % du trafic dans le blog ». Ce chiffre
> est incompatible avec les autres données du document (92 % + les 1 014 clics de la home
> dépassent le total réel de ~500 clics). Le plafond mathématique du blog est **84 %**, et
> c'est un plafond. L'écart ne change aucune décision, mais le chiffre juste est 84 %.

**Objectif de la refonte** : porter le CTR de la homepage de 0,92 % à 2 %, soit **+1 100
clics/an sans gagner une position**. ⚠️ Tension à arbitrer : le CTR se joue surtout sur le
title et la meta, or ils sont gelés. Les leviers restants sont les données structurées, les
rich results et les sitelinks. À rediscuter avant le lot Homepage.

### Cannibalisation

`/vendre-un-immeuble/` et `/estimer-un-immeuble/` se disputent leurs requêtes avec deux articles
qui, eux, performent — très probablement `/comment-vendre-un-immeuble-de-rapport/` et
`/comment-estimer-un-immeuble-de-rapport/`. **Ces deux pages perdent donc toute ambition SEO :
elles convertissent, les articles rankent.**

### Vocabulaire de marque

Expression dominante : **« immeuble de rapport »** (14 000+ impressions/an) — à privilégier
partout. Secondaire : « vente en bloc » (contexte juridique). À éviter : « immeuble entier »
(~600 imp/an), sauf contexte définitionnel.

Réassurance : 365 immeubles traités depuis 2018 (chiffre `immeubles_traites` déposé par le BO
dans `chiffres`, affiché en tête de l'accueil, MAV 27/10/2026) · 1 500 acheteurs en base (chiffre déposé par le BO) · 28 avis Google
à 4,9/5 · honoraires 5 % du prix net vendeur · modèle off-market · mandats semi-exclusifs avec
période de test interne 2-4 semaines.

Coordonnées : 01 72 87 52 22 · 66 avenue des Champs-Élysées, 75008 Paris.

### Style d'écriture — retour de MAV du 21/10/2026

Deux tics d'écriture automatique à proscrire dans tout texte visible du site :

- le **tiret cadratin « — » à la place d'une virgule** ou d'un deux-points ;
- les formules en **« jamais X, jamais Y »** (« jamais l'adresse, jamais un nom »).

Écrire des phrases simples, avec la ponctuation ordinaire. Préférer une phrase utile au
référencement (« Immeubles de rapport vendus en bloc à Paris, en Île-de-France et en
région ») à une formule.

---

## 11. Tracking

**`GTM-5KF68JV` est obligatoire sur CHAQUE page** — snippet `<head>` + `<noscript>` en début
de `<body>`. C'était absent de certaines pages du site actuel : ne jamais l'oublier.

---

## 12. Déploiement & environnements

- `git push` → preview Vercel automatique sur la branche → validation → merge → production.
- **Deployment Protection (Vercel Authentication) activée** sur les previews.
- Aucun secret commité. Variables d'environnement dans Vercel uniquement.
- Les clés `UNSPLASH_*` et `PEXELS_API_KEY` restent sur le projet Vercel du site (MAV,
  26/10/2026) : elles servent à chercher photos et vidéos libres de droits. Le site ne les
  lit pas ; les médias retenus sont téléchargés dans `/public/media/` (aucune image hors domaine).
- **Projets Vercel séparés** pour le site et le BO, variables cloisonnées (§2).
- Bascule DNS : créer d'abord l'enregistrement d'origine et vérifier qu'il répond, **avant**
  de basculer `www`. L'apex redirige vers `www`.

---

## 13. Workflow de validation

1. Développer → commit → preview Vercel automatique.
2. Validation visuelle sur l'URL de preview.
3. Itérer jusqu'à validation explicite.
4. Merge → production.
5. Vérification post-bascule : rendu desktop + mobile, formulaires fonctionnels, GTM qui fire,
   métadonnées conformes à l'inventaire §10.

**Jamais de mise en production sans validation humaine explicite.**

### Rapport de fin de lot — OBLIGATOIRE, sans attendre qu'on le demande

Chaque lot livré se termine par un **artefact avant/après** publié (outil Artifact), lien donné
dans la réponse. MAV l'a rappelé le 21/10/2026 : « il faut que tu le fasses systématiquement ».

- **Avant/après réels** : les deux versions construites et servies côte à côte (worktree sur le
  commit d'avant), capturées aux mêmes formats. Jamais de maquette, jamais de souvenir.
- **Mesures, pas impressions** : hauteurs, contrastes, nombre de mots indexables, compteurs —
  relevés par script sur les pages servies.
- **Ce qui reste à trancher** en fin de document, explicitement.
- **Toujours la version mobile à côté de l'ordinateur** (MAV, 26/10/2026) : rapports, maquettes
  et propositions montrent les deux formats, sans attendre qu'on le demande.
- Une page neuve n'a pas d'« avant » : le dire, et montrer l'état réel, y compris vide.

---

## 14. Milestones

> L'ancienne numérotation M1-M6 (WordPress) est annulée. Le design system livré reste acquis :
> le CSS devient la feuille globale du projet Next, les pages HTML deviennent des composants.

- **M1 — Socle** : projet Next.js, reprise du design system (tokens, `next/font/local`,
  composants boutons/sections), `/vendre-un-immeuble/` portée en composants.
- **M2 — Contrats de données** : les 4 projections du §2 définies et stubbées. **Débloque le
  travail en parallèle du site et du BO**, sans attendre que le BO soit fini.
- **M3 — Contenu** : `content.articles`, import des 14 articles avec métadonnées à l'identique,
  pipeline Mindstardust, revalidation.
- **M4 — Conversion** : `/estimer-un-immeuble/` + formulaire multi-étapes → endpoint BO.
- **M5 — Références** : `/immeubles-vendus/` alimentée par les projections anonymisées.
  Sortie de l'iframe Bubble.
- **M6 — Pages villes** : gabarit + premières communes (vendre × villes uniquement).
- **M7 — Homepage** + footer global, puis bascule DNS.
- **M8 — Espace client** (acheteurs), sur projection par acquéreur.

**Ordre de bascule : tout le reste avant la HOME.** La homepage porte 16 % du trafic et
l'essentiel de l'enjeu CTR : elle passe en dernier, quand le socle est éprouvé.

---

## 15. Dettes et bugs connus

- **Liens morts dans le footer livré** : `/mentions-legales/` n'existe pas (la vraie URL est
  `/mentions-legales-2/`, slug dupliqué à nettoyer) et `/politique-de-confidentialite/`
  n'existe pas du tout. `/plan-du-site/` est absent du footer alors qu'il a sa place.
- ~~**Incohérence de chiffre**~~ : tranché par MAV le 26/10/2026. **1 500** partout, comme
  la meta de l'accueil (gelée) : page Vendre, page Acheter, pied de page, page Découpe, lus
  dans `chiffres.investisseurs` déposé par le BO, valeur de secours `PREUVES.investisseurs`.
  Le BO dépose **1 500** et non son décompte réel (MAV, 26/10/2026 : « go pour 1500 tant pis »).
- **Libellés « bureaux » / « commerces » inversés** dans le formulaire actuel (§9).
- `/immeubles-vendus/` est une iframe Bubble : zéro contenu indexable, 365 transactions non
  exploitées.

---

## 16. Interdits récapitulatifs

**Sécurité — priorité absolue**
- ❌ Une clé du BO dans l'environnement du site, même en lecture seule
- ❌ Clé `service_role` côté navigateur ou dans une variable `NEXT_PUBLIC_*`
- ❌ Une table sans RLS
- ❌ Le site qui lit une table du CRM plutôt qu'une projection
- ❌ Le BO sur un sous-domaine de `france-immeuble.fr`
- ❌ Publier une référence non anonymisée (adresse exacte, nom, prix exact)

**SEO**
- ❌ Changer une URL existante, ou changer de nom de domaine
- ❌ Modifier le title/meta de la homepage
- ❌ Une page ville sans données ville (doorway page)
- ❌ Publier un article généré sans relecture humaine
- ❌ Oublier `GTM-5KF68JV` sur une page

**Design**
- ❌ Google Fonts en runtime, `next/font/google`, CDN de polices
- ❌ Remplacer les polices ou découper Archivo par graisse
- ❌ Utiliser Archivo Black (statique, sans axe de largeur)
- ❌ Oublier `font-variation-settings` sur un titre
- ❌ Une couleur hors des tokens du §3
- ❌ Introduire une seconde couleur d'accent
- ❌ Un bouton qui n'est pas une pilule stricte

**Divers**
- ❌ `localStorage`, `sessionStorage`
- ❌ Images hébergées hors du domaine
- ❌ Mise en production sans validation humaine explicite
