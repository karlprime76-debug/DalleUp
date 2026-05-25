import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { InvoiceStatus } from "@prisma/client";
import { logAdminAction } from "@/lib/data/admin-audit";
import { createBillingNotification } from "@/lib/data/billing-notifications";
import { prisma } from "@/lib/db/prisma";

const statuses: InvoiceStatus[] = [InvoiceStatus.PAID, InvoiceStatus.VOID, InvoiceStatus.UNCOLLECTIBLE, InvoiceStatus.OPEN];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "") as InvoiceStatus;
    if (!statuses.includes(status)) return NextResponse.json({ message: "Statut facture invalide." }, { status: 400 });
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return NextResponse.json({ message: "Facture introuvable." }, { status: 404 });
    const updatedInvoice = await prisma.invoice.update({ where: { id: invoice.id }, data: { status, paidAt: status === "PAID" ? new Date() : status === "OPEN" ? null : invoice.paidAt } });
    await logAdminAction({ adminId: admin.session.user.id, action: "INVOICE_STATUS_UPDATED", targetType: "INVOICE", targetId: updatedInvoice.id, targetLabel: updatedInvoice.number, metadata: { previousStatus: invoice.status, status } });
    await createBillingNotification({ userId: admin.session.user.id, restaurantId: updatedInvoice.restaurantId, type: "INVOICE_STATUS_UPDATED", status: "SENT", title: "Statut facture modifié", message: `La facture ${updatedInvoice.number} est passée de ${invoice.status} à ${status}.`, metadata: { invoiceId: updatedInvoice.id, previousStatus: invoice.status, status } });
    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp admin billing fallback] invoice status", error);
    return NextResponse.json({ message: "Statut facture indisponible." }, { status: 503 });
  }
}


