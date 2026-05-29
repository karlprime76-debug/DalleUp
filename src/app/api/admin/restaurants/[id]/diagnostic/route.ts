import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdminApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) {
      const token = await getToken({ req: request as unknown as Parameters<typeof getToken>[0]["req"], secret: process.env.NEXTAUTH_SECRET });
      if (!token?.sub || token.role !== "ADMIN") {
        return admin.response;
      }
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        menuItems: { select: { id: true, isActive: true } },
        _count: { select: { menuItems: true, orders: true } },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ ok: false, error: "Restaurant introuvable." }, { status: 404 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: restaurant.ownerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, title: true, read: true, createdAt: true },
    });

    return NextResponse.json({
      ok: true,
      restaurantId: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      status: restaurant.status,
      ownerUserId: restaurant.ownerId,
      ownerName: restaurant.owner?.name ?? null,
      ownerEmail: restaurant.owner?.email ?? null,
      image: restaurant.image,
      address: restaurant.address,
      phone: restaurant.phone,
      deliveryFee: restaurant.deliveryFee,
      minDelayMin: restaurant.minDelayMin,
      maxDelayMin: restaurant.maxDelayMin,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
      menuItemCount: restaurant._count.menuItems,
      activeMenuItemCount: restaurant.menuItems.filter((m) => m.isActive).length,
      orderCount: restaurant._count.orders,
      recentNotifications: notifications,
    });
  } catch (error) {
    const safe = error instanceof Error ? error.message : String(error);
    console.error("[DalleUp admin restaurant diagnostic] failed", { restaurantId: id, error: safe });
    return NextResponse.json({ ok: false, error: "Diagnostic indisponible." }, { status: 503 });
  }
}
