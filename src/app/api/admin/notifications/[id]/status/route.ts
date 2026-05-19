import { BillingNotificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/data/admin-audit";
import { prisma } from "@/lib/db/prisma";

const statuses: BillingNotificationStatus[] = [BillingNotificationStatus.SENT, BillingNotificationStatus.FAILED, BillingNotificationStatus.PENDING];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi();
    if ("response" in admin) return admin.response;
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "") as BillingNotificationStatus;
    if (!statuses.includes(status)) return NextResponse.json({ message: "Statut notification invalide." }, { status: 400 });
    const notification = await prisma.billingNotification.findUnique({ where: { id } });
    if (!notification) return NextResponse.json({ message: "Notification introuvable." }, { status: 404 });
    const updated = await prisma.billingNotification.update({ where: { id: notification.id }, data: { status, sentAt: status === "SENT" ? new Date() : notification.sentAt } });
    await logAdminAction({ adminId: admin.session.user.id, action: "BILLING_NOTIFICATION_STATUS_UPDATED", targetType: "BILLING_NOTIFICATION", targetId: updated.id, targetLabel: updated.title, metadata: { previousStatus: notification.status, status } });
    return NextResponse.json({ notification: updated });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp admin notifications fallback] status", error);
    return NextResponse.json({ message: "Statut notification indisponible." }, { status: 503 });
  }
}