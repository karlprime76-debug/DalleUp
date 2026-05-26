import { AdminBillingAnalyticsPanel } from "@/components/admin/admin-billing-analytics";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminFinancialReport } from "@/components/admin/admin-financial-report";
import { AdminInvoiceStatusActions } from "@/components/admin/admin-invoice-status-actions";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { getAdminBillingData } from "@/lib/data/admin-billing";
import { formatPrice } from "@/lib/pricing/delivery";


function statusVariant(status: string) {
  if (status === "PAID" || status === "APPROVED" || status === "ACTIVE") return "lime";
  if (status === "FAILED" || status === "REFUNDED" || status === "SUSPENDED" || status === "CLOSED" || status === "UNCOLLECTIBLE") return "orange";
  return "neutral";
}

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const billing = await getAdminBillingData();
  return <AdminShell title="Admin Paiements" sections={adminNavSections}><div className="grid gap-4 md:grid-cols-4"><StatCard label="CA payé" value={formatPrice(billing.summary.revenue)} /><StatCard label="Commission" value={formatPrice(billing.summary.commission)} /><StatCard label="Factures ouvertes" value={formatPrice(billing.summary.invoiceOpen)} /><StatCard label="Factures payées" value={formatPrice(billing.summary.invoicePaid)} /></div><Card className="mt-5 p-5"><AdminBillingAnalyticsPanel analytics={billing.analytics} /></Card><Card className="mt-5 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black">Reporting financier</h2><p className="mt-2 text-sm text-neutral-500">Agrégats mensuels, filtres et export CSV.</p></div><ButtonLink href="/admin/payments/report" size="sm" variant="outline">Rapport imprimable</ButtonLink></div><div className="mt-4"><AdminFinancialReport rows={billing.report} /></div></Card><div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]"><Card className="p-5"><h2 className="text-xl font-black">Factures restaurants</h2><p className="mt-2 text-sm text-neutral-500">Gestion admin des factures ouvertes, payées, annulées ou irrécouvrables.</p><div className="mt-4 grid gap-3">{billing.invoices.map((invoice) => <div key={invoice.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 xl:grid-cols-[1fr_120px_120px_1fr]"><div><p className="font-black">{invoice.number}</p><p className="text-sm text-neutral-500">{invoice.restaurant} · échéance {invoice.dueAt}</p><p className="text-xs font-bold text-neutral-400">Payé : {invoice.paidAt}</p></div><Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge><div><p className="font-black text-dalle-orange">{formatPrice(invoice.amount)}</p><p className="text-xs font-bold text-neutral-500">Com. {formatPrice(invoice.commission)}</p></div><AdminInvoiceStatusActions invoiceId={invoice.id} currentStatus={invoice.status} disabled={false} /></div>)}</div></Card><div className="grid h-fit gap-5"><Card className="p-5"><h2 className="text-xl font-black">Abonnements restaurants</h2><div className="mt-4 grid gap-3">{billing.plans.map((plan) => <div key={plan.id} className="rounded-2xl bg-neutral-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{plan.restaurant}</p><p className="text-sm text-neutral-500">{plan.plan} · commission {plan.commissionRate}%</p><p className="text-xs font-bold text-neutral-400">{plan.subscriptionStatus} · {plan.invoices} facture(s)</p></div><Badge variant={statusVariant(plan.status)}>{plan.status}</Badge></div><div className="mt-3 flex justify-between text-sm"><span>{plan.orders} commandes</span><b>{formatPrice(plan.monthlyFee)}/mois</b></div></div>)}</div></Card><Card className="p-5"><h2 className="text-xl font-black">Paiements commandes</h2><div className="mt-4 grid gap-3">{billing.payments.map((payment) => <div key={payment.id} className="rounded-2xl bg-neutral-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{payment.orderNumber}</p><p className="text-sm text-neutral-500">{payment.customer} · {payment.restaurant}</p><p className="text-xs text-neutral-500">{payment.method} · {payment.providerRef}</p></div><Badge variant={statusVariant(payment.status)}>{payment.status}</Badge></div><div className="mt-3 flex justify-between text-sm"><b className="text-dalle-orange">{formatPrice(payment.amount)}</b><span>Com. {formatPrice(payment.commission)}</span></div></div>)}</div></Card></div></div></AdminShell>;
}







