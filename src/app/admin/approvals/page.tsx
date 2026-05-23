import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { RestaurantStatusActions } from "@/components/ops/restaurant-status-actions";
import { DriverStatusActions } from "@/components/ops/driver-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOpsRestaurants, getOpsDrivers } from "@/lib/data/ops";

const nav = [
  { href: "/admin", label: "Accueil" },
  { href: "/admin/orders", label: "Commandes" },
  { href: "/admin/restaurants", label: "Restaurants" },
  { href: "/admin/drivers", label: "Livreurs" },
  { href: "/admin/approvals", label: "Validations" },
  { href: "/admin/settings", label: "Paramètres" }
];

function statusVariant(status: string) {
  if (status === "APPROVED" || status === "AVAILABLE") return "lime";
  if (status === "SUSPENDED" || status === "CLOSED") return "orange";
  return "neutral";
}

export default async function AdminApprovalsPage() {
  await requireAdmin();
  const [restaurants, drivers] = await Promise.all([getOpsRestaurants(), getOpsDrivers()]);
  const pendingRestaurants = restaurants.filter((r) => r.status === "PENDING");
  const pendingDrivers = drivers.filter((d) => d.status === "PENDING");

  return (
    <AdminShell title="Validations en attente" nav={nav}>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-xl font-black">Restaurants en attente ({pendingRestaurants.length})</h2>
          <p className="mt-2 text-sm text-neutral-500">Restaurants à valider avant qu&apos;ils puissent vendre.</p>
          <div className="mt-4 grid gap-3">
            {pendingRestaurants.length === 0 ? (
              <p className="text-sm text-neutral-400">Aucun restaurant en attente.</p>
            ) : (
              pendingRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="grid gap-4 rounded-2xl bg-neutral-50 p-4 xl:grid-cols-[1.4fr_1.2fr_120px_1.2fr]">
                  <div>
                    <p className="font-black">{restaurant.name}</p>
                    <p className="text-sm text-neutral-500">{restaurant.address}</p>
                    <p className="text-xs font-bold text-neutral-400">{restaurant.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Propriétaire</p>
                    <p className="text-sm text-neutral-500">{restaurant.owner}</p>
                  </div>
                  <Badge variant={statusVariant(restaurant.status)}>{restaurant.status}</Badge>
                  <RestaurantStatusActions restaurantId={restaurant.dbId} />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-black">Livreurs en attente ({pendingDrivers.length})</h2>
          <p className="mt-2 text-sm text-neutral-500">Livreurs à valider avant qu&apos;ils puissent recevoir des livraisons.</p>
          <div className="mt-4 grid gap-3">
            {pendingDrivers.length === 0 ? (
              <p className="text-sm text-neutral-400">Aucun livreur en attente.</p>
            ) : (
              pendingDrivers.map((driver) => (
                <div key={driver.id} className="grid gap-4 rounded-2xl bg-neutral-50 p-4 xl:grid-cols-[1.2fr_140px_1.3fr]">
                  <div>
                    <p className="font-black">{driver.name}</p>
                    <p className="text-sm text-neutral-500">{driver.email}</p>
                    <p className="text-xs font-bold text-neutral-400">{driver.phone}</p>
                  </div>
                  <Badge variant={statusVariant(driver.status)}>{driver.status}</Badge>
                  <DriverStatusActions driverId={driver.dbId} />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
