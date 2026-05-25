import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sendPushNotification } from "@/lib/notifications/push";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(input: CreateNotificationInput) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
      },
    });
    await sendPushNotification(input.userId, {
      title: input.title,
      message: input.message,
      type: input.type,
      url: input.metadata?.url as string | undefined,
    });
    return notification;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[notification] create failed", error);
    return null;
  }
}

export async function getNotifications(userId: string, opts?: { unreadOnly?: boolean; limit?: number; page?: number }) {
  const limit = Math.min(50, Math.max(1, opts?.limit ?? 20));
  const page = Math.max(1, opts?.page ?? 1);
  const where = { userId, ...(opts?.unreadOnly ? { read: false } : {}) };
  try {
    const [items, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.notification.count({ where: { userId } }),
    ]);
    return { items, unreadCount, totalCount, page, limit };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[notification] get failed", error);
    return { items: [], unreadCount: 0, totalCount: 0, page, limit };
  }
}

export async function markNotificationsAsRead(userId: string, ids?: string[]) {
  try {
    const where = ids?.length ? { userId, id: { in: ids } } : { userId, read: false };
    await prisma.notification.updateMany({ where, data: { read: true } });
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[notification] mark read failed", error);
    return false;
  }
}

export async function deleteNotification(userId: string, id: string) {
  try {
    await prisma.notification.deleteMany({ where: { userId, id } });
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[notification] delete failed", error);
    return false;
  }
}
