# Auth Reset — DalleUp

Guide pour remettre à zéro les comptes auth de DalleUp de façon sécurisée.

---

## Reset local (recommandé)

Lance le script PowerShell interactif qui demande les mots de passe sans les afficher :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/auth-reset-local.ps1
```

Le script effectue dans l'ordre :
1. Demande de confirmation manuelle (`YES`)
2. Demande des mots de passe en mode sécurisé (sans écho)
3. Reset de tous les comptes et données liées
4. Seed des comptes propres
5. Vérification automatique
6. Nettoyage des variables d'environnement

---

## Reset manuel (PowerShell)

```powershell
$env:RESET_ACCOUNTS_CONFIRM = "YES_DELETE_TEST_ACCOUNTS"
$env:ADMIN_SEED_PASSWORD    = "VotreMotDePasseAdmin"
$env:TEST_SEED_PASSWORD     = "VotreMotDePasseTest"
npm run auth:reset-and-seed
```

---

## Commandes disponibles

| Commande | Description |
|---|---|
| `npm run auth:reset` | Reset uniquement (supprime tous les comptes) |
| `npm run auth:seed` | Seed uniquement (crée les 4 comptes de test) |
| `npm run auth:verify` | Vérifie la présence et l'état des comptes |
| `npm run auth:reset-and-seed` | Reset + seed + vérification enchaînés |

---

## Comptes créés par le seed

| Email | Rôle | Notes |
|---|---|---|
| `admin@dalleup.app` | ADMIN | Mot de passe via `ADMIN_SEED_PASSWORD` |
| `client@test.dalleup.app` | CLIENT | Mot de passe via `TEST_SEED_PASSWORD` |
| `restaurant@test.dalleup.app` | RESTAURANT | Restaurant créé (status APPROVED) |
| `livreur@test.dalleup.app` | DELIVERY_DRIVER | Status AVAILABLE, véhicule MOTO |

---

## Ce qui est supprimé / conservé

**Supprimé :**
- Tous les utilisateurs et sessions NextAuth
- Restaurants, menus, commandes, livraisons
- Wallets, payouts, reviews, notifications, logs d'audit
- Adresses, favoris, push subscriptions

**Conservé :**
- `PlatformSettings` (commissions, configuration plateforme)
- Fichiers images dans Supabase Storage

---

## Production

> ⚠️ **Ne jamais lancer en production sans backup préalable.**

1. Faire un backup Supabase depuis le dashboard
2. Vérifier la `DATABASE_URL` ciblée
3. Lancer via Vercel CLI :

```bash
vercel env run -e production -- npm run auth:reset-and-seed
```

---

## Règles de sécurité

- Ne jamais mettre les mots de passe dans Git
- Ne jamais afficher `DATABASE_URL` dans les logs
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- Toujours nettoyer `$env:ADMIN_SEED_PASSWORD` et `$env:TEST_SEED_PASSWORD` après exécution
