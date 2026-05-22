export const RESTAURANT_COMMISSION_PCT = 15;
export const DELIVERY_COMMISSION_PCT = 10;

export function calculateRestaurantCommission(foodSubtotal: number): number {
  return Math.round((foodSubtotal * RESTAURANT_COMMISSION_PCT) / 100);
}

export function calculateDeliveryCommission(deliveryFee: number): number {
  return Math.round((deliveryFee * DELIVERY_COMMISSION_PCT) / 100);
}

export function calculateRestaurantPayout(foodSubtotal: number): number {
  return foodSubtotal - calculateRestaurantCommission(foodSubtotal);
}

export function calculateDriverPayout(deliveryFee: number): number {
  return deliveryFee - calculateDeliveryCommission(deliveryFee);
}

export function calculatePlatformRevenue(foodSubtotal: number, deliveryFee: number): number {
  return calculateRestaurantCommission(foodSubtotal) + calculateDeliveryCommission(deliveryFee);
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
  const restaurantCommission = calculateRestaurantCommission(foodSubtotal);
  const restaurantPayout = calculateRestaurantPayout(foodSubtotal);
  const deliveryCommission = calculateDeliveryCommission(deliveryFee);
  const driverPayout = calculateDriverPayout(deliveryFee);
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
