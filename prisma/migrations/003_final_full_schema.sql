-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'RESTAURANT', 'DELIVERY_DRIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CART', 'PENDING_PAYMENT', 'PAID_WAITING_RESTAURANT', 'ACCEPTED', 'PREPARING', 'READY', 'DRIVER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED', 'REFUND_REQUIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUND_REQUIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH_ON_DELIVERY', 'MTN_MOMO', 'MOOV_MONEY', 'CARD', 'PAYDUNYA', 'MOCK');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('ORDER_PAYMENT', 'RESTAURANT_SUBSCRIPTION', 'RESTAURANT_BOOST');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('MTN_MONEY', 'MOOV_MONEY', 'PAYDUNYA', 'MANUAL');

-- CreateEnum
CREATE TYPE "RestaurantPlacementType" AS ENUM ('HOME_FEATURED', 'SPONSORED_LISTING', 'TRENDING_DISHES', 'SEARCH_PRIORITY');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "RestaurantStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('PENDING', 'AVAILABLE', 'OFFLINE', 'ON_DELIVERY', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'PENDING_PAYMENT', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- CreateEnum
CREATE TYPE "AdminAuditAction" AS ENUM ('RESTAURANT_STATUS_UPDATED', 'DRIVER_STATUS_UPDATED', 'INVOICE_STATUS_UPDATED', 'FINANCIAL_REPORT_EXPORTED', 'BILLING_NOTIFICATION_STATUS_UPDATED', 'BILLING_NOTIFICATIONS_EXPORTED', 'PLATFORM_SETTINGS_UPDATED');

-- CreateEnum
CREATE TYPE "BillingNotificationType" AS ENUM ('SUBSCRIPTION_UPDATED', 'INVOICE_GENERATED', 'INVOICE_PAID', 'INVOICE_STATUS_UPDATED');

-- CreateEnum
CREATE TYPE "BillingNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('RESTAURANT_PAYOUT', 'DRIVER_PAYOUT', 'PLATFORM_REVENUE');

-- CreateEnum
CREATE TYPE "LedgerEntryDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "LedgerEntryStatus" AS ENUM ('PENDING', 'SETTLED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'READY_TO_PAY', 'SUCCESS', 'RETRY_REQUIRED', 'MANUALLY_PAID', 'BLOCKED_MISSING_PAYOUT_ACCOUNT', 'BLOCKED_UNVERIFIED_PAYOUT_ACCOUNT');

-- CreateEnum
CREATE TYPE "SettlementBatchStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_STATUS', 'ORDER_NEW', 'VALIDATION_APPROVED', 'VALIDATION_REJECTED', 'PAYOUT_STATUS', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PayoutOwnerType" AS ENUM ('RESTAURANT', 'COURIER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "passwordHash" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "driverStatus" "DriverStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vehicleType" TEXT,
    "city" TEXT,
    "verificationStatus" TEXT,
    "verificationSubmittedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "RestaurantCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RestaurantCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "status" "RestaurantStatus" NOT NULL DEFAULT 'PENDING',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryFee" INTEGER NOT NULL DEFAULT 1200,
    "minDelayMin" INTEGER NOT NULL DEFAULT 20,
    "maxDelayMin" INTEGER NOT NULL DEFAULT 40,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "currentPlanCode" TEXT,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "sponsoredUntil" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "addressId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subtotal" INTEGER NOT NULL,
    "deliveryFee" INTEGER NOT NULL,
    "serviceFee" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "note" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payoutStatus" "PayoutStatus",
    "paidAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driverId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "distanceKm" DOUBLE PRECISION,
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "lastLocationAt" TIMESTAMP(3),
    "trackingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pickedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "restaurantId" TEXT,
    "purpose" "PaymentPurpose" NOT NULL DEFAULT 'ORDER_PAYMENT',
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH_ON_DELIVERY',
    "provider" TEXT,
    "providerToken" TEXT,
    "providerRef" TEXT,
    "checkoutUrl" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "monthlyFee" INTEGER NOT NULL DEFAULT 0,
    "commissionRate" INTEGER NOT NULL DEFAULT 15,
    "interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "features" JSONB,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "allowPromoCodes" BOOLEAN NOT NULL DEFAULT false,
    "maxActivePromoCodes" INTEGER NOT NULL DEFAULT 0,
    "allowSponsoredPlacement" BOOLEAN NOT NULL DEFAULT false,
    "allowFeaturedDishes" BOOLEAN NOT NULL DEFAULT false,
    "allowAdvancedStats" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantSubscription" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "amount" INTEGER NOT NULL,
    "commission" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "discountType" "DiscountType",
    "discountValue" INTEGER,
    "minOrderAmount" INTEGER,
    "maxDiscountAmount" INTEGER,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perCustomerLimit" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCodeUsage" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "discountAmount" INTEGER NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCodeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "platformName" TEXT NOT NULL DEFAULT 'DalleUp',
    "platformSlogan" TEXT NOT NULL DEFAULT 'Commande. Chill. On livre.',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@dalleup.com',
    "supportPhone" TEXT NOT NULL DEFAULT '',
    "whatsappPhone" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'F CFA',
    "country" TEXT NOT NULL DEFAULT 'Bénin',
    "city" TEXT NOT NULL DEFAULT 'Cotonou',
    "defaultDeliveryFee" INTEGER NOT NULL DEFAULT 500,
    "deliveryFeePerKm" INTEGER NOT NULL DEFAULT 100,
    "freeDeliveryThreshold" INTEGER NOT NULL DEFAULT 10000,
    "minOrderAmount" INTEGER NOT NULL DEFAULT 1000,
    "maxDeliveryDistanceKm" INTEGER NOT NULL DEFAULT 15,
    "estimatedPrepTimeMin" INTEGER NOT NULL DEFAULT 20,
    "estimatedDeliveryTimeMin" INTEGER NOT NULL DEFAULT 30,
    "restaurantCommissionRate" INTEGER NOT NULL DEFAULT 15,
    "deliveryCommissionRate" INTEGER NOT NULL DEFAULT 0,
    "platformServiceFee" INTEGER NOT NULL DEFAULT 0,
    "restaurantPayoutDelayDays" INTEGER NOT NULL DEFAULT 7,
    "driverPayoutDelayDays" INTEGER NOT NULL DEFAULT 7,
    "allowCashPayment" BOOLEAN NOT NULL DEFAULT true,
    "allowMobileMoneyPayment" BOOLEAN NOT NULL DEFAULT true,
    "allowCardPayment" BOOLEAN NOT NULL DEFAULT false,
    "autoAcceptOrders" BOOLEAN NOT NULL DEFAULT false,
    "autoCancelUnpaidOrders" BOOLEAN NOT NULL DEFAULT true,
    "autoCancelDelayMinutes" INTEGER NOT NULL DEFAULT 15,
    "allowClientOrderCancellation" BOOLEAN NOT NULL DEFAULT true,
    "allowRestaurantOrderCancellation" BOOLEAN NOT NULL DEFAULT true,
    "clientCancellationWindowMin" INTEGER NOT NULL DEFAULT 5,
    "manualRestaurantApproval" BOOLEAN NOT NULL DEFAULT true,
    "allowRestaurantSelfProducts" BOOLEAN NOT NULL DEFAULT true,
    "allowRestaurantPriceEdit" BOOLEAN NOT NULL DEFAULT true,
    "autoHideClosedRestaurants" BOOLEAN NOT NULL DEFAULT true,
    "minRatingForFeature" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    "manualDriverApproval" BOOLEAN NOT NULL DEFAULT true,
    "enableAutoDriverAssign" BOOLEAN NOT NULL DEFAULT false,
    "driverSearchRadiusKm" INTEGER NOT NULL DEFAULT 5,
    "driverAcceptTimeoutSec" INTEGER NOT NULL DEFAULT 300,
    "driverMinFee" INTEGER NOT NULL DEFAULT 300,
    "driverDeliveryBonusEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowDriverRefusal" BOOLEAN NOT NULL DEFAULT true,
    "enableSponsoredRestaurants" BOOLEAN NOT NULL DEFAULT true,
    "sponsoredRestaurantDailyPrice" INTEGER NOT NULL DEFAULT 2000,
    "sponsoredRestaurantWeeklyPrice" INTEGER NOT NULL DEFAULT 10000,
    "sponsoredRestaurantMonthlyPrice" INTEGER NOT NULL DEFAULT 30000,
    "maxSponsoredRestaurants" INTEGER NOT NULL DEFAULT 6,
    "sponsoredDefaultDurationDays" INTEGER NOT NULL DEFAULT 7,
    "sponsoredDefaultStatus" TEXT NOT NULL DEFAULT 'pending',
    "enableTrendingDishes" BOOLEAN NOT NULL DEFAULT true,
    "trendingDishDailyPrice" INTEGER NOT NULL DEFAULT 1000,
    "trendingDishWeeklyPrice" INTEGER NOT NULL DEFAULT 5000,
    "trendingDishMonthlyPrice" INTEGER NOT NULL DEFAULT 15000,
    "maxTrendingDishes" INTEGER NOT NULL DEFAULT 8,
    "trendingDefaultDurationDays" INTEGER NOT NULL DEFAULT 7,
    "trendingDefaultStatus" TEXT NOT NULL DEFAULT 'pending',
    "enablePushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableSmsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "enableWhatsappNotifications" BOOLEAN NOT NULL DEFAULT false,
    "notifyNewOrderClient" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewOrderRestaurant" BOOLEAN NOT NULL DEFAULT true,
    "notifyOrderAccepted" BOOLEAN NOT NULL DEFAULT true,
    "notifyOrderRejected" BOOLEAN NOT NULL DEFAULT true,
    "notifyDriverAssigned" BOOLEAN NOT NULL DEFAULT true,
    "notifyOrderOnTheWay" BOOLEAN NOT NULL DEFAULT true,
    "notifyOrderDelivered" BOOLEAN NOT NULL DEFAULT true,
    "notifyPaymentConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "notifyPaymentFailed" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewRestaurant" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewDriver" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewSponsoring" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT NOT NULL DEFAULT 'DalleUp est temporairement en maintenance. Merci de revenir dans quelques minutes.',
    "allowAdminInMaintenance" BOOLEAN NOT NULL DEFAULT true,
    "disableOrdersTemporarily" BOOLEAN NOT NULL DEFAULT false,
    "disableRestaurantSignup" BOOLEAN NOT NULL DEFAULT false,
    "disableDriverSignup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "pendingBalance" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "LedgerEntryType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "direction" "LedgerEntryDirection" NOT NULL,
    "status" "LedgerEntryStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformRevenue" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "foodSubtotal" INTEGER NOT NULL,
    "deliveryFee" INTEGER NOT NULL,
    "restaurantCommission" INTEGER NOT NULL,
    "deliveryCommission" INTEGER NOT NULL,
    "restaurantPayout" INTEGER NOT NULL,
    "driverPayout" INTEGER NOT NULL,
    "totalPlatformRevenue" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
    "method" TEXT,
    "reference" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementBatch" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalRestaurants" INTEGER NOT NULL,
    "totalDrivers" INTEGER NOT NULL,
    "totalPlatform" INTEGER NOT NULL,
    "status" "SettlementBatchStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSplit" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "subtotalAmount" INTEGER NOT NULL,
    "deliveryFeeAmount" INTEGER NOT NULL,
    "serviceFeeAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "restaurantCommissionRate" INTEGER NOT NULL,
    "restaurantCommissionAmount" INTEGER NOT NULL,
    "deliveryCommissionRate" INTEGER NOT NULL,
    "deliveryCommissionAmount" INTEGER NOT NULL,
    "restaurantAmount" INTEGER NOT NULL,
    "courierAmount" INTEGER NOT NULL,
    "dalleupAmount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "manuallyPaidAt" TIMESTAMP(3),
    "manualNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantPlacement" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "type" "RestaurantPlacementType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantCategory_name_key" ON "RestaurantCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Address_userId_street_city_key" ON "Address"("userId", "street", "city");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPlan_code_key" ON "BillingPlan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPlan_name_key" ON "BillingPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantSubscription_paymentId_key" ON "RestaurantSubscription"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_createdAt_idx" ON "AdminAuditLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "BillingNotification_status_createdAt_idx" ON "BillingNotification"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BillingNotification_restaurantId_createdAt_idx" ON "BillingNotification"("restaurantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderId_key" ON "Review"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_restaurantId_key" ON "Favorite"("userId", "restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_restaurantId_isActive_idx" ON "PromoCode"("restaurantId", "isActive");

-- CreateIndex
CREATE INDEX "PlatformSettings_updatedAt_idx" ON "PlatformSettings"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformRevenue_orderId_key" ON "PlatformRevenue"("orderId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderSplit_orderId_key" ON "OrderSplit"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutAccount_ownerType_ownerId_provider_method_key" ON "PayoutAccount"("ownerType", "ownerId", "provider", "method");

-- CreateIndex
CREATE INDEX "PayoutTransfer_status_createdAt_idx" ON "PayoutTransfer"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutTransfer_orderId_beneficiaryType_beneficiaryId_key" ON "PayoutTransfer"("orderId", "beneficiaryType", "beneficiaryId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RestaurantCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantSubscription" ADD CONSTRAINT "RestaurantSubscription_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantSubscription" ADD CONSTRAINT "RestaurantSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantSubscription" ADD CONSTRAINT "RestaurantSubscription_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "RestaurantSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingNotification" ADD CONSTRAINT "BillingNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingNotification" ADD CONSTRAINT "BillingNotification_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSplit" ADD CONSTRAINT "OrderSplit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutTransfer" ADD CONSTRAINT "PayoutTransfer_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantPlacement" ADD CONSTRAINT "RestaurantPlacement_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

