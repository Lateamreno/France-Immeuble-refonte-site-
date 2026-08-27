# Banque d'images — candidats refonte 2026

20 photographies Unsplash, étalonnées « or » aux couleurs de la charte France Immeuble.
Sélection à valider : ce dossier est une réserve de candidats, pas un jeu d'assets validé.

## Étalonnage appliqué

Grade unique pour tout le jeu, afin que les pages restent cohérentes entre elles :

- désaturation partielle (`saturation 0.66`) — atténue les bleus/verts qui concurrencent le bronze,
  sans virer au monochrome (la photo reste une photo)
- matrice de canaux à dominante chaude, canal bleu ramené à `0.58` — l'or se loge dans les
  hautes lumières et le bleu ne revient pas quand on remonte le contraste
- légère surexposition (`brightness 1.04`) et courbe par canal `[1.30, 1.20, 0.96]` — c'est
  ce couple qui donne la matière ; le premier réglage assombrissait et rendait le jeu terne
- halo `#E6C89A` en haut à droite, mode `overlay` 28 % — lumière rasante d'heure dorée
- vignettage `#0A0A0A` 18 %, large — pose les bords sans éteindre l'image

**Deux écueils écartés en chemin**, à ne pas réintroduire : une matrice de canaux trop
agressive donne un sépia uniforme qui lit comme un filtre daté ; et remonter la saturation
globalement après le virage chaud ressuscite les bleus et vire au orange fluo. La richesse
vient du contraste et de la luminosité, pas de la saturation.

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
