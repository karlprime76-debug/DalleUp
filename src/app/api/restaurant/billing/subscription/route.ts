import { NextResponse } from "next/server";
import { requireRestaurantApi } from "@/lib/auth/guards";
import { createBillingNotification } from "@/lib/data/billing-notifications";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(request: Request) {
  try {
    const access = await requireRestaurantApi();
    if ("response" in access) return access.response;
    const body = await request.json();
    const planId = String(body.planId ?? "");
    if (!planId) return NextResponse.json({ message: "Plan requis." }, { status: 400 });
    const plan = await prisma.billingPlan.findFirst({ where: { id: planId, isActive: true } });
    if (!plan) return NextResponse.json({ message: "Plan introuvable ou inactif." }, { status: 404 });
    const current = await prisma.restaurantSubscription.findFirst({ where: { restaurantId: access.restaurant.id }, orderBy: { createdAt: "desc" } });
    const subscription = current ? await prisma.restaurantSubscription.update({ where: { id: current.id }, data: { planId: plan.id, status: "ACTIVE", endsAt: null } }) : await prisma.restaurantSubscription.create({ data: { restaurantId: access.restaurant.id, planId: plan.id, status: "ACTIVE" } });
    await createBillingNotification({ userId: access.session.user.id, restaurantId: access.restaurant.id, type: "SUBSCRIPTION_UPDATED", title: "Abonnement modifié", message: `Le restaurant ${access.restaurant.name} est passé au plan ${plan.name}.`, metadata: { planId: plan.id, subscriptionId: subscription.id } });
    return NextResponse.json({ subscription });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp restaurant billing fallback] subscription update", error);
    return NextResponse.json({ message: "Changement de plan indisponible." }, { status: 503 });
  }
}
