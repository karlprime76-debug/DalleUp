import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/settings/platform-settings";

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return NextResponse.json({
      platformName: settings.platformName,
      platformSlogan: settings.platformSlogan,
      currency: settings.currency,
      country: settings.country,
      city: settings.city,
      defaultDeliveryFee: settings.defaultDeliveryFee,
      deliveryFeePerKm: settings.deliveryFeePerKm,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      minOrderAmount: settings.minOrderAmount,
      maxDeliveryDistanceKm: settings.maxDeliveryDistanceKm,
      estimatedPrepTimeMin: settings.estimatedPrepTimeMin,
      estimatedDeliveryTimeMin: settings.estimatedDeliveryTimeMin,
      allowCashPayment: settings.allowCashPayment,
      allowMobileMoneyPayment: settings.allowMobileMoneyPayment,
      allowCardPayment: settings.allowCardPayment,
      autoAcceptOrders: settings.autoAcceptOrders,
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
      disableOrdersTemporarily: settings.disableOrdersTemporarily,
      disableRestaurantSignup: settings.disableRestaurantSignup,
      disableDriverSignup: settings.disableDriverSignup,
      restaurantCommissionRate: settings.restaurantCommissionRate,
      deliveryCommissionRate: settings.deliveryCommissionRate,
      platformServiceFee: settings.platformServiceFee,
      enableSponsoredRestaurants: settings.enableSponsoredRestaurants,
      sponsoredRestaurantDailyPrice: settings.sponsoredRestaurantDailyPrice,
      sponsoredRestaurantWeeklyPrice: settings.sponsoredRestaurantWeeklyPrice,
      sponsoredRestaurantMonthlyPrice: settings.sponsoredRestaurantMonthlyPrice,
      enableTrendingDishes: settings.enableTrendingDishes,
      trendingDishDailyPrice: settings.trendingDishDailyPrice,
      trendingDishWeeklyPrice: settings.trendingDishWeeklyPrice,
      trendingDishMonthlyPrice: settings.trendingDishMonthlyPrice,
    });
  } catch {
    return NextResponse.json(
      { message: "Erreur lors du chargement des paramètres." },
      { status: 500 }
    );
  }
}
