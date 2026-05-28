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

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { order: { select: { status: true } } }
    });

    if (!delivery) {
      return NextResponse.json({ message: "Livraison introuvable ou non disponible." }, { status: 404 });
    }
    if (delivery.driverId && delivery.driverId !== session.user.id) {
      return NextResponse.json({ message: "Cette livraison a déjà été acceptée." }, { status: 409 });
    }
    if (delivery.driverId === session.user.id) {
      return NextResponse.json({ message: "Vous avez déjà accepté cette livraison." }, { status: 409 });
    }
    if (delivery.status !== "PENDING") {
      return NextResponse.json({ message: "Livraison introuvable ou non disponible." }, { status: 404 });
    }

    const updatedDelivery = await prisma.$transaction(async (tx) => {
      const accepted = await tx.delivery.updateMany({
        where: { id: delivery.id, status: "PENDING", driverId: null },
        data: { driverId: session.user.id, status: "ASSIGNED" }
      });
      if (accepted.count !== 1) throw new Error("DELIVERY_ALREADY_ACCEPTED");
      await tx.user.update({ where: { id: session.user.id }, data: { driverStatus: "ON_DELIVERY" } });
      await tx.order.update({ where: { id: delivery.orderId }, data: { status: "DRIVER_ASSIGNED" } });
      return tx.delivery.findUniqueOrThrow({ where: { id: delivery.id } });
    });

    return NextResponse.json({ delivery: updatedDelivery, message: "Livraison acceptée." });
  } catch (error) {
    if (error instanceof Error && error.message === "DELIVERY_ALREADY_ACCEPTED") {
      return NextResponse.json({ message: "Cette livraison a déjà été acceptée." }, { status: 409 });
    }
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp] POST accept delivery", error);
    return NextResponse.json({ message: "Impossible d'accepter la livraison." }, { status: 503 });
  }
}
