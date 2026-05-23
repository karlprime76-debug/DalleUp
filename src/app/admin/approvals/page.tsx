import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { RestaurantStatusActions } from "@/components/ops/restaurant-status-actions";
import { DriverStatusActions } from "@/components/ops/driver-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOpsRestaurants, getOpsDrivers } from "@/lib/data/ops";
import { getResidenceProofStatus, getVerificationManifest } from "@/lib/supabase/verification-storage";


function statusVariant(status: string) {
  if (status === "APPROVED" || status === "AVAILABLE") return "lime";
  if (status === "SUSPENDED" || status === "CLOSED") return "orange";
  return "neutral";
}

function residenceStatusLabel(status: string) {
  if (status === "missing") return "Preuve de résidence manquante";
  if (status === "submitted") return "Preuve de résidence en attente";
  if (status === "approved") return "Preuve de résidence validée";
  if (status === "rejected") return "Preuve de résidence rejetée";
  if (status === "expired") return "Preuve de résidence expirée";
  return "Preuve de résidence à renouveler bientôt";
}

export default async function AdminApprovalsPage() {
  await requireAdmin();
  const [restaurants, drivers] = await Promise.all([getOpsRestaurants(), getOpsDrivers()]);
  const pendingRestaurants = restaurants.filter((r) => r.status === "PENDING");
  const pendingDrivers = drivers.filter((d) => d.status === "PENDING");
  const restaurantResidenceProofs = new Map(
    await Promise.all(
      pendingRestaurants.map(async (restaurant) => {
        const manifest = restaurant.ownerId ? await getVerificationManifest(restaurant.ownerId) : null;
        return [restaurant.id, getResidenceProofStatus(manifest)] as const;
      })
    )
  );
  const driverResidenceProofs = new Map(
    await Promise.all(
      pendingDrivers.map(async (driver) => {
        const manifest = driver.dbId ? await getVerificationManifest(driver.dbId) : null;
        return [driver.id, getResidenceProofStatus(manifest)] as const;
      })
    )
  );

  return (
    <AdminShell title="Validations en attente" sections={adminNavSections}>
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
                    <p className="mt-1 text-xs font-bold text-neutral-400">{residenceStatusLabel(restaurantResidenceProofs.get(restaurant.id)?.lifecycleStatus ?? "missing")}</p>
                    <p className="text-xs text-neutral-400">Expiration : {restaurantResidenceProofs.get(restaurant.id)?.document?.expiresAt ? new Date(restaurantResidenceProofs.get(restaurant.id)!.document!.expiresAt!).toLocaleDateString("fr-FR") : "—"}</p>
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
                    <p className="mt-1 text-xs font-bold text-neutral-400">{residenceStatusLabel(driverResidenceProofs.get(driver.id)?.lifecycleStatus ?? "missing")}</p>
                    <p className="text-xs text-neutral-400">Expiration : {driverResidenceProofs.get(driver.id)?.document?.expiresAt ? new Date(driverResidenceProofs.get(driver.id)!.document!.expiresAt!).toLocaleDateString("fr-FR") : "—"}</p>
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
