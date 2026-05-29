import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPaydunyaIpnHash } from "@/lib/payments/paydunya";

function parsePayload(rawData: string) {
  try {
    return JSON.parse(rawData) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
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
    const formData = await request.formData();
    const rawData = String(formData.get("data") ?? "");
    const payload = parsePayload(rawData);
    if (!payload) return NextResponse.json({ message: "Payload PayDunya invalide." }, { status: 400 });

    const receivedHash = asString(payload.hash) ?? asString(payload.HASH);
    if (!verifyPaydunyaIpnHash(receivedHash)) {
      return NextResponse.json({ message: "Signature PayDunya invalide." }, { status: 401 });
    }

    const invoice = asRecord(payload.invoice);
    const customData = asRecord(payload.custom_data);
    const status = asString(payload.status)?.toLowerCase();
    const token = asString(invoice.token) ?? asString(payload.token);
    const totalAmount = asNumber(payload.total_amount ?? invoice.total_amount);
    const orderId = asString(customData.orderId);

    if (!orderId || !token) return NextResponse.json({ message: "Données PayDunya incomplètes." }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });

    if (Number.isFinite(totalAmount) && totalAmount !== order.total) {
      return NextResponse.json({ message: "Montant invalide." }, { status: 400 });
    }

    // Idempotence
    if (order.payment?.status === "PAID") {
      return NextResponse.json({ ok: true, status: "completed" });
    }

    const nextPaymentStatus = status === "completed" ? "PAID" : status === "failed" || status === "cancelled" || status === "canceled" ? "FAILED" : "PENDING";

    if (nextPaymentStatus === "PAID") {
      await prisma.$transaction([
        prisma.payment.update({
          where: { orderId: order.id },
          data: { status: "PAID", paidAt: new Date(), raw: payload as unknown as Parameters<typeof prisma.payment.update>[0]["data"]["raw"] },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { status: "PAID_WAITING_RESTAURANT", paymentStatus: "PAID", paidAt: new Date() },
        }),
        prisma.orderSplit.update({
          where: { orderId: order.id },
          data: { status: "PENDING" },
        }),
      ]);
    } else if (nextPaymentStatus === "FAILED") {
      await prisma.payment.update({
        where: { orderId: order.id },
        data: { status: "FAILED", failedAt: new Date(), raw: payload as unknown as Parameters<typeof prisma.payment.update>[0]["data"]["raw"] },
      });
    }

    return NextResponse.json({ ok: true, status: nextPaymentStatus.toLowerCase() });
  } catch (error) {
    console.error("[PayDunya webhook] error", error);
    return NextResponse.json({ message: "Webhook PayDunya non traité." }, { status: 503 });
  }
}
