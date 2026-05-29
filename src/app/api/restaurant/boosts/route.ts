import { NextResponse } from "next/server";
import { requireRestaurantApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getPlanFeatures, getActiveRestaurantSubscription } from "@/lib/restaurant/subscriptions";

export async function GET() {
  try {
    const result = await requireRestaurantApi();
    if ("response" in result) return result.response;
    const { restaurant } = result;

    const placements = await prisma.restaurantPlacement.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ placements });
  } catch (error) {
    console.error("[DalleUp] GET /api/restaurant/boosts", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireRestaurantApi();
    if ("response" in result) return result.response;
    const { restaurant } = result;

    const sub = await getActiveRestaurantSubscription(restaurant.id);
    const features = getPlanFeatures(sub?.plan ?? null);
    if (!features.allowSponsoredPlacement) {
      return NextResponse.json({ message: "Les mises en avant ne sont pas disponibles avec votre plan actuel." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const type = body.type === "HOME_FEATURED" || body.type === "SPONSORED_LISTING" || body.type === "SEARCH_PRIORITY" || body.type === "TRENDING_DISHES" ? body.type : "SPONSORED_LISTING";
    const durationDays = typeof body.durationDays === "number" ? Math.max(1, body.durationDays) : 7;

    const now = new Date();
    const endsAt = new Date();
    endsAt.setDate(now.getDate() + durationDays);

    const placement = await prisma.restaurantPlacement.create({
      data: {
        restaurantId: restaurant.id,
        subscriptionId: sub?.id ?? null,
        type,
        startsAt: now,
        endsAt,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, placement });
  } catch (error) {
    console.error("[DalleUp] POST /api/restaurant/boosts", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
