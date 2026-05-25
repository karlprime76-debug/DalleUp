import { prisma } from "@/lib/db/prisma";

export type AdminComplianceAction = { id: string; action: string; actor: string; target: string; createdAt: string; isMock?: boolean };
export type AdminComplianceIssue = { id: string; title: string; detail: string; severity: "low" | "medium" | "high"; createdAt: string; isMock?: boolean };
export type AdminComplianceData = { auditCount: number; sensitiveActions7d: number; financialExports: number; notificationExports: number; pendingNotifications: number; failedNotifications: number; recentActions: AdminComplianceAction[]; issues: AdminComplianceIssue[]; isMock?: boolean };

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp compliance fallback] ${source}`, error);
}

function emptyComplianceData(): AdminComplianceData {
  return { auditCount: 0, sensitiveActions7d: 0, financialExports: 0, notificationExports: 0, pendingNotifications: 0, failedNotifications: 0, recentActions: [], issues: [] };
}

export async function getAdminComplianceData(): Promise<AdminComplianceData> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const [auditLogs, pendingNotifications, failedNotifications] = await Promise.all([
      prisma.adminAuditLog.findMany({ include: { admin: true }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.billingNotification.findMany({ where: { status: "PENDING" }, include: { restaurant: true }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.billingNotification.findMany({ where: { status: "FAILED" }, include: { restaurant: true }, orderBy: { createdAt: "desc" }, take: 10 })
    ]);
    if (!auditLogs.length && !pendingNotifications.length && !failedNotifications.length) return emptyComplianceData();
    const sensitiveActions7d = auditLogs.filter((log) => log.createdAt >= since).length;
    const financialExports = auditLogs.filter((log) => log.action === "FINANCIAL_REPORT_EXPORTED").length;
    const notificationExports = auditLogs.filter((log) => log.action === "BILLING_NOTIFICATIONS_EXPORTED").length;
    const recentActions = auditLogs.slice(0, 8).map((log) => ({ id: log.id, action: log.action, actor: log.admin.name, target: log.targetLabel ?? log.targetType, createdAt: log.createdAt.toLocaleString("fr-FR") }));
    const issues = failedNotifications.map((notification) => ({ id: notification.id, title: "Notification échouée", detail: `${notification.title} · ${notification.restaurant?.name ?? "Restaurant inconnu"}`, severity: "high" as const, createdAt: notification.createdAt.toLocaleString("fr-FR") }));
    return { auditCount: auditLogs.length, sensitiveActions7d, financialExports, notificationExports, pendingNotifications: pendingNotifications.length, failedNotifications: failedNotifications.length, recentActions, issues };
  } catch (error) {
    warnFallback("getAdminComplianceData", error);
    return emptyComplianceData();
  }
}
