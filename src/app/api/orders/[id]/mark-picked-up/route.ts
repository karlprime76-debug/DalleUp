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
      include: { delivery: true, restaurant: true },
    });
    if (!order) return NextResponse.json({ ok: false, error: "Commande introuvable." }, { status: 404 });

    const isDriver = order.delivery?.driverId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isDriver && !isAdmin) return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });

    if (!["ACCEPTED", "PREPARING", "READY", "DRIVER_ASSIGNED"].includes(order.status)) {
      return NextResponse.json({ ok: false, error: "Commande non prête pour le retrait." }, { status: 400 });
    }

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: "PICKED_UP", updatedAt: new Date() },
      }),
      prisma.delivery.update({
        where: { orderId: order.id },
        data: { status: "PICKED_UP", pickedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true, order: updatedOrder, message: "Commande récupérée." });
  } catch (error) {
    console.error("[DalleUp mark-picked-up] error", error);
    return NextResponse.json({ ok: false, error: "Indisponible." }, { status: 503 });
  }
}
