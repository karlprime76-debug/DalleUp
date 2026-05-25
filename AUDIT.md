# Rapport d'Audit - DalleUp

**Date** : 24 mai 2026  
**Projet** : DalleUp (`c:\Users\HP s\CascadeProjects\DalleUp`)  
**Stack** : Next.js 15/16, Prisma, PostgreSQL, NextAuth v4, Supabase Storage, Resend, Tailwind CSS, React 19  
**Build** : OK (exit 0)  
**Lint** : OK (exit 0)

---

## 1. Vue d'ensemble

Application de livraison de repas multi-rôles (Client, Restaurant, Livreur, Admin) avec gestion des commandes, paiements, vérification des documents (KYC), facturation et ledger financier.

---

## 2. Sécurité

### 2.1 Points Positifs

- **Authentification** : NextAuth v4 avec JWT, credentials provider, bcrypt (salt rounds 10)
- **Middleware** : `middleware.ts` protège `/app`, `/restaurant`, `/driver`, `/admin` avec vérification des rôles
- **Guards API** : `requireAdminApi`, `requireRestaurantApi`, `requireApprovedDriverApi` utilisés dans les routes sensibles
- **Headers de sécurité** : `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `HSTS` configurés dans `next.config.ts`
- **Reset password sécurisé** : token crypto de 32 bytes, expiration 30 min, suppression du token après utilisation, retour identique si email inconnu (pas d'énumération)
- **Templates email** : escape HTML via `escapeHtml()`
- **Validation des entrées** : presque toutes les routes API valident le type et la présence des champs
- **Transactions Prisma** : inscription, reset password, commandes, ledger utilisent `$transaction`
- **Audit logs** : actions admin tracées dans `AdminAuditLog`

### 2.2 Risques et Recommandations

| Sévérité | Description | Localisation | Recommandation |
|----------|-------------|--------------|----------------|
| **Élevée** | **Rate limiting en mémoire** (`Map`) : non persistant entre redémarrages et inopérant en multi-instance | `@/lib/rate-limit.ts` | Migrer vers Redis (Upstash, Redis Cloud) ou utiliser une DB pour le rate limit |
| **Élevée** | **Pas de rate limit** sur login, forgot-password, reset-password, admin API | Routes auth + admin | Ajouter `rateLimit()` sur toutes les routes publiques et sensibles |
| **Moyenne** | **Content-Security-Policy (CSP) absent** | `next.config.ts` headers | Ajouter un header `Content-Security-Policy` restrictif |
| **Moyenne** | **Double dépendance Prisma adapter** : `@auth/prisma-adapter` (v2) + `@next-auth/prisma-adapter` (v1) coexistent | `package.json` | Supprimer `@next-auth/prisma-adapter` et n'utiliser que `@auth/prisma-adapter` |
| **Moyenne** | **Logs de dev exposants** : email et rôle loggés dans `/api/register` | `src/app/api/register/route.ts:52,61` | Retirer les `console.info` ou anonymiser les données |
| **Moyenne** | **Supabase Storage** : les manifests JSON de vérification ne sont pas chiffrés. Si le bucket est mal configuré, les données KYC sont exposées | `@/lib/supabase/verification-storage.ts` | Vérifier que le bucket `verification-documents` est strictement privé (RLS + policies) |
| **Moyenne** | **Signed URLs de 1h** : durée potentiellement longue pour des documents sensibles | `@/lib/supabase/verification-storage.ts:306` | Réduire à 15-30 minutes |
| **Faible** | **Order number collision possible** : `DU-${String(Date.now()).slice(-6)}` | `src/app/api/orders/route.ts:21-22` | Utiliser un compteur ou un UUID court |
| **Faible** | **VerificationToken** : pas de nettoyage automatique des tokens expirés | Schéma Prisma | Ajouter un cron ou un script de cleanup hebdomadaire |
| **Faible** | **APP_URL fallback** : reset password peut pointer sur `https://dalleup.vercel.app` en dev | `src/app/api/auth/forgot-password/route.ts:12` | Forcer `APP_URL` en `.env.local` et ne pas fallback sur la prod |

---

## 3. Architecture & Base de données

### 3.1 Points Positifs

- **Singleton PrismaClient** : correctement implémenté avec `globalThis`
- **Schéma complet** : users, restaurants, menu, commandes, livraisons, paiements, wallets, ledger, subscriptions, factures, audits
- **Relations cohérentes** : `onDelete: Cascade` sur Account/Session/User
- **Unicités** : `@@unique([userId, restaurantId])` sur Favorite, `orderId @unique` sur Review
- **Types stricts** : enums Prisma pour les statuts et rôles

### 3.2 Risques et Recommandations

| Sévérité | Description | Localisation | Recommandation |
|----------|-------------|--------------|----------------|
| **Moyenne** | **Payout orphelin** : le modèle `Payout` n'a aucune relation avec `Wallet`, `LedgerEntry` ou `SettlementBatch` | `prisma/schema.prisma:491-500` | Ajouter des relations ou fusionner avec le système de ledger |
| **Moyenne** | **DriverStatus confusion** : l'enum a `PENDING` mais le champ `User.driverStatus` est `DriverStatus?` (nullable). Le statut PENDING est mappé vers `null` | `src/app/api/admin/drivers/[id]/status/route.ts:18` | Soit rendre `driverStatus` non-nullable avec `PENDING` par défaut, soit clarifier la sémantique |
| **Moyenne** | **Address sans contrainte d'unicité** : même user + même street = doublons possibles | `prisma/schema.prisma:280-292` | Ajouter `@@unique([userId, street, city])` ou gérer la déduplication côté app |
| **Faible** | **Migrations SQL manuelles** : pas de `prisma migrate` standard, fichier `000_init_full_schema.sql` | `prisma/migrations/` | Documenter la procédure de migration ou migrer vers `prisma migrate` |
| **Faible** | **`as never` dans ledger** : masque les types Prisma | `src/lib/billing/ledger.ts:88` | Typer correctement le tableau d'opérations avec `Prisma.PrismaPromise<any>[]` |

---

## 4. API Routes & Logique Métier

### 4.1 Points Positifs

- **Guards réutilisables** : `requireAdminApi`, `requireRestaurantApi`, etc.
- **Validation des statuts** : whitelist sur les PATCH admin (restaurant, driver)
- **Audit trail** : toute modification admin est loggée
- **Emails non bloquants** : catch silencieux pour ne pas bloquer les commandes
- **Fallbacks** : retours 503 avec message générique en cas d'erreur DB

### 4.2 Risques et Recommandations

| Sévérité | Description | Localisation | Recommandation |
|----------|-------------|--------------|----------------|
| **Moyenne** | **Pas de pagination** sur `/api/admin/payouts`, audit logs, orders | Routes API list | Ajouter `skip` / `take` avec valeurs max |
| **Moyenne** | **`listVerificationManifests` peu performant** : liste 1000 items, télécharge et parse chaque manifest JSON un par un | `@/lib/supabase/verification-storage.ts:345-360` | Mettre en cache ou indexer les métadonnées en DB |
| **Faible** | **`serializeOrder` inutile** : fait juste `return order` | `src/app/api/orders/route.ts:24-26` | Supprimer ou implémenter une sérialisation réelle |
| **Faible** | **Queries Prisma inline très longues** : lisibilité difficile | Plusieurs routes API | Formater sur plusieurs lignes |

---

## 5. Stockage & Fichiers

### 5.1 Points Positifs

- **Supabase Storage** utilisé pour les documents de vérification et contrats signés
- **Signed URLs** pour l'accès temporaire aux documents
- **Paths structurés** : `users/{userId}/{type}/{timestamp}-{filename}`
- **Preuve de résidence** : gestion de l'expiration (3 mois), alerte (15j), grace period (7j)

### 5.2 Risques et Recommandations

| Sévérité | Description | Localisation | Recommandation |
|----------|-------------|--------------|----------------|
| **Moyenne** | **Manifest JSON = single source of truth** : la vérification des documents ne passe pas par Prisma. Impossible de faire des requêtes SQL sur les statuts de vérification | `@/lib/supabase/verification-storage.ts` | Dupliquer les statuts clés (`status`, `submittedAt`) dans Prisma `User` ou créer une table `VerificationRequest` |
| **Faible** | **Pas de validation de type MIME** côté serveur lors de l'upload | `uploadVerificationDocument` | Vérifier `file.type` contre une whitelist (pdf, jpg, png) |

---

## 6. Email & Notifications

### 6.1 Points Positifs

- **Resend** avec clé API via env
- **Validation des emails** avant envoi
- **Fallback silencieux** : l'app ne plante pas si l'email échoue
- **Templates typés** : bien structurés

### 6.2 Risques et Recommandations

| Sévérité | Description | Localisation | Recommandation |
|----------|-------------|--------------|----------------|
| **Moyenne** | **Email silencieux = pas d'alerte** : si Resend est down ou mal configuré, personne ne le sait | `src/lib/email/send-email.ts:33-35` | Ajouter un monitoring (webhook, log level error) ou une file d'attente |
| **Faible** | **Pas de file d'attente** : envoi synchrone, peut ralentir les requêtes | Routes API | Utiliser un background job ou une queue (Inngest, QStash) |

---

## 7. Performance

| Sévérité | Description | Localisation | Recommandation |
|----------|-------------|--------------|----------------|
| **Faible** | **Pas de caching** sur les routes API | Routes GET | Ajouter `revalidate` ou `cache-control` sur les données peu changeantes (catégories, plans) |
| **Faible** | **Images distantes limitées** : seul unsplash.com est autorisé | `next.config.ts` | Ajouter le domaine Supabase Storage si utilisé pour les images restaurants |

---

## 8. RGPD / Conformité

| Sévérité | Description | Recommandation |
|----------|-------------|----------------|
| **Moyenne** | **Pas de page de suppression de compte** visible | Ajouter une page / API pour la suppression de compte (avec cascade ou anonymisation) |
| **Moyenne** | **Pas de politique de confidentialité / cookies** visible | Ajouter les pages légales requises |
| **Faible** | **BillingNotification** : champs `userId` et `restaurantId` optionnels | S'assurer qu'au moins un destinataire est présent ou ajouter une contrainte |

---

## 9. Dépendances

| Problème | Détail |
|----------|--------|
| Double adapter Prisma | `@auth/prisma-adapter` + `@next-auth/prisma-adapter` |
| Next.js 15 + React 19 | OK, compatible |
| bcryptjs | OK, pas de vulnérabilité connue |
| Resend | OK |

---

## 10. Score Synthétique

| Catégorie | Note | Commentaire |
|-----------|------|-------------|
| Authentification | B+ | JWT + bcrypt + guards, mais rate limit fragile |
| Autorisation | A- | Middleware + guards, whitelist des statuts |
| Injection / Validation | B+ | Validation des entrées, mais pas de CSP |
| Logs & Audit | B+ | Audit admin présent, mais logs dev exposants |
| Performance | B | Pas de cache, pas de pagination sur les listes |
| Architecture DB | B+ | Schéma complet, mais Payout orphelin et KYC hors DB |
| Conformité | C+ | Pages légales absentes, pas de suppression de compte |

**Note globale estimée : B+**

---

## 11. Actions Prioritaires

1. **Migrer le rate limiting vers Redis** (critique pour la production)
2. **Ajouter le rate limit sur login / forgot-password / admin** (critique)
3. **Ajouter un header Content-Security-Policy** (moyen)
4. **Nettoyer les dépendances Prisma adapter** (moyen)
5. **Vérifier la configuration RLS du bucket Supabase** (moyen)
6. **Ajouter la pagination sur les routes API admin** (moyen)
7. **Documenter / migrer vers `prisma migrate`** (faible)
8. **Ajouter les pages légales RGPD** (faible)
