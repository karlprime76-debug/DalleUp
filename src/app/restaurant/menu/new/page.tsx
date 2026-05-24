import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { MenuItemForm } from "@/components/restaurant/menu-item-form";
import { Card } from "@/components/ui/card";
import { requireRestaurant } from "@/lib/auth/guards";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";

export default async function NewMenuItemPage() {
  await requireRestaurant();
  return <RestaurantShell title="Nouveau produit" sections={restaurantNavSections}><Card className="mx-auto max-w-2xl p-5"><h2 className="text-xl font-black">Créer un produit</h2><p className="mb-5 mt-2 text-sm text-neutral-500">Ajoutez un plat, une boisson, un jus, un dessert ou un supplément avec son prix et sa photo.</p><MenuItemForm /></Card></RestaurantShell>;
}

