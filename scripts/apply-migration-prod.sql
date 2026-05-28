-- Script de baseline + application de la migration 002 sur la base de production
-- À exécuter dans l'éditeur SQL Supabase (ou Vercel Storage > SQL Editor)
--
-- IMPORTANT : Exécutez l'ÉTAPE 1 d'abord, puis l'ÉTAPE 2 dans une requête séparée.
-- PostgreSQL interdit d'utiliser une nouvelle valeur d'enum dans la même transaction.

-- ============================================================
-- ÉTAPE 1 : Ajouter les valeurs manquantes à l'enum DriverStatus
-- COPIEZ ET EXÉCUTEZ D'ABORD CE BLOC SEUL
-- ============================================================

DO $$
BEGIN
  ALTER TYPE "DriverStatus" ADD VALUE 'PENDING';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "DriverStatus" ADD VALUE 'REJECTED';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================================
-- ÉTAPE 2 : Le reste de la migration
-- COPIEZ ET EXÉCUTEZ CE BLOC APRÈS AVOIR CONFIRMÉ QUE L'ÉTAPE 1 A RÉUSSI
-- ============================================================

-- 1. Créer la table de suivi des migrations si elle n'existe pas
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY,
    "checksum" VARCHAR(64),
    "finished_at" TIMESTAMP(3),
    "migration_name" VARCHAR(255),
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- 2. Baseline : marquer la migration initiale comme déjà appliquée
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
SELECT 'baseline_000', '', NOW(), '000_init_full_schema', NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '000_init_full_schema');

-- 3. Ajouter les colonnes manquantes à la table User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vehicleType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationSubmittedAt" TIMESTAMP(3);

-- 4. Définir driverStatus avec une valeur par défaut et rendre NOT NULL
ALTER TABLE "User" ALTER COLUMN "driverStatus" SET DEFAULT 'PENDING';
UPDATE "User" SET "driverStatus" = 'PENDING' WHERE "driverStatus" IS NULL;
ALTER TABLE "User" ALTER COLUMN "driverStatus" SET NOT NULL;

-- 5. Marquer la migration 002 comme appliquée
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
SELECT 'baseline_002', '', NOW(), '002_sync_user_driver_schema', NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '002_sync_user_driver_schema');
