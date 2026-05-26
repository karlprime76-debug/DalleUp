import { prisma } from "@/lib/db/prisma";

export type RestaurantInvoice = {
  id: string;
  number: string;
  status: string;
  amount: number;
  commission: number;
  dueAt: string;
  paidAt: string;
};

export type RestaurantBillingPlan = {
  id: string;
  name: string;
  description: string;
  monthlyFee: number;
  commissionRate: number;
  interval: string;
};

export type RestaurantBilling = {
  restaurant: string;
  plan: string;
  planId?: string;
  subscriptionStatus: string;
  monthlyFee: number;
  commissionRate: number;
  startsAt: string;
  endsAt: string;
  invoices: RestaurantInvoice[];
  availablePlans: RestaurantBillingPlan[];
};

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp restaurant billing fallback] ${source}`, error);
}

function emptyRestaurantBilling(): RestaurantBilling {
  return { restaurant: "Restaurant introuvable", plan: "NON_SUBSCRIBED", subscriptionStatus: "NON_SUBSCRIBED", monthlyFee: 0, commissionRate: 0, startsAt: "—", endsAt: "—", invoices: [], availablePlans: [] };
}

export async function getRestaurantBilling(ownerId?: string): Promise<RestaurantBilling> {
  try {
    if (!ownerId) return emptyRestaurantBilling();
    const [restaurant, plans] = await Promise.all([
      prisma.restaurant.findFirst({ where: { ownerId }, include: { subscriptions: { include: { plan: true, invoices: true }, orderBy: { createdAt: "desc" }, take: 1 }, invoices: { orderBy: { createdAt: "desc" }, take: 20 } } }),
      prisma.billingPlan.findMany({ where: { isActive: true }, orderBy: { monthlyFee: "asc" } })
    ]);
    if (!restaurant) return { ...emptyRestaurantBilling(), availablePlans: plans.map((plan) => ({ id: plan.id, name: plan.name, description: plan.description ?? "", monthlyFee: plan.monthlyFee, commissionRate: plan.commissionRate, interval: plan.interval })) };
    const subscription = restaurant.subscriptions[0];
    const invoices = subscription?.invoices.length ? subscription.invoices : restaurant.invoices;
    return { restaurant: restaurant.name, plan: subscription?.plan.name ?? "NON_SUBSCRIBED", planId: subscription?.planId, subscriptionStatus: subscription?.status ?? "NON_SUBSCRIBED", monthlyFee: subscription?.plan.monthlyFee ?? 0, commissionRate: subscription?.plan.commissionRate ?? 15, startsAt: subscription?.startsAt.toLocaleDateString("fr-FR") ?? "—", endsAt: subscription?.endsAt?.toLocaleDateString("fr-FR") ?? "—", invoices: invoices.map((invoice) => ({ id: invoice.id, number: invoice.number, status: invoice.status, amount: invoice.amount, commission: invoice.commission, dueAt: invoice.dueAt?.toLocaleDateString("fr-FR") ?? "—", paidAt: invoice.paidAt?.toLocaleDateString("fr-FR") ?? "Non payé" })), availablePlans: plans.map((plan) => ({ id: plan.id, name: plan.name, description: plan.description ?? "", monthlyFee: plan.monthlyFee, commissionRate: plan.commissionRate, interval: plan.interval })) };
  } catch (error) {
    warnFallback("getRestaurantBilling", error);
    return emptyRestaurantBilling();
  }
}
