> ⚠️ **Remplacé en partie le 21/10/2026.** Le contrat validé par MAV est versionné
> dans le dépôt du BO, `docs/CONTRAT-SITE.md`. Il fait foi là où ce document
> diverge : mise en ligne toujours décidée à la main, statut 7 en ligne
> seulement si déjà publié, statuts 8 à 10 retirés, rue sans numéro affichée
> pour les ventes, table `offmarket`, champs des formulaires.

# Prompt à coller dans la session Claude Code du BO — récit des ventes

> Tout ce qui suit la ligne ci-dessous est destiné à la session qui travaille
> sur le back-office France Immeuble. Copiez-le tel quel. Il complète
> `PROMPT-BO-DIFFUSION-ET-LEADS.md` : ce prompt-là doit être traité d'abord,
> ou en même temps (même connexion, même table `ventes`).

---

## Objectif

Chaque vente publiée sur france-immeuble.fr a désormais sa propre page :
`/immeubles-vendus/<slug>/`. Pour que cette page soit utile, et que Google la
référence, elle doit raconter **un cas pratique** : le bien, son emplacement,
sa commercialisation, son acquéreur, et ce que la vente dit du marché.

Le BO rédige ce récit à partir des éléments du dossier et de la
commercialisation, **le soumet à MAV pour validation**, et ne le dépose sur le
site qu'une fois validé.

Pourquoi c'est le bon contenu : c'est une information que personne d'autre ne
peut publier. Une vraie transaction, avec ses chiffres, bat n'importe quel
article générique.

Pourquoi la validation est obligatoire : publier du texte généré en série,
sans relecture, est exactement ce que Google pénalise (« helpful content »). Et
un récit qui laisse deviner l'adresse trahit la discrétion promise au vendeur.
La base du site **refuse** d'ailleurs un récit sans date de validation.

## 1 — Le déclencheur

Quand une fiche `bo_immeuble` passe au statut **« 11 - VENDU »** (acte signé,
prix et date renseignés) :

1. Retirer le bien de `biens_a_vendre` immédiatement (comme prévu dans le
   prompt de diffusion).
2. **Ne rien déposer encore dans `ventes`.** Créer une tâche « Vente à publier
   sur le site » dans un tableau de bord visible de MAV, avec un compteur
   (« 2 ventes à publier »).
3. Préparer l'écran de validation (§2) : rassembler les faits, générer le
   brouillon du récit.
4. Relancer MAV si la tâche n'est pas traitée sous 7 jours.

Rien ne part sur le site sans une décision de MAV. C'est voulu : un vendeur
qui a demandé la discrétion ne doit pas voir sa vente publiée par défaut.

## 2 — L'écran de validation

Une page par vente, en deux colonnes.

**À gauche — les faits qui seront publiés**, chacun modifiable, chacun
effaçable (un champ vide n'est pas publié) :

| Champ | Exemple |
|---|---|
| Commune, département | Vincennes (94) |
| Arrondissement | Paris, Lyon, Marseille uniquement : « 18e arrondissement » |
| Type | Immeuble de rapport · Immeuble mixte · Immeuble de bureaux |
| Lots | 9 |
| Composition | 7 appartements, 1 commerce en pied d'immeuble, 1 local d'activité |
| Surface | **tranche** de 100 m² : 400 à 500 m² (jamais la surface exacte) |
| Époque | Fin XIXe · Années 1930 · Années 1970 |
| DPE | une lettre, ou rien |
| Occupation | en %, à la vente |
| Rendement brut | en %, sur le prix de vente |
| Profil de l'acquéreur | Investisseur · Marchand de biens · Patrimonial · Promoteur |
| Profil du vendeur | Particulier · Indivision · Société · Institutionnel |
| Commercialisation | off-market · annonces · off-market puis annonces |
| Délai | semaines entre la signature du mandat et celle du compromis |
| Acquéreurs sollicités | nombre d'acquéreurs du fichier qui ont reçu le dossier |
| Visites, offres | nombres |
| Prix, date de l'acte, photo | déjà dans le contrat `ventes` |

**À droite — le récit**, généré (§4), éditable en texte libre, avec :

- le compteur de mots ;
- le résultat du contrôle d'anonymat (§5), en rouge s'il bloque ;
- le chapô (1 à 2 phrases) et le titre, éditables aussi.

**Quatre boutons :**

| Bouton | Effet |
|---|---|
| **Valider et publier** | dépose la vente, ses faits et le récit, avec `recit_valide_le = now()` |
| **Régénérer** | nouveau brouillon à partir des faits (éventuellement corrigés) |
| **Publier sans récit** | dépose la vente et ses faits, sans récit. La fiche existe mais Google ne l'indexe pas. |
| **Ne pas publier** | rien ne part. La vente reste invisible sur le site. |

Journaliser qui a validé quoi, et quand. Ne jamais envoyer ce nom au site.

Si les faits sont trop maigres (moins de 6 champs remplis parmi type, lots,
composition, surface, époque, occupation, rendement, profil acquéreur,
commercialisation, délai, acquéreurs sollicités, visites, offres), **ne pas
générer de récit** : proposer seulement « Publier sans récit » ou « Ne pas
publier ». Un récit sans matière serait du remplissage, et c'est ce remplissage
que Google sanctionne.

## 3 — La connexion et le contrat

Même base et même clé que le prompt de diffusion (`SITE_FI_SUPABASE_URL`,
`SITE_FI_SUPABASE_SECRET_KEY`). Table **`ventes`**, upsert sur `id`.

Les colonnes existent déjà (migration `0003_recits_ventes.sql` du repo du
site). Le BO ne crée ni ne modifie aucune table.

| Colonne | Type | Règle |
|---|---|---|
| `id` | texte | **`_id` de `bo_vente`** — c'est la clé des 44 ventes déjà chargées |
| `ville`, `dept`, `prix`, `date`, `region`, `image` | | inchangés (voir prompt de diffusion §5) |
| `slug` | | **ne pas l'envoyer.** La base le génère (`immeuble-de-rapport-<commune>-<année>`) et le fige |
| `titre` | texte | le h1 de la page, ≤ 90 caractères |
| `type` | texte | |
| `arrondissement` | texte | ou null |
| `lots` | entier | |
| `composition` | texte | |
| `surface_min`, `surface_max` | entiers | bornes de la tranche, `surface_min < surface_max` |
| `epoque` | texte | |
| `dpe` | `A`…`G` | ou null |
| `occupation` | nombre | **en %** : `89`, pas `0.89` |
| `rendement` | nombre | **en %** : `5.1`, pas `0.051` — la base refuse hors de 1 à 40 |
| `profil_acquereur` | texte | exactement : `Investisseur`, `Marchand de biens`, `Patrimonial` ou `Promoteur` |
| `profil_vendeur` | texte | exactement : `Particulier`, `Indivision`, `Société` ou `Institutionnel` |
| `mode_commercialisation` | texte | `off_market`, `diffusion` ou `mixte` |
| `delai_semaines` | entier | |
| `acquereurs_sollicites`, `visites`, `offres` | entiers | |
| `chapo` | texte | 1 à 2 phrases |
| `recit` | texte | voir §4 pour le format |
| `seo_title` | texte | facultatif, ≤ 70 caractères, terminé par « \| France Immeuble » |
| `seo_desc` | texte | facultatif, ≤ 170 caractères |
| `recit_valide_le` | horodatage | **obligatoire dès qu'il y a un récit** — la base refuse sinon |

**Format du récit** : texte brut. Paragraphes séparés par une ligne vide.
Intertitres sur une ligne seule, préfixés par `## `. Rien d'autre : ni gras,
ni liens, ni listes, ni HTML.

Un récit corrigé plus tard se redépose par le même upsert : le slug, donc
l'URL, ne bouge pas.

## 4 — Les consignes de rédaction

À stocker telles quelles comme gabarit du générateur. Utiliser l'intégration
LLM du BO si elle existe, sinon l'API Anthropic avec le modèle Claude le plus
récent, clé dans les variables d'environnement **du BO**. On ne passe au modèle
**que les faits de l'écran de validation** — jamais la fiche complète, jamais
l'adresse, jamais les noms.

```text
Tu rédiges, pour le site de France Immeuble (agence spécialisée dans la vente
d'immeubles de rapport), le récit d'une vente réalisée : un cas pratique.

FAITS (seule source autorisée) :
{faits au format « champ : valeur », un par ligne, champs vides omis}

RÈGLES DE FOND
1. N'utilise QUE les faits ci-dessus. N'invente aucun chiffre, aucune date,
   aucune caractéristique, aucune anecdote. Un fait absent n'est pas mentionné,
   ni deviné, ni remplacé par une généralité qui le simule.
2. Emplacement : parle de la commune (ou de l'arrondissement à Paris, Lyon,
   Marseille), de son marché locatif, du type de demande qu'elle attire. Seules
   les généralités notoires et vérifiables sont admises. Ne cite AUCUNE rue,
   place, adresse, aucun commerce, monument ou équipement voisin qui
   permettrait de localiser l'immeuble. En cas de doute sur une affirmation
   géographique, écris-la entre crochets [à vérifier] : elle sera relue.
3. Jamais de nom de personne ni de société, ni pour le vendeur ni pour
   l'acquéreur ni pour les locataires. Les profils suffisent.
4. Jamais le motif personnel de la vente (décès, divorce, dettes, santé).
   « Indivision » est un profil, pas une histoire.
5. Jamais le prix de mandat, l'estimation initiale, ni l'écart de négociation.
   Le prix de l'acte, oui.
6. Surface en tranche, telle que fournie. Jamais une surface exacte.

RÈGLES DE FORME
7. 350 à 650 mots. Français soutenu mais simple, phrases courtes, aucun
   superlatif creux (« exceptionnel », « unique », « idéal »), aucune formule
   publicitaire. Le ton d'un agent qui raconte une vente à un confrère.
8. 3 à 5 intertitres, chacun sur une ligne seule, précédés de « ## ». Le
   premier contient la commune. Formule-les comme des constats propres à CETTE
   vente (« Neuf lots, un seul vacant », « Onze semaines, trois offres »), pas
   comme des rubriques (« L'emplacement », « Conclusion »). Ne reprends pas
   toujours le même ordre : commence par ce qui distingue cette vente.
9. Couvre, quand les faits le permettent : le bien (type, lots, composition,
   époque, surface, DPE) ; l'emplacement ; l'état locatif (occupation,
   rendement) ; la commercialisation (mode, acquéreurs sollicités, visites,
   offres, délai) ; l'acquéreur (profil, et ce qu'un tel profil recherche) ;
   ce que la vente enseigne à un propriétaire qui voudrait vendre un bien
   comparable.
10. Vocabulaire : « immeuble de rapport » 2 à 3 fois, naturellement ; « vente
    en bloc » si le contexte s'y prête ; le nom de la commune 2 à 4 fois.
    N'empile pas les mots-clés : un lecteur doit pouvoir lire le texte à voix
    haute sans gêne.
11. Termine par un paragraphe utile au vendeur, sans appel à l'action ni
    numéro de téléphone (la page s'en charge).

RENDS, dans cet ordre, séparés par une ligne « --- » :
TITRE : une phrase de 90 caractères maximum, avec la commune et un fait
distinctif (ex. « Immeuble de rapport de 9 lots vendu à Vincennes, sans
annonce »).
CHAPÔ : 1 à 2 phrases, 170 caractères maximum, avec 2 ou 3 chiffres clés.
RÉCIT : le texte, au format décrit.
```

## 5 — Le contrôle d'anonymat

Avant d'activer « Valider et publier », le BO vérifie titre, chapô, composition
et récit, et **bloque** si l'un d'eux contient :

- un type de voie suivi d'un nom propre : rue, avenue, boulevard, impasse,
  allée, place, quai, chemin, cours, passage, square, villa, route, sentier,
  cité ;
- un code postal suivi d'une commune (« 92100 Boulogne ») ;
- **le nom, le prénom ou la société** de toute personne liée au dossier
  (vendeur, acquéreur, locataires, notaires) — chercher chacun dans le texte ;
- le numéro de rue de l'immeuble, ou son adresse en toutes lettres ;
- une mention restée entre crochets « [à vérifier] ».

La base du site applique en plus les deux premières règles et rejette le dépôt.
Un rejet doit s'afficher sur l'écran de validation, jamais échouer en silence.

**Les photos** : vérifier qu'aucune enseigne, plaque de rue ou numéro n'est
lisible. Une façade avec l'enseigne d'un commerce se retrouve en dix secondes
sur Street View. En cas de doute, cadrer autrement ou publier sans photo.

## 6 — Les 44 ventes déjà en ligne

Elles sont chargées dans `ventes`, sans faits ni récit. Leur `id` est le `_id`
de `bo_vente`.

Ajouter dans le tableau de bord une file « Ventes passées à enrichir », triée
du dossier le plus complet au plus pauvre. Même écran, mêmes boutons. MAV la
traite à son rythme : chaque récit validé ajoute une page indexable au site.
Un upsert sur ces `id` ne touche ni au slug ni à l'URL.

## 7 — Recette

1. Passer une fiche test au statut 11 : elle disparaît de `biens_a_vendre`, une
   tâche « Vente à publier » apparaît, **rien** n'apparaît dans `ventes`.
2. Ouvrir l'écran : les faits sont pré-remplis, en %, la surface en tranche.
3. Générer : le récit fait 350 à 650 mots, 3 à 5 intertitres « ## », aucun
   chiffre absent des faits. Le vérifier ligne à ligne contre les faits.
4. Écrire « rue Victor-Hugo » dans le récit : le bouton se bloque. Forcer
   l'envoi en contournant le contrôle : la base rejette, l'écran l'affiche.
5. Valider : la vente apparaît sur `/immeubles-vendus/` sous 10 minutes, sa
   fiche affiche le récit, et la page n'a plus de balise `noindex`.
6. « Publier sans récit » sur une autre vente : sa fiche existe, avec
   `noindex` dans le code source.
7. Corriger le récit d'une vente publiée et redéposer : l'URL ne change pas.
