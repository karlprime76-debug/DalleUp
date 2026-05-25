import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/data/admin-audit";
import { getAdminBillingData } from "@/lib/data/admin-billing";

type CsvRow = Record<string, string | number>;

const exportTypes = ["summary", "payments", "invoices"] as const;
const datePattern = /^\d{4}-\d{2}$/;

function csvValue(value: string | number) {
  const text = String(value);
  return text.includes(",") || text.includes('"') || text.includes("\n") ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers: string[], rows: CsvRow[]) {
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvValue(row[header] ?? "")).join(","))].join("\n");
}

function getMonth(value: string) {
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return "";
  return `${match[3]}-${match[2]}`;
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const status = searchParams.get("status") || "ALL";
    const type = searchParams.get("type") || "summary";
    if (!exportTypes.includes(type as typeof exportTypes[number])) return NextResponse.json({ message: "Type d'export invalide." }, { status: 400 });
    if (from && !datePattern.test(from)) return NextResponse.json({ message: "Filtre from invalide. Format attendu YYYY-MM." }, { status: 400 });
    if (to && !datePattern.test(to)) return NextResponse.json({ message: "Filtre to invalide. Format attendu YYYY-MM." }, { status: 400 });
    if (from && to && from > to) return NextResponse.json({ message: "La période d'export est invalide." }, { status: 400 });
    const billing = await getAdminBillingData();
    let headers = ["month", "status", "orderRevenue", "orderCommission", "invoiceAmount", "invoiceCommission", "estimatedCommission"];
    let rows: CsvRow[] = billing.report.filter((row) => (!from || row.month >= from) && (!to || row.month <= to) && (status === "ALL" || row.status === status));
    if (type === "payments") {
      headers = ["orderNumber", "restaurant", "customer", "method", "status", "amount", "commission", "providerRef", "paidAt"];
      rows = billing.payments.filter((payment) => {
        const month = getMonth(payment.paidAt);
        return (status === "ALL" || payment.status === status) && (!from || !month || month >= from) && (!to || !month || month <= to);
      }).map((payment) => ({ orderNumber: payment.orderNumber, restaurant: payment.restaurant, customer: payment.customer, method: payment.method, status: payment.status, amount: payment.amount, commission: payment.commission, providerRef: payment.providerRef, paidAt: payment.paidAt }));
    }
    if (type === "invoices") {
      headers = ["number", "restaurant", "status", "amount", "commission", "dueAt", "paidAt"];
      rows = billing.invoices.filter((invoice) => {
        const month = getMonth(invoice.paidAt !== "Non payé" ? invoice.paidAt : invoice.dueAt);
        return (status === "ALL" || invoice.status === status) && (!from || !month || month >= from) && (!to || !month || month <= to);
      }).map((invoice) => ({ number: invoice.number, restaurant: invoice.restaurant, status: invoice.status, amount: invoice.amount, commission: invoice.commission, dueAt: invoice.dueAt, paidAt: invoice.paidAt }));
    }
    const csv = toCsv(headers, rows);
    await logAdminAction({ adminId: admin.session.user.id, action: "FINANCIAL_REPORT_EXPORTED", targetType: "REPORT", targetId: type, targetLabel: `Export ${type}`, metadata: { from, to, status, rows: rows.length, type } });
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv;charset=utf-8", "Content-Disposition": `attachment; filename="dalleup-financial-${type}.csv"` } });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp admin report fallback] financial export", error);
    return NextResponse.json({ message: "Export financier indisponible." }, { status: 503 });
  }
}
