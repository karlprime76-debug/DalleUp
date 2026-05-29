-- ============================================================================
-- MIGRATION DE RATTRAPAGE : Création des tables manquantes
-- À exécuter dans Supabase SQL Editor (requête unique)
-- ============================================================================
--
-- PROBLÈME : La migration initiale (000_init_full_schema.sql) crée une table
--   "PlatformSetting" (singulier, 3 colonnes) alors que le schema Prisma
--   attend "PlatformSettings" (pluriel, ~50 colonnes).
--   De plus, les tables "Notification" et "PushSubscription" sont absentes.
--
-- SOLUTION : Cette migration crée les tables manquantes et sauvegarde l'ancienne.
--   AUCUNE donnée utilisateur n'est supprimée.
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Sauvegarder l'ancienne table PlatformSetting (au lieu de supprimer)
-- ============================================================================
ALTER TABLE IF EXISTS "PlatformSetting" RENAME TO "_legacy_PlatformSetting";

-- ============================================================================
-- ÉTAPE 2 : Créer l'enum NotificationType (manquant)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'ORDER_STATUS',
      'ORDER_NEW',
      'VALIDATION_APPROVED',
      'VALIDATION_REJECTED',
      'PAYOUT_STATUS',
      'SYSTEM'
    );
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3 : Créer la table PlatformSettings (conforme au schema Prisma actuel)
-- ============================================================================
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

-- ============================================================================
-- ÉTAPE 4 : Insérer les paramètres par défaut
-- ============================================================================
INSERT INTO "PlatformSettings" ("id", "updatedAt")
SELECT gen_random_uuid()::TEXT, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PlatformSettings");

-- ============================================================================
-- ÉTAPE 5 : Créer la table Notification
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- ============================================================================
-- ÉTAPE 6 : Créer la table PushSubscription
-- ============================================================================
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "userId"    TEXT NOT NULL,
    "endpoint"  TEXT NOT NULL UNIQUE,
    "p256dh"    TEXT NOT NULL,
    "auth"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- ============================================================================
-- ÉTAPE 7 : Mettre à jour le suivi des migrations Prisma
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

-- ============================================================================
-- FIN
-- ============================================================================
