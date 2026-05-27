export const RESTAURANT_COMMISSION_PCT = 15;
export const DELIVERY_COMMISSION_PCT = 10;

export function calculateRestaurantCommission(foodSubtotal: number, ratePct = RESTAURANT_COMMISSION_PCT): number {
  return Math.round((foodSubtotal * ratePct) / 100);
}

export function calculateDeliveryCommission(deliveryFee: number, ratePct = DELIVERY_COMMISSION_PCT): number {
  return Math.round((deliveryFee * ratePct) / 100);
}

export function calculateRestaurantPayout(foodSubtotal: number, ratePct = RESTAURANT_COMMISSION_PCT): number {
  return foodSubtotal - calculateRestaurantCommission(foodSubtotal, ratePct);
}

export function calculateDriverPayout(deliveryFee: number, ratePct = DELIVERY_COMMISSION_PCT): number {
  return deliveryFee - calculateDeliveryCommission(deliveryFee, ratePct);
}

export function calculatePlatformRevenue(foodSubtotal: number, deliveryFee: number, restaurantRate = RESTAURANT_COMMISSION_PCT, deliveryRate = DELIVERY_COMMISSION_PCT): number {
  return calculateRestaurantCommission(foodSubtotal, restaurantRate) + calculateDeliveryCommission(deliveryFee, deliveryRate);
}

export type OrderSplit = {
  foodSubtotal: number;
  deliveryFee: number;
  totalPaidByCustomer: number;
  restaurantCommission: number;
  restaurantPayout: number;
  deliveryCommission: number;
  driverPayout: number;
  platformRevenue: number;
};

export function calculateOrderSplit({
  foodSubtotal,
  deliveryFee,
}: {
  foodSubtotal: number;
  deliveryFee: number;
}): OrderSplit {
  return calculateOrderSplitWithRates({ foodSubtotal, deliveryFee });
}

export function calculateOrderSplitWithRates({
  foodSubtotal,
  deliveryFee,
  restaurantRate = RESTAURANT_COMMISSION_PCT,
  deliveryRate = DELIVERY_COMMISSION_PCT,
}: {
  foodSubtotal: number;
  deliveryFee: number;
  restaurantRate?: number;
  deliveryRate?: number;
}): OrderSplit {
  const restaurantCommission = calculateRestaurantCommission(foodSubtotal, restaurantRate);
  const restaurantPayout = calculateRestaurantPayout(foodSubtotal, restaurantRate);
  const deliveryCommission = calculateDeliveryCommission(deliveryFee, deliveryRate);
  const driverPayout = calculateDriverPayout(deliveryFee, deliveryRate);
  const platformRevenue = restaurantCommission + deliveryCommission;
  const totalPaidByCustomer = foodSubtotal + deliveryFee;

  return {
    foodSubtotal,
    deliveryFee,
    totalPaidByCustomer,
    restaurantCommission,
    restaurantPayout,
    deliveryCommission,
    driverPayout,
    platformRevenue,
  };
}
