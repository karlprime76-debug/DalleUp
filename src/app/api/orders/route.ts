import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

type OrderItemInput = {
  id: string;
  restaurantId: string;
  name: string;
  price: number;
  quantity: number;
};

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
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items as OrderItemInput[] : [];
    if (!items.length) return NextResponse.json({ message: "Panier vide." }, { status: 400 });

    const firstItem = items[0];
    const restaurant = await prisma.restaurant.findFirst({ where: { OR: [{ id: firstItem.restaurantId }, { slug: firstItem.restaurantId }] } });
    if (!restaurant) return NextResponse.json({ message: "Restaurant indisponible en base." }, { status: 404 });

    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: items.map((item) => item.id) }, restaurantId: restaurant.id } });
    if (menuItems.length !== items.length) return NextResponse.json({ message: "Certains plats ne sont pas disponibles en base." }, { status: 404 });

    const address = await prisma.address.findFirst({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
    const subtotal = Number(body.subtotal ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const deliveryFee = Number(body.deliveryFee ?? restaurant.deliveryFee);
    const total = Number(body.total ?? subtotal + deliveryFee);

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        customerId: session.user.id,
        restaurantId: restaurant.id,
        addressId: address?.id,
        subtotal,
        deliveryFee,
        total,
        items: { create: items.map((item) => ({ menuItemId: item.id, quantity: item.quantity, unitPrice: item.price, total: item.price * item.quantity })) },
        payment: { create: { method: body.paymentMethod ?? "CASH_ON_DELIVERY", status: "PENDING", amount: total } }
      },
      include: { restaurant: true, items: { include: { menuItem: true } }, payment: true, address: true }
    });

    return NextResponse.json({ order: serializeOrder(order) }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp orders fallback] POST /api/orders", error);
    return NextResponse.json({ message: "Création Prisma indisponible." }, { status: 503 });
  }
}
