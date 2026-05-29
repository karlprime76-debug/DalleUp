import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as import("@prisma/client").RestaurantPlacementType | null;
    const activeOnly = searchParams.get("active") === "true";
    const where: import("@prisma/client").Prisma.RestaurantPlacementWhereInput = {};
    if (type) where.type = type;
    if (activeOnly) where.isActive = true;
    const placements = await prisma.restaurantPlacement.findMany({
      where,
      include: { restaurant: { select: { id: true, name: true, slug: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ placements });
  } catch (error) {
    console.error("[DalleUp] GET /api/admin/featured-restaurants", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
