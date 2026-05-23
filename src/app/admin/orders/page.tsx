import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { AssignDriverActions } from "@/components/ops/assign-driver-actions";
import { OrderStatusActions } from "@/components/ops/order-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { getOpsDrivers, getOpsOrders, getOpsRestaurants, getOpsStats } from "@/lib/data/ops";
import { formatPrice } from "@/lib/pricing/delivery";


export default async function AdminOrdersPage() {
  await requireAdmin();
  const [stats, restaurants, drivers, orders] = await Promise.all([getOpsStats(), getOpsRestaurants(), getOpsDrivers(), getOpsOrders()]);
  return <AdminShell title="Admin Commandes" sections={adminNavSections}><div className="grid gap-4 md:grid-cols-4"><StatCard label="Commandes" value={String(stats.orders)} /><StatCard label="Restaurants" value={String(restaurants.length)} /><StatCard label="Livreurs" value={String(drivers.length)} /><StatCard label="CA" value={formatPrice(stats.revenue)} /></div><Card className="mt-6 p-5"><h2 className="text-xl font-black">Commandes plateforme</h2><div className="mt-4 grid gap-3">{orders.map((order) => <div key={order.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 2xl:grid-cols-[120px_1fr_150px_120px_1.1fr_1.2fr]"><b>{order.id}</b><span>{order.restaurant} · {order.customer}<br /><span className="text-xs text-neutral-500">Livreur : {order.driver}</span></span><div className="grid gap-2"><OrderStatusBadge status={order.status} />{order.deliveryStatus ? <Badge variant="neutral">Livraison {order.deliveryStatus}</Badge> : null}</div><span className="font-black text-dalle-orange">{formatPrice(order.total)}</span><OrderStatusActions orderId={order.dbId} role="admin" /><AssignDriverActions orderId={order.dbId} drivers={drivers} currentDriverId={order.driverId} /></div>)}</div></Card></AdminShell>;
}



