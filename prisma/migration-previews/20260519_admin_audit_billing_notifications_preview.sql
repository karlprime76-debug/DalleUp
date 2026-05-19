-- Preview only. Do not apply automatically.
-- Sprint 34: Admin audit logs and billing notifications.

CREATE TYPE "AdminAuditAction" AS ENUM (
  'RESTAURANT_STATUS_UPDATED',
  'DRIVER_STATUS_UPDATED',
  'INVOICE_STATUS_UPDATED',
  'FINANCIAL_REPORT_EXPORTED',
  'BILLING_NOTIFICATION_STATUS_UPDATED',
  'BILLING_NOTIFICATIONS_EXPORTED'
);

CREATE TYPE "BillingNotificationType" AS ENUM (
  'SUBSCRIPTION_UPDATED',
  'INVOICE_GENERATED',
  'INVOICE_PAID',
  'INVOICE_STATUS_UPDATED'
);

CREATE TYPE "BillingNotificationStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED'
);

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "action" "AdminAuditAction" NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "targetLabel" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingNotification" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "restaurantId" TEXT,
  "type" "BillingNotificationType" NOT NULL,
  "status" "BillingNotificationStatus" NOT NULL DEFAULT 'PENDING',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "BillingNotification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AdminAuditLog"
  ADD CONSTRAINT "AdminAuditLog_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BillingNotification"
  ADD CONSTRAINT "BillingNotification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BillingNotification"
  ADD CONSTRAINT "BillingNotification_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AdminAuditLog_adminId_createdAt_idx" ON "AdminAuditLog"("adminId", "createdAt");
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");
CREATE INDEX "BillingNotification_status_createdAt_idx" ON "BillingNotification"("status", "createdAt");
CREATE INDEX "BillingNotification_restaurantId_createdAt_idx" ON "BillingNotification"("restaurantId", "createdAt");

