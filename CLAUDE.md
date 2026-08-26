# CLAUDE.md — Refonte site France Immeuble

> Version du 7 août 2026 (rév. 2 — typographie verrouillée).
> Spec de référence. À placer à la racine du repo `france-immeuble-refonte`.

---

## 1. Contexte

Refonte visuelle progressive de **france-immeuble.fr** — agence de vente d'immeubles de rapport, 66 avenue des Champs-Élysées, Paris 8e. Le site actuel tourne sur WordPress (OVH) + Elementor + thème custom `hono-theme`, design daté de 2021.

**Architecture du projet — À COMPRENDRE AVANT TOUT :**

- **Ce repo = STAGING VISUEL uniquement**, déployé sur Vercel pour validation sur URL privée.
- **La production reste WordPress** : le HTML validé est intégré page par page dans WordPress (bloc Gutenberg « HTML personnalisé » + template vierge), sur les **mêmes URLs**.
- Conséquence : **HTML/CSS/JS PUR STATIQUE. Interdiction absolue de framework** (pas de Next.js, React, Vue, build step, imports ES modules entre fichiers). Chaque page = 1 fichier HTML autonome, avec son CSS et son JS en balises `<style>` / `<script>` intégrées. Le fichier doit être copiable-collable tel quel dans un bloc HTML WordPress.

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
  --display-wght:700;
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

## 3. Typographie — self-hébergement obligatoire

Les 3 polices sont **libres et self-hébergées en woff2** dans `/assets/fonts/`, appelées via `@font-face` avec `font-display: swap`.

**INTERDIT** : `<link>` vers `fonts.googleapis.com`, `@import` d'une CDN de polices, `next/font/google`. Deux raisons : la contrainte HTML statique, et l'exposition d'IP utilisateurs à un tiers (sujet RGPD déjà sanctionné en Europe).

| Rôle | Police | Usage |
|---|---|---|
| Display | **Archivo** (variable, `wdth` 118 / `wght` 700) | Titres H1-H3, chiffres clés. Réglage d'axe étendu = substitut libre de GT America Extended Bold. La marque travaux du groupe utilise la **même famille** en `wdth` 100 : un seul woff2 pour les deux sites. |
| Body | **Inter** (variable) | Corps de texte, navigation, boutons, formulaires. |
| Mono | **JetBrains Mono** | Données chiffrées, surtitres techniques, labels de stats. |

**Self-héberger le fichier variable complet** (`Archivo[wdth,wght].woff2`, ~90 Ko) — ne jamais le découper en fichiers statiques par graisse, cela casserait le réglage d'axe.

Déclaration attendue :

```css
@font-face{
  font-family:"Archivo";
  src:url("/assets/fonts/Archivo[wdth,wght].woff2") format("woff2-variations");
  font-weight:100 900;
  font-stretch:62% 125%;
  font-display:swap;
}
```

> **Réversibilité** : si une licence webfont GT America (Grilli Type) est acquise plus tard, ne modifier que `--font-display` et le bloc `@font-face` correspondant. Rien d'autre ne bouge.

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

| # | Page | Risque SEO | Contrainte |
|---|---|---|---|
| 1 | `/vendre-un-immeuble/` | Nul (7 clics/an) | Refonte libre, design premium à fond. Page de rodage du design system. |
| 2 | `/estimer-un-immeuble/` | Nul (9 clics/an) | Refonte libre + **formulaire d'estimation multi-étapes à recoder** (voir §6). |
| 3 | Homepage | **SANCTUAIRE** | Liberté totale sur le design. **Title et meta description CONSERVÉS À L'IDENTIQUE.** H1 et textes clés préservés sémantiquement. |
| 4 | `/immeubles-vendus/` | Nul | Galerie premium — c'est la preuve sociale (365 immeubles traités). |
| 5 | `/contactez-nous/` | Nul (noindex) | Refonte libre. |
| 6 | **Footer global** | — | Véhicule du maillage interne. Prévoir une colonne « Vendre par ville » (Paris, Neuilly, Levallois, Boulogne…) pour les futures landings géo. |

**Le blog n'est PAS dans le périmètre.** 92 % du trafic du site y réside — on n'y touche pas à ce stade.

### Contrainte de conception imposée par le client

**Chaque lien du menu haut mène à une page qui convertit.** Aucune page du menu principal ne doit être bourrée de texte SEO. Le contenu long va dans le blog et les futures pages piliers, pas dans le menu.

### Baseline SEO à connaître

Search Console, 12 mois glissants au 6 août 2026 : 6 443 clics / 320 081 impressions. 78 % de trafic hors marque. **La homepage fait 110 226 impressions/an à 0,92 % de CTR en position 8,67** — l'objectif direct de cette refonte est de porter ce CTR à 2 %, soit +1 100 clics/an sans gagner une position.

### Vocabulaire de marque

Expression dominante : **« immeuble de rapport »** (14 000+ impressions/an) — à privilégier partout. Secondaire : « vente en bloc » (contexte juridique). À éviter : « immeuble entier » (~600 imp/an), sauf contexte définitionnel.

Éléments de réassurance disponibles : 365 immeubles traités depuis 2018 · 1 372 investisseurs en base · 28 avis Google à 4,9/5 · honoraires 5 % du prix net vendeur · modèle off-market · mandats semi-exclusifs avec période de test interne 2-4 semaines.

Coordonnées réelles : 01 72 87 52 22 · 66 avenue des Champs-Élysées, 75008 Paris.

---

## 6. Formulaire d'estimation

C'est le **canal de leads n°1** — à ne pas improviser.

- Formulaire **multi-étapes** (une question par écran, barre de progression, validation par étape).
- Champs : type de bien, adresse / arrondissement, surface, nombre de lots, occupation, revenus locatifs annuels, coordonnées.
- **Backend** : Formspree en première itération (notification instantanée à contact@france-immeuble.fr), migration vers le CRM plus tard. À confirmer avant M2.
- **Pas de `<form>` natif soumis en POST classique** si cela casse l'intégration WordPress — soumission en `fetch()` avec état de succès inline.
- Prévoir un event GTM sur la soumission réussie (`form_submit_estimation`) — le tracking de conversion était défaillant, c'est un point à sécuriser.

---

## 7. Tracking

**`GTM-5KF68JV` est obligatoire sur CHAQUE page** — snippet `<head>` + `<noscript>` en début de `<body>`. C'était absent de certaines pages du site actuel : ne jamais l'oublier.

---

## 8. Publication vers WordPress

- Un script `push-to-wp.js` lit les credentials depuis `.env` (jamais en dur) :

```
WP_URL=https://www.france-immeuble.fr
WP_USER=<identifiant>
WP_APP_PASSWORD=<mot de passe d'application>
```

- `.env` est dans `.gitignore`. Vérifier avant tout commit.
- Le script utilise l'API REST WordPress (`/wp-json/wp/v2/pages/{id}`).
- **Jamais de publication directe sans validation humaine explicite.** Mode brouillon par défaut.
- Prévoir une commande `--list-pages` (GET `/wp-json/wp/v2/pages`) pour récupérer les IDs.
- Alternative manuelle toujours valable : copier-coller le HTML dans un bloc Gutenberg « HTML personnalisé », template vierge.

---

## 9. Workflow de validation

1. Développer la page → déployer sur Vercel → Marc-Antoine valide visuellement sur l'URL de preview.
2. Itérer jusqu'à validation explicite.
3. Pousser vers WordPress (script ou copier-coller).
4. Vérification post-bascule : rendu desktop + mobile, formulaire fonctionnel, GTM qui fire, balises Yoast intactes.
5. Noter la date de migration (suivi dans Notion, base « Refonte FI — Suivi des pages »).

**Ordre de bascule en production : vendre → estimer → transactions → contact → HOME EN DERNIER.**

---

## 10. Milestones

- **M1** : setup repo + design system CSS (tokens, typo self-hébergée, composants boutons/sections) + `/vendre-un-immeuble/` complète sur Vercel
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
- ❌ Découper la variable font Archivo en fichiers statiques
- ❌ Oublier `font-variation-settings` sur un titre (il tomberait en largeur standard)
- ❌ `localStorage`, `sessionStorage`
- ❌ Images hébergées hors du domaine
- ❌ Toucher au blog, aux articles, aux URLs existantes
- ❌ Modifier les title/meta de la homepage
- ❌ Publier sur WordPress sans validation explicite
- ❌ Oublier GTM-5KF68JV sur une page
- ❌ Utiliser une couleur hors des tokens du §2
- ❌ Introduire une seconde couleur d'accent
