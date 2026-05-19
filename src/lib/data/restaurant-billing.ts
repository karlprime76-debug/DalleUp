import { prisma } from "@/lib/db/prisma";
import { restaurants as mockRestaurants } from "@/lib/mock-data";

export type RestaurantInvoice = {
  id: string;
  number: string;
  status: string;
  amount: number;
  commission: number;
  dueAt: string;
  paidAt: string;
  isMock?: boolean;
};

export type RestaurantBillingPlan = {
  id: string;
  name: string;
  description: string;
  monthlyFee: number;
  commissionRate: number;
  interval: string;
  isMock?: boolean;
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
  isMock?: boolean;
};

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp restaurant billing fallback] ${source}`, error);
}

function mockRestaurantBilling(): RestaurantBilling {
  const restaurant = mockRestaurants[0];
  const availablePlans = [{ id: "starter", name: "Starter", description: "Plan de démarrage", monthlyFee: 0, commissionRate: 15, interval: "MONTHLY", isMock: true }, { id: "premium", name: "Premium", description: "Commission réduite", monthlyFee: 15000, commissionRate: 12, interval: "MONTHLY", isMock: true }];
  return { restaurant: restaurant?.name ?? "Restaurant démo", plan: restaurant?.popular ? "Premium" : "Starter", planId: restaurant?.popular ? "premium" : "starter", subscriptionStatus: "ACTIVE", monthlyFee: restaurant?.popular ? 15000 : 0, commissionRate: restaurant?.popular ? 12 : 15, startsAt: "Démo", endsAt: "—", invoices: [{ id: "mock-invoice", number: "INV-DEMO-001", status: "OPEN", amount: restaurant?.popular ? 15000 : 0, commission: 0, dueAt: "Démo", paidAt: "Non payé", isMock: true }], availablePlans, isMock: true };
}

export async function getRestaurantBilling(ownerId?: string): Promise<RestaurantBilling> {
  try {
    if (!ownerId) return mockRestaurantBilling();
    const [restaurant, plans] = await Promise.all([
      prisma.restaurant.findFirst({ where: { ownerId }, include: { subscriptions: { include: { plan: true, invoices: true }, orderBy: { createdAt: "desc" }, take: 1 }, invoices: { orderBy: { createdAt: "desc" }, take: 20 } } }),
      prisma.billingPlan.findMany({ where: { isActive: true }, orderBy: { monthlyFee: "asc" } })
    ]);
    if (!restaurant) return mockRestaurantBilling();
    const subscription = restaurant.subscriptions[0];
    const invoices = subscription?.invoices.length ? subscription.invoices : restaurant.invoices;
    return { restaurant: restaurant.name, plan: subscription?.plan.name ?? "NON_SUBSCRIBED", planId: subscription?.planId, subscriptionStatus: subscription?.status ?? "NON_SUBSCRIBED", monthlyFee: subscription?.plan.monthlyFee ?? 0, commissionRate: subscription?.plan.commissionRate ?? 15, startsAt: subscription?.startsAt.toLocaleDateString("fr-FR") ?? "—", endsAt: subscription?.endsAt?.toLocaleDateString("fr-FR") ?? "—", invoices: invoices.map((invoice) => ({ id: invoice.id, number: invoice.number, status: invoice.status, amount: invoice.amount, commission: invoice.commission, dueAt: invoice.dueAt?.toLocaleDateString("fr-FR") ?? "—", paidAt: invoice.paidAt?.toLocaleDateString("fr-FR") ?? "Non payé" })), availablePlans: plans.map((plan) => ({ id: plan.id, name: plan.name, description: plan.description ?? "", monthlyFee: plan.monthlyFee, commissionRate: plan.commissionRate, interval: plan.interval })) };
  } catch (error) {
    warnFallback("getRestaurantBilling", error);
    return mockRestaurantBilling();
  }
}
