import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send-email";
import { orderConfirmationClient, newOrderRestaurant } from "@/lib/email/templates";
import { formatPrice } from "@/lib/pricing/delivery";
import { getDeliveryFeeEstimate } from "@/lib/billing/delivery-fee";
import { validatePromoCode } from "@/lib/promotions/promo-codes";

type OrderItemInput = {
  id?: string;
  menuItemId?: string;
  restaurantId?: string;
  quantity: number;
};

const allowedPaymentMethods = ["CASH_ON_DELIVERY", "MTN_MOMO", "MOOV_MONEY", "CARD"] as const;

function orderNumber() {
  return `DU-${String(Date.now()).slice(-6)}`;
}

function serializeOrder(order: Awaited<ReturnType<typeof prisma.order.findFirstOrThrow>>) {
  return order;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });
    const orders = await prisma.order.findMany({ where: { customerId: session.user.id }, include: { restaurant: true, items: { include: { menuItem: true } }, payment: true, address: true }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ orders });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp orders fallback] GET /api/orders", error);
    return NextResponse.json({ message: "Commandes Prisma indisponibles." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });
    if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") return NextResponse.json({ message: "Accès client requis." }, { status: 403 });
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items as OrderItemInput[] : [];
    if (!items.length) return NextResponse.json({ message: "Panier vide." }, { status: 400 });

    const firstItem = items[0];
    const restaurantId = String(body.restaurantId ?? firstItem.restaurantId ?? "").trim();
    if (!restaurantId) return NextResponse.json({ message: "Restaurant requis." }, { status: 400 });
    const normalizedItems = items.map((item) => ({ menuItemId: String(item.menuItemId ?? item.id ?? "").trim(), quantity: Number(item.quantity) }));
    if (normalizedItems.some((item) => !item.menuItemId || !Number.isInteger(item.quantity) || item.quantity <= 0)) return NextResponse.json({ message: "Chaque plat doit avoir un identifiant et une quantité valide." }, { status: 400 });
    const paymentMethod = String(body.paymentMethod ?? "CASH_ON_DELIVERY");
    if (!allowedPaymentMethods.includes(paymentMethod as typeof allowedPaymentMethods[number])) return NextResponse.json({ message: "Méthode de paiement invalide." }, { status: 400 });
    const deliveryAddress = String(body.deliveryAddress ?? "").trim();
    const deliveryZone = String(body.deliveryZone ?? "").trim();
    const deliveryPhone = String(body.deliveryPhone ?? "").trim();
    const deliveryInstructions = String(body.deliveryInstructions ?? "").trim();
    if (deliveryAddress.length < 5) return NextResponse.json({ message: "Adresse de livraison requise." }, { status: 400 });
    if (deliveryZone.length < 2) return NextResponse.json({ message: "Quartier de livraison requis." }, { status: 400 });
    if (deliveryPhone.length < 6) return NextResponse.json({ message: "Téléphone de livraison requis." }, { status: 400 });

    const restaurant = await prisma.restaurant.findFirst({ where: { OR: [{ id: restaurantId }, { slug: restaurantId }] } });
    if (!restaurant) return NextResponse.json({ message: "Restaurant indisponible en base." }, { status: 404 });
    if (restaurant.status !== "APPROVED") return NextResponse.json({ message: "Ce restaurant est fermé pour le moment." }, { status: 403 });

    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: normalizedItems.map((item) => item.menuItemId) }, restaurantId: restaurant.id, isActive: true } });
    if (menuItems.length !== items.length) return NextResponse.json({ message: "Certains plats ne sont pas disponibles en base." }, { status: 404 });

    const existingAddress = await prisma.address.findFirst({ where: { userId: session.user.id, street: deliveryAddress } });
    const address = existingAddress ?? await prisma.address.create({ data: { userId: session.user.id, label: "Livraison", street: deliveryAddress, city: "Cotonou", zone: deliveryZone, isDefault: false } });
    const subtotal = normalizedItems.reduce((sum, item) => {
      const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
      return sum + (menuItem?.price ?? 0) * item.quantity;
    }, 0);
    const promoCode = String(body.promoCode ?? "").trim();
    const promo = await validatePromoCode({ code: promoCode, subtotal });
    if (promoCode && !promo) return NextResponse.json({ message: "Code promo invalide ou expiré." }, { status: 400 });
    const deliveryFee = getDeliveryFeeEstimate({ zone: deliveryZone });
    if (deliveryFee === null) {
      return NextResponse.json({ message: "Frais de livraison non calculables pour ce quartier." }, { status: 400 });
    }
    const total = (promo?.discountedSubtotal ?? subtotal) + deliveryFee;

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        customerId: session.user.id,
        restaurantId: restaurant.id,
        addressId: address?.id,
        note: `${deliveryInstructions ? `${deliveryInstructions} · ` : ""}Téléphone: ${deliveryPhone}${promo ? ` · Code promo ${promo.code}: -${formatPrice(promo.discount)}` : ""}`,
        subtotal,
        deliveryFee,
        total,
        items: { create: normalizedItems.map((item) => {
          const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
          const unitPrice = menuItem?.price ?? 0;
          return { menuItemId: item.menuItemId, quantity: item.quantity, unitPrice, total: unitPrice * item.quantity };
        }) },
        payment: { create: { method: paymentMethod as typeof allowedPaymentMethods[number], status: "PENDING", amount: total } }
      },
      include: { restaurant: true, items: { include: { menuItem: true } }, payment: true, address: true }
    });

    const customer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } }).catch(() => null);

    try {
      if (customer?.email) {
        const template = orderConfirmationClient(order.orderNumber, formatPrice(order.total), order.restaurant.name);
        await sendEmail({ to: customer.email, subject: template.subject, html: template.html, text: template.text });
      }
    } catch {
      /* L'email ne bloque pas la commande */
    }

    try {
      const owner = await prisma.user.findUnique({ where: { id: restaurant.ownerId }, select: { email: true, name: true } });
      if (owner?.email) {
        const template = newOrderRestaurant(order.orderNumber, formatPrice(order.total), customer?.name || "Client");
        await sendEmail({ to: owner.email, subject: template.subject, html: template.html, text: template.text });
      }
    } catch {
      /* L'email ne bloque pas la commande */
    }

    return NextResponse.json({ order: serializeOrder(order) }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp orders fallback] POST /api/orders", error);
    return NextResponse.json({ message: "Création Prisma indisponible." }, { status: 503 });
  }
}
