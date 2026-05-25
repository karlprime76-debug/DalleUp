import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { createNotification } from "@/lib/data/notifications";
import { prisma } from "@/lib/db/prisma";

const allowedStatuses = ["PENDING", "ACCEPTED", "PREPARING", "READY", "DRIVER_ASSIGNED", "PICKED_UP", "ON_THE_WAY", "DELIVERED", "CANCELLED"] as const;
const allowedRoles = ["ADMIN", "RESTAURANT"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role || !allowedRoles.includes(session.user.role)) return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "");
    if (!allowedStatuses.includes(status as typeof allowedStatuses[number])) return NextResponse.json({ message: "Statut invalide." }, { status: 400 });
    const existing = await prisma.order.findFirst({ where: { OR: [{ id }, { orderNumber: id }] }, include: { restaurant: true } });
    if (!existing) return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });
    if (session.user.role === "RESTAURANT" && existing.restaurant.ownerId !== session.user.id) return NextResponse.json({ message: "Commande non autorisée." }, { status: 403 });
    const order = await prisma.order.update({ where: { id: existing.id }, data: { status: status as typeof allowedStatuses[number] }, include: { restaurant: true } });

    const statusLabels: Record<string, string> = {
      ACCEPTED: "Commande acceptée",
      PREPARING: "En préparation",
      READY: "Prête à être récupérée",
      DRIVER_ASSIGNED: "Livreur assigné",
      CANCELLED: "Commande annulée",
    };
    const label = statusLabels[status];
    if (label) {
      await createNotification({
        userId: existing.customerId,
        type: "ORDER_STATUS",
        title: label,
        message: `Votre commande ${existing.orderNumber} chez ${existing.restaurant.name} est ${label.toLowerCase()}.`,
        metadata: { orderId: existing.id, orderNumber: existing.orderNumber, status },
      });
    }

    return NextResponse.json({ order });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp ops fallback] PATCH order status", error);
    return NextResponse.json({ message: "Modification statut indisponible." }, { status: 503 });
  }
}
