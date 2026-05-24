import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ message: "Accès admin requis." }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    const driverId = body.driverId === null ? null : String(body.driverId ?? "");

    const order = await prisma.order.findFirst({ where: { OR: [{ id }, { orderNumber: id }] } });
    if (!order) return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });

    if (driverId === null) {
      const delivery = await prisma.delivery.findUnique({ where: { orderId: order.id } });
      if (delivery?.driverId) {
        await prisma.$transaction([
          prisma.delivery.update({ where: { id: delivery.id }, data: { driverId: null, status: "PENDING" } }),
          prisma.order.update({ where: { id: order.id }, data: { status: "READY" } }),
          prisma.user.update({ where: { id: delivery.driverId }, data: { driverStatus: "AVAILABLE" } })
        ]);
      } else {
        await prisma.delivery.update({ where: { orderId: order.id }, data: { driverId: null, status: "PENDING" } });
      }
      return NextResponse.json({ message: "Livraison libérée." });
    }

    if (!driverId) return NextResponse.json({ message: "Livreur requis." }, { status: 400 });
    const driver = await prisma.user.findFirst({ where: { id: driverId, role: "DELIVERY_DRIVER" } });
    if (!driver) return NextResponse.json({ message: "Livreur introuvable." }, { status: 404 });
    const delivery = await prisma.delivery.upsert({ where: { orderId: order.id }, create: { orderId: order.id, driverId, status: "ASSIGNED" }, update: { driverId, status: "ASSIGNED" }, include: { driver: true, order: true } });
    await Promise.all([prisma.order.update({ where: { id: order.id }, data: { status: "DRIVER_ASSIGNED" } }), prisma.user.update({ where: { id: driverId }, data: { driverStatus: "ON_DELIVERY" } })]);
    return NextResponse.json({ delivery });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp ops fallback] assign driver", error);
    return NextResponse.json({ message: "Assignation indisponible." }, { status: 503 });
  }
}
