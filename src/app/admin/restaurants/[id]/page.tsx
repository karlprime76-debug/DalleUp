import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function AdminRestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const restaurant = await prisma.restaurant.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { owner: true, category: true, _count: { select: { menuItems: true, orders: true } } }
  });

  if (!restaurant) {
    return (
      <AdminShell title="Restaurant" sections={adminNavSections}>
        <Card className="p-6">
          <p className="text-neutral-500">Restaurant introuvable.</p>
        </Card>
      </AdminShell>
    );
  }

  const orders = await prisma.order.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { customer: true }
  });

  return (
    <AdminShell title={restaurant.name} sections={adminNavSections}>
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={restaurant.status === "APPROVED" ? "lime" : "neutral"}>{restaurant.status}</Badge>
          {restaurant.isPopular ? <Badge variant="orange">Sponsorisé</Badge> : null}
        </div>
        <h2 className="mt-3 text-xl font-black">{restaurant.name}</h2>
        <p className="mt-1 text-sm text-neutral-500">{restaurant.address}</p>
        <p className="mt-1 text-sm text-neutral-500">{restaurant._count.menuItems} plats · {restaurant._count.orders} commandes</p>
        <p className="mt-1 text-sm text-neutral-500">Propriétaire : {restaurant.owner?.name ?? restaurant.owner?.email ?? "—"}</p>
        <p className="mt-1 text-sm text-neutral-500">Frais de livraison : {formatPrice(restaurant.deliveryFee)}</p>
      </Card>

      <Card className="mt-5 p-5">
        <h3 className="text-lg font-black">Dernières commandes</h3>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Aucune commande pour ce restaurant.</p>
        ) : (
          <div className="mt-3 grid gap-2">
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl bg-neutral-50 p-3 text-sm">
                <span className="font-black">{o.id}</span> · {o.customer?.name ?? "Client"} · {formatPrice(o.total)} · <Badge variant="soft">{o.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminShell>
  );
}


