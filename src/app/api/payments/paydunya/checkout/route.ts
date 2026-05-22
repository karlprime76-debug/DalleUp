import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { createPaydunyaCheckoutInvoice, getPaydunyaConfig } from "@/lib/payments/paydunya";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

    const body = await request.json();
    const orderId = String(body.orderId ?? "").trim();
    if (!orderId) return NextResponse.json({ message: "Commande requise." }, { status: 400 });

    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId: session.user.id },
      include: { customer: true, restaurant: true, payment: true, items: { include: { menuItem: true } }, address: true }
    });
    if (!order) return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });
    if (order.payment?.status === "PAID") return NextResponse.json({ message: "Commande déjà payée." }, { status: 409 });

    const config = getPaydunyaConfig();
    const invoice = await createPaydunyaCheckoutInvoice({
      invoice: {
        total_amount: order.total,
        description: `Commande ${order.orderNumber} - ${order.restaurant.name}`,
        items: order.items.map((item) => ({ name: item.menuItem.name, quantity: item.quantity, unit_price: item.unitPrice, total_price: item.total, description: item.menuItem.description }))
      },
      store: { name: config.storeName },
      actions: {
        return_url: `${config.appUrl}/payments/paydunya/return`,
        cancel_url: `${config.appUrl}/payments/paydunya/cancel`,
        callback_url: `${config.appUrl}/api/payments/paydunya/callback`
      },
      custom_data: { orderId: order.id, userId: session.user.id },
      customer: { name: order.customer.name, email: order.customer.email, phone: order.customer.phone ?? order.address?.zone ?? undefined }
    });

    if (invoice.response_code !== "00") return NextResponse.json({ message: "PayDunya a refusé la création de facture." }, { status: 502 });
    const token = typeof invoice.token === "string" ? invoice.token : undefined;
    const checkoutUrl = typeof invoice.response_text === "string" ? invoice.response_text : typeof invoice.invoice_url === "string" ? invoice.invoice_url : undefined;
    if (!token || !checkoutUrl) return NextResponse.json({ message: "Réponse PayDunya incomplète." }, { status: 502 });

    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { method: "CARD", status: "PENDING", amount: order.total, providerRef: token },
      create: { orderId: order.id, method: "CARD", status: "PENDING", amount: order.total, providerRef: token }
    });

    return NextResponse.json({ checkoutUrl, token });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[PayDunya checkout]", error);
    return NextResponse.json({ message: "Initialisation PayDunya impossible." }, { status: 503 });
  }
}
