import { NextResponse } from "next/server";
import { requireRestaurantApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getPlanFeatures } from "@/lib/restaurant/subscriptions";

export async function GET() {
  try {
    const result = await requireRestaurantApi();
    if ("response" in result) return result.response;
    const { restaurant } = result;
    const plans = await prisma.billingPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
    const subscription = await prisma.restaurantSubscription.findFirst({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });
    const currentFeatures = getPlanFeatures(subscription?.plan ?? null);
    return NextResponse.json({
      plans: plans.map((plan) => {
        const pf = getPlanFeatures(plan);
        return {
          ...plan,
          features: pf,
          isCurrent: subscription?.planId === plan.id,
        };
      }),
      currentSubscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            startsAt: subscription.startsAt,
            endsAt: subscription.endsAt,
            autoRenew: subscription.autoRenew,
            plan: subscription.plan ? { code: subscription.plan.code, name: subscription.plan.name } : null,
          }
        : null,
      currentFeatures,
    });
  } catch (error) {
    console.error("[DalleUp] GET /api/restaurant/plans", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
