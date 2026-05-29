import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Non connecté." }, { status: 401 });

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { delivery: true, restaurant: true, payment: true, orderSplit: true },
    });
    if (!order) return NextResponse.json({ ok: false, error: "Commande introuvable." }, { status: 404 });

    const isDriver = order.delivery?.driverId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isDriver && !isAdmin) return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });

    if (order.status !== "PICKED_UP" && order.status !== "ON_THE_WAY") {
      return NextResponse.json({ ok: false, error: "La commande doit être en cours de livraison." }, { status: 400 });
    }

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: "DELIVERED", deliveredAt: new Date(), updatedAt: new Date() },
      }),
      prisma.delivery.update({
        where: { orderId: order.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      }),
      prisma.orderSplit.update({
        where: { orderId: order.id },
        data: { status: "READY_TO_PAY" },
      }),
    ]);

    return NextResponse.json({ ok: true, order: updatedOrder, message: "Commande livrée. Reversements en attente." });
  } catch (error) {
    console.error("[DalleUp mark-delivered] error", error);
    return NextResponse.json({ ok: false, error: "Indisponible." }, { status: 503 });
  }
}
