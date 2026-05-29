-- Migration: marketplace_payments
-- Description: Ajoute les statuts marketplace, enrichit Payment/Order, crée OrderSplit, PayoutAccount, PayoutTransfer

-- 1. OrderStatus: ajouter CART, PENDING_PAYMENT, PAID_WAITING_RESTAURANT, READY_FOR_PICKUP, REFUND_REQUIRED, REFUNDED
ALTER TYPE "OrderStatus" ADD VALUE 'CART';
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE "OrderStatus" ADD VALUE 'PAID_WAITING_RESTAURANT';
ALTER TYPE "OrderStatus" ADD VALUE 'READY_FOR_PICKUP';
ALTER TYPE "OrderStatus" ADD VALUE 'REFUND_REQUIRED';
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';

-- 2. PaymentStatus: ajouter CANCELLED, REFUND_REQUIRED
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUND_REQUIRED';

-- 3. PaymentMethod: ajouter PAYDUNYA, MOCK
ALTER TYPE "PaymentMethod" ADD VALUE 'PAYDUNYA';
ALTER TYPE "PaymentMethod" ADD VALUE 'MOCK';

-- 4. PayoutStatus: ajouter PENDING, READY_TO_PAY, SUCCESS, RETRY_REQUIRED, MANUALLY_PAID
ALTER TYPE "PayoutStatus" ADD VALUE 'PENDING';
ALTER TYPE "PayoutStatus" ADD VALUE 'READY_TO_PAY';
ALTER TYPE "PayoutStatus" ADD VALUE 'SUCCESS';
ALTER TYPE "PayoutStatus" ADD VALUE 'RETRY_REQUIRED';
ALTER TYPE "PayoutStatus" ADD VALUE 'MANUALLY_PAID';

-- 5. Payment: nouvelles colonnes
ALTER TABLE "Payment" ADD COLUMN "provider" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerToken" TEXT;
ALTER TABLE "Payment" ADD COLUMN "checkoutUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'XOF';
ALTER TABLE "Payment" ADD COLUMN "failedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "raw" JSONB;
ALTER TABLE "Payment" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Payment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 6. Order: nouvelles colonnes
ALTER TABLE "Order" ADD COLUMN "serviceFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN "payoutStatus" "PayoutStatus";
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "refundedAt" TIMESTAMP(3);

-- Mettre à jour les commandes existantes qui n'ont pas de paymentStatus
UPDATE "Order" SET "paymentStatus" = 'PAID' WHERE "status" IN ('ACCEPTED', 'PREPARING', 'READY', 'DRIVER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED');
UPDATE "Order" SET "paymentStatus" = 'PENDING' WHERE "status" = 'PENDING';
UPDATE "Order" SET "paymentStatus" = 'FAILED' WHERE "status" = 'CANCELLED';

-- 7. OrderSplit
CREATE TABLE "OrderSplit" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "subtotalAmount" INTEGER NOT NULL,
    "deliveryFeeAmount" INTEGER NOT NULL,
    "serviceFeeAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "restaurantCommissionRate" INTEGER NOT NULL,
    "restaurantCommissionAmount" INTEGER NOT NULL,
    "restaurantAmount" INTEGER NOT NULL,
    "courierAmount" INTEGER NOT NULL,
    "dalleupAmount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSplit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderSplit_orderId_key" UNIQUE ("orderId")
);

CREATE UNIQUE INDEX "OrderSplit_orderId_key" ON "OrderSplit"("orderId");

ALTER TABLE "OrderSplit" ADD CONSTRAINT "OrderSplit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. PayoutAccount
CREATE TYPE "PayoutOwnerType" AS ENUM ('RESTAURANT', 'COURIER');

CREATE TABLE "PayoutAccount" (
    "id" TEXT NOT NULL,
    "ownerType" "PayoutOwnerType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "phone" TEXT,
    "accountAlias" TEXT,
    "accountName" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayoutAccount_ownerType_ownerId_provider_method_key" ON "PayoutAccount"("ownerType", "ownerId", "provider", "method");

-- 9. PayoutTransfer
CREATE TABLE "PayoutTransfer" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "beneficiaryType" "PayoutOwnerType" NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "payoutAccountId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "provider" TEXT NOT NULL,
    "providerToken" TEXT,
    "providerRef" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "raw" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutTransfer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayoutTransfer_orderId_beneficiaryType_beneficiaryId_key" ON "PayoutTransfer"("orderId", "beneficiaryType", "beneficiaryId");
CREATE INDEX "PayoutTransfer_status_createdAt_idx" ON "PayoutTransfer"("status", "createdAt");

ALTER TABLE "PayoutTransfer" ADD CONSTRAINT "PayoutTransfer_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayoutTransfer" ADD CONSTRAINT "PayoutTransfer_payoutAccountId_fkey" FOREIGN KEY ("payoutAccountId") REFERENCES "PayoutAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
