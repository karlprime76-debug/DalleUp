import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusActions } from "@/components/ops/order-status-actions";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireApprovedRestaurant } from "@/lib/auth/guards";
import { getOpsOrders } from "@/lib/data/ops";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function RestaurantOrdersPage() {
  const { session } = await requireApprovedRestaurant();
  const orders = await getOpsOrders({ restaurantOwnerId: session.user.id });
  return <RestaurantShell title="Commandes reçues" sections={restaurantNavSections}><Card className="p-5"><h2 className="text-xl font-black">Commandes reçues</h2><p className="mt-2 text-neutral-500">Commandes liées à votre restaurant.</p>{orders.length ? <div className="mt-4 grid gap-3">{orders.map((order) => <div key={order.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 xl:grid-cols-[120px_1fr_150px_120px_1fr]"><b>{order.id}</b><div><p>{order.customer} · {order.address}</p>{order.note ? <p className="mt-1 text-sm font-bold text-neutral-600">{order.note}</p> : null}{order.items.length ? <p className="mt-1 text-sm text-neutral-500">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}</p> : null}</div><OrderStatusBadge status={order.status} /><span className="font-black text-dalle-orange">{formatPrice(order.total)}</span><OrderStatusActions orderId={order.dbId} role="restaurant" /></div>)}</div> : <div className="mt-5"><EmptyState title="Aucune commande reçue" description="Les commandes clients apparaîtront ici dès leur validation." /></div>}</Card></RestaurantShell>;
}

