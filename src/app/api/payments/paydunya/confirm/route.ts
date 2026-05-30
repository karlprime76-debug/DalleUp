import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { confirmPaydunyaInvoice } from "@/lib/payments/paydunya";

function asRecord(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number.NaN;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

    const body = await request.json();
    const token = String(body.token ?? "").trim();
    if (!token) return NextResponse.json({ message: "Token PayDunya requis." }, { status: 400 });

    const isMock = token.startsWith("mock-");
    const order = await prisma.order.findFirst({ where: { customerId: session.user.id, payment: { providerRef: token } }, include: { payment: true } });
    if (!order) return NextResponse.json({ message: "Paiement introuvable." }, { status: 404 });
    if (order.payment?.status === "PAID") return NextResponse.json({ status: "completed", orderId: order.id });

    let nextStatus: "PAID" | "FAILED" | "PENDING" = "PENDING";

    if (isMock) {
      nextStatus = "PAID";
    } else {
      const confirmation = await confirmPaydunyaInvoice(token);
      if (confirmation.response_code !== "00") return NextResponse.json({ status: "pending", orderId: order.id });

      const invoice = asRecord(confirmation.invoice);
      const status = asString(confirmation.status ?? invoice.status)?.toLowerCase();
      const totalAmount = asNumber(confirmation.total_amount ?? invoice.total_amount);
      if (Number.isFinite(totalAmount) && totalAmount !== order.total) return NextResponse.json({ message: "Montant invalide." }, { status: 400 });

      nextStatus = status === "completed" ? "PAID" : status === "failed" || status === "cancelled" || status === "canceled" ? "FAILED" : "PENDING";
    }

    await prisma.payment.update({ where: { orderId: order.id }, data: { status: nextStatus, paidAt: nextStatus === "PAID" ? new Date() : order.payment?.paidAt } });

    if (nextStatus === "PAID") {
      await prisma.order.update({ where: { id: order.id }, data: { status: "PAID_WAITING_RESTAURANT", paymentStatus: "PAID", paidAt: new Date() } });
    }

    return NextResponse.json({ status: nextStatus === "PAID" ? "completed" : nextStatus === "FAILED" ? "failed" : "pending", orderId: order.id });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[PayDunya confirm]", error);
    return NextResponse.json({ message: "Confirmation PayDunya impossible." }, { status: 503 });
  }
}
