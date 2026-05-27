import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export const DEFAULT_SETTINGS: Omit<
  Prisma.PlatformSettingsCreateInput,
  "createdAt" | "updatedAt"
> = {
  platformName: "DalleUp",
  platformSlogan: "Commande. Chill. On livre.",
  supportEmail: "support@dalleup.com",
  supportPhone: "",
  whatsappPhone: "",
  currency: "F CFA",
  country: "Bénin",
  city: "Cotonou",

  defaultDeliveryFee: 500,
  deliveryFeePerKm: 100,
  freeDeliveryThreshold: 10000,
  minOrderAmount: 1000,
  maxDeliveryDistanceKm: 15,
  estimatedPrepTimeMin: 20,
  estimatedDeliveryTimeMin: 30,

  restaurantCommissionRate: 15,
  deliveryCommissionRate: 0,
  platformServiceFee: 0,
  restaurantPayoutDelayDays: 7,
  driverPayoutDelayDays: 7,

  allowCashPayment: true,
  allowMobileMoneyPayment: true,
  allowCardPayment: false,

  autoAcceptOrders: false,
  autoCancelUnpaidOrders: true,
  autoCancelDelayMinutes: 15,
  allowClientOrderCancellation: true,
  allowRestaurantOrderCancellation: true,
  clientCancellationWindowMin: 5,

  manualRestaurantApproval: true,
  allowRestaurantSelfProducts: true,
  allowRestaurantPriceEdit: true,
  autoHideClosedRestaurants: true,
  minRatingForFeature: 4.0,

  manualDriverApproval: true,
  enableAutoDriverAssign: false,
  driverSearchRadiusKm: 5,
  driverAcceptTimeoutSec: 300,
  driverMinFee: 300,
  driverDeliveryBonusEnabled: false,
  allowDriverRefusal: true,

  enableSponsoredRestaurants: true,
  sponsoredRestaurantDailyPrice: 2000,
  sponsoredRestaurantWeeklyPrice: 10000,
  sponsoredRestaurantMonthlyPrice: 30000,
  maxSponsoredRestaurants: 6,
  sponsoredDefaultDurationDays: 7,
  sponsoredDefaultStatus: "pending",

  enableTrendingDishes: true,
  trendingDishDailyPrice: 1000,
  trendingDishWeeklyPrice: 5000,
  trendingDishMonthlyPrice: 15000,
  maxTrendingDishes: 8,
  trendingDefaultDurationDays: 7,
  trendingDefaultStatus: "pending",

  enablePushNotifications: true,
  enableEmailNotifications: true,
  enableSmsNotifications: false,
  enableWhatsappNotifications: false,

  notifyNewOrderClient: true,
  notifyNewOrderRestaurant: true,
  notifyOrderAccepted: true,
  notifyOrderRejected: true,
  notifyDriverAssigned: true,
  notifyOrderOnTheWay: true,
  notifyOrderDelivered: true,
  notifyPaymentConfirmed: true,
  notifyPaymentFailed: true,
  notifyNewRestaurant: true,
  notifyNewDriver: true,
  notifyNewSponsoring: true,

  maintenanceMode: false,
  maintenanceMessage:
    "DalleUp est temporairement en maintenance. Merci de revenir dans quelques minutes.",
  allowAdminInMaintenance: true,
  disableOrdersTemporarily: false,
  disableRestaurantSignup: false,
  disableDriverSignup: false,
};

export async function getPlatformSettings() {
  let settings = await prisma.platformSettings.findFirst();
  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: DEFAULT_SETTINGS,
    });
  }
  return settings;
}

export async function updatePlatformSettings(
  data: Partial<Prisma.PlatformSettingsUpdateInput>,
  adminId: string
) {
  const settings = await getPlatformSettings();

  const before = { ...settings };
  delete (before as { id?: string }).id;
  delete (before as { createdAt?: Date }).createdAt;
  delete (before as { updatedAt?: Date }).updatedAt;

  const updated = await prisma.platformSettings.update({
    where: { id: settings.id },
    data,
  });

  const after = { ...updated };
  delete (after as { id?: string }).id;
  delete (after as { createdAt?: Date }).createdAt;
  delete (after as { updatedAt?: Date }).updatedAt;

  // log only changed keys
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of Object.keys(after)) {
    const k = key as keyof typeof before;
    if ((before as Record<string, unknown>)[k] !== (after as Record<string, unknown>)[k]) {
      changes[key] = {
        before: (before as Record<string, unknown>)[k],
        after: (after as Record<string, unknown>)[k],
      };
    }
  }

  if (Object.keys(changes).length > 0) {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: "PLATFORM_SETTINGS_UPDATED",
        targetType: "PlatformSettings",
        targetLabel: "Paramètres système",
        metadata: changes as unknown as Prisma.InputJsonValue,
      },
    });
  }

  return updated;
}
