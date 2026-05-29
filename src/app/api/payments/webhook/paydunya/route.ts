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
    const status = asString(payload.status)?.toLowerCase();
    const token = asString(invoice.token) ?? asString(payload.token);
    const totalAmount = asNumber(payload.total_amount ?? invoice.total_amount);

    if (!token) return NextResponse.json({ message: "Token PayDunya manquant." }, { status: 400 });

    const payment = await prisma.payment.findFirst({ where: { providerToken: token }, include: { order: true } });
    if (!payment) return NextResponse.json({ message: "Paiement introuvable." }, { status: 404 });

    if (Number.isFinite(totalAmount) && totalAmount !== payment.amount) {
      return NextResponse.json({ message: "Montant invalide." }, { status: 400 });
    }

    // Idempotence
    if (payment.status === "PAID") {
      return NextResponse.json({ ok: true, status: "completed" });
    }

    const nextPaymentStatus = status === "completed" ? "PAID" : status === "failed" || status === "cancelled" || status === "canceled" ? "FAILED" : "PENDING";

    if (nextPaymentStatus === "PAID") {
      if (payment.purpose === "RESTAURANT_SUBSCRIPTION") {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "PAID", paidAt: new Date(), raw: payload as unknown as Parameters<typeof prisma.payment.update>[0]["data"]["raw"] },
          }),
          prisma.restaurantSubscription.update({
            where: { paymentId: payment.id },
            data: { status: "ACTIVE", startsAt: new Date() },
          }),
        ]);
        const subscription = await prisma.restaurantSubscription.findUnique({ where: { paymentId: payment.id }, include: { plan: true } });
        if (subscription?.plan) {
          const endsAt = new Date();
          endsAt.setDate(endsAt.getDate() + (subscription.plan.durationDays || 30));
          await prisma.$transaction([
            prisma.restaurant.update({
              where: { id: payment.restaurantId! },
              data: {
                currentPlanCode: subscription.plan.code,
                isSponsored: subscription.plan.allowSponsoredPlacement,
                sponsoredUntil: subscription.plan.allowSponsoredPlacement ? endsAt : null,
                isFeatured: subscription.plan.allowFeaturedDishes,
                featuredUntil: subscription.plan.allowFeaturedDishes ? endsAt : null,
                priorityScore: subscription.plan.priorityScore,
              },
            }),
            prisma.restaurantSubscription.update({
              where: { id: subscription.id },
              data: { endsAt },
            }),
          ]);
          if (subscription.plan.allowSponsoredPlacement) {
            await prisma.restaurantPlacement.create({
              data: { restaurantId: payment.restaurantId!, subscriptionId: subscription.id, type: "SPONSORED_LISTING", startsAt: new Date(), endsAt },
            });
          }
          if (subscription.plan.allowFeaturedDishes) {
            await prisma.restaurantPlacement.create({
              data: { restaurantId: payment.restaurantId!, subscriptionId: subscription.id, type: "HOME_FEATURED", startsAt: new Date(), endsAt },
            });
          }
        }
      } else {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "PAID", paidAt: new Date(), raw: payload as unknown as Parameters<typeof prisma.payment.update>[0]["data"]["raw"] },
          }),
          prisma.order.update({
            where: { id: payment.orderId! },
            data: { status: "PAID_WAITING_RESTAURANT" as import("@prisma/client").OrderStatus, paymentStatus: "PAID", paidAt: new Date() },
          }),
          prisma.orderSplit.update({
            where: { orderId: payment.orderId! },
            data: { status: "PENDING" as import("@prisma/client").PayoutStatus },
          }),
        ]);
      }
    } else if (nextPaymentStatus === "FAILED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", failedAt: new Date(), raw: payload as unknown as Parameters<typeof prisma.payment.update>[0]["data"]["raw"] },
      });
      if (payment.purpose === "RESTAURANT_SUBSCRIPTION") {
        await prisma.restaurantSubscription.updateMany({
          where: { paymentId: payment.id },
          data: { status: "FAILED" as import("@prisma/client").SubscriptionStatus },
        });
      }
    }

    return NextResponse.json({ ok: true, status: nextPaymentStatus.toLowerCase() });
  } catch (error) {
    console.error("[PayDunya webhook] error", error);
    return NextResponse.json({ message: "Webhook PayDunya non traité." }, { status: 503 });
  }
}
