import { NextResponse } from "next/server";
import { DriverStatus } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/data/admin-audit";
import { createNotification } from "@/lib/data/notifications";
import { prisma } from "@/lib/db/prisma";

const allowedStatuses = ["PENDING", "AVAILABLE", "OFFLINE", "ON_DELIVERY", "SUSPENDED"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "");
    if (!allowedStatuses.includes(status as typeof allowedStatuses[number])) return NextResponse.json({ message: "Statut livreur invalide." }, { status: 400 });
    const driver = await prisma.user.findFirst({ where: { id, role: "DELIVERY_DRIVER" } });
    if (!driver) return NextResponse.json({ message: "Livreur introuvable." }, { status: 404 });
    const updated = await prisma.user.update({ where: { id: driver.id }, data: { driverStatus: status as DriverStatus } });
    await logAdminAction({ adminId: admin.session.user.id, action: "DRIVER_STATUS_UPDATED", targetType: "DRIVER", targetId: updated.id, targetLabel: updated.name, metadata: { previousStatus: driver.driverStatus, status } });

    const notifType = status === "AVAILABLE" ? "VALIDATION_APPROVED" : status === "SUSPENDED" ? "VALIDATION_REJECTED" : "SYSTEM";
    const notifTitle = status === "AVAILABLE" ? "Profil livreur approuvé" : status === "SUSPENDED" ? "Profil suspendu" : "Mise à jour du statut";
    const notifMessage = status === "AVAILABLE" ? "Votre profil livreur a été approuvé. Vous pouvez maintenant recevoir des livraisons." : status === "SUSPENDED" ? "Votre profil livreur a été suspendu. Contactez le support." : `Votre statut livreur est passé à ${status}.`;
    await createNotification({ userId: updated.id, type: notifType, title: notifTitle, message: notifMessage, metadata: { driverId: updated.id, status } });

    return NextResponse.json({ driver: updated });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp admin fallback] driver status", error);
    return NextResponse.json({ message: "Modification statut livreur indisponible." }, { status: 503 });
  }
}

