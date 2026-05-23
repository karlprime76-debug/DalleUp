import { getServerSession } from "next-auth";
import { Bike, Building2, CreditCard, ReceiptText, Users } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminShell } from "@/components/layout/admin-shell";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { DriverShell } from "@/components/layout/driver-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { authOptions } from "@/lib/auth/config";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { getOpsDrivers, getOpsOrders, getOpsRestaurants, getOpsStats } from "@/lib/data/ops";
import { formatPrice } from "@/lib/pricing/delivery";

const navByRole = {
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/orders", label: "Commandes" },
    { href: "/admin/restaurants", label: "Restaurants" },
    { href: "/admin/drivers", label: "Livreurs" },
    { href: "/admin/settings", label: "Paramètres" }
  ],
  restaurant: [
    { href: "/restaurant/dashboard", label: "Dashboard" },
    { href: "/restaurant/orders", label: "Commandes" },
    { href: "/restaurant/menu", label: "Menu" },
    { href: "/restaurant/settings", label: "Paramètres" }
  ],
  driver: [
    { href: "/driver/dashboard", label: "Dashboard" },
    { href: "/driver/deliveries", label: "Livraisons" },
    { href: "/driver/earnings", label: "Gains" }
  ]
};

const shellByRole = {
  admin: AdminShell,
  restaurant: RestaurantShell,
  driver: DriverShell
};

export async function RoleDashboard({ role, title }: { role: keyof typeof navByRole; title: string }) {
  const session = await getServerSession(authOptions);
  const [stats, restaurants, drivers, orders] = await Promise.all([
    getOpsStats(),
    getOpsRestaurants(),
    getOpsDrivers(),
    getOpsOrders(role === "restaurant" ? { restaurantOwnerId: session?.user?.id } : role === "driver" ? { driverId: session?.user?.id } : undefined)
  ]);
  const Shell = shellByRole[role];
  return (
    <Shell title={title} nav={role !== "admin" ? navByRole[role] : undefined} sections={role === "admin" ? adminNavSections : undefined}>
      <Card className="mb-6 flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
        <div><p className="text-sm font-black text-dalle-orange">Connecté</p><h2 className="text-2xl font-black">{session?.user?.name ?? "Utilisateur DalleUp"}</h2><p className="text-sm text-neutral-500">{session?.user?.email} · {session?.user?.role}</p></div>
        <SignOutButton />
      </Card>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Commandes" value={String(stats.orders)} icon={<ReceiptText size={22} />} trend="+12% cette semaine" />
        <StatCard label="Restaurants" value={String(restaurants.length)} icon={<Building2 size={22} />} trend="Actifs" />
        <StatCard label="Livreurs" value={String(drivers.length)} icon={<Bike size={22} />} trend="Disponibles" />
        <StatCard label="CA" value={formatPrice(stats.revenue)} icon={<CreditCard size={22} />} trend="Commission suivie" />
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="border-b border-black/5 p-5"><h2 className="text-xl font-black">Commandes récentes</h2><p className="text-sm text-neutral-500">Suivez vos commandes en temps réel.</p></div>
          <div className="divide-y divide-black/5">{orders.map((order) => <div key={order.id} className="grid gap-3 p-5 md:grid-cols-[120px_1fr_160px_130px]"><p className="font-black">{order.id}</p><div><p className="font-bold">{order.restaurant}</p><p className="text-sm text-neutral-500">{order.customer} · {order.address}</p></div><OrderStatusBadge status={order.status} /><button className="rounded-2xl bg-dalle-charcoal px-4 py-2 text-sm font-black text-white">Voir</button></div>)}</div>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-black">Actions rapides</h2>
          <div className="mt-4 grid gap-3">
            {role === "admin" ? <><Badge variant="orange">Approuver restaurants</Badge><Badge variant="lime">Assigner livreur</Badge><Badge variant="soft">Configurer frais</Badge></> : null}
            {role === "restaurant" ? <><Badge variant="orange">Accepter commande</Badge><Badge variant="lime">Plat disponible</Badge><Badge variant="soft">Voir ventes</Badge></> : null}
            {role === "driver" ? <><Badge variant="orange">Marquer récupérée</Badge><Badge variant="lime">Marquer livrée</Badge><Badge variant="soft">Voir gains</Badge></> : null}
          </div>
          <div className="mt-6 rounded-3xl bg-neutral-50 p-4"><Users className="text-dalle-orange" /><p className="mt-3 font-black">Centre d&apos;opérations DalleUp</p><p className="mt-1 text-sm text-neutral-500">Gérez vos commandes, vos livraisons et vos revenus en un seul endroit.</p></div>
        </Card>
      </div>
    </Shell>
  );
}
