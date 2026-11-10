# Demande à la session BO : immeubles étudiés par zone (10/11/2026)

MAV, 10/11/2026, pour la page `/vendre-un-immeuble/paris/` : « pour nos données on peut parler
du nombre de biens étudiés à Paris (donc l'étude de tous les immeubles étudiés sur Paris dans
le BO, ce qui représente quand même pas mal de biens) ».

## Ce que le site attend

Dans la table `chiffres` du site, celle où le BO dépose déjà `immeubles_traites` à 9 h et
19 h, de nouvelles lignes au même format (`cle`, `valeur`, `maj_le`) :

| `cle` | `valeur` |
|---|---|
| `immeubles_traites_75` | nombre d'immeubles étudiés à Paris depuis la création de l'agence |
| `immeubles_traites_92012` | idem pour Boulogne-Billancourt (code INSEE) |
| `immeubles_traites_92051` | Neuilly-sur-Seine |
| `immeubles_traites_92044` | Levallois-Perret |
| `immeubles_traites_94041` | Ivry-sur-Seine |
| `immeubles_traites_94067` | Saint-Mandé |

- Même définition que `immeubles_traites` : tout immeuble qui a fait l'objet d'une étude ou
  d'une estimation, vendu ou non. Le total des zones ne dépasse donc jamais
  `immeubles_traites`.
- Une zone par département (2 caractères, `75`) ou par commune (code INSEE à 5 chiffres).
  D'autres zones pourront suivre, au même format, sans changement côté site.
- Un entier, rien d'autre : ni adresse, ni nom, ni liste. C'est un agrégat anonyme (CLAUDE.md
  §2, décision de MAV du 04/11/2026 sur les agrégats par département).
- Une zone sans étude : ne pas déposer la ligne (le site n'affiche rien).

## Ce que fait le site

Tant que la ligne n'existe pas, la page n'affiche pas la phrase. Dès qu'elle arrive, la
section « Nos dernières ventes à Paris » commence par « Depuis 2018, nous avons étudié
N immeubles parisiens pour leurs propriétaires », sous 10 minutes, sans redéploiement.
