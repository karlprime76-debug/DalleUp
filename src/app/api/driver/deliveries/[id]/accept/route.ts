import { NextResponse } from "next/server";
import { requireApprovedDriverApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await requireApprovedDriverApi();
    if ("response" in result) return result.response;
    const { session, user } = result;

    if (user.driverStatus !== "AVAILABLE") {
      return NextResponse.json({ message: "Vous devez être disponible pour accepter une livraison." }, { status: 403 });
    }

    const { id } = await params;

    const delivery = await prisma.delivery.findFirst({
      where: { id, status: "PENDING", driverId: null },
      include: { order: { select: { status: true } } }
    });

    if (!delivery) {
      const existing = await prisma.delivery.findUnique({ where: { id }, select: { driverId: true, status: true } });
      if (existing?.driverId && existing.driverId !== session.user.id) {
        return NextResponse.json({ message: "Cette livraison a déjà été acceptée." }, { status: 409 });
      }
      if (existing?.driverId === session.user.id) {
        return NextResponse.json({ message: "Vous avez déjà accepté cette livraison." }, { status: 409 });
      }
      return NextResponse.json({ message: "Livraison introuvable ou non disponible." }, { status: 404 });
    }

    const [updatedDelivery] = await prisma.$transaction([
      prisma.delivery.update({
        where: { id: delivery.id },
        data: { driverId: session.user.id, status: "ASSIGNED" }
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { driverStatus: "ON_DELIVERY" }
      }),
      prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: "DRIVER_ASSIGNED" }
      })
    ]);

    return NextResponse.json({ delivery: updatedDelivery, message: "Livraison acceptée." });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp] POST accept delivery", error);
    return NextResponse.json({ message: "Impossible d'accepter la livraison." }, { status: 503 });
  }
}
