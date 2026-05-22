import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });
    const body = await request.json();
    const orderId = String(body.orderId ?? "").trim();
    const rating = Number(body.rating ?? 0);
    const comment = String(body.comment ?? "").trim();
    if (!orderId) return NextResponse.json({ message: "Commande requise." }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ message: "La note doit être comprise entre 1 et 5." }, { status: 400 });
    const order = await prisma.order.findFirst({ where: { customerId: session.user.id, OR: [{ id: orderId }, { orderNumber: orderId }] } });
    if (!order) return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });
    if (order.status !== "DELIVERED") return NextResponse.json({ message: "Vous pourrez noter cette commande après livraison." }, { status: 400 });
    const review = await prisma.review.create({ data: { userId: session.user.id, restaurantId: order.restaurantId, orderId: order.id, rating, comment: comment || null } });
    const aggregate = await prisma.review.aggregate({ where: { restaurantId: order.restaurantId }, _avg: { rating: true } });
    await prisma.restaurant.update({ where: { id: order.restaurantId }, data: { rating: Number((aggregate._avg.rating ?? rating).toFixed(1)) } });
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : null;
    if (code === "P2002") return NextResponse.json({ message: "Vous avez déjà noté cette commande." }, { status: 409 });
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp reviews fallback] POST /api/reviews", error);
    return NextResponse.json({ message: "Avis indisponible pour le moment." }, { status: 503 });
  }
}
