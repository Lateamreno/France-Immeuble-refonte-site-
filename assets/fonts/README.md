# Polices self-hébergées

Les 3 woff2 variables sont **présents dans ce dossier**. Ils ne sont pas servis
depuis `/assets/fonts/` : ils sont importés par `src/lib/fonts.ts` via
**`next/font/local`**, qui génère les `@font-face`, empreinte les fichiers et les
sert depuis `/_next/static/media/`.

> **Ne rien télécharger, ne rien convertir, ne rien remplacer** (CLAUDE.md §4 et §16).

| Fichier | Rôle | Axes | Poids |
|---|---|---|---|
| `Archivo[wdth,wght].woff2` | Display — titres H1-H3, chiffres clés | `wght` 100-900 · `wdth` 62-125 | 145 Ko |
| `Inter[opsz,wght].woff2` | Body — texte, navigation, boutons, formulaires | `wght` 100-900 · `opsz` 14-32 | 199 Ko |
| `JetBrainsMono[wght].woff2` | Data — chiffres, surtitres, labels | `wght` 100-800 | 45 Ko |

Sous-ensemblés au latin étendu (couverture FR complète : accents, ligatures,
guillemets français, tirets cadratins, €, exposants). Licence SIL Open Font
License pour les trois.

## Le point à ne jamais casser

**Archivo ne doit jamais être découpée en fichiers statiques par graisse.** Le
réglage `wdth` 118 du titrage — qui justifie tout le choix typographique — en
dépend. C'est aussi la raison pour laquelle Archivo Black a été écartée : famille
statique, sans axe de largeur.

`next/font` n'expose pas `font-stretch` dans son API : il est ajouté comme
descripteur brut via l'option `declarations` dans `src/lib/fonts.ts`. Ne pas le
retirer.

## Vérifications

Les tokens `--font-display` / `--font-body` / `--font-mono-site` pointent sur les
variables générées (`--font-archivo`, `--font-inter`, `--font-jetbrains`). C'est
la seule adaptation faite au bloc de tokens verrouillé du §3 — les valeurs sont
inchangées.

Contrôle visuel : les H1/H2/H3 doivent apparaître **larges et très gras**
(`wdth` 118 / `wght` 900). En largeur standard, c'est que le woff2 variable n'est
pas chargé ou que `font-variation-settings` manque sur le sélecteur de titrage.

Contrôle par fontTools :

```python
from fontTools.ttLib import TTFont
f = TTFont("Archivo[wdth,wght].woff2")
print({a.axisTag: (a.minValue, a.maxValue) for a in f["fvar"].axes})
# attendu : {'wght': (100.0, 900.0), 'wdth': (62.0, 125.0)}
```

L'absence de table `fvar` signifierait une police statique — inacceptable.

Aucune requête ne doit partir vers une CDN de polices tierce (contrainte RGPD,
CLAUDE.md §4).
