import { NextResponse } from "next/server";
import { requireApprovedDriverApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

const allowedDriverStatuses = ["PICKED_UP", "ON_THE_WAY", "DELIVERED"] as const;
const allowedTransitions: Record<string, typeof allowedDriverStatuses[number][]> = {
  ASSIGNED: ["PICKED_UP"],
  PICKED_UP: ["ON_THE_WAY"],
  ON_THE_WAY: ["DELIVERED"],
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await requireApprovedDriverApi();
    if ("response" in result) return result.response;
    const { session } = result;

    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "");

    if (!allowedDriverStatuses.includes(status as typeof allowedDriverStatuses[number])) {
      return NextResponse.json({ message: "Statut invalide." }, { status: 400 });
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id, driverId: session.user.id },
      include: { order: true }
    });

    if (!delivery) {
      return NextResponse.json({ message: "Livraison introuvable ou non autorisée." }, { status: 404 });
    }
    if (!allowedTransitions[delivery.status]?.includes(status as typeof allowedDriverStatuses[number])) {
      return NextResponse.json({ message: "Transition de statut non autorisée." }, { status: 409 });
    }

    const updateData: { status: typeof allowedDriverStatuses[number]; pickedAt?: Date; deliveredAt?: Date } = { status: status as typeof allowedDriverStatuses[number] };
    if (status === "PICKED_UP") updateData.pickedAt = new Date();
    if (status === "DELIVERED") updateData.deliveredAt = new Date();

    const updatedDelivery = await prisma.$transaction(async (tx) => {
      const updated = await tx.delivery.update({ where: { id: delivery.id }, data: updateData });
      await tx.order.update({ where: { id: delivery.orderId }, data: { status: status === "DELIVERED" ? "DELIVERED" : status as typeof allowedDriverStatuses[number] } });
      if (status === "DELIVERED") await tx.user.update({ where: { id: session.user.id }, data: { driverStatus: "AVAILABLE" } });
      return updated;
    });

    return NextResponse.json({ delivery: updatedDelivery });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp] PATCH delivery status", error);
    return NextResponse.json({ message: "Impossible de modifier le statut." }, { status: 503 });
  }
}
