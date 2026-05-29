import { NextResponse } from "next/server";
import { requireRestaurantApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  try {
    const result = await requireRestaurantApi();
    if ("response" in result) return result.response;
    const { restaurant } = result;

    const subscription = await prisma.restaurantSubscription.findFirst({
      where: { restaurantId: restaurant.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return NextResponse.json({ message: "Aucun abonnement actif." }, { status: 404 });
    }

    await prisma.restaurantSubscription.update({
      where: { id: subscription.id },
      data: { autoRenew: false },
    });

    return NextResponse.json({ ok: true, message: "Renouvellement désactivé. Votre abonnement reste actif jusqu'à expiration." });
  } catch (error) {
    console.error("[DalleUp] POST /api/restaurant/subscription/cancel", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
