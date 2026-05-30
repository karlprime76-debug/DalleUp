-- Migration 20260530: Add Place, SavedAddress, PlaceSuggestion tables and enums

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlaceType') THEN
    CREATE TYPE "PlaceType" AS ENUM (
      'COUNTRY','DEPARTMENT','COMMUNE','ARRONDISSEMENT','NEIGHBORHOOD','DISTRICT',
      'LANDMARK','ROUNDABOUT','ROAD','TRANSPORT_HUB','MARKET',
      'RESTAURANT','MAQUIS','FAST_FOOD','CAFE','BAKERY','PASTRY_SHOP','BAR','BUVETTE','LOUNGE','NIGHTCLUB',
      'GYM','SPORTS_CENTER','FOOTBALL_FIELD',
      'SHOP','SUPERMARKET','MINI_MARKET','PHARMACY','CLINIC','HOSPITAL','BANK','ATM','GAS_STATION','HOTEL',
      'SCHOOL','UNIVERSITY','CHURCH','MOSQUE','ADMIN_BUILDING',
      'BUILDING','RESIDENCE','HOUSE_LANDMARK','PRIVATE_HOME',
      'BEACH','TOURIST_PLACE','OTHER'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlaceSource') THEN
    CREATE TYPE "PlaceSource" AS ENUM ('MANUAL','ADMIN','USER_SUGGESTION','DRIVER_SUGGESTION','RESTAURANT_SUGGESTION','GOOGLE_PLACES','OPENSTREETMAP','IMPORT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryPriority') THEN
    CREATE TYPE "DeliveryPriority" AS ENUM ('HIGH','MEDIUM','LOW');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SuggestionStatus') THEN
    CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING','APPROVED','REJECTED','MERGED');
  END IF;
END $$;

-- Place table
CREATE TABLE IF NOT EXISTS "Place" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "type" "PlaceType" NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'Bénin',
  "department" TEXT,
  "commune" TEXT,
  "arrondissement" TEXT,
  "neighborhood" TEXT,
  "city" TEXT,
  "addressText" TEXT,
  "description" TEXT,
  "aliases" JSONB,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "source" "PlaceSource" NOT NULL DEFAULT 'MANUAL',
  "externalId" TEXT,
  "googlePlaceId" TEXT,
  "osmId" TEXT,
  "osmType" TEXT,
  "osmTags" JSONB,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "deliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
  "deliveryPriority" "DeliveryPriority",
  "baseDeliveryFee" INTEGER,
  "estimatedEtaMin" INTEGER,
  "estimatedEtaMax" INTEGER,
  "popularityScore" INTEGER NOT NULL DEFAULT 0,
  "searchWeight" INTEGER NOT NULL DEFAULT 0,
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Place_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Place_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Place_slug_commune_type_key" ON "Place"("slug","commune","type");
CREATE INDEX IF NOT EXISTS "Place_commune_idx" ON "Place"("commune");
CREATE INDEX IF NOT EXISTS "Place_city_idx" ON "Place"("city");
CREATE INDEX IF NOT EXISTS "Place_type_idx" ON "Place"("type");
CREATE INDEX IF NOT EXISTS "Place_deliveryEnabled_idx" ON "Place"("deliveryEnabled");
CREATE INDEX IF NOT EXISTS "Place_isActive_idx" ON "Place"("isActive");
CREATE INDEX IF NOT EXISTS "Place_normalizedName_idx" ON "Place"("normalizedName");
CREATE INDEX IF NOT EXISTS "Place_googlePlaceId_idx" ON "Place"("googlePlaceId");
CREATE INDEX IF NOT EXISTS "Place_osmId_idx" ON "Place"("osmId");

-- SavedAddress table
CREATE TABLE IF NOT EXISTS "SavedAddress" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "restaurantId" TEXT,
  "label" TEXT,
  "recipientName" TEXT,
  "phone" TEXT,
  "addressText" TEXT NOT NULL,
  "commune" TEXT,
  "neighborhood" TEXT,
  "landmarkText" TEXT,
  "instructions" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "placeId" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isPrivate" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SavedAddress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SavedAddress_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SavedAddress_userId_idx" ON "SavedAddress"("userId");
CREATE INDEX IF NOT EXISTS "SavedAddress_restaurantId_idx" ON "SavedAddress"("restaurantId");
CREATE INDEX IF NOT EXISTS "SavedAddress_placeId_idx" ON "SavedAddress"("placeId");

-- PlaceSuggestion table
CREATE TABLE IF NOT EXISTS "PlaceSuggestion" (
  "id" TEXT NOT NULL,
  "suggestedById" TEXT,
  "suggestedByRole" TEXT,
  "name" TEXT NOT NULL,
  "type" "PlaceType",
  "addressText" TEXT,
  "commune" TEXT,
  "neighborhood" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "notes" TEXT,
  "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdPlaceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlaceSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PlaceSuggestion_status_idx" ON "PlaceSuggestion"("status");
CREATE INDEX IF NOT EXISTS "PlaceSuggestion_commune_idx" ON "PlaceSuggestion"("commune");
