import type { AdminAuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type AdminAuditLogItem = { id: string; admin: string; action: string; targetType: string; targetId: string; targetLabel: string; metadata: string; createdAt: string; isMock?: boolean };

export type AdminAuditInput = { adminId: string; action: AdminAuditAction; targetType: string; targetId?: string; targetLabel?: string; metadata?: Prisma.InputJsonValue };

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp audit fallback] ${source}`, error);
}

export async function logAdminAction(input: AdminAuditInput) {
  try {
    await prisma.adminAuditLog.create({ data: input });
  } catch (error) {
    warnFallback("logAdminAction", error);
  }
}

export async function getAdminAuditLogs(page?: number, limit?: number): Promise<AdminAuditLogItem[]> {
  try {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 50));
    const logs = await prisma.adminAuditLog.findMany({ include: { admin: true }, orderBy: { createdAt: "desc" }, skip: (safePage - 1) * safeLimit, take: safeLimit });
    if (!logs.length) return [];
    return logs.map((log) => ({ id: log.id, admin: log.admin.name, action: log.action, targetType: log.targetType, targetId: log.targetId ?? "—", targetLabel: log.targetLabel ?? "—", metadata: log.metadata ? JSON.stringify(log.metadata) : "—", createdAt: log.createdAt.toLocaleString("fr-FR") }));
  } catch (error) {
    warnFallback("getAdminAuditLogs", error);
    return [];
  }
}
