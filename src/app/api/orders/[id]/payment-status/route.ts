import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Non connecté." }, { status: 401 });

    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { payment: { select: { status: true, checkoutUrl: true, providerRef: true } } },
    });
    if (!order) return NextResponse.json({ ok: false, error: "Commande introuvable." }, { status: 404 });

    const isOwner = order.customerId === session.user.id || session.user.role === "ADMIN";
    if (!isOwner) return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: order.payment?.status ?? null,
      checkoutUrl: order.payment?.checkoutUrl ?? null,
    });
  } catch (error) {
    console.error("[DalleUp payment-status] error", error);
    return NextResponse.json({ ok: false, error: "Indisponible." }, { status: 503 });
  }
}
