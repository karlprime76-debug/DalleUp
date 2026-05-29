import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getDeliveryFeeEstimate } from "@/lib/billing/delivery-fee";
import { validatePromoCode } from "@/lib/promotions/promo-codes";
import { calculateOrderSplit } from "@/lib/payments/split";
import { createCheckout, resolvePaymentProvider } from "@/lib/payments/provider";
import { getPlatformSettings } from "@/lib/settings/platform-settings";

type OrderItemInput = {
  menuItemId: string;
  quantity: number;
};

function orderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(2).toString("hex").toUpperCase();
  return `DU-${ts}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Non connecté." }, { status: 401 });
    if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Accès client requis." }, { status: 403 });
    }

    const body = await request.json();
    const items = Array.isArray(body.items) ? (body.items as OrderItemInput[]) : [];
    if (!items.length) return NextResponse.json({ ok: false, error: "Panier vide." }, { status: 400 });

    const restaurantId = String(body.restaurantId ?? "").trim();
    if (!restaurantId) return NextResponse.json({ ok: false, error: "Restaurant requis." }, { status: 400 });

    const normalizedItems = items.map((item) => ({
      menuItemId: String(item.menuItemId ?? "").trim(),
      quantity: Number(item.quantity),
    }));
    if (normalizedItems.some((item) => !item.menuItemId || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      return NextResponse.json({ ok: false, error: "Chaque plat doit avoir un identifiant et une quantité valide." }, { status: 400 });
    }

    const paymentMethod = String(body.paymentMethod ?? "CASH_ON_DELIVERY");
    const allowedMethods = ["CASH_ON_DELIVERY", "MTN_MOMO", "MOOV_MONEY", "CARD", "PAYDUNYA", "MOCK"];
    if (!allowedMethods.includes(paymentMethod)) {
      return NextResponse.json({ ok: false, error: "Méthode de paiement invalide." }, { status: 400 });
    }

    const deliveryAddress = String(body.deliveryAddress ?? "").trim();
    const deliveryZone = String(body.deliveryZone ?? "").trim();
    const deliveryPhone = String(body.deliveryPhone ?? "").trim();
    const deliveryInstructions = String(body.deliveryInstructions ?? "").trim();
    if (deliveryAddress.length < 5) return NextResponse.json({ ok: false, error: "Adresse de livraison requise." }, { status: 400 });
    if (deliveryZone.length < 2) return NextResponse.json({ ok: false, error: "Quartier de livraison requis." }, { status: 400 });
    if (deliveryPhone.length < 6) return NextResponse.json({ ok: false, error: "Téléphone de livraison requis." }, { status: 400 });

    const restaurant = await prisma.restaurant.findFirst({ where: { OR: [{ id: restaurantId }, { slug: restaurantId }] } });
    if (!restaurant) return NextResponse.json({ ok: false, error: "Restaurant indisponible en base." }, { status: 404 });
    if (restaurant.status !== "APPROVED") return NextResponse.json({ ok: false, error: "Ce restaurant est fermé pour le moment." }, { status: 403 });

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: normalizedItems.map((i) => i.menuItemId) }, restaurantId: restaurant.id, isActive: true },
    });
    if (menuItems.length !== normalizedItems.length) {
      return NextResponse.json({ ok: false, error: "Certains plats ne sont pas disponibles." }, { status: 404 });
    }

    const existingAddress = await prisma.address.findFirst({ where: { userId: session.user.id, street: deliveryAddress } });
    const address = existingAddress ?? (await prisma.address.create({
      data: { userId: session.user.id, label: "Livraison", street: deliveryAddress, city: "Cotonou", zone: deliveryZone, isDefault: false },
    }));

    const subtotal = normalizedItems.reduce((sum, item) => {
      const mi = menuItems.find((m) => m.id === item.menuItemId);
      return sum + (mi?.price ?? 0) * item.quantity;
    }, 0);

    const promoCode = String(body.promoCode ?? "").trim();
    const promo = promoCode ? await validatePromoCode({ code: promoCode, subtotal }) : null;
    if (promoCode && !promo) return NextResponse.json({ ok: false, error: "Code promo invalide ou expiré." }, { status: 400 });

    const deliveryFee = getDeliveryFeeEstimate({ zone: deliveryZone });
    if (deliveryFee === null) return NextResponse.json({ ok: false, error: "Frais de livraison non calculables." }, { status: 400 });

    const settings = await getPlatformSettings();
    const serviceFee = settings.platformServiceFee ?? 0;
    const discountedSubtotal = promo?.discountedSubtotal ?? subtotal;
    const total = discountedSubtotal + deliveryFee + serviceFee;
    const commissionRate = restaurant.deliveryFee ?? settings.restaurantCommissionRate ?? 15;

    const split = calculateOrderSplit({
      subtotalAmount: discountedSubtotal,
      deliveryFeeAmount: deliveryFee,
      serviceFeeAmount: serviceFee,
      restaurantCommissionRate: commissionRate,
    });

    const isOnline = paymentMethod === "PAYDUNYA" || paymentMethod === "CARD" || paymentMethod === "MOCK";
    const provider = resolvePaymentProvider(paymentMethod);

    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          orderNumber: orderNumber(),
          customerId: session.user.id,
          restaurantId: restaurant.id,
          addressId: address.id,
          status: isOnline ? "PENDING_PAYMENT" : "PAID_WAITING_RESTAURANT",
          subtotal: discountedSubtotal,
          deliveryFee,
          serviceFee,
          total,
          note: `${deliveryInstructions ? `${deliveryInstructions} · ` : ""}Téléphone: ${deliveryPhone}${promo ? ` · Code promo ${promo.code}: -${promo.discount}` : ""}`,
          paymentStatus: isOnline ? "PENDING" : "PAID",
          paidAt: isOnline ? null : new Date(),
          items: {
            create: normalizedItems.map((item) => {
              const mi = menuItems.find((m) => m.id === item.menuItemId);
              const unitPrice = mi?.price ?? 0;
              return { menuItemId: item.menuItemId, quantity: item.quantity, unitPrice, total: unitPrice * item.quantity };
            }),
          },
          payment: {
            create: {
              method: paymentMethod as Parameters<typeof prisma.payment.create>[0]["data"]["method"],
              provider: isOnline ? provider : undefined,
              status: isOnline ? "PENDING" : "PAID",
              amount: total,
              currency: "XOF",
              paidAt: isOnline ? null : new Date(),
            },
          },
          delivery: {
            create: { status: "PENDING", distanceKm: deliveryFee ? Math.round((deliveryFee / 200) * 10) / 10 : undefined },
          },
          orderSplit: {
            create: {
              subtotalAmount: split.subtotalAmount,
              deliveryFeeAmount: split.deliveryFeeAmount,
              serviceFeeAmount: split.serviceFeeAmount,
              totalAmount: split.totalAmount,
              restaurantCommissionRate: split.restaurantCommissionRate,
              restaurantCommissionAmount: split.restaurantCommissionAmount,
              deliveryCommissionRate: split.deliveryCommissionRate,
              deliveryCommissionAmount: split.deliveryCommissionAmount,
              restaurantAmount: split.restaurantAmount,
              courierAmount: split.courierAmount,
              dalleupAmount: split.dalleupAmount,
              status: "PENDING",
            },
          },
        },
        include: { restaurant: true, items: { include: { menuItem: true } }, payment: true, address: true, delivery: true },
      }),
    ]);

    if (!isOnline) {
      return NextResponse.json({ ok: true, order, message: "Commande créée. Paiement à la livraison." }, { status: 201 });
    }

    const appUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://dalleup.vercel.app").replace(/\/$/, "");
    const checkout = await createCheckout(provider, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      description: `Commande ${order.orderNumber} - ${restaurant.name}`,
      items: order.items.map((item) => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.total,
        description: item.menuItem.description,
      })),
      customer: { name: session.user.name ?? undefined, email: session.user.email ?? undefined, phone: deliveryPhone },
      customData: { orderId: order.id, userId: session.user.id },
      returnUrl: `${appUrl}/payments/paydunya/return`,
      cancelUrl: `${appUrl}/payments/paydunya/cancel`,
      callbackUrl: `${appUrl}/api/payments/webhook/paydunya`,
    });

    if (!checkout.ok || !checkout.checkoutUrl || !checkout.token) {
      return NextResponse.json({ ok: false, error: checkout.error ?? "Erreur de création du paiement." }, { status: 502 });
    }

    await prisma.payment.update({
      where: { orderId: order.id },
      data: { providerToken: checkout.token, checkoutUrl: checkout.checkoutUrl, providerRef: checkout.providerRef },
    });

    return NextResponse.json({ ok: true, order, checkoutUrl: checkout.checkoutUrl, token: checkout.token, message: "Commande créée. Redirection vers le paiement." }, { status: 201 });
  } catch (error) {
    console.error("[DalleUp create-payment] error", error);
    return NextResponse.json({ ok: false, error: "Création de commande impossible." }, { status: 503 });
  }
}
