# Polices self-hébergées

Les 3 woff2 variables sont **présents dans ce dossier** et référencés par
`@font-face` dans `assets/css/design-system.css` ainsi que dans le `<style>`
inline de chaque page.

> **Ne rien télécharger, ne rien convertir, ne rien remplacer** (CLAUDE.md §3 et §11).

| Fichier | Rôle | Axes | Poids |
|---|---|---|---|
| `Archivo[wdth,wght].woff2` | Display — titres H1-H3, chiffres clés | `wght` 100-900 · `wdth` 62-125 | 145 Ko |
| `Inter[opsz,wght].woff2` | Body — texte, navigation, boutons, formulaires | `wght` 100-900 · `opsz` 14-32 | 199 Ko |
| `JetBrainsMono[wght].woff2` | Data — chiffres, surtitres techniques, labels | `wght` 100-800 | 45 Ko |

Sous-ensemblés au latin étendu (couverture FR complète : accents, ligatures,
guillemets français, tirets cadratins, €, exposants). Licence SIL Open Font
License pour les trois.

**Archivo ne doit jamais être découpée en fichiers statiques par graisse** :
le réglage `wdth` 118 du titrage — qui justifie tout le choix typographique —
en dépend. C'est aussi la raison pour laquelle Archivo Black a été écartée
(famille statique, sans axe de largeur).

## Vérification

Les 3 fichiers doivent être servis en `200` depuis le domaine du site, et
aucune requête ne doit partir vers une CDN de polices tierce (contrainte RGPD).

Contrôle visuel du titrage : les H1/H2/H3 doivent apparaître **larges et très
gras** (`wdth` 118 / `wght` 900). S'ils s'affichent en largeur standard, c'est
que le woff2 variable n'est pas chargé ou que `font-variation-settings` manque
sur le sélecteur de titrage.

Contrôle par fontTools :

```python
from fontTools.ttLib import TTFont
f = TTFont("Archivo[wdth,wght].woff2")
print({a.axisTag: (a.minValue, a.maxValue) for a in f["fvar"].axes})
# attendu : {'wght': (100.0, 900.0), 'wdth': (62.0, 125.0)}
```

L'absence de table `fvar` signifierait une police statique — inacceptable.

## Bascule WordPress

Les `@font-face` utilisent des chemins **absolus** (`/assets/fonts/…`). En
production, les 3 woff2 doivent être accessibles à la même racine sur
`france-immeuble.fr`, sinon adapter les `url()` vers le dossier du thème
(ex. `/wp-content/themes/hono-theme/assets/fonts/…`) — à deux endroits :
`assets/css/design-system.css` et le `<style>` de chaque page.
