import { NextResponse } from "next/server";
import { requireRestaurantApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getPlanFeatures } from "@/lib/restaurant/subscriptions";

export async function GET() {
  try {
    const result = await requireRestaurantApi();
    if ("response" in result) return result.response;
    const { restaurant } = result;

    const subscription = await prisma.restaurantSubscription.findFirst({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "desc" },
      include: { plan: true, payment: true },
    });

    const plan = subscription?.plan ?? null;
    const features = getPlanFeatures(plan);

    return NextResponse.json({
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            startsAt: subscription.startsAt,
            endsAt: subscription.endsAt,
            autoRenew: subscription.autoRenew,
            plan: plan
              ? {
                  id: plan.id,
                  code: plan.code,
                  name: plan.name,
                  description: plan.description,
                  price: plan.price,
                  durationDays: plan.durationDays,
                  commissionRate: plan.commissionRate,
                }
              : null,
            payment: subscription.payment
              ? {
                  status: subscription.payment.status,
                  amount: subscription.payment.amount,
                  paidAt: subscription.payment.paidAt,
                }
              : null,
          }
        : null,
      features,
      currentPlanCode: restaurant.currentPlanCode ?? "FREE",
      isSponsored: restaurant.isSponsored,
      sponsoredUntil: restaurant.sponsoredUntil,
      isFeatured: restaurant.isFeatured,
      featuredUntil: restaurant.featuredUntil,
      priorityScore: restaurant.priorityScore,
    });
  } catch (error) {
    console.error("[DalleUp] GET /api/restaurant/subscription", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
