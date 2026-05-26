import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

export default async function AdminSponsoringStatsPage() {
  await requireAdmin();

  const [sponsoredCount, totalOrdersLast7Days, totalOrdersLast30Days, topRestaurants] = await Promise.all([
    prisma.restaurant.count({ where: { isPopular: true } }),
    prisma.order.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.order.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    prisma.restaurant.findMany({
      where: { status: "APPROVED" },
      orderBy: { orders: { _count: "desc" } },
      take: 5,
      select: { id: true, name: true, isPopular: true, _count: { select: { orders: true } } }
    })
  ]);

  return (
    <AdminShell title="Statistiques sponsoring" sections={adminNavSections}>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-neutral-500">Restaurants sponsorisés</p>
          <p className="mt-2 text-3xl font-black text-dalle-orange">{sponsoredCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-neutral-500">Commandes (7 jours)</p>
          <p className="mt-2 text-3xl font-black text-dalle-charcoal">{totalOrdersLast7Days}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-neutral-500">Commandes (30 jours)</p>
          <p className="mt-2 text-3xl font-black text-dalle-charcoal">{totalOrdersLast30Days}</p>
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <h2 className="text-xl font-black">Top restaurants par volume</h2>
        <div className="mt-4 grid gap-3">
          {topRestaurants.length === 0 ? (
            <p className="text-sm font-bold text-neutral-400">Aucune donnée disponible.</p>
          ) : (
            topRestaurants.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-dalle-charcoal text-sm font-black text-white">#{i + 1}</span>
                  <div>
                    <p className="font-black">{r.name}</p>
                    <p className="text-xs text-neutral-500">{r._count.orders} commandes</p>
                  </div>
                </div>
                {r.isPopular ? <Badge variant="lime">Sponsorisé</Badge> : null}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="mt-5 p-5">
        <h2 className="text-xl font-black">Tracking clics et impressions</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Le tracking détaillé nécessite une migration pour ajouter les tables <code className="rounded bg-neutral-100 px-1 font-mono text-xs">SponsoredCampaign</code>,
          <code className="rounded bg-neutral-100 px-1 font-mono text-xs">SponsoredClick</code> et <code className="rounded bg-neutral-100 px-1 font-mono text-xs">SponsoredImpression</code>.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          En attendant, un endpoint <code className="rounded bg-neutral-100 px-1 font-mono text-xs">POST /api/sponsorships/[id]/click</code> est prêt pour enregistrer les clics côté serveur.
        </p>
      </Card>
    </AdminShell>
  );
}
