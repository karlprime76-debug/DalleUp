import { getServerSession } from "next-auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusActions } from "@/components/ops/order-status-actions";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { authOptions } from "@/lib/auth/config";
import { getOpsOrders } from "@/lib/data/ops";
import { getRestaurantMenuForOwner } from "@/lib/data/restaurant-menu";
import { formatPrice } from "@/lib/pricing/delivery";

const nav = [{ href: "/restaurant/dashboard", label: "Accueil" }, { href: "/restaurant/orders", label: "Commandes" }, { href: "/restaurant/menu", label: "Menu" }, { href: "/restaurant/billing", label: "Facturation" }, { href: "/restaurant/settings", label: "Paramètres" }];

export default async function RestaurantDashboardPage() {
  const session = await getServerSession(authOptions);
  const [orders, menu] = await Promise.all([getOpsOrders({ restaurantOwnerId: session?.user?.id }), getRestaurantMenuForOwner(session?.user?.id)]);
  const activeOrders = orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  return <DashboardShell title="Restaurant Dashboard" nav={nav}><div className="grid gap-5"><div className="grid gap-4 md:grid-cols-3"><Card className="p-5"><p className="text-sm font-bold text-neutral-500">Restaurant</p><h2 className="mt-2 text-2xl font-black">{menu.restaurant?.name ?? "Restaurant"}</h2></Card><Card className="p-5"><p className="text-sm font-bold text-neutral-500">Commandes actives</p><h2 className="mt-2 text-3xl font-black text-dalle-orange">{activeOrders.length}</h2></Card><Card className="p-5"><p className="text-sm font-bold text-neutral-500">CA commandes</p><h2 className="mt-2 text-3xl font-black text-dalle-orange">{formatPrice(revenue)}</h2></Card></div><Card className="p-5"><h2 className="text-xl font-black">Commandes à suivre</h2>{activeOrders.length ? <div className="mt-4 grid gap-3">{activeOrders.slice(0, 6).map((order) => <div key={order.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 lg:grid-cols-[120px_1fr_150px_1fr]"><b>{order.id}</b><div><p>{order.customer}</p>{order.items.length ? <p className="mt-1 text-sm text-neutral-500">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}</p> : null}</div><OrderStatusBadge status={order.status} /><OrderStatusActions orderId={order.dbId} role="restaurant" /></div>)}</div> : <div className="mt-5"><EmptyState title="Aucune commande active" description="Les nouvelles commandes à préparer apparaîtront ici." /></div>}</Card></div></DashboardShell>;
}
