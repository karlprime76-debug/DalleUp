export type OrderSplitInput = {
  subtotalAmount: number;
  deliveryFeeAmount: number;
  serviceFeeAmount: number;
  restaurantCommissionRate: number; // ex: 10 pour 10%
};

export type OrderSplitResult = {
  subtotalAmount: number;
  deliveryFeeAmount: number;
  serviceFeeAmount: number;
  totalAmount: number;
  restaurantCommissionRate: number;
  restaurantCommissionAmount: number;
  restaurantAmount: number;
  courierAmount: number;
  dalleupAmount: number;
};

export function calculateOrderSplit({
  subtotalAmount,
  deliveryFeeAmount,
  serviceFeeAmount,
  restaurantCommissionRate,
}: OrderSplitInput): OrderSplitResult {
  const rate = Math.max(0, Math.min(100, restaurantCommissionRate));
  const restaurantCommissionAmount = Math.round((subtotalAmount * rate) / 100);
  const restaurantAmount = subtotalAmount - restaurantCommissionAmount;
  const courierAmount = deliveryFeeAmount;
  const dalleupAmount = restaurantCommissionAmount + serviceFeeAmount;
  const totalAmount = subtotalAmount + deliveryFeeAmount + serviceFeeAmount;

  return {
    subtotalAmount,
    deliveryFeeAmount,
    serviceFeeAmount,
    totalAmount,
    restaurantCommissionRate: rate,
    restaurantCommissionAmount,
    restaurantAmount,
    courierAmount,
    dalleupAmount,
  };
}
