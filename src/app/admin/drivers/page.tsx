import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { DriverStatusActions } from "@/components/ops/driver-status-actions";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getOpsDrivers } from "@/lib/data/ops";
import { formatPrice } from "@/lib/pricing/delivery";

const allStatuses = ["PENDING", "AVAILABLE", "OFFLINE", "ON_DELIVERY", "SUSPENDED", "REJECTED"] as const;

function statusVariant(status: string) {
  if (status === "AVAILABLE") return "lime";
  if (status === "SUSPENDED" || status === "REJECTED") return "orange";
  return "neutral";
}

export default async function AdminDriversPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const filterStatus = query?.status ?? "ALL";
  const drivers = await getOpsDrivers();
  const filtered = filterStatus === "ALL" ? drivers : drivers.filter((d) => d.status === filterStatus);

  const counts = Object.fromEntries(allStatuses.map((s) => [s, drivers.filter((d) => d.status === s).length]));

  return (
    <AdminShell title="Admin Livreurs" sections={adminNavSections}>
      <Card className="p-5">
        <h2 className="text-xl font-black">Livreurs</h2>
        <p className="mt-2 text-sm text-neutral-500">Gestion des statuts et informations des livreurs.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href="/admin/drivers" variant={filterStatus === "ALL" ? "dark" : "ghost"} size="sm">Tous ({drivers.length})</ButtonLink>
          {allStatuses.map((s) => (
            <ButtonLink key={s} href={`/admin/drivers?status=${s}`} variant={filterStatus === s ? "dark" : "ghost"} size="sm">
              {s} ({counts[s] ?? 0})
            </ButtonLink>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          {filtered.length === 0 ? (
            <EmptyState title="Aucun livreur" description="Aucun livreur ne correspond à ce filtre." />
          ) : (
            filtered.map((driver) => (
              <div key={driver.id} className="grid gap-4 rounded-2xl bg-neutral-50 p-4 xl:grid-cols-[1.2fr_140px_120px_120px_140px_1.3fr]">
                <div>
                  <p className="font-black">{driver.name}</p>
                  <p className="text-sm text-neutral-500">{driver.email}</p>
                  <p className="text-xs font-bold text-neutral-400">{driver.phone}</p>
                  <p className="mt-1 text-xs text-neutral-400">{driver.vehicleType} · {driver.city}</p>
                </div>
                <Badge variant={statusVariant(driver.status)}>{driver.status}</Badge>
                <div>
                  <p className="font-black">{driver.deliveries}</p>
                  <p className="text-xs text-neutral-500">livraisons</p>
                </div>
                <div>
                  <p className="font-black text-dalle-orange">{formatPrice(driver.earnings)}</p>
                  <p className="text-xs text-neutral-500">gains estimés</p>
                </div>
                <Link href={`/admin/drivers/${driver.dbId}`} className="self-center rounded-2xl bg-white px-4 py-2 text-center text-sm font-black ring-1 ring-black/10 transition hover:bg-neutral-100">Détail</Link>
                <DriverStatusActions driverId={driver.dbId} />
              </div>
            ))
          )}
        </div>
      </Card>
    </AdminShell>
  );
}


