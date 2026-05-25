import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  try {
    const limit = rateLimitRequest(request, "/api/account");
    if (!limit.ok) {
      return NextResponse.json(
        { message: "Trop de tentatives. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { identifier: { startsWith: `reset:${session.user.email}` } } }),
      prisma.account.deleteMany({ where: { userId: session.user.id } }),
      prisma.session.deleteMany({ where: { userId: session.user.id } }),
      prisma.favorite.deleteMany({ where: { userId: session.user.id } }),
      prisma.address.deleteMany({ where: { userId: session.user.id } }),
      prisma.wallet.deleteMany({ where: { userId: session.user.id } }),
      prisma.payout.deleteMany({ where: { userId: session.user.id } }),
      prisma.delivery.deleteMany({ where: { driverId: session.user.id } }),
      prisma.billingNotification.deleteMany({ where: { userId: session.user.id } }),
      prisma.adminAuditLog.deleteMany({ where: { adminId: session.user.id } }),
      prisma.review.deleteMany({ where: { userId: session.user.id } }),
      prisma.orderItem.deleteMany({ where: { order: { customerId: session.user.id } } }),
      prisma.orderItem.deleteMany({ where: { order: { restaurant: { ownerId: session.user.id } } } }),
      prisma.payment.deleteMany({ where: { order: { customerId: session.user.id } } }),
      prisma.payment.deleteMany({ where: { order: { restaurant: { ownerId: session.user.id } } } }),
      prisma.delivery.deleteMany({ where: { order: { customerId: session.user.id } } }),
      prisma.delivery.deleteMany({ where: { order: { restaurant: { ownerId: session.user.id } } } }),
      prisma.order.deleteMany({ where: { customerId: session.user.id } }),
      prisma.order.deleteMany({ where: { restaurant: { ownerId: session.user.id } } }),
      prisma.invoice.deleteMany({ where: { restaurant: { ownerId: session.user.id } } }),
      prisma.restaurantSubscription.deleteMany({ where: { restaurant: { ownerId: session.user.id } } }),
      prisma.menuItem.deleteMany({ where: { restaurant: { ownerId: session.user.id } } }),
      prisma.restaurant.deleteMany({ where: { ownerId: session.user.id } }),
      prisma.user.delete({ where: { id: session.user.id } }),
    ]);

    return NextResponse.json({ success: true, message: "Compte supprimé." });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[delete-account]", error);
    return NextResponse.json({ message: "Impossible de supprimer le compte." }, { status: 500 });
  }
}
