export type OrderSplitInput = {
  subtotalAmount: number;
  deliveryFeeAmount: number;
  serviceFeeAmount: number;
  restaurantCommissionRate?: number; // ex: 15 pour 15%
  deliveryCommissionRate?: number;     // ex: 10 pour 10%
};

export type OrderSplitResult = {
  subtotalAmount: number;
  deliveryFeeAmount: number;
  serviceFeeAmount: number;
  totalAmount: number;
  restaurantCommissionRate: number;
  restaurantCommissionAmount: number;
  deliveryCommissionRate: number;
  deliveryCommissionAmount: number;
  restaurantAmount: number;
  courierAmount: number;
  dalleupAmount: number;
};

export function calculateOrderSplit({
  subtotalAmount,
  deliveryFeeAmount,
  serviceFeeAmount,
  restaurantCommissionRate = 15,
  deliveryCommissionRate = 10,
}: OrderSplitInput): OrderSplitResult {
  const restRate = Math.max(0, Math.min(100, restaurantCommissionRate));
  const delRate = Math.max(0, Math.min(100, deliveryCommissionRate));

  const restaurantCommissionAmount = Math.round((subtotalAmount * restRate) / 100);
  const deliveryCommissionAmount = Math.round((deliveryFeeAmount * delRate) / 100);

  const restaurantAmount = subtotalAmount - restaurantCommissionAmount;
  const courierAmount = deliveryFeeAmount - deliveryCommissionAmount;
  const dalleupAmount = restaurantCommissionAmount + deliveryCommissionAmount + serviceFeeAmount;
  const totalAmount = subtotalAmount + deliveryFeeAmount + serviceFeeAmount;

  return {
    subtotalAmount,
    deliveryFeeAmount,
    serviceFeeAmount,
    totalAmount,
    restaurantCommissionRate: restRate,
    restaurantCommissionAmount,
    deliveryCommissionRate: delRate,
    deliveryCommissionAmount,
    restaurantAmount,
    courierAmount,
    dalleupAmount,
  };
}
