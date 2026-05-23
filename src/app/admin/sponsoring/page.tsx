import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";


export default async function AdminSponsoringPage() {
  await requireAdmin();
  const restaurants = await prisma.restaurant.findMany({ orderBy: [{ isPopular: "desc" }, { createdAt: "desc" }], take: 30 }).catch(() => []);

  return (
    <AdminShell title="Restaurants sponsorisés" sections={adminNavSections}>
      <Card className="p-5">
        <h2 className="text-xl font-black">Mise en avant payante</h2>
        <p className="mt-2 text-sm text-neutral-500">MVP actuel : le champ existant `isPopular` sert de mise en avant visuelle. Les dates début/fin et statuts sponsorisés nécessitent une migration dédiée.</p>
        <div className="mt-4 grid gap-3">
          {restaurants.length === 0 ? (
            <p className="text-sm font-bold text-neutral-400">Aucun restaurant configuré.</p>
          ) : (
            restaurants.map((restaurant) => (
              <div key={restaurant.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 md:grid-cols-[1fr_140px_160px]">
                <div>
                  <p className="font-black">{restaurant.name}</p>
                  <p className="text-sm text-neutral-500">{restaurant.address}</p>
                </div>
                <Badge variant={restaurant.isPopular ? "lime" : "neutral"}>{restaurant.isPopular ? "Sponsorisé" : "Standard"}</Badge>
                <Badge variant={restaurant.status === "APPROVED" ? "lime" : "neutral"}>{restaurant.status}</Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </AdminShell>
  );
}
