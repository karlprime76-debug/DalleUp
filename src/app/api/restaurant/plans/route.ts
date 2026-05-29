import { NextResponse } from "next/server";
import { requireRestaurantApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

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
    });
    return NextResponse.json({ plans, currentSubscription: subscription });
  } catch (error) {
    console.error("[DalleUp] GET /api/restaurant/plans", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
