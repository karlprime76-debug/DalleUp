import { getServerSession } from "next-auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusActions } from "@/components/ops/order-status-actions";
import { Card } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/config";
import { getOpsOrders } from "@/lib/data/ops";
import { formatPrice } from "@/lib/pricing/delivery";

const nav = [{ href: "/restaurant/dashboard", label: "Accueil" }, { href: "/restaurant/orders", label: "Commandes" }, { href: "/restaurant/menu", label: "Menu" }, { href: "/restaurant/billing", label: "Facturation" }, { href: "/restaurant/settings", label: "Paramètres" }];

export default async function RestaurantOrdersPage() {
  const session = await getServerSession(authOptions);
  const orders = await getOpsOrders({ restaurantOwnerId: session?.user?.id });
  return <DashboardShell title="Restaurant Commandes" nav={nav}><Card className="p-5"><h2 className="text-xl font-black">Commandes reçues</h2><p className="mt-2 text-neutral-500">Données Prisma si disponibles, fallback mock sinon.</p><div className="mt-4 grid gap-3">{orders.map((order) => <div key={order.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 xl:grid-cols-[120px_1fr_150px_120px_1fr]"><b>{order.id}</b><span>{order.customer} · {order.address}</span><OrderStatusBadge status={order.status} /><span className="font-black text-dalle-orange">{formatPrice(order.total)}</span><OrderStatusActions orderId={order.dbId} role="restaurant" /></div>)}</div></Card></DashboardShell>;
}

