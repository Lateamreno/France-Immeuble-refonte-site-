# Compte client : réglages à faire dans Supabase (projet du SITE)

Le code du compte est en place (contrat BO §9 et §10). Ces réglages se font une
fois, dans le tableau de bord Supabase du projet **France Immeuble site**
(`omtkttpvfjsbnqsajcsp`). Aucun ne demande de clé dans le site.

## 1. Envoi des e-mails (bloquant)

Sans serveur d'envoi à vous, Supabase n'envoie les e-mails de vérification
qu'aux adresses des membres de l'équipe Supabase, et deux par heure au plus.
Un client ne recevrait jamais son lien.

**Authentication → Emails → SMTP Settings** : activer « Custom SMTP ».

- Expéditeur : `noreply@france-immeuble.fr`, nom « France Immeuble ».
- Serveur : celui de votre messagerie (OVH, Brevo, Resend…). Hôte, port,
  identifiant et mot de passe se saisissent dans Supabase, jamais dans le site.

Seuls deux e-mails partent : la vérification de l'adresse à la création du
compte, et le lien « mot de passe oublié » quand la personne le demande.
Aucun autre e-mail automatique (§9.1).

## 2. Adresses de retour

**Authentication → URL Configuration**

- Site URL : `https://www.france-immeuble.fr`
- Redirect URLs, une par ligne :
  - `https://www.france-immeuble.fr/**`
  - `https://*-lateamrenos-projects.vercel.app/**` (les previews)

Sans elles, le lien reçu par e-mail renvoie sur la page d'accueil au lieu de
`/mon-compte/confirmer/`.

## 3. Règles du compte

**Authentication → Sign In / Providers → Email**

- Confirm email : **activé** (le compte n'est rattaché au BO qu'après).
- Secure password change : activé.
- Minimum password length : 8.

## 4. Modèles d'e-mail en français

**Authentication → Emails → Templates**

« Confirm signup », sujet : `Confirmez votre adresse | France Immeuble`

```html
<p>Bonjour,</p>
<p>Pour activer votre compte France Immeuble, confirmez votre adresse :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon adresse</a></p>
<p>Si vous n'avez pas demandé de compte, ignorez ce message.</p>
<p>France Immeuble · 66 avenue des Champs-Élysées, 75008 Paris · 01 72 87 52 22</p>
```

« Reset password », sujet : `Nouveau mot de passe | France Immeuble`

```html
<p>Bonjour,</p>
<p>Pour choisir un nouveau mot de passe, suivez ce lien (valable une heure) :</p>
<p><a href="{{ .ConfirmationURL }}">Choisir un nouveau mot de passe</a></p>
<p>Si vous n'avez rien demandé, ignorez ce message : votre mot de passe ne change pas.</p>
<p>France Immeuble · 66 avenue des Champs-Élysées, 75008 Paris · 01 72 87 52 22</p>
```

## 5. Limites de débit

**Authentication → Rate Limits** : toutes les connexions passent par les
serveurs du site (Vercel). Supabase les voit donc venir de quelques adresses
seulement. Monter « Sign-ups and sign-ins » à 100 par 5 minutes et « Token
refreshes » à 300 par 5 minutes.

## Ce qui est déjà fait

- Les tables `compte_recherches`, `compte_propositions`, `compte_demandes`,
  `compte_biens`, `compte_estimations`, `compte_documents` (migration 0008) :
  lecture par le seul titulaire du compte, écriture par la clé secrète.
- Le seau privé `depots-proprietaires` : aucune lecture publique, 25 Mo, formats
  du §10.2.
- La session vit dans deux cookies httpOnly ; rien dans le stockage du
  navigateur.
