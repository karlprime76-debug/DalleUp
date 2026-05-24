import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        restaurant: { select: { id: true, name: true, address: true, ownerId: true } },
        address: true,
        items: { include: { menuItem: true } },
        delivery: { include: { driver: { select: { id: true, name: true, phone: true } } } },
        payment: true,
      },
    });
    if (!order) return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });

    const isClient = order.customerId === session.user.id;
    const isRestaurantOwner = order.restaurant.ownerId === session.user.id;
    const isDriver = order.delivery?.driverId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isClient && !isRestaurantOwner && !isDriver && !isAdmin) {
      return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp ops] GET order detail", error);
    return NextResponse.json({ message: "Service temporairement indisponible." }, { status: 503 });
  }
}
