import { NextResponse } from "next/server";
import { requireRestaurantApi } from "@/lib/auth/guards";
import { createBillingNotification } from "@/lib/data/billing-notifications";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  try {
    const access = await requireRestaurantApi();
    if ("response" in access) return access.response;
    const restaurant = await prisma.restaurant.findUnique({ where: { id: access.restaurant.id }, include: { subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 } } });
    if (!restaurant) return NextResponse.json({ message: "Restaurant Prisma introuvable." }, { status: 404 });
    const subscription = restaurant.subscriptions[0];
    if (!subscription) return NextResponse.json({ message: "Abonnement introuvable." }, { status: 404 });
    const now = new Date();
    const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const number = `INV-${restaurant.slug}-${period}`;
    const existing = await prisma.invoice.findUnique({ where: { number } });
    if (existing) return NextResponse.json({ invoice: existing });
    const dueAt = new Date(now);
    dueAt.setDate(dueAt.getDate() + 15);
    const invoice = await prisma.invoice.create({ data: { restaurantId: restaurant.id, subscriptionId: subscription.id, number, status: "OPEN", amount: subscription.plan.monthlyFee, commission: 0, dueAt } });
    await createBillingNotification({ userId: access.session.user.id, restaurantId: restaurant.id, type: "INVOICE_GENERATED", title: "Facture générée", message: `La facture ${invoice.number} a été générée pour ${restaurant.name}.`, metadata: { invoiceId: invoice.id, amount: invoice.amount } });
    return NextResponse.json({ invoice });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp restaurant billing fallback] invoice generate", error);
    return NextResponse.json({ message: "Génération de facture indisponible." }, { status: 503 });
  }
}
