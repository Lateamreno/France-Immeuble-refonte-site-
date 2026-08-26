# CLAUDE.md — Refonte site France Immeuble

> Version du 26 août 2026 (rév. 3 — graisse de titrage verrouillée à 900, polices déjà présentes dans le repo, dév en cloud).
> Spec de référence. À placer à la racine du repo `france-immeuble-refonte`.

---

## 1. Contexte

Refonte visuelle progressive de **france-immeuble.fr** — agence de vente d'immeubles de rapport, 66 avenue des Champs-Élysées, Paris 8e. Le site actuel tourne sur WordPress (OVH) + Elementor + thème custom `hono-theme`, design daté de 2021.

**Architecture du projet — À COMPRENDRE AVANT TOUT :**

- **Ce repo = STAGING VISUEL uniquement**, déployé sur Vercel pour validation sur URL privée (Deployment Protection activée).
- **La production reste WordPress** : le HTML validé est intégré page par page dans WordPress (bloc Gutenberg « HTML personnalisé » + template vierge), sur les **mêmes URLs**.
- Conséquence : **HTML/CSS/JS PUR STATIQUE. Interdiction absolue de framework** (pas de Next.js, React, Vue, build step, imports ES modules entre fichiers). Chaque page = 1 fichier HTML autonome, avec son CSS et son JS en balises `<style>` / `<script>` intégrées. Le fichier doit être copiable-collable tel quel dans un bloc HTML WordPress.
- **Développement en sessions cloud** (claude.ai/code). L'accès réseau est restreint : ne jamais tenter de télécharger une ressource externe, tout ce qui est nécessaire est déjà dans le repo.

---

## 2. Design tokens (charte 2026 — alignée groupe)

À déclarer une seule fois en tête de chaque page. Les noms de variables sont **identiques à ceux de la marque travaux du groupe** : cohérence de nommage inter-projets, seul le réglage de largeur du display diffère.

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

- **Le bronze `#C19B6E` est la SEULE couleur d'accent.** Le relief s'obtient par dégradés monochromes clair → profond, par ombres colorées et halos — **jamais par une seconde couleur vive**.
- Les 3 noirs servent à empiler des sections sombres successives sans aplat plat : `--color-noir` pour le hero et les sections fortes, `--color-noir-2` et `--color-noir-3` pour les blocs adjacents et les cartes.
- `--color-ligne` (#282522) = bordures et séparateurs sur fond sombre. `--color-gris` (#8E8A84) = texte secondaire, gris chaud compatible bronze.
- **Couleurs mortes, à ne jamais utiliser** : or champagne `#D9BF7D`, or rosé `#D98F7D`, bleu nuit `#0C2432`, gris rosé `#BD9091`, noir pur `#000000`, et les gris froids `#CCCCCC` / `#EFEFEF` / `#F8F8F8`.
- **Le site actuellement en ligne utilise l'ancienne charte** — ne jamais s'en inspirer pour les couleurs.

### Signature visuelle groupe

- Filet vertical bronze 1-2 px à gauche des blocs importants.
- Surtitres de section en petites capitales espacées (`letter-spacing: 0.15em`), en bronze, en `--font-mono-site`.

---

## 3. Typographie — polices DÉJÀ dans le repo

Les 3 polices sont **déjà présentes dans `/assets/fonts/`**, en woff2 variables sous-ensemblées au latin étendu. **Ne rien télécharger, ne rien convertir, ne rien remplacer.**

| Fichier | Rôle | Axes |
|---|---|---|
| `Archivo[wdth,wght].woff2` | Display — titres H1-H3, chiffres clés | `wght` 100-900 · `wdth` 62-125 |
| `Inter[opsz,wght].woff2` | Body — texte, navigation, boutons, formulaires | `wght` 100-900 · `opsz` 14-32 |
| `JetBrainsMono[wght].woff2` | Data — chiffres, surtitres techniques, labels | `wght` 100-800 |

Déclaration attendue (bloc `@font-face` à reprendre tel quel dans chaque page) :

```css
@font-face{
  font-family:"Archivo";
  src:url("/assets/fonts/Archivo[wdth,wght].woff2") format("woff2-variations");
  font-weight:100 900;
  font-stretch:62% 125%;
  font-display:swap;
}
@font-face{
  font-family:"Inter";
  src:url("/assets/fonts/Inter[opsz,wght].woff2") format("woff2-variations");
  font-weight:100 900;
  font-display:swap;
}
@font-face{
  font-family:"JetBrains Mono";
  src:url("/assets/fonts/JetBrainsMono[wght].woff2") format("woff2-variations");
  font-weight:100 800;
  font-display:swap;
}
```

**INTERDIT** : `<link>` vers `fonts.googleapis.com`, `@import` d'une CDN de polices, `next/font/google`. Deux raisons : la contrainte HTML statique, et l'exposition d'IP utilisateurs à un tiers (sujet RGPD déjà sanctionné en Europe). L'accès réseau des sessions cloud est de toute façon restreint.

**Décisions typographiques verrouillées :**
- Le display est **Archivo variable réglée à `wdth` 118 / `wght` 900** — réglage d'axe étendu, substitut libre de GT America Extended (aucune licence webfont Grilli Type détenue). La marque travaux du groupe utilise la même famille en `wdth` 100 : parenté de groupe, marques non jumelles.
- **Archivo Black est ÉCARTÉE** (décision 26/08/2026). C'est une famille statique, sans axe de largeur : l'utiliser aurait fait perdre l'extension `wdth` 118 qui justifie tout le choix typographique. La graisse 900 d'Archivo variable donne un rendu équivalent en conservant l'extension.
- Réversibilité : si une licence webfont GT America est acquise plus tard, ne modifier que `--font-display` et le bloc `@font-face` correspondant.

---

## 4. Boutons — règle groupe, sans exception

- **Forme** : pilule stricte, `border-radius: var(--radius-pill)` sur les 4 côtés. Jamais 8 px, jamais carré.
- **Texte centré** horizontalement, même avec icône. Icône à droite, `gap: 10px`.
- **Padding** : `var(--btn-padding)`.
- **Sur fond clair** : fond `--color-noir`, texte blanc, hover `--color-bronze-hover`, ombre `--btn-shadow`.
- **Sur fond sombre** : CTA principal plein `--color-bronze` texte `--color-noir` ; CTA secondaire en outline bronze 1 px, texte bronze, hover fond bronze.
- Focus clavier visible obligatoire : `outline: 2px solid var(--color-bronze-clair); outline-offset: 3px`.

---

## 5. Périmètre — 6 chantiers, dans cet ordre de risque croissant

| # | Page | ID WP | Risque SEO | Contrainte |
|---|---|---|---|---|
| 1 | `/vendre-un-immeuble/` | 1081 | Nul (7 clics/an) | Refonte libre, design premium à fond. Page de rodage du design system. |
| 2 | `/estimer-un-immeuble/` | 997 | Nul (9 clics/an) | Refonte libre + **formulaire d'estimation multi-étapes à recoder** (voir §6). |
| 3 | Homepage | 6 | **SANCTUAIRE** | Liberté totale sur le design. **Title et meta description CONSERVÉS À L'IDENTIQUE.** H1 et textes clés préservés sémantiquement. |
| 4 | `/immeubles-vendus/` | 1428 | Nul | Aujourd'hui une simple iframe vers l'app Bubble → zéro contenu indexable. Décision d'architecture à prendre avant de coder. |
| 5 | `/contactez-nous/` | 964 | Nul (noindex) | Refonte libre. |
| 6 | **Footer global** | — | — | Véhicule du maillage interne. Prévoir une colonne « Vendre par ville » (Paris, Neuilly, Levallois, Boulogne…) pour les futures landings géo. |

**Le blog n'est PAS dans le périmètre.** 92 % du trafic du site y réside — on n'y touche pas à ce stade.

### Contraintes de conception imposées par le client

1. **Chaque lien du menu haut mène à une page qui convertit.** Aucune page du menu principal ne doit être bourrée de texte SEO.
2. **Cannibalisation à corriger** : `/vendre-un-immeuble/` et `/estimer-un-immeuble/` se disputent leurs requêtes avec deux articles du blog qui, eux, performent. Ces deux pages perdent donc toute ambition SEO : elles convertissent, les articles rankent.

### Baseline SEO à connaître

Search Console, 12 mois glissants au 6 août 2026 : 6 443 clics / 320 081 impressions. 78 % de trafic hors marque. **La homepage fait 110 226 impressions/an à 0,92 % de CTR en position 8,67** — l'objectif direct de cette refonte est de porter ce CTR à 2 %, soit +1 100 clics/an sans gagner une position.

Maillage actuel : `/vendre-un-immeuble/` reçoit 18 liens internes et n'en émet aucun ; `/estimer-un-immeuble/` 10 reçus / 0 émis. Le footer global est le seul véhicule possible pour irriguer les futures landings géo.

### Vocabulaire de marque

Expression dominante : **« immeuble de rapport »** (14 000+ impressions/an) — à privilégier partout. Secondaire : « vente en bloc » (contexte juridique). À éviter : « immeuble entier » (~600 imp/an), sauf contexte définitionnel.

Éléments de réassurance disponibles : 365 immeubles traités depuis 2018 · 1 372 investisseurs en base · 28 avis Google à 4,9/5 · honoraires 5 % du prix net vendeur · modèle off-market · mandats semi-exclusifs avec période de test interne 2-4 semaines.

Coordonnées réelles : 01 72 87 52 22 · 66 avenue des Champs-Élysées, 75008 Paris.

---

## 6. Formulaire d'estimation

C'est le **canal de leads n°1** — à ne pas improviser.

- Formulaire **multi-étapes** (une question par écran, barre de progression, validation par étape).
- Structure de l'existant à reprendre : étape 1 (prénom, nom, email, téléphone, adresse, descriptif) → étape 2 (lots habitation / bureaux / commerces / activité, surface carrez, loyer HC annuel, travaux à prévoir, échéance de vente) → message de succès.
- ⚠️ **Bug à ne pas reproduire** : dans le formulaire actuel, les libellés « bureaux » et « commerces » sont inversés par rapport aux noms de champs. Vérifier la correspondance.
- **Backend** : Formspree en première itération (notification instantanée à contact@france-immeuble.fr), migration vers le CRM plus tard. À confirmer avant M2.
- **Pas de `<form>` natif soumis en POST classique** si cela casse l'intégration WordPress — soumission en `fetch()` avec état de succès inline.
- Prévoir un event GTM sur la soumission réussie (`form_submit_estimation`) — le tracking de conversion était défaillant, c'est un point à sécuriser.

---

## 7. Tracking

**`GTM-5KF68JV` est obligatoire sur CHAQUE page** — snippet `<head>` + `<noscript>` en début de `<body>`. C'était absent de certaines pages du site actuel : ne jamais l'oublier.

---

## 8. Publication vers WordPress

- Un script `push-to-wp.js` lit les credentials depuis les **variables d'environnement de l'environnement cloud** — jamais depuis un fichier commité :

```
WP_URL=https://www.france-immeuble.fr
WP_USER=<identifiant>
WP_APP_PASSWORD=<mot de passe d'application>
```

- Le script utilise l'API REST WordPress (`/wp-json/wp/v2/pages/{id}`).
- ⚠️ L'accès réseau des sessions cloud est restreint : `france-immeuble.fr` devra être autorisé dans les réglages de l'environnement, sinon rester sur le copier-coller manuel. À trancher en M6.
- **Jamais de publication directe sans validation humaine explicite.** Mode brouillon par défaut.
- Alternative manuelle toujours valable : copier-coller le HTML dans un bloc Gutenberg « HTML personnalisé », template vierge.

---

## 9. Workflow de validation

1. Développer la page → commit → Vercel déploie automatiquement une preview.
2. Marc-Antoine valide visuellement sur l'URL de preview (protégée par Vercel Authentication).
3. Itérer jusqu'à validation explicite.
4. Pousser vers WordPress (script ou copier-coller).
5. Vérification post-bascule : rendu desktop + mobile, formulaire fonctionnel, GTM qui fire, balises Yoast intactes.

**Ordre de bascule en production : vendre → estimer → transactions → contact → HOME EN DERNIER.**

---

## 10. Milestones

- **M1** : design system CSS (tokens, `@font-face`, composants boutons/sections) + `/vendre-un-immeuble/` complète
- **M2** : `/estimer-un-immeuble/` + formulaire multi-étapes fonctionnel (backend tranché)
- **M3** : homepage
- **M4** : `/immeubles-vendus/` + `/contactez-nous/`
- **M5** : footer global + version intégrable dans le thème WordPress
- **M6** : script `push-to-wp.js` + première bascule en production

Chaque milestone est validé sur preview Vercel avant de passer au suivant.

---

## 11. Interdits récapitulatifs

- ❌ Framework JS, build step, dépendances npm côté front
- ❌ Google Fonts en runtime, `next/font/google`, CDN de polices
- ❌ Télécharger ou remplacer les polices — elles sont déjà dans `/assets/fonts/`
- ❌ Utiliser Archivo Black (écartée : statique, sans axe de largeur)
- ❌ Oublier `font-variation-settings` sur un titre (il tomberait en largeur standard)
- ❌ `localStorage`, `sessionStorage`
- ❌ Images hébergées hors du domaine
- ❌ Toucher au blog, aux articles, aux URLs existantes
- ❌ Modifier les title/meta de la homepage
- ❌ Publier sur WordPress sans validation explicite
- ❌ Oublier GTM-5KF68JV sur une page
- ❌ Utiliser une couleur hors des tokens du §2
- ❌ Introduire une seconde couleur d'accent
