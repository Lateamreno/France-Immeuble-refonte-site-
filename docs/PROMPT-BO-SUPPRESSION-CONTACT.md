# Demande au BO : supprimer un contact, et les faux contacts envoyés par des robots

*Rédigé par la session du site le 23/11/2026, à partir des captures de MAV. À coller dans une session
Claude Code ouverte sur le dépôt du BO. Le site n'a aucun accès au BO (CLAUDE.md §2) : rien de ce
qui suit n'a été vérifié dans le code du BO.*

## 1. Le contact ne disparaît pas après « Supprimer ce contact »

MAV ouvre la fenêtre « Supprimer … », choisit un motif, clique sur **Supprimer ce contact** : la
fenêtre se ferme, mais la fiche reste dans la liste des contacts.

À vérifier, dans l'ordre :

1. La requête de suppression part-elle, et que répond le serveur ? (onglet Réseau du navigateur,
   journaux de Supabase). Si elle échoue, la fenêtre ne doit pas se fermer en silence : afficher
   l'erreur.
2. Si elle réussit (la fiche est marquée supprimée avec son motif, comme l'annonce la fenêtre),
   la liste des contacts et les recherches doivent **filtrer les fiches supprimées**, et la liste
   doit se recharger juste après la suppression.
3. Une politique RLS qui laisse lire mais pas modifier la fiche donnerait exactement ce
   symptôme : une mise à jour qui touche 0 ligne sans erreur. Vérifier le nombre de lignes
   modifiées.

## 2. La liste des motifs

Dans la fenêtre, la liste « Motif » s'affiche comme une liste native du navigateur (cadre noir
épais, flèche du système) et ne montre que « Autre » au premier coup d'œil. La mettre au style des
autres listes du BO, et vérifier qu'elle propose bien tous les motifs prévus. Ajouter le motif
**« Faux contact (robot) »**.

## 3. Les trois faux contacts à supprimer

Envoyés par des robots par le formulaire de contact du site, projet « acheter » :

| Nom | E-mail | Téléphone |
|---|---|---|
| gKcjbFFDRNjWkMzgCNW KVyvcrLeWZYIIubRCTiCGNnK | cari.c.uf.i.0.3.3@gmail.com | 9188951551 |
| kICcopqCmowEhKkj xCSQvdOMQLHkRsAT | a.fof.uv.a.g.ac.o3.1.2@gmail.com | 5896799202 |
| sujfoBhCCDSQFKAQzUL DuoITxIljYaJoUCVD | (voir la fiche) | (voir la fiche) |

Motif : faux contact (robot). Chercher aussi d'autres fiches de la même forme depuis le 05/11/2026 :
prénom et nom en lettres prises au hasard (majuscules au milieu des mots), adresse Gmail avec
quatre points ou plus, téléphone à 10 chiffres sans indicatif. Les lister à MAV avant de les
supprimer.

## 4. Ce que le site fait désormais (pour information)

Depuis le 23/11/2026 (sur la branche, en production après l'accord de MAV), le site garde à part les
envois douteux : champ piège rempli, envoi sans jeton de formulaire ou en moins de 3 secondes,
texte en charabia. Ils ne sont plus déposés au BO et ne déclenchent plus d'alerte. Rien ne change
dans le contrat : un envoi normal arrive comme avant.

Le contrat (CLAUDE.md du site, §2) demande aussi une **limite de débit sur l'endpoint des leads du
BO** : un jeton volé ne doit pas permettre d'en créer des milliers. À vérifier qu'elle existe.
