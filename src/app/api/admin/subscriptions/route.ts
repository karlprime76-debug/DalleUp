import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const where: import("@prisma/client").Prisma.RestaurantSubscriptionWhereInput = {};
    if (status) where.status = status as import("@prisma/client").SubscriptionStatus;
    const subscriptions = await prisma.restaurantSubscription.findMany({
      where,
      include: { restaurant: { select: { id: true, name: true, slug: true } }, plan: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("[DalleUp] GET /api/admin/subscriptions", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
