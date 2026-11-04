# Demande à la session BO : le message de contact et ce qui le suit (04/11/2026)

Retour #120 de MAV (03/11/2026), précisé le 04/11/2026.

## Ce que fait le site depuis le 03/11/2026

Le formulaire de contact (accueil et page Contact) demande prénom, nom, e-mail, téléphone,
projet et message. Il part au BO comme avant (`type: "contact"`, avec sa `ref`).

Une fois le message parti, le formulaire se prolonge selon le projet :

- **« Je souhaite acheter un immeuble »** : le dépôt de recherche s'ouvre, coordonnées et
  message repris. S'il va au bout, un lead `type: "recherche_acquereur"` part au BO.
- **« Je souhaite vendre un immeuble »** : le formulaire d'estimation s'ouvre, coordonnées et
  message repris. Il part au BO comme toute estimation (`type: "estimation"`).

Ce second lead porte désormais un champ en plus : **`refContact`**, la `ref` du message de
contact qui le précède. Le champ est absent quand la recherche ou l'estimation est faite
directement, sans message avant.

## Ce que le site demande au BO

1. **Regrouper** : quand un lead arrive avec `refContact`, le rattacher au message de contact
   de même `ref` (même personne, même demande). Ne pas créer un second contact.
2. **Acheteur : garder la vignette du message.** Pour un message dont le projet est
   « Je souhaite acheter un immeuble », la vignette reste dans « Formulaires du site » même
   quand la recherche suit et qu'elle est enregistrée : elle pousse l'agence à appeler
   (MAV, 04/11/2026). La recherche s'y rattache.
3. **Vendeur** : rien à changer. Depuis la dernière modification, « vendre » crée déjà un
   formulaire direct dans le tableau de bord. L'estimation qui suit s'y rattache par
   `refContact`.
4. Accepter `refContact` sans erreur s'il arrive avant que le BO sache le traiter : un champ
   inconnu ne doit pas faire refuser le lead.
