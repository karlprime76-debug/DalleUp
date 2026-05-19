import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const allowedStatuses = ["PICKED_UP", "ON_THE_WAY", "DELIVERED", "FAILED"] as const;

function orderStatusForDelivery(status: typeof allowedStatuses[number]) {
  if (status === "PICKED_UP") return "PICKED_UP";
  if (status === "ON_THE_WAY") return "ON_THE_WAY";
  if (status === "DELIVERED") return "DELIVERED";
  return "CANCELLED";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "DELIVERY_DRIVER") return NextResponse.json({ message: "Accès livreur requis." }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "");
    if (!allowedStatuses.includes(status as typeof allowedStatuses[number])) return NextResponse.json({ message: "Statut livraison invalide." }, { status: 400 });
    const delivery = await prisma.delivery.findFirst({ where: { order: { OR: [{ id }, { orderNumber: id }] }, driverId: session.user.id }, include: { order: true } });
    if (!delivery) return NextResponse.json({ message: "Livraison introuvable ou non assignée." }, { status: 404 });
    const nextStatus = status as typeof allowedStatuses[number];
    const updated = await prisma.delivery.update({ where: { id: delivery.id }, data: { status: nextStatus, pickedAt: nextStatus === "PICKED_UP" ? new Date() : delivery.pickedAt, deliveredAt: nextStatus === "DELIVERED" ? new Date() : delivery.deliveredAt }, include: { order: true } });
    await prisma.order.update({ where: { id: delivery.orderId }, data: { status: orderStatusForDelivery(nextStatus) } });
    if (nextStatus === "DELIVERED" || nextStatus === "FAILED") await prisma.user.update({ where: { id: session.user.id }, data: { driverStatus: "AVAILABLE" } });
    return NextResponse.json({ delivery: updated });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp ops fallback] delivery status", error);
    return NextResponse.json({ message: "Mise à jour livraison indisponible." }, { status: 503 });
  }
}
