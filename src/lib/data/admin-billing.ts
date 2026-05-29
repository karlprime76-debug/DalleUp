import { prisma } from "@/lib/db/prisma";

export type AdminPayment = { id: string; orderNumber: string; restaurant: string; customer: string; method: string; status: string; amount: number; commission: number; providerRef: string; paidAt: string };
export type AdminBillingPlan = { id: string; restaurant: string; status: string; plan: string; subscriptionStatus: string; invoices: number; monthlyFee: number; commissionRate: number; orders: number; revenue: number };
export type AdminInvoice = { id: string; number: string; restaurant: string; status: string; amount: number; commission: number; dueAt: string; paidAt: string };
export type AdminBillingSummary = { revenue: number; commission: number; paid: number; pending: number; failed: number; refunded: number; invoiceOpen: number; invoicePaid: number; invoiceUncollectible: number };
export type AdminFinancialReportRow = { month: string; status: string; orderRevenue: number; orderCommission: number; invoiceAmount: number; invoiceCommission: number; estimatedCommission: number };
export type AdminBillingAnalytics = { paymentRate: number; overdueInvoices: number; activeSubscriptions: number; suspendedRestaurants: number; topRestaurants: { restaurant: string; revenue: number; orders: number; commissionRate: number }[]; invoiceRisks: { restaurant: string; amount: number; status: string; dueAt: string }[] };
export type AdminBillingData = { summary: AdminBillingSummary; payments: AdminPayment[]; plans: AdminBillingPlan[]; invoices: AdminInvoice[]; report: AdminFinancialReportRow[]; analytics: AdminBillingAnalytics };

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp billing fallback] ${source}`, error);
}

function emptyBillingData(): AdminBillingData {
  const payments: AdminPayment[] = [];
  const plans: AdminBillingPlan[] = [];
  const invoices: AdminInvoice[] = [];
  return { summary: { revenue: 0, commission: 0, paid: 0, pending: 0, failed: 0, refunded: 0, invoiceOpen: 0, invoicePaid: 0, invoiceUncollectible: 0 }, payments, plans, invoices, report: [], analytics: buildAnalytics(payments, plans, invoices) };
}

function buildAnalytics(payments: AdminPayment[], plans: AdminBillingPlan[], invoices: AdminInvoice[]): AdminBillingAnalytics {
  const paidCount = payments.filter((payment) => payment.status === "PAID").length;
  const paymentRate = payments.length ? Math.round((paidCount / payments.length) * 100) : 0;
  const activeSubscriptions = plans.filter((plan) => plan.subscriptionStatus === "ACTIVE").length;
  const suspendedRestaurants = plans.filter((plan) => plan.status === "SUSPENDED" || plan.subscriptionStatus === "SUSPENDED").length;
  const topRestaurants = [...plans].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((plan) => ({ restaurant: plan.restaurant, revenue: plan.revenue, orders: plan.orders, commissionRate: plan.commissionRate }));
  const invoiceRisks = invoices.filter((invoice) => invoice.status === "OPEN" || invoice.status === "UNCOLLECTIBLE").sort((a, b) => b.amount - a.amount).slice(0, 5).map((invoice) => ({ restaurant: invoice.restaurant, amount: invoice.amount, status: invoice.status, dueAt: invoice.dueAt }));
  return { paymentRate, overdueInvoices: invoiceRisks.length, activeSubscriptions, suspendedRestaurants, topRestaurants, invoiceRisks };
}

export async function getAdminBillingData(): Promise<AdminBillingData> {
  try {
    const [payments, restaurants, revenue, subscriptions, invoices] = await Promise.all([
      prisma.payment.findMany({ include: { order: { include: { restaurant: true, customer: true } } }, orderBy: { paidAt: "desc" }, take: 30 }),
      prisma.restaurant.findMany({ include: { _count: { select: { orders: true } }, orders: true }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
      prisma.restaurantSubscription.findMany({ include: { plan: true, restaurant: true, invoices: true }, orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.invoice.findMany({ include: { restaurant: true }, orderBy: { createdAt: "desc" }, take: 40 })
    ]);
    if (!payments.length && !restaurants.length && !subscriptions.length && !invoices.length) return emptyBillingData();
    const formattedPayments = payments.map((payment) => ({ id: payment.id, orderNumber: payment.order?.orderNumber ?? "—", restaurant: payment.order?.restaurant?.name ?? "—", customer: payment.order?.customer?.name ?? "—", method: payment.method, status: payment.status, amount: payment.amount, commission: Math.round(payment.amount * 0.15), providerRef: payment.providerRef ?? "—", paidAt: payment.paidAt?.toLocaleString("fr-FR") ?? "Non payé" }));
    const plans = restaurants.map((restaurant) => {
      const restaurantRevenue = restaurant.orders.reduce((sum, order) => sum + order.total, 0);
      const subscription = subscriptions.find((item) => item.restaurantId === restaurant.id);
      const plan = subscription?.plan;
      return { id: restaurant.id, restaurant: restaurant.name, status: restaurant.status, plan: plan?.name ?? (restaurant.isPopular ? "Premium" : "Starter"), subscriptionStatus: subscription?.status ?? "NON_SUBSCRIBED", invoices: subscription?.invoices.length ?? 0, monthlyFee: plan?.monthlyFee ?? (restaurant.isPopular ? 15000 : 0), commissionRate: plan?.commissionRate ?? (restaurant.isPopular ? 12 : 15), orders: restaurant._count.orders, revenue: restaurantRevenue };
    });
    const formattedInvoices = invoices.map((invoice) => ({ id: invoice.id, number: invoice.number, restaurant: invoice.restaurant.name, status: invoice.status, amount: invoice.amount, commission: invoice.commission, dueAt: invoice.dueAt?.toLocaleDateString("fr-FR") ?? "—", paidAt: invoice.paidAt?.toLocaleDateString("fr-FR") ?? "Non payé" }));
    const reportMap = new Map<string, AdminFinancialReportRow>();
    const ensureReportRow = (month: string, status: string) => {
      const key = `${month}:${status}`;
      const existing = reportMap.get(key);
      if (existing) return existing;
      const row = { month, status, orderRevenue: 0, orderCommission: 0, invoiceAmount: 0, invoiceCommission: 0, estimatedCommission: 0 };
      reportMap.set(key, row);
      return row;
    };
    payments.forEach((payment) => {
      const date = payment.paidAt ?? payment.order?.createdAt ?? new Date();
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const row = ensureReportRow(month, payment.status);
      row.orderRevenue += payment.amount;
      row.orderCommission += Math.round(payment.amount * 0.15);
      row.estimatedCommission += Math.round(payment.amount * 0.15);
    });
    invoices.forEach((invoice) => {
      const date = invoice.paidAt ?? invoice.dueAt ?? invoice.createdAt;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const row = ensureReportRow(month, invoice.status);
      row.invoiceAmount += invoice.amount;
      row.invoiceCommission += invoice.commission;
      row.estimatedCommission += invoice.commission;
    });
    const report = Array.from(reportMap.values()).sort((a, b) => b.month.localeCompare(a.month) || a.status.localeCompare(b.status));
    const paid = formattedPayments.filter((payment) => payment.status === "PAID").reduce((sum, payment) => sum + payment.amount, 0);
    const pending = formattedPayments.filter((payment) => payment.status === "PENDING").reduce((sum, payment) => sum + payment.amount, 0);
    const failed = formattedPayments.filter((payment) => payment.status === "FAILED").reduce((sum, payment) => sum + payment.amount, 0);
    const refunded = formattedPayments.filter((payment) => payment.status === "REFUNDED").reduce((sum, payment) => sum + payment.amount, 0);
    const totalRevenue = revenue._sum.amount ?? paid;
    const invoiceOpen = formattedInvoices.filter((invoice) => invoice.status === "OPEN").reduce((sum, invoice) => sum + invoice.amount, 0);
    const invoicePaid = formattedInvoices.filter((invoice) => invoice.status === "PAID").reduce((sum, invoice) => sum + invoice.amount, 0);
    const invoiceUncollectible = formattedInvoices.filter((invoice) => invoice.status === "UNCOLLECTIBLE").reduce((sum, invoice) => sum + invoice.amount, 0);
    const analytics = buildAnalytics(formattedPayments, plans, formattedInvoices);
    return { summary: { revenue: totalRevenue, commission: Math.round(totalRevenue * 0.15), paid, pending, failed, refunded, invoiceOpen, invoicePaid, invoiceUncollectible }, payments: formattedPayments, plans, invoices: formattedInvoices, report, analytics };
  } catch (error) {
    warnFallback("getAdminBillingData", error);
    return emptyBillingData();
  }
}

