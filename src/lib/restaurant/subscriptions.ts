import { prisma } from "@/lib/db/prisma";
import type { BillingPlan } from "@prisma/client";

export type PlanFeatures = {
  priorityScore: number;
  allowPromoCodes: boolean;
  maxActivePromoCodes: number;
  allowSponsoredPlacement: boolean;
  allowFeaturedDishes: boolean;
  allowAdvancedStats: boolean;
};

export function getPlanFeatures(plan: BillingPlan | null): PlanFeatures {
  return {
    priorityScore: plan?.priorityScore ?? 0,
    allowPromoCodes: plan?.allowPromoCodes ?? false,
    maxActivePromoCodes: plan?.maxActivePromoCodes ?? 0,
    allowSponsoredPlacement: plan?.allowSponsoredPlacement ?? false,
    allowFeaturedDishes: plan?.allowFeaturedDishes ?? false,
    allowAdvancedStats: plan?.allowAdvancedStats ?? false,
  };
}

export async function getActiveRestaurantSubscription(restaurantId: string) {
  const subscription = await prisma.restaurantSubscription.findFirst({
    where: { restaurantId, status: "ACTIVE", endsAt: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
  return subscription;
}

export async function canRestaurantUseFeature(
  restaurantId: string,
  feature: keyof PlanFeatures
): Promise<boolean> {
  const sub = await getActiveRestaurantSubscription(restaurantId);
  if (!sub?.plan) return false;
  const features = getPlanFeatures(sub.plan);
  return Boolean(features[feature]);
}

export async function expireRestaurantSubscriptions() {
  const now = new Date();
  const expired = await prisma.restaurantSubscription.findMany({
    where: { status: "ACTIVE", endsAt: { lt: now } },
    include: { restaurant: true },
  });

  for (const sub of expired) {
    await prisma.$transaction([
      prisma.restaurantSubscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED" },
      }),
      prisma.restaurant.update({
        where: { id: sub.restaurantId },
        data: {
          currentPlanCode: "FREE",
          isSponsored: false,
          isFeatured: false,
          priorityScore: 0,
        },
      }),
    ]);
  }

  return { expiredCount: expired.length };
}
