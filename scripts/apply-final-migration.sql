-- ============================================================================
-- MIGRATION FINALE DALLEUP — Paiements, Payouts, Abonnements, Mises en avant
-- À exécuter dans Supabase SQL Editor (requête unique)
-- ============================================================================
--
-- COUVERTURE :
--  - Enums : PaymentPurpose, PayoutMethod, RestaurantPlacementType
--  - Enums étendus : PayoutStatus, SubscriptionStatus
--  - Tables : PayoutAccount, PayoutTransfer, RestaurantPlacement, OrderSplit,
--             PlatformRevenue, PlatformSettings, Notification, PushSubscription
--  - Colonnes ajoutées : Payment, BillingPlan, RestaurantSubscription,
--                        Restaurant, Order, User
--
-- IDEMPOTENT : peut être relancé sans risque.
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Enums manquants
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentPurpose') THEN
    CREATE TYPE "PaymentPurpose" AS ENUM ('ORDER_PAYMENT', 'RESTAURANT_SUBSCRIPTION');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayoutMethod') THEN
    CREATE TYPE "PayoutMethod" AS ENUM ('MTN_MONEY', 'MOOV_MONEY', 'PAYDUNYA', 'MANUAL');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RestaurantPlacementType') THEN
    CREATE TYPE "RestaurantPlacementType" AS ENUM (
      'HOME_FEATURED', 'SPONSORED_LISTING', 'TRENDING_DISHES', 'SEARCH_PRIORITY'
    );
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2 : Étendre PayoutStatus
-- ============================================================================

DO $$
BEGIN
  ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'READY_TO_PAY';
  ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'SUCCESS';
  ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'RETRY_REQUIRED';
  ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'MANUALLY_PAID';
  ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'BLOCKED_MISSING_PAYOUT_ACCOUNT';
  ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'BLOCKED_UNVERIFIED_PAYOUT_ACCOUNT';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================================================
-- ÉTAPE 3 : Étendre SubscriptionStatus
-- ============================================================================

DO $$
BEGIN
  ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
  ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
  ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'FAILED';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================================================
-- ÉTAPE 4 : Table PayoutAccount
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PayoutAccount" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "ownerType"       TEXT NOT NULL,
    "ownerId"         TEXT NOT NULL,
    "provider"        TEXT NOT NULL,
    "method"          TEXT NOT NULL,
    "phone"           TEXT,
    "accountAlias"    TEXT,
    "accountName"     TEXT,
    "isVerified"      BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt"      TIMESTAMP(3),
    "rejectedAt"      TIMESTAMP(3),
    "rejectionReason" TEXT,
    "adminNote"       TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "PayoutAccount_ownerType_ownerId_provider_method_key"
  ON "PayoutAccount"("ownerType", "ownerId", "provider", "method");

-- ============================================================================
-- ÉTAPE 5 : Table PayoutTransfer
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PayoutTransfer" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "orderId"         TEXT NOT NULL,
    "beneficiaryType" TEXT NOT NULL,
    "beneficiaryId"   TEXT NOT NULL,
    "payoutAccountId" TEXT,
    "amount"          INTEGER NOT NULL,
    "currency"        TEXT NOT NULL DEFAULT 'XOF',
    "provider"        TEXT NOT NULL,
    "providerToken"   TEXT,
    "providerRef"     TEXT,
    "status"          TEXT NOT NULL DEFAULT 'PENDING',
    "attempts"        INTEGER NOT NULL DEFAULT 0,
    "lastError"       TEXT,
    "raw"             JSONB,
    "processedAt"     TIMESTAMP(3),
    "manuallyPaidAt"  TIMESTAMP(3),
    "manualNote"      TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "PayoutTransfer_orderId_beneficiaryType_beneficiaryId_key"
  ON "PayoutTransfer"("orderId", "beneficiaryType", "beneficiaryId");

CREATE INDEX IF NOT EXISTS "PayoutTransfer_status_createdAt_idx"
  ON "PayoutTransfer"("status", "createdAt");

-- ============================================================================
-- ÉTAPE 6 : Table RestaurantPlacement
-- ============================================================================

CREATE TABLE IF NOT EXISTS "RestaurantPlacement" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "restaurantId"    TEXT NOT NULL,
    "subscriptionId"  TEXT,
    "type"            TEXT NOT NULL,
    "startsAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt"          TIMESTAMP(3),
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÉTAPE 7 : Table OrderSplit
-- ============================================================================

CREATE TABLE IF NOT EXISTS "OrderSplit" (
    "id"                         TEXT NOT NULL PRIMARY KEY,
    "orderId"                    TEXT NOT NULL UNIQUE,
    "subtotalAmount"             INTEGER NOT NULL,
    "deliveryFeeAmount"          INTEGER NOT NULL,
    "serviceFeeAmount"         INTEGER NOT NULL,
    "totalAmount"              INTEGER NOT NULL,
    "restaurantCommissionRate"   INTEGER NOT NULL,
    "restaurantCommissionAmount" INTEGER NOT NULL,
    "deliveryCommissionRate"     INTEGER NOT NULL,
    "deliveryCommissionAmount"   INTEGER NOT NULL,
    "restaurantAmount"           INTEGER NOT NULL,
    "courierAmount"              INTEGER NOT NULL,
    "dalleupAmount"              INTEGER NOT NULL,
    "status"                     TEXT NOT NULL DEFAULT 'PENDING',
    "calculatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÉTAPE 8 : Table PlatformRevenue
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PlatformRevenue" (
    "id"                   TEXT NOT NULL PRIMARY KEY,
    "orderId"              TEXT NOT NULL UNIQUE,
    "foodSubtotal"         INTEGER NOT NULL,
    "deliveryFee"          INTEGER NOT NULL,
    "restaurantCommission" INTEGER NOT NULL,
    "deliveryCommission"   INTEGER NOT NULL,
    "restaurantPayout"     INTEGER NOT NULL,
    "driverPayout"         INTEGER NOT NULL,
    "totalPlatformRevenue" INTEGER NOT NULL,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÉTAPE 9 : Table PlatformSettings
-- ============================================================================

ALTER TABLE IF EXISTS "PlatformSetting" RENAME TO "_legacy_PlatformSetting";

CREATE TABLE IF NOT EXISTS "PlatformSettings" (
    "id"                          TEXT NOT NULL PRIMARY KEY,
    "platformName"                TEXT NOT NULL DEFAULT 'DalleUp',
    "platformSlogan"              TEXT NOT NULL DEFAULT 'Commande. Chill. On livre.',
    "supportEmail"                TEXT NOT NULL DEFAULT 'support@dalleup.com',
    "supportPhone"                TEXT NOT NULL DEFAULT '',
    "whatsappPhone"               TEXT NOT NULL DEFAULT '',
    "currency"                    TEXT NOT NULL DEFAULT 'F CFA',
    "country"                     TEXT NOT NULL DEFAULT 'Bénin',
    "city"                        TEXT NOT NULL DEFAULT 'Cotonou',
    "defaultDeliveryFee"          INTEGER NOT NULL DEFAULT 500,
    "deliveryFeePerKm"            INTEGER NOT NULL DEFAULT 100,
    "freeDeliveryThreshold"       INTEGER NOT NULL DEFAULT 10000,
    "minOrderAmount"              INTEGER NOT NULL DEFAULT 1000,
    "maxDeliveryDistanceKm"       INTEGER NOT NULL DEFAULT 15,
    "estimatedPrepTimeMin"        INTEGER NOT NULL DEFAULT 20,
    "estimatedDeliveryTimeMin"    INTEGER NOT NULL DEFAULT 30,
    "restaurantCommissionRate"    INTEGER NOT NULL DEFAULT 15,
    "deliveryCommissionRate"      INTEGER NOT NULL DEFAULT 0,
    "platformServiceFee"          INTEGER NOT NULL DEFAULT 0,
    "restaurantPayoutDelayDays"   INTEGER NOT NULL DEFAULT 7,
    "driverPayoutDelayDays"       INTEGER NOT NULL DEFAULT 7,
    "allowCashPayment"            BOOLEAN NOT NULL DEFAULT true,
    "allowMobileMoneyPayment"     BOOLEAN NOT NULL DEFAULT true,
    "allowCardPayment"            BOOLEAN NOT NULL DEFAULT false,
    "autoAcceptOrders"            BOOLEAN NOT NULL DEFAULT false,
    "autoCancelUnpaidOrders"      BOOLEAN NOT NULL DEFAULT true,
    "autoCancelDelayMinutes"      INTEGER NOT NULL DEFAULT 15,
    "allowClientOrderCancellation"   BOOLEAN NOT NULL DEFAULT true,
    "allowRestaurantOrderCancellation" BOOLEAN NOT NULL DEFAULT true,
    "clientCancellationWindowMin" INTEGER NOT NULL DEFAULT 5,
    "manualRestaurantApproval"    BOOLEAN NOT NULL DEFAULT true,
    "allowRestaurantSelfProducts" BOOLEAN NOT NULL DEFAULT true,
    "allowRestaurantPriceEdit"    BOOLEAN NOT NULL DEFAULT true,
    "autoHideClosedRestaurants"   BOOLEAN NOT NULL DEFAULT true,
    "minRatingForFeature"         DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    "manualDriverApproval"        BOOLEAN NOT NULL DEFAULT true,
    "enableAutoDriverAssign"      BOOLEAN NOT NULL DEFAULT false,
    "driverSearchRadiusKm"        INTEGER NOT NULL DEFAULT 5,
    "driverAcceptTimeoutSec"      INTEGER NOT NULL DEFAULT 300,
    "driverMinFee"                INTEGER NOT NULL DEFAULT 300,
    "driverDeliveryBonusEnabled"  BOOLEAN NOT NULL DEFAULT false,
    "allowDriverRefusal"          BOOLEAN NOT NULL DEFAULT true,
    "enableSponsoredRestaurants"  BOOLEAN NOT NULL DEFAULT true,
    "sponsoredRestaurantDailyPrice"   INTEGER NOT NULL DEFAULT 2000,
    "sponsoredRestaurantWeeklyPrice"  INTEGER NOT NULL DEFAULT 10000,
    "sponsoredRestaurantMonthlyPrice" INTEGER NOT NULL DEFAULT 30000,
    "maxSponsoredRestaurants"     INTEGER NOT NULL DEFAULT 6,
    "sponsoredDefaultDurationDays"    INTEGER NOT NULL DEFAULT 7,
    "sponsoredDefaultStatus"      TEXT NOT NULL DEFAULT 'pending',
    "enableTrendingDishes"        BOOLEAN NOT NULL DEFAULT true,
    "trendingDishDailyPrice"      INTEGER NOT NULL DEFAULT 1000,
    "trendingDishWeeklyPrice"     INTEGER NOT NULL DEFAULT 5000,
    "trendingDishMonthlyPrice"    INTEGER NOT NULL DEFAULT 15000,
    "maxTrendingDishes"           INTEGER NOT NULL DEFAULT 8,
    "trendingDefaultDurationDays" INTEGER NOT NULL DEFAULT 7,
    "trendingDefaultStatus"       TEXT NOT NULL DEFAULT 'pending',
    "enablePushNotifications"     BOOLEAN NOT NULL DEFAULT true,
    "enableEmailNotifications"    BOOLEAN NOT NULL DEFAULT true,
    "enableSmsNotifications"      BOOLEAN NOT NULL DEFAULT false,
    "enableWhatsappNotifications"   BOOLEAN NOT NULL DEFAULT false,
    "notifyNewOrderClient"        BOOLEAN NOT NULL DEFAULT true,
    "notifyNewOrderRestaurant"      BOOLEAN NOT NULL DEFAULT true,
    "notifyOrderAccepted"         BOOLEAN NOT NULL DEFAULT true,
    "notifyOrderRejected"         BOOLEAN NOT NULL DEFAULT true,
    "notifyDriverAssigned"        BOOLEAN NOT NULL DEFAULT true,
    "notifyOrderOnTheWay"         BOOLEAN NOT NULL DEFAULT true,
    "notifyOrderDelivered"        BOOLEAN NOT NULL DEFAULT true,
    "notifyPaymentConfirmed"      BOOLEAN NOT NULL DEFAULT true,
    "notifyPaymentFailed"         BOOLEAN NOT NULL DEFAULT true,
    "notifyNewRestaurant"         BOOLEAN NOT NULL DEFAULT true,
    "notifyNewDriver"             BOOLEAN NOT NULL DEFAULT true,
    "notifyNewSponsoring"         BOOLEAN NOT NULL DEFAULT true,
    "maintenanceMode"             BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage"          TEXT NOT NULL DEFAULT 'DalleUp est temporairement en maintenance. Merci de revenir dans quelques minutes.',
    "allowAdminInMaintenance"     BOOLEAN NOT NULL DEFAULT true,
    "disableOrdersTemporarily"    BOOLEAN NOT NULL DEFAULT false,
    "disableRestaurantSignup"     BOOLEAN NOT NULL DEFAULT false,
    "disableDriverSignup"         BOOLEAN NOT NULL DEFAULT false,
    "createdAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "PlatformSettings" ("id", "updatedAt")
SELECT gen_random_uuid()::TEXT, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PlatformSettings");

-- ============================================================================
-- ÉTAPE 10 : Tables Notification et PushSubscription
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'ORDER_STATUS', 'ORDER_NEW', 'VALIDATION_APPROVED',
      'VALIDATION_REJECTED', 'PAYOUT_STATUS', 'SYSTEM'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Notification" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "userId"    TEXT NOT NULL,
    "type"      "NotificationType" NOT NULL,
    "title"     TEXT NOT NULL,
    "message"   TEXT NOT NULL,
    "read"      BOOLEAN NOT NULL DEFAULT false,
    "metadata"  TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx"
  ON "Notification"("userId", "read", "createdAt");

CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "userId"    TEXT NOT NULL,
    "endpoint"  TEXT NOT NULL UNIQUE,
    "p256dh"    TEXT NOT NULL,
    "auth"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx"
  ON "PushSubscription"("userId");

-- ============================================================================
-- ÉTAPE 11 : Colonnes ajoutées à Payment
-- ============================================================================

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "purpose"        TEXT NOT NULL DEFAULT 'ORDER_PAYMENT';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "restaurantId"     TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "providerToken"    TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "checkoutUrl"      TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "failedAt"         TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "raw"              JSONB;

-- ============================================================================
-- ÉTAPE 12 : Colonnes ajoutées à BillingPlan
-- ============================================================================

ALTER TABLE "BillingPlan" ADD COLUMN IF NOT EXISTS "code"          TEXT;
ALTER TABLE "BillingPlan" ADD COLUMN IF NOT EXISTS "price"         INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BillingPlan" ADD COLUMN IF NOT EXISTS "currency"      TEXT NOT NULL DEFAULT 'XOF';
ALTER TABLE "BillingPlan" ADD COLUMN IF NOT EXISTS "durationDays"  INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "BillingPlan" ADD COLUMN IF NOT EXISTS "features"      JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "BillingPlan_code_key"
  ON "BillingPlan"("code");

-- ============================================================================
-- ÉTAPE 13 : Colonnes ajoutées à RestaurantSubscription
-- ============================================================================

ALTER TABLE "RestaurantSubscription" ADD COLUMN IF NOT EXISTS "paymentId"    TEXT;
ALTER TABLE "RestaurantSubscription" ADD COLUMN IF NOT EXISTS "autoRenew"    BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "RestaurantSubscription" ALTER COLUMN "startsAt" DROP NOT NULL;
ALTER TABLE "RestaurantSubscription" ALTER COLUMN "endsAt" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "RestaurantSubscription_paymentId_key"
  ON "RestaurantSubscription"("paymentId");

-- ============================================================================
-- ÉTAPE 14 : Colonnes ajoutées à Restaurant
-- ============================================================================

ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "currentPlanCode"   TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "isSponsored"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "sponsoredUntil"   TIMESTAMP(3);
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "isFeatured"       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "featuredUntil"    TIMESTAMP(3);
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "priorityScore"    INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- ÉTAPE 15 : Colonnes ajoutées à Order
-- ============================================================================

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "payoutStatus"  TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt"        TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveredAt"    TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelledAt"    TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundedAt"     TIMESTAMP(3);

-- ============================================================================
-- ÉTAPE 16 : Colonnes ajoutées à User (driver / livreur)
-- ============================================================================

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vehicleType"          TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city"                 TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationStatus"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationSubmittedAt" TIMESTAMP(3);

ALTER TABLE "User" ALTER COLUMN "driverStatus" SET DEFAULT 'PENDING';
UPDATE "User" SET "driverStatus" = 'PENDING' WHERE "driverStatus" IS NULL;
ALTER TABLE "User" ALTER COLUMN "driverStatus" SET NOT NULL;

-- ============================================================================
-- ÉTAPE 17 : Foreign Keys (optionnel — si les tables cibles existent déjà)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'OrderSplit') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'OrderSplit_orderId_fkey' AND table_name = 'OrderSplit'
    ) THEN
      ALTER TABLE "OrderSplit" ADD CONSTRAINT "OrderSplit_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PayoutTransfer') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'PayoutTransfer_orderId_fkey' AND table_name = 'PayoutTransfer'
    ) THEN
      ALTER TABLE "PayoutTransfer" ADD CONSTRAINT "PayoutTransfer_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'RestaurantPlacement') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'RestaurantPlacement_restaurantId_fkey' AND table_name = 'RestaurantPlacement'
    ) THEN
      ALTER TABLE "RestaurantPlacement" ADD CONSTRAINT "RestaurantPlacement_restaurantId_fkey"
        FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PlatformRevenue') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'PlatformRevenue_orderId_fkey' AND table_name = 'PlatformRevenue'
    ) THEN
      ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 18 : Suivi des migrations Prisma
-- ============================================================================

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36) PRIMARY KEY,
    "checksum"              VARCHAR(64),
    "finished_at"           TIMESTAMP(3),
    "migration_name"        VARCHAR(255),
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMP(3),
    "started_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
SELECT 'baseline_000', '', NOW(), '000_init_full_schema', NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '000_init_full_schema');

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
SELECT 'baseline_002', '', NOW(), '002_sync_user_driver_schema', NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '002_sync_user_driver_schema');

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
SELECT 'baseline_003', '', NOW(), '003_payments_payouts_subscriptions', NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '003_payments_payouts_subscriptions');

-- ============================================================================
-- FIN
-- ============================================================================
