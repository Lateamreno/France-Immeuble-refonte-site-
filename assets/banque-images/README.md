# Banque d'images — candidats refonte 2026

20 photographies Unsplash, étalonnées « or » aux couleurs de la charte France Immeuble.
Sélection à valider : ce dossier est une réserve de candidats, pas un jeu d'assets validé.

## Correction couleur appliquée

**Correction légère, pas un étalonnage.** Les photos gardent leurs couleurs réelles — un
ciel reste bleu, une chemise bleue reste bleue, la peau garde son ton. On ne fait que
réchauffer légèrement le rendu, de sorte que le jeu s'accorde au bronze de la charte sans
qu'on puisse dire qu'un filtre a été passé.

```
.modulate({ saturation: 0.97 })
.recomb([[1.030, 0.055, 0.000],
         [0.010, 1.010, 0.000],
         [0.000, 0.015, 0.915]])
```

Pas de vignettage, pas de halo, pas de contraste ajouté.

### Deux écueils écartés — ne pas les réintroduire

1. **Le sépia.** Une matrice de canaux agressive (canal bleu sous 0.6, forte désaturation)
   collapse l'image sur une seule teinte. Le résultat lit comme une vieille photo, pas
   comme une marque.
2. **L'orange fluo.** Remonter la saturation globale après un virage chaud ressuscite les
   bleus et sature la peau. Ni l'un ni l'autre ne ressemble à ce que font les autres sites
   du groupe, où la retouche est discrète.

Trois intensités ont été comparées avant de retenir celle-ci ; la monter ou la baisser
tient dans les trois coefficients ci-dessus.

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
