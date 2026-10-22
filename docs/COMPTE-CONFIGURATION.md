# E-mails du site et compte client : réglages à faire

Deux sortes d'e-mails partent du site, tous par **SendGrid**, depuis
`contact@france-immeuble.fr` :

1. **Les alertes de l'agence** : un e-mail à `contact@` et à `ma.voci@` à
   chaque formulaire rempli (vente, estimation, recherche, contact, demande de
   dossier, compte client et actions dans le compte). Envoyées par le site
   lui-même, même si le BO est en panne.
2. **Les e-mails du compte client** : seulement le lien de vérification de
   l'adresse et le lien « mot de passe oublié ». Envoyés par Supabase Auth.
   Aucun autre e-mail ne part vers le client (contrat BO §9.1).

Le domaine `france-immeuble.fr` est déjà authentifié chez SendGrid (clés
DKIM `s1` et `s2` en place chez OVH, vérifié le 22/10/2026) : rien à changer
dans le DNS.

## 1. SendGrid

- **Settings → Sender Authentication → Domain Authentication** :
  `france-immeuble.fr` doit être « Verified ».
- **Settings → Tracking** : tout sur Off (Click, Open, Subscription, Google
  Analytics). Le suivi réécrit les liens et ajoute un pixel : mauvais pour la
  délivrabilité et soumis à consentement (CNIL).
- **Settings → API Keys → Create API Key → Restricted Access**, droit unique
  **Mail Send : Full Access**. Deux clés, jamais celle du BO :
  - `site-notifications` pour Vercel ;
  - `site-supabase` pour Supabase.

## 2. Vercel (alertes de l'agence)

Projet `france-immeuble-refonte-site` → Settings → Environment Variables :

| Nom | Valeur |
|---|---|
| `SENDGRID_API_KEY` | la clé `site-notifications` |
| `SITE_NOTIF_FROM` | `contact@france-immeuble.fr` |
| `SITE_NOTIF_DESTINATAIRES` | `contact@france-immeuble.fr,ma.voci@france-immeuble.fr` |

Puis redéployer (Deployments → … → Redeploy) pour que les variables soient lues.

## 3. Supabase (e-mails du compte client)

Projet **France Immeuble site** (`omtkttpvfjsbnqsajcsp`).

**Authentication → Emails → SMTP Settings → Enable Custom SMTP**

| Champ | Valeur |
|---|---|
| Sender email | `contact@france-immeuble.fr` |
| Sender name | `France Immeuble` |
| Host | `smtp.sendgrid.net` |
| Port | `587` |
| Username | `apikey` (ce mot, littéralement) |
| Password | la clé `site-supabase` |

**Authentication → URL Configuration**

- Site URL : `https://www.france-immeuble.fr`
- Redirect URLs, une par ligne :
  - `https://www.france-immeuble.fr/**`
  - `https://*-lateamrenos-projects.vercel.app/**`

**Authentication → Sign In / Providers → Email**

- Confirm email : activé.
- Secure password change : activé.
- Minimum password length : 8.

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

**Authentication → Rate Limits** : toutes les connexions passent par les
serveurs du site, Supabase les voit venir de quelques adresses seulement.
« Sign-ups and sign-ins » à 100 par 5 minutes, « Token refreshes » à 300 par
5 minutes. « Emails sent » à 100 par heure.

## 4. OVH

`contact@france-immeuble.fr` doit exister (boîte ou redirection vers ma.voci) :
c'est l'adresse que voient les clients, leurs réponses doivent arriver.

## Ce qui est déjà fait

- Les tables du compte (migration 0008), lisibles par leur seul titulaire.
- Le seau privé `depots-proprietaires`.
- La session du compte dans deux cookies httpOnly, rien dans le navigateur.
- Les alertes : `src/lib/notifications.ts`, inactives tant que les variables
  Vercel ne sont pas posées.
