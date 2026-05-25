import type { BillingNotificationStatus, BillingNotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type BillingNotificationItem = { id: string; user: string; restaurant: string; type: string; status: string; title: string; message: string; metadata: string; createdAt: string; sentAt: string; isMock?: boolean };
export type BillingNotificationInput = { userId?: string; restaurantId?: string; type: BillingNotificationType; status?: BillingNotificationStatus; title: string; message: string; metadata?: Prisma.InputJsonValue };
export type BillingNotificationFilters = { status?: string; type?: string };

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp notification fallback] ${source}`, error);
}

export async function createBillingNotification(input: BillingNotificationInput) {
  try {
    await prisma.billingNotification.create({ data: input });
  } catch (error) {
    warnFallback("createBillingNotification", error);
  }
}

export async function getBillingNotifications(filters: BillingNotificationFilters = {}): Promise<BillingNotificationItem[]> {
  try {
    const where = { ...(filters.status && filters.status !== "ALL" ? { status: filters.status as BillingNotificationStatus } : {}), ...(filters.type && filters.type !== "ALL" ? { type: filters.type as BillingNotificationType } : {}) };
    const notifications = await prisma.billingNotification.findMany({ where, include: { user: true, restaurant: true }, orderBy: { createdAt: "desc" }, take: 50 });
    if (!notifications.length) return [];
    return notifications.map((notification) => ({ id: notification.id, user: notification.user?.name ?? "—", restaurant: notification.restaurant?.name ?? "—", type: notification.type, status: notification.status, title: notification.title, message: notification.message, metadata: notification.metadata ? JSON.stringify(notification.metadata) : "—", createdAt: notification.createdAt.toLocaleString("fr-FR"), sentAt: notification.sentAt?.toLocaleString("fr-FR") ?? "Non envoyé" }));
  } catch (error) {
    warnFallback("getBillingNotifications", error);
    return [];
  }
}
