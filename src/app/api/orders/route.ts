import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

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

    const restaurant = await prisma.restaurant.findFirst({ where: { OR: [{ id: restaurantId }, { slug: restaurantId }] } });
    if (!restaurant) return NextResponse.json({ message: "Restaurant indisponible en base." }, { status: 404 });

    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: normalizedItems.map((item) => item.menuItemId) }, restaurantId: restaurant.id, isActive: true } });
    if (menuItems.length !== items.length) return NextResponse.json({ message: "Certains plats ne sont pas disponibles en base." }, { status: 404 });

    const address = await prisma.address.findFirst({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
    const subtotal = normalizedItems.reduce((sum, item) => {
      const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
      return sum + (menuItem?.price ?? 0) * item.quantity;
    }, 0);
    const deliveryFee = restaurant.deliveryFee;
    const total = subtotal + deliveryFee;

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        customerId: session.user.id,
        restaurantId: restaurant.id,
        addressId: address?.id,
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

    return NextResponse.json({ order: serializeOrder(order) }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp orders fallback] POST /api/orders", error);
    return NextResponse.json({ message: "Création Prisma indisponible." }, { status: 503 });
  }
}
