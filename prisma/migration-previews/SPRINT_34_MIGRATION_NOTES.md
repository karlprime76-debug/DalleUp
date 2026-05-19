---
title: Sprint 34 migration notes
---

# Sprint 34 migration notes

This folder contains a manual SQL preview for the admin audit and billing notification models.

## Scope

The preview SQL adds:

- `AdminAuditAction` enum
- `BillingNotificationType` enum
- `BillingNotificationStatus` enum
- `AdminAuditLog` table
- `BillingNotification` table
- foreign keys to `User` and `Restaurant`
- read-optimized indexes for audit and notification history

## Files

- `20260519_admin_audit_billing_notifications_preview.sql`

## Important safety rule

Do not apply this SQL blindly in production. Prefer a Prisma migration created and reviewed in a safe environment.

## Recommended manual workflow

1. Back up the target database.
2. Ensure the current Prisma schema is committed.
3. Generate the Prisma migration locally with:

```bash
npm run prisma:migrate -- --name admin_audit_billing_notifications
```

4. Review the generated SQL under `prisma/migrations/`.
5. Compare it with `prisma/migration-previews/20260519_admin_audit_billing_notifications_preview.sql`.
6. Run:

```bash
npm run prisma:generate
npm run lint
npm run build
```

7. Test these pages manually:

- `/admin/audit`
- `/admin/notifications`
- `/admin/payments`
- `/restaurant/billing`

## Expected behavior before DB migration

The application remains functional through fallback-safe data layers:

- audit logging failures are swallowed with dev warnings
- notification creation failures are swallowed with dev warnings
- admin audit and notifications pages display mock fallback rows

## Expected behavior after DB migration

- admin audit actions are persisted in `AdminAuditLog`
- billing notifications are persisted in `BillingNotification`
- admin notification status updates are persisted and audited
