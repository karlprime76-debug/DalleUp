import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { RestaurantStatusActions } from "@/components/ops/restaurant-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOpsRestaurants } from "@/lib/data/ops";


function statusVariant(status: string) {
  if (status === "APPROVED") return "lime";
  if (status === "SUSPENDED" || status === "CLOSED") return "orange";
  return "neutral";
}

export default async function AdminRestaurantsPage() {
  await requireAdmin();
  const restaurants = await getOpsRestaurants();
  return <AdminShell title="Admin Restaurants" sections={adminNavSections}><Card className="p-5"><h2 className="text-xl font-black">Restaurants</h2><p className="mt-2 text-sm text-neutral-500">Gestion Prisma des statuts, fallback mock lecture seule si la DB est indisponible.</p><div className="mt-4 grid gap-3">{restaurants.map((restaurant) => <div key={restaurant.id} className="grid gap-4 rounded-2xl bg-neutral-50 p-4 xl:grid-cols-[1.4fr_1.2fr_120px_120px_1.2fr]"><div><p className="font-black">{restaurant.name}</p><p className="text-sm text-neutral-500">{restaurant.address}</p><p className="text-xs font-bold text-neutral-400">{restaurant.phone}</p></div><div><p className="text-sm font-bold">Propriétaire</p><p className="text-sm text-neutral-500">{restaurant.owner}</p></div><div><p className="font-black">{restaurant.rating} ⭐</p><p className="text-xs text-neutral-500">{restaurant.menuItems} plats</p></div><div><p className="font-black">{restaurant.orders}</p><p className="text-xs text-neutral-500">commandes</p></div><div className="grid gap-3"><Badge variant={statusVariant(restaurant.status)}>{restaurant.status}</Badge><RestaurantStatusActions restaurantId={restaurant.dbId} /></div></div>)}</div></Card></AdminShell>;
}


