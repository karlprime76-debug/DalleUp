import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";
import { RestaurantInvoiceActions } from "@/components/restaurant/restaurant-invoice-actions";
import { RestaurantPlanActions } from "@/components/restaurant/restaurant-plan-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { requireRestaurant } from "@/lib/auth/guards";
import { getRestaurantBilling } from "@/lib/data/restaurant-billing";
import { formatPrice } from "@/lib/pricing/delivery";


function statusVariant(status: string) {
  if (status === "ACTIVE" || status === "PAID") return "lime";
  if (status === "PAST_DUE" || status === "UNCOLLECTIBLE") return "orange";
  return "neutral";
}

export default async function RestaurantBillingPage() {
  const { session, restaurant } = await requireRestaurant();
  const billing = await getRestaurantBilling(session.user.id);
  return <RestaurantShell title="Facturation Restaurant" sections={restaurantNavSections}>{restaurant.status === "PENDING" ? <div className="mb-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-dalle-orange">Votre restaurant est en attente de validation.</div> : null}<div className="grid gap-4 md:grid-cols-4"><StatCard label="Plan" value={billing.plan} /><StatCard label="Mensuel" value={formatPrice(billing.monthlyFee)} /><StatCard label="Commission" value={`${billing.commissionRate}%`} /><StatCard label="Factures" value={String(billing.invoices.length)} /></div>{billing.isMock ? <Card className="mt-5 border-dashed p-4 text-sm font-bold text-dalle-orange">Fallback mock lecture seule : les abonnements Prisma ne sont pas encore disponibles.</Card> : null}<div className="mt-5 grid gap-5 xl:grid-cols-[360px_1fr]"><div className="grid h-fit gap-5"><Card className="p-5"><h2 className="text-xl font-black">Abonnement</h2><p className="mt-2 text-sm text-neutral-500">{billing.restaurant}</p><div className="mt-4 grid gap-3 text-sm"><div className="flex justify-between"><span>Statut</span><Badge variant={statusVariant(billing.subscriptionStatus)}>{billing.subscriptionStatus}</Badge></div><div className="flex justify-between"><span>Démarrage</span><b>{billing.startsAt}</b></div><div className="flex justify-between"><span>Fin</span><b>{billing.endsAt}</b></div><div className="flex justify-between"><span>Frais mensuels</span><b>{formatPrice(billing.monthlyFee)}</b></div><div className="flex justify-between"><span>Commission</span><b>{billing.commissionRate}%</b></div></div></Card><Card className="p-5"><h2 className="text-xl font-black">Changer de plan</h2><p className="mb-4 mt-2 text-sm text-neutral-500">Upgrade/downgrade sans paiement réel pour le moment.</p><RestaurantPlanActions plans={billing.availablePlans} currentPlanId={billing.planId} disabled={billing.isMock} /></Card><Card className="p-5"><h2 className="text-xl font-black">Actions factures</h2><p className="mb-4 mt-2 text-sm text-neutral-500">Paiement simulé et génération mensuelle simple.</p><RestaurantInvoiceActions invoices={billing.invoices} disabled={billing.isMock} /></Card></div><Card className="p-5"><h2 className="text-xl font-black">Factures</h2><div className="mt-4 grid gap-3">{billing.invoices.map((invoice) => <div key={invoice.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 md:grid-cols-[1fr_120px_140px_140px]"><div><p className="font-black">{invoice.number}</p><p className="text-sm text-neutral-500">Échéance {invoice.dueAt} · payé {invoice.paidAt}</p></div><Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge><p className="font-black text-dalle-orange">{formatPrice(invoice.amount)}</p><p className="text-xs font-bold text-neutral-500">Com. {formatPrice(invoice.commission)}</p></div>)}</div></Card></div></RestaurantShell>;
}


