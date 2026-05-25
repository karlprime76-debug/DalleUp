import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/data/admin-audit";
import { createNotification } from "@/lib/data/notifications";
import { prisma } from "@/lib/db/prisma";

const allowedStatuses = ["PENDING", "APPROVED", "SUSPENDED", "CLOSED"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "");
    if (!allowedStatuses.includes(status as typeof allowedStatuses[number])) return NextResponse.json({ message: "Statut restaurant invalide." }, { status: 400 });
    const restaurant = await prisma.restaurant.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!restaurant) return NextResponse.json({ message: "Restaurant introuvable." }, { status: 404 });
    const updated = await prisma.restaurant.update({ where: { id: restaurant.id }, data: { status: status as typeof allowedStatuses[number] } });
    await logAdminAction({ adminId: admin.session.user.id, action: "RESTAURANT_STATUS_UPDATED", targetType: "RESTAURANT", targetId: updated.id, targetLabel: updated.name, metadata: { previousStatus: restaurant.status, status } });

    const notifType = status === "APPROVED" ? "VALIDATION_APPROVED" : status === "SUSPENDED" ? "VALIDATION_REJECTED" : "SYSTEM";
    const notifTitle = status === "APPROVED" ? "Restaurant approuvé" : status === "SUSPENDED" ? "Restaurant suspendu" : "Mise à jour du statut";
    const notifMessage = status === "APPROVED" ? `Votre restaurant "${updated.name}" a été approuvé. Vous pouvez maintenant recevoir des commandes.` : status === "SUSPENDED" ? `Votre restaurant "${updated.name}" a été suspendu. Contactez le support.` : `Le statut de votre restaurant "${updated.name}" est passé à ${status}.`;
    await createNotification({ userId: updated.ownerId, type: notifType, title: notifTitle, message: notifMessage, metadata: { restaurantId: updated.id, status } });

    return NextResponse.json({ restaurant: updated });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp admin fallback] restaurant status", error);
    return NextResponse.json({ message: "Modification statut restaurant indisponible." }, { status: 503 });
  }
}

