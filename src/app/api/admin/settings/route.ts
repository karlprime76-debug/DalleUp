import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/lib/settings/platform-settings";

export async function GET(request: Request) {
  const guard = await requireAdminApi(request);
  if ("response" in guard) return guard.response;

  try {
    const settings = await getPlatformSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { message: "Erreur lors du chargement des paramètres." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const guard = await requireAdminApi(request);
  if ("response" in guard) return guard.response;

  try {
    const body = await request.json();

    // strip ids and timestamps
    const allowedKeys = new Set([
      "platformName",
      "platformSlogan",
      "supportEmail",
      "supportPhone",
      "whatsappPhone",
      "currency",
      "country",
      "city",
      "defaultDeliveryFee",
      "deliveryFeePerKm",
      "freeDeliveryThreshold",
      "minOrderAmount",
      "maxDeliveryDistanceKm",
      "estimatedPrepTimeMin",
      "estimatedDeliveryTimeMin",
      "restaurantCommissionRate",
      "deliveryCommissionRate",
      "platformServiceFee",
      "restaurantPayoutDelayDays",
      "driverPayoutDelayDays",
      "allowCashPayment",
      "allowMobileMoneyPayment",
      "allowCardPayment",
      "autoAcceptOrders",
      "autoCancelUnpaidOrders",
      "autoCancelDelayMinutes",
      "allowClientOrderCancellation",
      "allowRestaurantOrderCancellation",
      "clientCancellationWindowMin",
      "manualRestaurantApproval",
      "allowRestaurantSelfProducts",
      "allowRestaurantPriceEdit",
      "autoHideClosedRestaurants",
      "minRatingForFeature",
      "manualDriverApproval",
      "enableAutoDriverAssign",
      "driverSearchRadiusKm",
      "driverAcceptTimeoutSec",
      "driverMinFee",
      "driverDeliveryBonusEnabled",
      "allowDriverRefusal",
      "enableSponsoredRestaurants",
      "sponsoredRestaurantDailyPrice",
      "sponsoredRestaurantWeeklyPrice",
      "sponsoredRestaurantMonthlyPrice",
      "maxSponsoredRestaurants",
      "sponsoredDefaultDurationDays",
      "sponsoredDefaultStatus",
      "enableTrendingDishes",
      "trendingDishDailyPrice",
      "trendingDishWeeklyPrice",
      "trendingDishMonthlyPrice",
      "maxTrendingDishes",
      "trendingDefaultDurationDays",
      "trendingDefaultStatus",
      "enablePushNotifications",
      "enableEmailNotifications",
      "enableSmsNotifications",
      "enableWhatsappNotifications",
      "notifyNewOrderClient",
      "notifyNewOrderRestaurant",
      "notifyOrderAccepted",
      "notifyOrderRejected",
      "notifyDriverAssigned",
      "notifyOrderOnTheWay",
      "notifyOrderDelivered",
      "notifyPaymentConfirmed",
      "notifyPaymentFailed",
      "notifyNewRestaurant",
      "notifyNewDriver",
      "notifyNewSponsoring",
      "maintenanceMode",
      "maintenanceMessage",
      "allowAdminInMaintenance",
      "disableOrdersTemporarily",
      "disableRestaurantSignup",
      "disableDriverSignup",
    ]);

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!allowedKeys.has(key)) continue;
      updateData[key] = value;
    }

    // simple validation for numeric ranges
    const intFields = [
      "defaultDeliveryFee",
      "deliveryFeePerKm",
      "freeDeliveryThreshold",
      "minOrderAmount",
      "maxDeliveryDistanceKm",
      "estimatedPrepTimeMin",
      "estimatedDeliveryTimeMin",
      "restaurantCommissionRate",
      "deliveryCommissionRate",
      "platformServiceFee",
      "restaurantPayoutDelayDays",
      "driverPayoutDelayDays",
      "autoCancelDelayMinutes",
      "clientCancellationWindowMin",
      "driverSearchRadiusKm",
      "driverAcceptTimeoutSec",
      "driverMinFee",
      "sponsoredRestaurantDailyPrice",
      "sponsoredRestaurantWeeklyPrice",
      "sponsoredRestaurantMonthlyPrice",
      "maxSponsoredRestaurants",
      "sponsoredDefaultDurationDays",
      "trendingDishDailyPrice",
      "trendingDishWeeklyPrice",
      "trendingDishMonthlyPrice",
      "maxTrendingDishes",
      "trendingDefaultDurationDays",
    ];

    for (const field of intFields) {
      if (field in updateData) {
        const val = Number(updateData[field]);
        if (Number.isNaN(val)) {
          return NextResponse.json(
            { message: `Le champ ${field} doit être un nombre valide.` },
            { status: 400 }
          );
        }
        if (field.includes("Rate") || field.includes("Pct") || field === "platformServiceFee") {
          if (val < 0 || val > 100) {
            return NextResponse.json(
              { message: `Le taux ${field} doit être entre 0 et 100.` },
              { status: 400 }
            );
          }
        }
        if (val < 0) {
          return NextResponse.json(
            { message: `Le champ ${field} ne peut pas être négatif.` },
            { status: 400 }
          );
        }
        updateData[field] = val;
      }
    }

    const floatFields = ["minRatingForFeature"];
    for (const field of floatFields) {
      if (field in updateData) {
        const val = Number(updateData[field]);
        if (Number.isNaN(val)) {
          return NextResponse.json(
            { message: `Le champ ${field} doit être un nombre valide.` },
            { status: 400 }
          );
        }
        updateData[field] = val;
      }
    }

    const boolFields = [
      "allowCashPayment",
      "allowMobileMoneyPayment",
      "allowCardPayment",
      "autoAcceptOrders",
      "autoCancelUnpaidOrders",
      "allowClientOrderCancellation",
      "allowRestaurantOrderCancellation",
      "manualRestaurantApproval",
      "allowRestaurantSelfProducts",
      "allowRestaurantPriceEdit",
      "autoHideClosedRestaurants",
      "manualDriverApproval",
      "enableAutoDriverAssign",
      "driverDeliveryBonusEnabled",
      "allowDriverRefusal",
      "enableSponsoredRestaurants",
      "enableTrendingDishes",
      "enablePushNotifications",
      "enableEmailNotifications",
      "enableSmsNotifications",
      "enableWhatsappNotifications",
      "notifyNewOrderClient",
      "notifyNewOrderRestaurant",
      "notifyOrderAccepted",
      "notifyOrderRejected",
      "notifyDriverAssigned",
      "notifyOrderOnTheWay",
      "notifyOrderDelivered",
      "notifyPaymentConfirmed",
      "notifyPaymentFailed",
      "notifyNewRestaurant",
      "notifyNewDriver",
      "notifyNewSponsoring",
      "maintenanceMode",
      "allowAdminInMaintenance",
      "disableOrdersTemporarily",
      "disableRestaurantSignup",
      "disableDriverSignup",
    ];
    for (const field of boolFields) {
      if (field in updateData) {
        updateData[field] = Boolean(updateData[field]);
      }
    }

    const stringFields = [
      "platformName",
      "platformSlogan",
      "supportEmail",
      "supportPhone",
      "whatsappPhone",
      "currency",
      "country",
      "city",
      "maintenanceMessage",
      "sponsoredDefaultStatus",
      "trendingDefaultStatus",
    ];
    for (const field of stringFields) {
      if (field in updateData) {
        if (typeof updateData[field] !== "string") {
          return NextResponse.json(
            { message: `Le champ ${field} doit être une chaîne.` },
            { status: 400 }
          );
        }
      }
    }

    const updated = await updatePlatformSettings(
      updateData,
      guard.session.user.id
    );
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour des paramètres." },
      { status: 500 }
    );
  }
}
