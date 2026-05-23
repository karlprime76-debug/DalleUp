import { DriverShell } from "@/components/layout/driver-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { DeliveryStatusActions } from "@/components/ops/delivery-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireApprovedDriver } from "@/lib/auth/guards";
import { getOpsOrders } from "@/lib/data/ops";
import { formatPrice } from "@/lib/pricing/delivery";

const nav = [{ href: "/driver/dashboard", label: "Accueil" }, { href: "/driver/deliveries", label: "Livraisons" }, { href: "/driver/earnings", label: "Gains" }];

export default async function DriverDeliveriesPage() {
  const { session } = await requireApprovedDriver();
  const orders = await getOpsOrders({ driverId: session.user.id });
  return <DriverShell title="Livraisons" nav={nav}><Card className="p-5"><h2 className="text-xl font-black">Mes livraisons</h2><p className="mt-2 text-neutral-500">Données Prisma si disponibles, fallback mock sinon.</p><div className="mt-4 grid gap-3">{orders.map((order) => <div key={order.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 xl:grid-cols-[120px_1fr_150px_120px_1fr]"><b>{order.id}</b><span>{order.restaurant} · {order.address}</span><div className="grid gap-2"><OrderStatusBadge status={order.status} />{order.deliveryStatus ? <Badge variant="neutral">Livraison {order.deliveryStatus}</Badge> : null}</div><span className="font-black text-dalle-orange">{formatPrice(order.total)}</span><DeliveryStatusActions orderId={order.dbId} /></div>)}</div></Card></DriverShell>;
}
