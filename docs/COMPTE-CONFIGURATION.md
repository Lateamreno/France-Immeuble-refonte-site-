# E-mails du site et compte client : réglages à faire

Trois sortes d'e-mails partent du site, tous par **SendGrid**, depuis
`contact@france-immeuble.fr` :

1. **Les alertes de l'agence** : un e-mail à `contact@` et à `ma.voci@` à
   chaque formulaire rempli (vente, estimation, recherche, contact, demande de
   dossier, compte client et actions dans le compte). Envoyées par le site
   lui-même, même si le BO est en panne.
2. **Les e-mails du compte client** : le lien de vérification de l'adresse
   et le lien « mot de passe oublié ». Envoyés par Supabase Auth.
3. **L'e-mail qui suit une estimation** (MAV, 27/10/2026) : un agent appelle
   sous 48 h, la liste des pièces à préparer et le lien de l'espace client,
   ouvert pour lui. Envoyé par le site (`src/lib/compte/accueil.ts`) quand la
   seconde partie du formulaire est remplie, une fois par adresse et par 24 h
   au plus. C'est le seul e-mail automatique vers un visiteur. Un compte ainsi
   créé et jamais ouvert est supprimé au bout de 30 jours ; la variable
   `CRON_SECRET` de Vercel protège la tâche quotidienne qui s'en charge.

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

Facultatif : `SITE_ORIGINE` (par exemple `https://www.france-immeuble.fr`),
l'adresse des liens envoyés au client. Sans elle, le site prend le domaine de
production que Vercel lui donne (`VERCEL_PROJECT_PRODUCTION_URL`), jamais
l'en-tête de la requête, qu'un attaquant pourrait choisir.

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

- Email OTP Expiration : `86400` secondes (24 h), le maximum permis. C'est la
  durée de validité du lien d'accès à l'espace client envoyé après une
  estimation ; par défaut, une heure seulement. Le réglage n'est pas dans le
  menu Emails : Authentication → Sign In / Providers, puis cliquer sur la
  ligne « Email » de la liste des fournisseurs ; le champ est dans le panneau
  qui s'ouvre. Lien direct :
  https://supabase.com/dashboard/project/omtkttpvfjsbnqsajcsp/auth/providers
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
