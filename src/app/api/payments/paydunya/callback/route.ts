import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPaydunyaIpnHash } from "@/lib/payments/paydunya";
import { creditOrderPayment } from "@/lib/billing/ledger";

function parsePayload(rawData: string) {
  try {
    return JSON.parse(rawData) as Record<string, unknown>;
  } catch {
    return null;
  }
}

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
    const formData = await request.formData();
    const rawData = String(formData.get("data") ?? "");
    const payload = parsePayload(rawData);
    if (!payload) return NextResponse.json({ message: "Payload PayDunya invalide." }, { status: 400 });

    const receivedHash = asString(payload.hash) ?? asString(payload.HASH);
    if (!verifyPaydunyaIpnHash(receivedHash)) return NextResponse.json({ message: "Signature PayDunya invalide." }, { status: 401 });

    const invoice = asRecord(payload.invoice);
    const customData = asRecord(payload.custom_data);
    const status = asString(payload.status)?.toLowerCase();
    const token = asString(invoice.token) ?? asString(payload.token);
    const totalAmount = asNumber(payload.total_amount ?? invoice.total_amount);
    const orderId = asString(customData.orderId);
    if (!orderId || !token) return NextResponse.json({ message: "Données PayDunya incomplètes." }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });
    if (Number.isFinite(totalAmount) && totalAmount !== order.total) return NextResponse.json({ message: "Montant invalide." }, { status: 400 });
    if (order.payment?.status === "PAID") return NextResponse.json({ ok: true, status: "completed" });

    const nextStatus = status === "completed" ? "PAID" : status === "failed" || status === "cancelled" || status === "canceled" ? "FAILED" : "PENDING";
    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { method: "CARD", status: nextStatus, providerRef: token, paidAt: nextStatus === "PAID" ? new Date() : order.payment?.paidAt },
      create: { orderId: order.id, method: "CARD", status: nextStatus, amount: order.total, providerRef: token, paidAt: nextStatus === "PAID" ? new Date() : undefined }
    });

    if (nextStatus === "PAID") {
      try {
        await creditOrderPayment(orderId);
      } catch (ledgerError) {
        if (process.env.NODE_ENV !== "production") console.warn("[PayDunya callback] Ledger credit failed", ledgerError);
      }
    }

    return NextResponse.json({ ok: true, status: nextStatus.toLowerCase() });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[PayDunya callback]", error);
    return NextResponse.json({ message: "Callback PayDunya non traité." }, { status: 503 });
  }
}
