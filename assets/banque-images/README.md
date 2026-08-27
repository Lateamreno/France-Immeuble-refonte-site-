# Banque d'images — candidats refonte 2026

20 photographies Unsplash, étalonnées « or » aux couleurs de la charte France Immeuble.
Sélection à valider : ce dossier est une réserve de candidats, pas un jeu d'assets validé.

## Étalonnage appliqué

Grade unique pour tout le jeu, afin que les pages restent cohérentes entre elles :

- désaturation partielle (`saturation 0.58`) — neutralise les bleus/verts qui concurrencent le bronze,
  sans virer au monochrome (la photo reste une photo)
- matrice de canaux à dominante chaude — l'or se loge dans les hautes lumières
- courbe par canal `[1.20, 1.12, 0.94]` — contraste + écrasement du bleu dans les ombres
- halo bronze `#C19B6E` en haut à droite, mode `overlay` 34 % — lumière rasante d'heure dorée
- vignettage `#0A0A0A` 40 % — les bords descendent vers le noir de la charte

Reproductible via `/tmp/final-v3.cjs` (fonction `grade`, sharp `recomb` + `linear` + composite SVG).

## Nommage

`Page <page> - <emplacement> - <description>.jpg`

L'emplacement est une **proposition**, pas une affectation : une image nommée
« Page Accueil - Hero » peut parfaitement finir ailleurs.

## Résolution

2000 px de large, JPEG qualité 86, sans sous-échantillonnage chroma (`4:4:4`).
Suffisant pour un hero pleine largeur. Les sources Unsplash permettent de remonter
plus haut si besoin — les identifiants sont conservés dans `SOURCES.txt`.

## Réserves sur trois images

- `Nos biens - Section Preuve - remise des cles` — maison miniature + porte-clés :
  cliché stock, calibre faible pour une agence d'immeubles à plusieurs M€.
- `Contact - Colonne - detail bureau lumiere` — l'enceinte au premier plan est hors sujet.
- `Estimer - Section Confiance - reunion table longue` — lit plutôt « café / coworking »
  que réunion d'arbitrage patrimonial.

## Licence

Unsplash License — usage commercial autorisé, sans attribution obligatoire.
Vérifier avant mise en ligne qu'aucune personne reconnaissable ne pose de problème
de droit à l'image sur un usage publicitaire.
