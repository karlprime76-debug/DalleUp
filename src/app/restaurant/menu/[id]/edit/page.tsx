import { redirect } from "next/navigation";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { MenuItemForm } from "@/components/restaurant/menu-item-form";
import { Card } from "@/components/ui/card";
import { requireRestaurant } from "@/lib/auth/guards";
import { getRestaurantMenuItemForOwner } from "@/lib/data/restaurant-menu";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { session } = await requireRestaurant();
  const { id } = await params;
  const item = await getRestaurantMenuItemForOwner(session.user.id, id);
  if (!item) redirect("/restaurant/menu");
  return <RestaurantShell title="Éditer produit" sections={restaurantNavSections}><Card className="mx-auto max-w-2xl p-5"><h2 className="text-xl font-black">{item.name}</h2><p className="mb-5 mt-2 text-sm text-neutral-500">Modifiez le nom, le prix, la catégorie, la disponibilité et la photo du produit.</p><MenuItemForm item={{ id: item.dbId ?? item.id, name: item.name, description: item.description, price: item.price, image: item.image, category: item.category, isActive: item.isActive }} /></Card></RestaurantShell>;
}

