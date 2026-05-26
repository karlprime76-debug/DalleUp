import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const [totalOrders, totalRestaurants, totalDrivers, totalUsers] = await Promise.all([
    prisma.order.count(),
    prisma.restaurant.count(),
    prisma.user.count({ where: { role: "DELIVERY_DRIVER" } }),
    prisma.user.count()
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
      <Card className="mt-6 p-5">
        <h2 className="text-xl font-black">Paramètres système</h2>
        <p className="mt-2 text-neutral-500">Cette page regroupe les paramètres globaux de la plateforme. Les fonctionnalités avancées seront ajoutées progressivement.</p>
        <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm text-neutral-700">
          <p className="font-bold">En cours de développement</p>
          <p>La configuration des frais de livraison par zone, des seuils de commission et des notifications globales sera disponible prochainement.</p>
        </div>
      </Card>
    </AdminShell>
  );
}




