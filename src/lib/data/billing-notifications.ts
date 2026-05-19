import type { BillingNotificationStatus, BillingNotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type BillingNotificationItem = { id: string; user: string; restaurant: string; type: string; status: string; title: string; message: string; metadata: string; createdAt: string; sentAt: string; isMock?: boolean };
export type BillingNotificationInput = { userId?: string; restaurantId?: string; type: BillingNotificationType; status?: BillingNotificationStatus; title: string; message: string; metadata?: Prisma.InputJsonValue };
export type BillingNotificationFilters = { status?: string; type?: string };

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp notification fallback] ${source}`, error);
}

function mockBillingNotifications(filters: BillingNotificationFilters = {}): BillingNotificationItem[] {
  const notifications = [
    { id: "mock-notif-1", user: "Admin Démo", restaurant: "Restaurant démo", type: "INVOICE_GENERATED", status: "PENDING", title: "Facture générée", message: "Une facture démo est prête à être envoyée.", metadata: '{"source":"mock"}', createdAt: "Démo", sentAt: "Non envoyé", isMock: true },
    { id: "mock-notif-2", user: "Admin Démo", restaurant: "Restaurant démo", type: "INVOICE_PAID", status: "SENT", title: "Facture payée", message: "Paiement simulé confirmé.", metadata: '{"source":"mock"}', createdAt: "Démo", sentAt: "Démo", isMock: true }
  ];
  return notifications.filter((notification) => (!filters.status || filters.status === "ALL" || notification.status === filters.status) && (!filters.type || filters.type === "ALL" || notification.type === filters.type));
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
    if (!notifications.length) return mockBillingNotifications(filters);
    return notifications.map((notification) => ({ id: notification.id, user: notification.user?.name ?? "—", restaurant: notification.restaurant?.name ?? "—", type: notification.type, status: notification.status, title: notification.title, message: notification.message, metadata: notification.metadata ? JSON.stringify(notification.metadata) : "—", createdAt: notification.createdAt.toLocaleString("fr-FR"), sentAt: notification.sentAt?.toLocaleString("fr-FR") ?? "Non envoyé" }));
  } catch (error) {
    warnFallback("getBillingNotifications", error);
    return mockBillingNotifications(filters);
  }
}
