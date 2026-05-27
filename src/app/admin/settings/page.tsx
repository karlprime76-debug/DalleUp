import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { StatCard } from "@/components/ui/stat-card";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/pricing/delivery";
import { getPlatformSettings } from "@/lib/settings/platform-settings";
import PlatformSettingsForm from "@/components/admin/platform-settings-form";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const [totalOrders, totalRestaurants, totalDrivers, totalUsers, settings] = await Promise.all([
    prisma.order.count(),
    prisma.restaurant.count(),
    prisma.user.count({ where: { role: "DELIVERY_DRIVER" } }),
    prisma.user.count(),
    getPlatformSettings().catch(() => null),
  ]);

  const revenueAgg = await prisma.order.aggregate({
    where: { status: { not: "CANCELLED" } },
    _sum: { total: true }
  });
  const totalRevenue = revenueAgg._sum.total ?? 0;

  return (
    <AdminShell title="Paramètres" sections={adminNavSections}>
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Commandes" value={String(totalOrders)} />
        <StatCard label="Restaurants" value={String(totalRestaurants)} />
        <StatCard label="Livreurs" value={String(totalDrivers)} />
        <StatCard label="Utilisateurs" value={String(totalUsers)} />
        <StatCard label="CA" value={formatPrice(totalRevenue)} />
      </div>

      {settings ? (
        <PlatformSettingsForm initial={settings as never} />
      ) : (
        <div className="mt-6 rounded-2xl bg-orange-50 p-5 text-sm text-neutral-700">
          <p className="font-bold">Impossible de charger les paramètres</p>
          <p>Vérifiez la connexion à la base de données.</p>
        </div>
      )}
    </AdminShell>
  );
}




