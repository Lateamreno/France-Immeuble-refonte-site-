# Demande à la session BO : photos des ventes sans image (03/11/2026)

Retour #143 de MAV (03/11/2026) : « J'ai vu qu'il y avait des immeubles sans photo.
Normalement elles sont bien sur le BO puisqu'on avait généré des dossiers. Peux-tu forcer
pour les trouver ? »

Le site ne lit pas la base du BO (CLAUDE.md §2). Il ne peut que constater ce qui a été
déposé. Au 03/11/2026, trois ventes de la table `ventes` du site ont `image` vide :

| `slug` côté site | Commune |
|---|---|
| `immeuble-de-rapport-drancy` | Drancy |
| `immeuble-de-rapport-marseille` | Marseille |
| `immeuble-de-rapport-thourotte` | Thourotte |

## Ce que le site demande

1. Retrouver pour ces trois ventes une photo de façade dans le BO : photos du bien, et à
   défaut la photo de couverture des dossiers de vente générés.
2. La déposer comme pour les autres ventes, dans le champ `image` du dépôt habituel.
3. La photo ne doit montrer ni numéro de rue ni plaque, comme les autres (§2 du contrat).
   Recadrer si besoin.
4. Si une vente n'a vraiment aucune photo au BO, le dire : le site garde alors son visuel
   par défaut.

Le site n'a rien à changer : la carte et la fiche affichent la photo dès qu'elle arrive.
