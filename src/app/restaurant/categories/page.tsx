import Link from "next/link";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRestaurant } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";

export default async function RestaurantCategoriesPage() {
  const { restaurant } = await requireRestaurant();
  const categories = await prisma.menuCategory.findMany({ where: { restaurantId: restaurant.id }, orderBy: { sortOrder: "asc" } }).catch(() => []);

  return (
    <RestaurantShell title="Catégories menu" sections={restaurantNavSections}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-black">Catégories</h2>
          <p className="text-neutral-500">Organisez vos produits en catégories claires pour vos clients.</p>
        </div>
        <ButtonLink href="/restaurant/menu/new">Ajouter un produit</ButtonLink>
      </div>
      {categories.length ? (
        <div className="mt-6 grid gap-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="flex items-center justify-between p-5">
              <div>
                <p className="font-black">{cat.name}</p>
                <p className="text-sm text-neutral-500">Ordre : {cat.sortOrder}</p>
              </div>
              <Link href={`/restaurant/menu?category=${cat.id}`} className="rounded-2xl bg-dalle-charcoal px-4 py-2 text-sm font-black text-white transition hover:bg-black">Voir produits</Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-6"><EmptyState title="Aucune catégorie" description="Les catégories par défaut seront créées lors de l'onboarding." /></div>
      )}
      <Card className="mt-6 p-5">
        <h3 className="font-black">Catégories recommandées</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Plats", "Boissons", "Jus", "Desserts", "Accompagnements", "Sauces", "Suppléments", "Menus combo", "Autres"].map((c) => (
            <span key={c} className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-bold text-neutral-600">{c}</span>
          ))}
        </div>
      </Card>
    </RestaurantShell>
  );
}
