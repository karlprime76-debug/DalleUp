import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/data/admin-audit";
import { getBillingNotifications } from "@/lib/data/billing-notifications";

type CsvRow = Record<string, string | number>;

const statuses = ["ALL", "PENDING", "SENT", "FAILED"];
const types = ["ALL", "SUBSCRIPTION_UPDATED", "INVOICE_GENERATED", "INVOICE_PAID", "INVOICE_STATUS_UPDATED"];

function csvValue(value: string | number) {
  const text = String(value);
  return text.includes(",") || text.includes('"') || text.includes("\n") ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers: string[], rows: CsvRow[]) {
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvValue(row[header] ?? "")).join(","))].join("\n");
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const type = searchParams.get("type") || "ALL";
    if (!statuses.includes(status)) return NextResponse.json({ message: "Statut notification invalide." }, { status: 400 });
    if (!types.includes(type)) return NextResponse.json({ message: "Type notification invalide." }, { status: 400 });
    const notifications = await getBillingNotifications({ status, type });
    const headers = ["id", "user", "restaurant", "type", "status", "title", "message", "createdAt", "sentAt"];
    const rows = notifications.map((notification) => ({ id: notification.id, user: notification.user, restaurant: notification.restaurant, type: notification.type, status: notification.status, title: notification.title, message: notification.message, createdAt: notification.createdAt, sentAt: notification.sentAt }));
    const csv = toCsv(headers, rows);
    await logAdminAction({ adminId: admin.session.user.id, action: "BILLING_NOTIFICATIONS_EXPORTED", targetType: "BILLING_NOTIFICATION", targetId: "export", targetLabel: "Export notifications billing", metadata: { status, type, rows: rows.length } });
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv;charset=utf-8", "Content-Disposition": 'attachment; filename="dalleup-billing-notifications.csv"' } });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp admin notifications fallback] export", error);
    return NextResponse.json({ message: "Export notifications indisponible." }, { status: 503 });
  }
}
