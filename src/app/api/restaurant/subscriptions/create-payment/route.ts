import { NextResponse } from "next/server";
import { requireRestaurantApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { createCheckout, resolvePaymentProvider } from "@/lib/payments/provider";

export async function POST(request: Request) {
  try {
    const authResult = await requireRestaurantApi();
    if ("response" in authResult) return authResult.response;
    const { restaurant } = authResult;
    const body = await request.json().catch(() => ({}));
    const planCode = String(body.planCode ?? "").trim();
    if (!planCode) {
      return NextResponse.json({ message: "Code du plan requis." }, { status: 400 });
    }
    const plan = await prisma.billingPlan.findUnique({ where: { code: planCode } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ message: "Plan introuvable ou inactif." }, { status: 404 });
    }

    const subscription = await prisma.restaurantSubscription.create({
      data: {
        restaurantId: restaurant.id,
        planId: plan.id,
        status: "PENDING_PAYMENT",
      },
    });

    const provider = resolvePaymentProvider("PAYDUNYA");
    const payment = await prisma.payment.create({
      data: {
        restaurantId: restaurant.id,
        purpose: "RESTAURANT_SUBSCRIPTION",
        method: provider === "PAYDUNYA" ? "PAYDUNYA" : "MOCK",
        provider: provider,
        status: "PENDING",
        amount: plan.price,
        currency: plan.currency || "XOF",
      },
    });

    await prisma.restaurantSubscription.update({
      where: { id: subscription.id },
      data: { paymentId: payment.id },
    });

    let checkoutUrl: string | undefined;
    let token: string | undefined;
    if (provider === "MOCK") {
      checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/payments/mock/return?token=mock-sub-${subscription.id}`;
      token = `mock-sub-${subscription.id}`;
      await prisma.payment.update({ where: { id: payment.id }, data: { providerToken: token, checkoutUrl } });
      return NextResponse.json({ ok: true, subscription, checkoutUrl, token, message: "Paiement mock créé." });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
    const checkoutResult = await createCheckout(provider as import("@/lib/payments/provider").PaymentProvider, {
      orderId: subscription.id,
      orderNumber: `SUB-${subscription.id.slice(-6).toUpperCase()}`,
      total: plan.price,
      description: `Abonnement ${plan.name} — ${restaurant.name}`,
      items: [{ name: plan.name, quantity: 1, unitPrice: plan.price, totalPrice: plan.price, description: plan.description ?? "" }],
      customer: { name: restaurant.name, email: undefined, phone: undefined },
      customData: { subscriptionId: subscription.id, planCode: plan.code },
      returnUrl: `${appUrl}/restaurant/subscription?status=return`,
      cancelUrl: `${appUrl}/restaurant/subscription?status=cancel`,
      callbackUrl: `${appUrl}/api/payments/webhook/paydunya`,
    });
    if (!checkoutResult.ok || !checkoutResult.token || !checkoutResult.checkoutUrl) {
      return NextResponse.json({ message: "Impossible de créer le paiement." }, { status: 502 });
    }
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerToken: checkoutResult.token, checkoutUrl: checkoutResult.checkoutUrl },
    });
    return NextResponse.json({ ok: true, subscription, checkoutUrl: checkoutResult.checkoutUrl, token: checkoutResult.token });
  } catch (error) {
    console.error("[DalleUp] POST /api/restaurant/subscriptions/create-payment", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
