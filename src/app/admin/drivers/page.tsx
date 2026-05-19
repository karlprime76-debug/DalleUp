import { requireAdmin } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DriverStatusActions } from "@/components/ops/driver-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOpsDrivers } from "@/lib/data/ops";
import { formatPrice } from "@/lib/pricing/delivery";

const nav = [{ href: "/admin", label: "Accueil" }, { href: "/admin/orders", label: "Commandes" }, { href: "/admin/drivers", label: "Livreurs" }, { href: "/admin/users", label: "Utilisateurs" }];

function statusVariant(status: string) {
  if (status === "AVAILABLE") return "lime";
  if (status === "SUSPENDED") return "orange";
  return "neutral";
}

export default async function AdminDriversPage() {
  await requireAdmin();
  const drivers = await getOpsDrivers();
  return <DashboardShell title="Admin Livreurs" nav={nav}><Card className="p-5"><h2 className="text-xl font-black">Livreurs</h2><p className="mt-2 text-sm text-neutral-500">Gestion Prisma des statuts livreurs, fallback mock lecture seule si la DB est indisponible.</p><div className="mt-4 grid gap-3">{drivers.map((driver) => <div key={driver.id} className="grid gap-4 rounded-2xl bg-neutral-50 p-4 xl:grid-cols-[1.2fr_140px_120px_140px_1.3fr]"><div><p className="font-black">{driver.name}</p><p className="text-sm text-neutral-500">{driver.email}</p><p className="text-xs font-bold text-neutral-400">{driver.phone}</p></div><Badge variant={statusVariant(driver.status)}>{driver.status}</Badge><div><p className="font-black">{driver.deliveries}</p><p className="text-xs text-neutral-500">livraisons</p></div><div><p className="font-black text-dalle-orange">{formatPrice(driver.earnings)}</p><p className="text-xs text-neutral-500">gains estimés</p></div><DriverStatusActions driverId={driver.dbId} /></div>)}</div></Card></DashboardShell>;
}


