import { NextResponse } from "next/server";
import { requireRestaurantApi } from "@/lib/auth/guards";
import { createBillingNotification } from "@/lib/data/billing-notifications";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireRestaurantApi();
    if ("response" in access) return access.response;
    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({ where: { id, restaurantId: access.restaurant.id } });
    if (!invoice) return NextResponse.json({ message: "Facture introuvable pour ce restaurant." }, { status: 404 });
    if (invoice.status === "PAID") return NextResponse.json({ invoice });
    const paidInvoice = await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt: new Date() } });
    await createBillingNotification({ userId: access.session.user.id, restaurantId: access.restaurant.id, type: "INVOICE_PAID", status: "SENT", title: "Facture payée", message: `La facture ${paidInvoice.number} a été marquée comme payée.`, metadata: { invoiceId: paidInvoice.id, amount: paidInvoice.amount } });
    return NextResponse.json({ invoice: paidInvoice });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp restaurant billing fallback] invoice pay", error);
    return NextResponse.json({ message: "Paiement simulé indisponible." }, { status: 503 });
  }
}
