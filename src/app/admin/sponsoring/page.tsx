import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { SponsorshipToggle } from "@/components/admin/sponsorship-toggle";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

export default async function AdminSponsoringPage() {
  await requireAdmin();
  const restaurants = await prisma.restaurant.findMany({
    orderBy: [{ isPopular: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      status: true,
      isPopular: true,
      rating: true,
      image: true,
      _count: { select: { menuItems: true, orders: true } }
    }
  }).catch(() => []);

  const sponsored = restaurants.filter((r) => r.isPopular);
  const standard = restaurants.filter((r) => !r.isPopular);

  return (
    <AdminShell title="Restaurants sponsorisés" sections={adminNavSections}>
      <Card className="p-5">
        <h2 className="text-xl font-black">Mise en avant</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Activez ou désactivez la mise en avant d’un restaurant. Les restaurants mis en avant apparaissent en priorité sur l’accueil client.
        </p>
        <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm text-neutral-700">
          <p className="font-bold">Note MVP</p>
          <p>Le modèle actuel utilise le champ <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">isPopular</code> sur Restaurant. Pour une gestion complète avec dates, priorités, statuts de campagne et tracking des clics, une migration Prisma est nécessaire.</p>
        </div>

        {sponsored.length > 0 ? (
          <section className="mt-6">
            <h3 className="text-lg font-black text-dalle-orange">Restaurants sponsorisés ({sponsored.length})</h3>
            <div className="mt-3 grid gap-3">
              {sponsored.map((restaurant) => (
                <div key={restaurant.id} className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:grid-cols-[1fr_120px_160px]">
                  <div>
                    <p className="font-black">{restaurant.name}</p>
                    <p className="text-sm text-neutral-500">{restaurant.address}</p>
                    <p className="mt-1 text-xs text-neutral-400">{restaurant._count.menuItems} plats · {restaurant._count.orders} commandes · {restaurant.rating} ⭐</p>
                  </div>
                  <Badge variant={restaurant.status === "APPROVED" ? "lime" : "neutral"}>{restaurant.status}</Badge>
                  <SponsorshipToggle restaurantId={restaurant.id} initialValue={restaurant.isPopular} restaurantName={restaurant.name} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <h3 className="text-lg font-black">Tous les restaurants ({restaurants.length})</h3>
          <div className="mt-3 grid gap-3">
            {restaurants.length === 0 ? (
              <p className="text-sm font-bold text-neutral-400">Aucun restaurant trouvé.</p>
            ) : (
              [...sponsored, ...standard].map((restaurant) => (
                <div key={restaurant.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 md:grid-cols-[1fr_120px_160px]">
                  <div>
                    <p className="font-black">{restaurant.name}</p>
                    <p className="text-sm text-neutral-500">{restaurant.address}</p>
                    <p className="mt-1 text-xs text-neutral-400">{restaurant._count.menuItems} plats · {restaurant._count.orders} commandes · {restaurant.rating} ⭐</p>
                  </div>
                  <Badge variant={restaurant.status === "APPROVED" ? "lime" : "neutral"}>{restaurant.status}</Badge>
                  <SponsorshipToggle restaurantId={restaurant.id} initialValue={restaurant.isPopular} restaurantName={restaurant.name} />
                </div>
              ))
            )}
          </div>
        </section>
      </Card>
    </AdminShell>
  );
}
