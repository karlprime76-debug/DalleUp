import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Non connecté." }, { status: 401 });

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { restaurant: true, payment: true },
    });
    if (!order) return NextResponse.json({ ok: false, error: "Commande introuvable." }, { status: 404 });

    const isOwner = order.restaurant.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });

    if (order.status !== "PAID_WAITING_RESTAURANT") {
      return NextResponse.json({ ok: false, error: "La commande n'est pas en attente d'acceptation." }, { status: 400 });
    }
    if (order.payment?.status !== "PAID" && order.payment?.method !== "CASH_ON_DELIVERY") {
      return NextResponse.json({ ok: false, error: "Paiement non confirmé." }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "ACCEPTED", updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true, order: updated, message: "Commande acceptée." });
  } catch (error) {
    console.error("[DalleUp accept] error", error);
    return NextResponse.json({ ok: false, error: "Indisponible." }, { status: 503 });
  }
}
