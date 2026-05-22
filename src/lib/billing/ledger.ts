import { prisma } from "@/lib/db/prisma";
import { calculateOrderSplit } from "./commissions";

export async function ensureWallet(userId: string) {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wallet.create({
    data: { userId, balance: 0, pendingBalance: 0 },
  });
}

export async function creditOrderPayment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: true, delivery: true },
  });
  if (!order) throw new Error("Order not found");
  if (!order.restaurant) throw new Error("Order has no restaurant");

  const existingRev = await prisma.platformRevenue.findUnique({
    where: { orderId: order.id },
  });
  if (existingRev) {
    return { skipped: true, reason: "PlatformRevenue already exists", orderId };
  }

  const split = calculateOrderSplit({
    foodSubtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
  });

  const restaurantOwnerId = order.restaurant.ownerId;
  const restaurantWallet = await ensureWallet(restaurantOwnerId);

  const operations = [
    prisma.platformRevenue.create({
      data: {
        orderId: order.id,
        foodSubtotal: split.foodSubtotal,
        deliveryFee: split.deliveryFee,
        restaurantCommission: split.restaurantCommission,
        deliveryCommission: split.deliveryCommission,
        restaurantPayout: split.restaurantPayout,
        driverPayout: split.driverPayout,
        totalPlatformRevenue: split.platformRevenue,
      },
    }),
    prisma.ledgerEntry.create({
      data: {
        walletId: restaurantWallet.id,
        orderId: order.id,
        type: "RESTAURANT_PAYOUT",
        amount: split.restaurantPayout,
        direction: "CREDIT",
        status: "SETTLED",
        description: `Restaurant payout for order ${order.orderNumber ?? order.id}`,
      },
    }),
    prisma.wallet.update({
      where: { id: restaurantWallet.id },
      data: { balance: { increment: split.restaurantPayout } },
    }),
  ];

  let driverPayoutDone = false;
  if (order.delivery?.driverId) {
    const driverWallet = await ensureWallet(order.delivery.driverId);
    operations.push(
      prisma.ledgerEntry.create({
        data: {
          walletId: driverWallet.id,
          orderId: order.id,
          type: "DRIVER_PAYOUT",
          amount: split.driverPayout,
          direction: "CREDIT",
          status: "SETTLED",
          description: `Driver payout for order ${order.orderNumber ?? order.id}`,
        },
      }),
      prisma.wallet.update({
        where: { id: driverWallet.id },
        data: { balance: { increment: split.driverPayout } },
      })
    );
    driverPayoutDone = true;
  }

  const [revenue] = await prisma.$transaction(operations as never);

  return {
    skipped: false,
    orderId,
    restaurantPayout: split.restaurantPayout,
    driverPayout: driverPayoutDone ? split.driverPayout : 0,
    driverPayoutPending: !driverPayoutDone,
    platformRevenue: split.platformRevenue,
    revenueId: (revenue as { id: string }).id,
  };
}

export async function creditOrderDelivery(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: true, delivery: true, payment: true },
  });
  if (!order) throw new Error("Order not found");
  if (!order.restaurant) throw new Error("Order has no restaurant");
  if (!order.delivery) throw new Error("Order has no delivery");
  if (!order.delivery.driverId) throw new Error("Delivery has no driver");

  const existingRev = await prisma.platformRevenue.findUnique({
    where: { orderId: order.id },
  });
  if (existingRev) {
    // Check if driver was already credited (e.g., by creditOrderPayment)
    const driverEntry = await prisma.ledgerEntry.findFirst({
      where: { orderId: order.id, type: "DRIVER_PAYOUT" },
    });
    if (driverEntry) {
      return { skipped: true, reason: "Driver already credited", orderId };
    }
    // Revenue exists but driver not yet credited — credit driver only
    const split = calculateOrderSplit({
      foodSubtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
    });
    const driverWallet = await ensureWallet(order.delivery.driverId);
    await prisma.$transaction([
      prisma.ledgerEntry.create({
        data: {
          walletId: driverWallet.id,
          orderId: order.id,
          type: "DRIVER_PAYOUT",
          amount: split.driverPayout,
          direction: "CREDIT",
          status: "SETTLED",
          description: `Driver payout for order ${order.orderNumber ?? order.id}`,
        },
      }),
      prisma.wallet.update({
        where: { id: driverWallet.id },
        data: { balance: { increment: split.driverPayout } },
      }),
    ]);
    return {
      skipped: false,
      orderId,
      restaurantPayout: 0,
      driverPayout: split.driverPayout,
      platformRevenue: split.platformRevenue,
      revenueId: existingRev.id,
    };
  }

  const split = calculateOrderSplit({
    foodSubtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
  });

  const restaurantOwnerId = order.restaurant.ownerId;
  const driverId = order.delivery.driverId;

  const [restaurantWallet, driverWallet] = await Promise.all([
    ensureWallet(restaurantOwnerId),
    ensureWallet(driverId),
  ]);

  const [revenue] = await prisma.$transaction([
    prisma.platformRevenue.create({
      data: {
        orderId: order.id,
        foodSubtotal: split.foodSubtotal,
        deliveryFee: split.deliveryFee,
        restaurantCommission: split.restaurantCommission,
        deliveryCommission: split.deliveryCommission,
        restaurantPayout: split.restaurantPayout,
        driverPayout: split.driverPayout,
        totalPlatformRevenue: split.platformRevenue,
      },
    }),
    prisma.ledgerEntry.create({
      data: {
        walletId: restaurantWallet.id,
        orderId: order.id,
        type: "RESTAURANT_PAYOUT",
        amount: split.restaurantPayout,
        direction: "CREDIT",
        status: "SETTLED",
        description: `Restaurant payout for order ${order.orderNumber ?? order.id}`,
      },
    }),
    prisma.ledgerEntry.create({
      data: {
        walletId: driverWallet.id,
        orderId: order.id,
        type: "DRIVER_PAYOUT",
        amount: split.driverPayout,
        direction: "CREDIT",
        status: "SETTLED",
        description: `Driver payout for order ${order.orderNumber ?? order.id}`,
      },
    }),
    prisma.wallet.update({
      where: { id: restaurantWallet.id },
      data: { balance: { increment: split.restaurantPayout } },
    }),
    prisma.wallet.update({
      where: { id: driverWallet.id },
      data: { balance: { increment: split.driverPayout } },
    }),
  ]);

  return {
    skipped: false,
    orderId,
    restaurantPayout: split.restaurantPayout,
    driverPayout: split.driverPayout,
    platformRevenue: split.platformRevenue,
    revenueId: revenue.id,
  };
}
