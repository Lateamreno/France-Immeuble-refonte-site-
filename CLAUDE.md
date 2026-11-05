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

> **Décisions MAV du 04/11/2026 (audit SEO)** : le **prix de vente exact** reste publié sur les
> ventes réalisées (fiches et cartes), avec la rue sans numéro et la surface exacte : c'est assumé.
> Le BO peut déposer des **agrégats anonymes par département** (nombre de ventes, rendements,
> délais, nombre d'acquéreurs qui cherchent) pour de futures pages départements. Rien de nouveau
> (page, contenu, gabarit) n'est créé sans l'accord de MAV.

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

### Espace client v2 — décisions de MAV du 30/10/2026

- Le menu du site reste en haut ; l'espace s'ouvre dessous comme une application, sans hero.
  Organisation : option B (voir plus bas).
- **Messagerie** : plusieurs conversations nommées par client, rattachables à un immeuble (achat
  ou vente) par le client ou par l'agence. Chaque message part aussi par e-mail, à l'agence et au
  client, avec l'historique.
- **Rendez-vous** : une demande sur calendrier, confirmée par l'agent. E-mail immédiat au
  commercial attitré (sinon contact@) et à ma.voci@.
- **Vendeur** : offres reçues en détail, document d'offre compris (nom inclus) ; retours de visite
  **anonymisés**. Estimation détaillée avec curseur de prix et données du secteur. Frise :
  estimation, mandat, commercialisation, visites, offres, compromis, acte. Mandat signé dans
  DocuSign, le compte montre son état et le PDF.
- **Acheteur** : documents d'un bien ouverts dès l'envoi du dossier ; offre en ligne avec curseur
  de prix (comme Plein Bail), envoyée à l'agent qui confirme ; profil investisseur facultatif
  joint aux offres.
- **Agent attitré** attribué après le premier appel. L'appel ouvre l'envoi des dossiers en
  priorité et l'off-market. Sans appel, l'acquéreur est en **D** dans le BO : ne jamais l'afficher
  au client.
  Avant cet appel, l'accueil de l'acheteur porte une carte : un appel de quelques minutes avec un
  agent ouvre les biens off-market et l'envoi des dossiers en priorité, avec un bouton pour
  demander l'appel (MAV, 30/10/2026 : « quelques minutes », pas de durée chiffrée).
- Organisation retenue : **option B** (un seul compte, rubriques selon le profil, une page par
  immeuble à vendre avec ses onglets ; cinq onglets en bas au téléphone).
- Notifications par e-mail (nouveau bien, offre, message), désactivables, gabarit blanc.
- **Tout ce que le client saisit doit remplir le BO**, pas seulement partir par e-mail. Le BO ne
  répond 200 qu'une fois l'envoi enregistré ; sinon le site le garde en file et réessaie.
- **Livré le 30/10/2026** : cadre `src/components/compte/Coquille.tsx` (menu à gauche, cinq
  onglets en bas au téléphone, pied de page du site masqué), écrans `/mon-compte/` (accueil
  « À faire »), `immeubles/[cle]/?onglet=` (vue d'ensemble, estimation au curseur et données du
  département tirées des ventes publiées, offres avec PDF servi par `/api/compte/offre-document/`,
  documents, état locatif, mandat), `biens/[cle]/` (offre au curseur), `recherches/`,
  `messages/[conversation]/`, `rendez-vous/` (calendrier), `profil/` (profil investisseur,
  notifications, mot de passe). Envois : `src/lib/compte/envois.ts` (lead au BO, agent attitré en
  copie de l'alerte, copie gardée dans `compte_saisies` jusqu'au retour du BO). E-mails au client :
  `src/lib/compte/avis.ts` (une fois par ligne, table `compte_avis`), préférences dans
  `app_metadata.notifications`. Demande au BO : `docs/PROMPT-BO-COMPTE-V2.md`.
- **Décisions de MAV du 30/10 au soir et du 31/10** : alerte de rendez-vous à l'agent attitré et
  ma.voci@ sans contact@, et sans agent attitré à contact@ seulement (option `regleRendezVous`) ; photo de l'agent copiée une fois dans le seau
  privé `photos-agents` (migration 0013) et servie par `/api/compte/photo-agent/`
  (`src/lib/compte/photo-agent.ts`) ; le BO appelle `/api/compte/avis/` avec `AVIS_SECRET`, un
  secret à part de `CRON_SECRET` ; pièces jointes aux messages (cinq, 25 Mo, même seau que les
  pièces du §10, contrôle du contenu réel, `.doc`/`.xls` refusés, macros et PDF à code refusés :
  `contenuSuspect` dans `src/lib/compte/pieces.ts`) ; le client change lui-même ses coordonnées,
  l'e-mail avec un code envoyé à la nouvelle adresse, l'ancienne prévenue (type `coordonnees`).
- **Immeubles à vendre avec le compte** (MAV, 31/10/2026, « comme Plein Bail ») : recherche dans
  l'adresse de la page (`src/lib/recherche-biens.ts` : localisation, type, prix, rendement, surface,
  lots, sans offre, tris ; page filtrée en `noindex`), cœur des favoris sur les cartes et la fiche
  (table `compte_favoris`, migration 0014, type `favori` au BO sans e-mail), « Enregistrer la
  recherche » vers `recherche_compte`, fiche avec panneau d'offre au curseur et simulation de crédit
  (`offre_acquereur` avec `annonce`), état financier et
  comparaison avec nos ventes du département. Pages en cache ; l'état du visiteur est lu par
  `/api/compte/etat-biens/`. Sans compte, favori et offre mènent à la connexion puis reviennent
  sur la page. Rubrique « Mes favoris » dans le compte.
- **Moteur et fiche « comme Plein Bail »** (MAV, 31/10/2026, spec Plein Bail du 30/10, lot 59) :
  l'adresse est l'état de la recherche (`ou=d:78&ou=v:Lyon`, `dest`, `pmin`, `pmax`, `rdt`, `tri`).
  **Les critères sont ceux d'une recherche du BO, et rien d'autre** (MAV, 02/11/2026 : « il faut
  que les critères d'affichage soient les mêmes que ceux de notre BO de telle façon qu'ils puissent
  enregistrer leur recherche ») : départements et villes (une région ajoute ses départements),
  quatre types d'immeuble (MAV, 02/11 : Habitation, Commerces, Bureaux, Entrepôts ; envoyés au BO
  comme destinations Logement, Commerce, Bureau, Logistique ; ni hôtel ni parking ; lus dans `biens_lots`),
  prix, rendement ; à l'enregistrement, un ou plusieurs profils (une recherche par profil, le reste
  à l'identique) et un commentaire. Pas de type de ville, de surface, de DPE ni d'occupation
  dans la barre. Fond sombre (la page sur son image) et barre empilée au téléphone, comme Plein Bail
  (MAV, 02/11). La vignette off-market est toujours la première, quels que soient les critères
  et le tri. Une seule
  traduction filtres → résultats (`filtrer` dans `src/lib/recherche-biens.ts`), une seule puce pour
  les localisations, « En dehors de votre recherche » sous six résultats, rangées compactes au
  téléphone. Calculs partagés dans `src/lib/annonce.ts` (frais de notaire réels, rendements brut,
  net et acte en main, libellés d'occupation et de DPE). Fiche : galerie en carrousel, tuiles avec
  leur formule, état locatif (`biens_lots`, migration 0015), état financier, mentions
  réglementaires, biens similaires ; carte d'action collante dès 900 px de large et 660 px de haut
  (`src/components/biens/CarteAction.tsx`), barre « Voir le n° · Contacter · Faire une offre » en
  bas au téléphone, offre en feuille. Adapté à la charte : bronze seul, DPE en dégradé bronze,
  pas de carte de quartier (aucune tuile tierce), pas de carte vendeur (l'agence vend), l'écart
  au marché se mesure à nos ventes du département. Demande au BO : `docs/PROMPT-BO-ANNONCES.md`, livrée par le BO le 02/11
  (contrat §14 ; pas de GES, `charges_copro` libellé « Charges » ; 422 sur une annonce sortie de
  la vente : pas de file, le client est prévenu). Première vignette de la liste : l'off-market (retour #74, MAV, 02/11/2026).
  Retour #94 (MAV, 02/11) : la localisation propose toute la France, pas seulement là où un
  bien est en vente ; « Plus de critères » ajoute l'occupation (double curseur, filtre la
  liste) et le type d'opération (devient le profil enregistré ; ne filtre pas, le BO ne
  qualifie pas encore ses biens) ; une liste vide invite à enregistrer la recherche.
  Occupation et société partent aussi en clair dans le commentaire en attendant le BO.
  Retours #107 à #115 (MAV, 02/11) : tout bouton qui demande un compte (favori, offre,
  enregistrer, fin du dépôt de recherche) ouvre la **fenêtre de compte** (`ModaleCompte`, montée
  dans la mise en page, `ouvrirCompte()` de `src/components/biens/etat.ts`) : connecté, la page se
  recharge sur place (« #offre » rouvre l'offre) ; compte créé, le lien de vérification ramène sur
  la page (cookie `fi_retour`). Fiche : la référence du secteur est **Plein Bail** (#110, MAV, 03/11/2026 : « Pleinbail c'est
  mieux ») : prix au m² contre la médiane DVF des appartements, rentabilité contre celle de la ville,
  mêmes règles que `src/lib/benchmarks.ts` de Plein Bail, lues avec sa clé publiable (`src/lib/marche.ts`),
  bloc « Le marché à … » ; écart en or quand il est favorable à l'acquéreur, en noir sinon (MAV,
  03/11/2026) ; nos ventes restent en fin de fiche, sans comparaison ; « Nos ventes »
  en fin de fiche ; état financier en blocs à picto ; sous 1150 px de haut (retour #180), la simulation passe
  dans la feuille d'offre et la colonne tient sans défiler. DPE : fourchette des lots, de la
  meilleure classe à la moins bonne, quand le BO dépose les lots.
- **Lot 82, « Mes immeubles » dès le formulaire** (retours #261 à #278, MAV, 05/11/2026) :
  une estimation envoyée connecté (ou dont le compte s'ouvre avec le code du dossier) est
  copiée dans `compte_saisies` (type `estimation`, migration 0017 ; **rue sans numéro**,
  `rueSansNumero` de `src/lib/compte/immeubles.ts`) et s'affiche tout de suite dans Mes
  immeubles, avec sa page : vue d'ensemble, estimation en cours et marché du département,
  état locatif à remplir sur place (`DossierForm` avec `cible`, route `/api/compte/immeuble/`)
  et documents (`refEstimation` au BO). La copie s'efface devant la fiche du BO quand
  `compte_biens.ref` vaut sa `ref`. Plus de bouton « Mon dossier en ligne ». Connecté, les
  formulaires ne redemandent ni nom, ni e-mail, ni téléphone (une ligne « Modifier ») ; une
  connexion par la fenêtre ne recharge plus une page où un formulaire est en cours
  (`fi:connecte`, `useGarderALaConnexion`) ; l'écran de fin montre l'état locatif tout de
  suite ; lots au − et + ; bail « Nu » ; recherches en pictos, renommées au crayon
  (`recherche_nom`), budget au curseur avec espaces des milliers, liste relue seule après
  un ajout. Demande au BO : `docs/PROMPT-BO-MES-IMMEUBLES.md` (dont l'incident du 05/11 :
  le compte de MAV vidé d'un coup par le BO).
  Même jour : la pilule fixe du téléphone s'efface dès qu'un autre bouton de la page est à
  l'écran, et revient après (« sinon des boutons peuvent se superposer »).
  Vitesse (PageSpeed de MAV, 05/11/2026) : le 10,5 s de LCP mobile est une simulation ; en
  ralenti réel le titre du hero s'affiche à 2,5 s. Chargés à l'usage seulement (`next/dynamic`) :
  l'outil de recette, la fenêtre de connexion, les formulaires des fenêtres et la suite du
  message de contact ; carnet de l'accueil en priorité basse ; `/media/…?dpl=` un an en cache.
  Écartés après mesure : `inlineCss` (page de 22 à 167 Ko compressés) et ne précharger
  qu'Archivo (premier affichage de 1,8 à 3,2 s). Le plus gros poids restant est le conteneur
  GTM (Universal Analytics éteint et deux GA4, 528 Ko), à nettoyer dans GTM par MAV.
  Même jour (MAV) : nombre de lots avec deux petites flèches haut et bas à droite dans la case ;
  « Surface habitable (m²) » et « Loyer annuel HC (€) » sur une ligne, cases alignées.
  **Première fourchette dans le compte** (`src/lib/compte/fourchette.ts`), une fois l'état
  locatif terminé (« J'ai terminé ») avec ses surfaces Carrez. **Règle de MAV (05/11/2026)** :
  loyer annuel HC ÷ rendement brut de la ville (Plein Bail, `marche.ts`), à ±15 % ; **jamais
  au-dessus** de Carrez × prix médian DVF des appartements (souvent 10 à 15 % en dessous) ;
  **plus de 25 % de décote au m²** (ou aucun loyer) : pas de chiffre, une alerte « votre
  immeuble demande le passage d'un agent » avec un bouton de rendez-vous. Avertissement : données
  secteur automatiques et non vérifiées, l'agent adapte à l'immeuble et au rendement attendu
  des investisseurs ; son estimation fait foi.
- **Lot 85** (MAV, 05/11/2026). **L'état locatif part au BO pendant la saisie** (#266, « même si
  le client ne veut pas créer son compte, on a quand même les infos ») : même dépôt que l'envoi
  final avec `enCours: true`, sans e-mail à l'agence, toutes les 45 s au plus, tout de suite quand
  la page se ferme (`pagehide`, `fetch keepalive`) ou sur « Enregistrer » ; la tâche de la nuit
  rattrape un brouillon modifié et non transmis (empreinte, migration 0018) ; en file, la dernière
  version remplace la précédente. Mention « Enregistré à HH:MM et transmis à votre agent. Vous
  pouvez quitter la page ». Le compte devient facultatif ; dans le compte, « J'ai terminé »
  prévient l'agent et ouvre la fourchette. Onglets du bas au téléphone : Accueil, Vendre (immeubles
  et estimations), Acheter (biens proposés et recherches, deux sous-onglets en pilule), Favoris,
  Profil. Boutons centrés partout, ordinateur et téléphone (#270). Recherches : occupation « de 0
  à 100 % », rendement minimum au curseur de 0 à 12 %, la partie retenue va du point vers la
  droite (#272). Estimer, Analyses : retour à la mise en page d'avant le lot 82 (#268), resserrée
  seulement sous 760 px de haut. Pilule du téléphone : cachée dès qu'on entre dans une section
  qui a ses propres boutons, et revient après.

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
  c'est un objet photographié, pas une couleur d'interface. Les **e-mails** du site sont aussi
  sur fond blanc, texte noir, logo en image (MAV, 27/10/2026 : « moins l'impression que c'est
  une pub ») : gabarit unique `src/lib/courriel.ts`, logo `public/logo/logo-france-immeuble-email.png`.
- **Couleurs mortes** : `#D9BF7D`, `#D98F7D`, `#0C2432`, `#BD9091`, `#000000`, `#CCCCCC`,
  `#EFEFEF`, `#F8F8F8`.
- **Le site actuellement en ligne utilise l'ancienne charte** — ne jamais s'en inspirer.

### Signature visuelle groupe

- Filet vertical bronze 1-2 px à gauche des blocs importants.
- Surtitres en petites capitales espacées (`letter-spacing: 0.15em`), bronze, `--font-mono-site`.

---

## 4. Typographie — polices dans le repo

Les 4 woff2 variables sont dans **`/assets/fonts/`**, sous-ensemblées au **français et à
l'anglais** depuis le 05/11/2026 (accord de MAV, vitesse : 463 → 291 Ko pour les quatre ;
détail dans `assets/fonts/README.md`). **Ne rien remplacer d'autre, ne jamais découper par graisse.** Les fichiers ont perdu leurs crochets le
04/11/2026 (lot 77) : `Archivo[wdth,wght].woff2` était encodé `%5B…%5D` dans le préchargement et
pas dans le CSS, et chaque police était téléchargée deux fois. Même fichier, même contenu.

| Fichier | Rôle | Axes | Poids |
|---|---|---|---|
| `Archivo-wdth-wght.woff2` | Display — H1-H3, chiffres clés | `wght` 100-900 · `wdth` 62-125 | 89 Ko |
| `Inter-opsz-wght.woff2` | Body — texte, nav, boutons, formulaires | `wght` 100-900 · `opsz` 14-32 | 91 Ko |
| `JetBrainsMono-wght.woff2` | Data — chiffres, surtitres, labels | `wght` 100-800 | 39 Ko |
| `Caveat-wght.woff2` | Écriture des légendes de polaroïds (MAV, 22/10/2026) et des chiffres de la méthode de Vendre (MAV, 03/11/2026), rien d'autre. Non préchargée | `wght` 400-700 | 72 Ko |

```css
@font-face{font-family:"Archivo";src:url("/assets/fonts/Archivo-wdth-wght.woff2") format("woff2-variations");font-weight:100 900;font-stretch:62% 125%;font-display:swap}
@font-face{font-family:"Inter";src:url("/assets/fonts/Inter-opsz-wght.woff2") format("woff2-variations");font-weight:100 900;font-display:swap}
@font-face{font-family:"JetBrains Mono";src:url("/assets/fonts/JetBrainsMono-wght.woff2") format("woff2-variations");font-weight:100 800;font-display:swap}
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

**Exception : l'espace client** (`/mon-compte/…`, MAV, 30/10/2026) n'a pas de hero. C'est un
outil, il s'ouvre directement sur son contenu (« pas besoin de hero ni rien »).
**Page sur image** (`PageFond`, MAV, 02/11/2026) : pas de hero ; une seule image de fond court
sous **toute la page** (« pas juste sur la première partie où il y a le titre »), collée pendant
le défilement, voile sombre, le titre puis le contenu tout de suite. Les sections de la page n'ont
plus de fond propre. Pour `/immeubles-a-vendre/` (la recherche, cartes sur fond sombre) et
`/contactez-nous/` (le formulaire, retour #72 ; projet acheter, vendre ou autre, et « vendre »
ouvre le formulaire de vente habituel, retour #71). Références sur fond noir (retour #73).

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
défile (MAV : « Lire la suite », personne ne clique), puis le carnet entier et net sous le texte
(MAV, 02/11/2026 : la mise en page d'avant, mais l'image visible ; texte du carnet en noir,
`carnet-temoignage.webp`) ; l'échantillon des Références garde sur
ordinateur sa longue liste par région et département (MAV : « c'était pas mal comme
avant »), repliée en deux lignes qui glissent au téléphone. Suites courtes (méthode de
Vendre) : une étape par écran au téléphone, illustrations agrandies (retours #75 et #77,
02/11/2026). **Bouton fixe au téléphone sur toutes les pages qui vendent** (`BoutonFixeMobile`,
retour #77, puis MAV, 02/11/2026 : « partout », « pas tout en bas », « sous le pouce ») : une
pilule à 28 px au-dessus du bas de l'écran, sans bandeau. Cachée sur le hero, le formulaire
(`cible`), le pied de page et les rangées `.porte-action` ; elle remplace au téléphone les
boutons de section qui mènent au même endroit (`double-fixe`). **Estimer, « Analyses »** (MAV, 03/11/2026, dessin A) : un schéma d'immeuble haussmannien à
l'angle de deux rues (`src/lib/schema-immeuble.ts`, SVG calculé au serveur) dont chaque analyse
allume sa partie : rues en pointillés, abribus et commerce pour le secteur, contours pour la
technique, fenêtres pour le financier (la porte reste éteinte), mansarde en pointillés et vide
pour la constructibilité, un des trois personnages pour la cible (`AnalysesSchema`). Sur
ordinateur, allumage seul toutes les 3 s, arrêté au survol ; au téléphone, schéma collé en haut
et allumage au défilement. Légende A1 (MAV, 03/11/2026) : ni encadré ni rond autour du picto,
l'analyse allumée prend le filet or et son titre passe en or. Téléphone B1 : surtitre, titre et
immeuble collés en haut, une analyse par écran dessous, en grand, la suivante à peine visible ;
le titre se resserre sur un écran bas et se cache sous 600 px de haut (le surtitre et l'immeuble
restent). **Méthode de Vendre** (MAV, 03/11/2026) : le marbre noir de l'ancien site
(`marbre-noir.webp`) en fond et un grand chiffre or écrit en Caveat, décalé en haut à droite de chaque illustration qui n'en couvre que le bas
(`.methode-sec--marbre`, `.step__chiffre`) ; l'ancien site utilisait Quentin, licence inconnue.
**Estimer, analyses épinglées** (retour #127, MAV, 03/11/2026) : sur ordinateur, la section
reste à l'écran (immeuble, analyses et bouton) pendant que le défilement fait passer les cinq
analyses, puis la page reprend (`.sec-analyses--pin`). Au téléphone, on garde une analyse par
écran sous le titre et l'immeuble collés : la section bloquée y a été essayée et écartée (MAV,
04/11/2026). Six analyses depuis le retour #165 (MAV, 04/11/2026) : la sixième, « Découpe »,
allume une ligne de partage des lots sur la façade ; le chapeau est monté dans le hero (#168) ;
allumage net, sans fondu (#167). **Méthode de Vendre centrée** (#124,
#125) : sans petits numéros ni frise, le grand chiffre or dit l'ordre. **Découpe** (retours
#126 à #141) : la marge du marchand ; les deux acheteurs en dessin (`DeuxAcheteurs`) ;
honoraires de vente et de montage détaillés ; étapes avec picto, sans filet ni point ;
la Team Reno pour les travaux (lien vers www.lateamreno.fr) ; tous les boutons mènent au formulaire de vente en fin de
page. Lot 75 (retours #150 à #164, MAV, 04/11/2026) : les deux acheteurs dessinés devant le même
immeuble isométrique (`src/lib/dessin-acheteurs.ts`), l'investisseur seul entouré comme la cible
d'Estimer, les familles nombreuses ; lots occupés proposés sur Plein Bail, lots libres confiés à
des agences locales sans surcoût ; 5 000 € TTC à la signature de la structuration, le solde à la
première vente ; périmètre « Paris et Île-de-France » sur la carte de France, la région en or
(`CarteIdf`). **Acheter et le SEO** (MAV, 04/11/2026 : « le titre c'est même pas acheter un
immeuble de rapport ») : H1 « Acheter un immeuble de rapport avant qu'il soit annoncé », H2 et
meta sur « immeuble de rapport », FAQ repliée de cinq questions avec ses données FAQPage. La page
reste une page qui convertit (§6) : le texte SEO est dans la FAQ, fermée par défaut.
Lot 76 (MAV, 04/11/2026) : « Les offres » de l'accueil en option A (#149 : photo fondue en
fond, picto en tête de carte) ; **aucun bouton sur deux lignes au téléphone**, vérifié par script
à 390, 375, 360 et 320 px (`court` de `Button` : un libellé court sous 600 px) ; les deux acheteurs
de la Découpe sont l'immeuble d'Estimer (`schemaImmeuble("bloc" | "decoupe")`) : toutes les
fenêtres allumées et un investisseur à la calculette, ou quelques fenêtres et une famille (la mère
vers les commerces, le père vers l'immeuble, les enfants à la balançoire) ; la carte du périmètre
est la France au trait or, l'Île-de-France allumée d'un halo (retour #179 : la vue de nuit était « trop réaliste ») ;
fiche annonce : la barrette de prix reste dans la colonne (#171) ; Contact : le titre à gauche,
le formulaire titré « Échangeons sur votre projet » (#172, #173).
Lot 78 (retours #174 à #204, MAV, 04/11/2026) : sur crème, surtitre et accroche en noir ; les
formulaires de contact portent leur titre dans leur cadre (« Parlez-nous de votre projet »,
« Échangeons sur votre projet ») ; au téléphone, le titre et le sous-titre avant le formulaire,
pas de carnet sous « Vendez votre immeuble », les cartes du réseau l'une sous l'autre ; menu du
téléphone sur toute la hauteur, sous-menus dépliés d'office ; « Estimer mon immeuble » du menu
mène au formulaire (`#estimer`) ; le bouton fixe reste sur le pied de page et s'efface devant
tout formulaire visible ; Acheter : surtitre « Acheter un immeuble », « Déposer ma recherche »
sur l'accueil. Découpe : carte au trait or, Île-de-France en halo (`CarteIdf`, vectoriel) ;
seules la fenêtre que regarde le père et ses deux voisines sont allumées ; « Des honoraires
connus d'avance » avec un picto par ligne et les montants dans l'or des boutons ; tableau du cas
réel en libellés courts au téléphone, sans défilement. Fiche annonce : la colonne tient dans
l'écran (cœur à côté de « Voir le n° » et « Contacter », cadres plus bas, simulation dans la
feuille sous 1150 px de haut). Ventes au téléphone : une ligne qui glisse par département
d'Île-de-France puis par région, carte de la région en tête.
Lot 79 (retours #205 à #229, MAV, 04/11/2026) : **le menu fermé du téléphone n'existe plus pour le
doigt** (`visibility:hidden`) ; au lot 78, ses sous-menus invisibles couvraient la page et prenaient
les clics (« des liens partout », formulaires impossibles à remplir, défilements bloqués). Ne jamais
laisser un élément invisible recevoir le doigt. Aucun lien dans les textes des pages hors blog : le
maillage du blog reste. Au téléphone, le menu ne montre que les sous-menus (Vendre en bloc, Vendre à
la découpe, Biens vendus…), sans titre de groupe ; les articles du blog l'un sous l'autre ; texte
secondaire presque blanc ; champs à 16 px (l'iPhone zoomait). « Déposer ma recherche » de l'accueil
ouvre la fenêtre de recherche (`BoutonRecherche`). Nos ventes : « Vendez votre immeuble » en fin de
page, communes d'une seule vente classées par prix au m², « et X autres communes ».
Lot 80 (retours #230 à #260, MAV, 04/11/2026) : au téléphone, **le titre de chaque hero commence
au même niveau** (16 % de l'écran sous la barre) et les boutons tombent au niveau de ceux de
l'accueil, deux cales souples qui se tassent quand le texte est long (le hero tient sur un écran) ; flèches des lignes qui glissent sous les cartes, au centre ; une carte passe au
premier plan dès les trois quarts visibles ; flèche or des listes déroulantes ; menu ouvert jusqu'au
bas de l'écran, page bloquée derrière ; un lien vers une ancre (`#estimer`) se recale après le
chargement (`AncreStable`) ; sur Nos ventes et les fiches de vente, « Estimer mon immeuble » et la
pilule ouvrent le formulaire dans une fenêtre (`ModaleEstimation`) ; photo claire et conviviale
derrière le formulaire de Vendre une photo sérieuse, un dossier qu'on signe (`FondPhoto clair`,
Unsplash) ; picto détective au trait (chapeau mou, col relevé, cravate) pour l'off-market de
l'accueil ; sur Contact, le formulaire reste avant les coordonnées ; pictos téléphone, e-mail et adresse dans le pied de page. Textes : un
immeuble en bloc se valorise au rendement du secteur, et non au prix au m² (plus de
« capitaliser ») ; Acheter titré « avec France Immeuble », « 100 % de nos biens d'abord en
off-market ».
**Off-market, « Le principe »** (retour #105, MAV, 03/11/2026) : « Les meilleures offres sont
off-market », l'homme aux lunettes qui lit son dossier, fondu dans le noir
(`atouts/commercialisation-dossier.webp`, retour #147, MAV, 04/11/2026 : « c'est cette photo que
j'aime bien »), trois raisons en cartes de verre.
**Photos fondues** dans les
sections sombres sans image (`FondPhoto`, page Vendre : formulaire et contact, MAV, 02/11/2026). Lignes en `marches` : chaque carte dans une case de taille fixe, seule la
carte rétrécit (retour #76 : l'arrêt du défilement ne saute plus). Suites longues (mission de la Découpe) : grille 3 × 2 sur
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
- **Un seul formulaire par page de conversion** (MAV, 03/11/2026) : le bloc « Besoin d'un
  conseil ? » et son formulaire de contact restent sur l'accueil (public mélangé) et la page
  Contact. Vendre et Estimer finissent sur le formulaire d'estimation, avec le seul bouton
  téléphone à côté pour les indécis (l'e-mail y était moche, MAV) ; l'e-mail de contact est
  dans le pied de page de toutes les pages : un contact donne moins d'informations qu'une estimation.
- **Le message de contact se prolonge** (retour #120, MAV, 03/11/2026) : prénom, nom et
  e-mail sur tous les formulaires de contact ; le message parti, « acheter » enchaîne sur le
  dépôt de recherche et « vendre » sur l'estimation, coordonnées et message repris
  (`initial` de `EstimationForm`, `contact` de `RechercheForm`). Le message reste au BO même
  si le visiteur s'arrête là. La recherche ou l'estimation qui suit porte `refContact`, la
  référence du message : le BO regroupe les deux et garde, pour un acheteur, la vignette du
  message dans « Formulaires du site » pour pousser l'appel (MAV, 04/11/2026 ;
  `docs/PROMPT-BO-CONTACT-SUITE.md`).
- **Ventes publiées** (retour #144, MAV, 03 et 04/11/2026) : l'écart à l'estimation ne
  s'affiche qu'entre −8 % et +8 % (au-delà, dans les deux sens, l'estimation était loin du
  prix) ; un délai avant l'offre de plus de trois mois ne s'affiche pas (`ecartPublie`,
  `delaiPublie` de `CarteVente`).
- **Alerte de l'agence à chaque formulaire** (MAV, 22/10/2026) : le site envoie lui-même un
  e-mail à `contact@` et `ma.voci@` (SendGrid, depuis `contact@france-immeuble.fr`,
  Reply-To = le client), quel que soit le formulaire, même si le BO est en panne
  (`src/lib/notifications.ts`). Réglages : `docs/COMPTE-CONFIGURATION.md`.
- **E-mail au client après une estimation et compte créé pour lui** (MAV, 27/10/2026) :
  un agent appelle sous 48 h, liste des pièces, lien d'accès à l'espace client
  (`src/lib/compte/accueil.ts`, page `/mon-compte/activer/`). **Seulement quand la partie 2
  est remplie** (surface et loyer : de quoi estimer), hors PleinBail. Arrêté après la
  partie 1, le visiteur ne reçoit rien : l'agent l'appelle. Une adresse reçoit au plus un
  e-mail par 24 h (table `envois_client`, empreinte de l'adresse). Le seul autre e-mail vers un
  visiteur est le code de confirmation qu'il demande en validant son dossier (5 par 24 h au plus).
- **Comptes vendeurs jamais ouverts supprimés après 30 jours** (`src/lib/compte/purge.ts`,
  tâche quotidienne `/api/lead/relance/`). Les comptes créés par le visiteur lui-même
  (acquéreurs) ne sont jamais purgés (MAV, 27/10/2026).
- **Aucun prénom dans les messages des formulaires** (MAV, 27/10/2026 : « c'est insultant »).
  Pas de « Merci Claire » ; l'e-mail au client commence par « Bonjour, ».
- Dépôt de recherche acquéreur en trois étapes courtes : critères, budget, coordonnées.
  Retours #83 à #91 (MAV, 02/11/2026) : type d'opération Investissement et/ou Marchand de
  biens (deux choisis = deux recherches identiques, visibles comme telles au récapitulatif ;
  ni patrimonial ni promoteur) ; lieux comme au BO, régions, départements et toutes les
  communes de France, au clavier ou avec « + » (`ChoixLieux`, `/api/communes/`) ; budget
  minimum et maximum en euros avec un double curseur de 0 à 10 M€ et plus (sans limite au
  BO) ; précisions en zone de texte pleine largeur ; société facultative ; plus de
  financement. Fin : « Créer mon compte » en bouton, avec ce que le compte apporte, plus de
  « Être rappelé ». Demande au BO : `docs/PROMPT-BO-RECHERCHE.md`.
- **Le « sous 48 h » ne se dit qu'à la fin du formulaire** (retour #65, MAV, 27/10/2026) : avant,
  le visiteur doit pouvoir croire que l'estimation arrive en ligne. Aucune promesse de délai dans
  les accroches, les cartes ou les étapes du formulaire. Seule exception : la meta de l'accueil,
  gelée (§10).
- Adresse : la saisie à la main est une ligne de la liste des suggestions (retour #62), affichée
  aussi quand rien n'est trouvé ou que la recherche ne répond pas.
- **Écran de fin et dossier en ligne** (retour #66 : aperçu des premières lignes, bas flouté,
  « Voir tout et remplir » déplie le tableau sur place ; au téléphone une ligne courte par lot ;
  retours #64 et #67 à #70 : pas de hero, pas d’étage, une colonne état, un picto par type de lot, MAV, 27 et 30/10/2026) : « C'est noté. Un agent vous
  appelle sous 48 h », la liste des éléments à préparer (`ELEMENTS_ATTENDUS`), puis le bouton
  « Remplir mon dossier en ligne » → `/mon-compte/dossier/` : l'état locatif lot par lot,
  prérempli avec les lots de la partie 2, options des lots de Plein Bail (`src/lib/dossier/`).
  Brouillon enregistré sur le serveur (table `dossiers_vendeurs`, cookie httpOnly), vidé dès
  l'envoi. « Valider et créer mon compte » : le dossier part au BO (`etat: "dossier"`, même
  `ref`), puis mot de passe et **code reçu par e-mail** : le compte ne s'ouvre qu'avec la preuve
  de l'adresse (§2). Ne jamais écrire sur l'écran de fin qu'un lien a été envoyé.

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

**Décisions MAV du 04/11/2026** : seules `/vendre-un-immeuble/` et `/estimer-un-immeuble/` restent
des pages de conversion pour Google Ads (pas de texte SEO ajouté) ; les autres pages peuvent viser
le trafic. Le title et la meta de l'accueil restent gelés jusqu'à la bascule ; **quelques semaines
après, rappeler à MAV de tester un nouveau title/meta selon ce que montre la Search Console**.
Pas de page Boulogne ni Neuilly tant qu'aucune vente n'y est publiée. Audit complet :
https://claude.ai/artifact/1inya8hsQapWCuXT9QTWwZ.

### Cannibalisation

`/vendre-un-immeuble/` et `/estimer-un-immeuble/` se disputent leurs requêtes avec deux articles
qui, eux, performent — très probablement `/comment-vendre-un-immeuble-de-rapport/` et
`/comment-estimer-un-immeuble-de-rapport/`. **Ces deux pages perdent donc toute ambition SEO :
elles convertissent, les articles rankent.**

### Vocabulaire de marque

Expression dominante : **« immeuble de rapport »** (14 000+ impressions/an) — à privilégier
partout. Secondaire : « vente en bloc » (contexte juridique). À éviter : « immeuble entier »
(~600 imp/an), sauf contexte définitionnel.

Réassurance : 1 170 immeubles traités depuis 2018 (chiffre `immeubles_traites` déposé par le BO
dans `chiffres`, affiché en tête de l'accueil, MAV 27/10/2026 ; 1 170 validé par MAV le 31/10/2026) · 1 500 acheteurs en base (chiffre déposé par le BO) · 28 avis Google
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

> **Depuis la bascule sur www.france-immeuble.fr (MAV, 05/11/2026)** : chaque lot est poussé
> **seulement sur la branche de travail** (preview Vercel). **Jamais de `git push origin HEAD:main`
> sans que MAV le demande explicitement, lot par lot** (« passe en prod »). Le site est en ligne :
> `main` = production.

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
- ❌ Publier une référence non anonymisée (adresse exacte, numéro de rue, nom) ; le prix de vente exact est admis (MAV, 04/11/2026)

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
