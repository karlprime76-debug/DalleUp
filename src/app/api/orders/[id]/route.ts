import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });
    const { id } = await params;
    const order = await prisma.order.findFirst({ where: { customerId: session.user.id, OR: [{ id }, { orderNumber: id }] }, include: { restaurant: true, items: { include: { menuItem: true } }, payment: true, address: true, review: true, delivery: { include: { driver: { select: { id: true, name: true } } } } } });
    if (!order) return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp orders fallback] GET /api/orders/[id]", error);
    return NextResponse.json({ message: "Commande Prisma indisponible." }, { status: 503 });
  }
}
