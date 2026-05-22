import { ShoppingBag, Star } from "lucide-react";
import { MenuItemCard } from "@/components/customer/menu-item-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDisplayCategory, isComplementCategory, productFilters } from "@/lib/catalog/product-types";
import { getMenuItemsByRestaurantId, getRestaurantById } from "@/lib/data/restaurants";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function RestaurantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = await getRestaurantById(id);
  if (!restaurant) return <main className="px-4 py-8"><div className="mx-auto max-w-3xl"><EmptyState title="Restaurant introuvable" description="Ce restaurant n’est pas disponible pour le moment." actionHref="/app/restaurants" actionLabel="Voir les restaurants" /></div></main>;
  const items = (await getMenuItemsByRestaurantId(id)).map((item) => ({ ...item, restaurantId: restaurant.id, restaurantName: restaurant.name }));
  const categories = Array.from(new Set(items.map((item) => getDisplayCategory(item.category))));
  const complements = items.filter((item) => item.active !== false && isComplementCategory(item.category)).slice(0, 6);

  return (
    <main className="px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <Card className="overflow-hidden">
          <div className="h-56 bg-cover bg-center md:h-72" style={{ backgroundImage: `url(${restaurant.image})` }} />
          <div className="p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div><div className="flex gap-2"><Badge variant="orange">Ouvert</Badge>{restaurant.popular ? <Badge variant="lime">Populaire</Badge> : null}</div><h1 className="mt-3 text-4xl font-black text-dalle-charcoal">{restaurant.name}</h1><p className="mt-2 text-neutral-500">{restaurant.description}</p></div>
              <div className="grid grid-cols-3 gap-2 text-center md:min-w-80"><div className="rounded-3xl bg-orange-50 p-3"><p className="flex items-center justify-center gap-1 font-black text-dalle-orange"><Star size={15} fill="currentColor" />{restaurant.rating}</p><p className="text-xs text-neutral-500">Note</p></div><div className="rounded-3xl bg-neutral-50 p-3"><p className="font-black">{restaurant.delay}</p><p className="text-xs text-neutral-500">Délai</p></div><div className="rounded-3xl bg-neutral-50 p-3"><p className="font-black">{formatPrice(restaurant.deliveryFee)}</p><p className="text-xs text-neutral-500">Livraison</p></div></div>
            </div>
          </div>
        </Card>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{productFilters.map((filter, index) => <Badge key={filter} variant={index === 0 ? "dark" : "soft"} className="shrink-0">{filter}</Badge>)}</div>
        {complements.length ? <section className="mt-6"><div className="flex items-center justify-between gap-3"><div><p className="font-black text-dalle-orange">Complétez votre repas</p><h2 className="text-2xl font-black text-dalle-charcoal">Boissons disponibles, desserts et extras</h2></div><Badge variant="neutral">Options et boissons</Badge></div><div className="mt-4 grid gap-4 md:grid-cols-2">{complements.map((item) => <MenuItemCard key={item.id} item={item} restaurantName={restaurant.name} />)}</div></section> : null}
        <section className="mt-8"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="font-black text-dalle-orange">Produits du restaurant</p><h2 className="text-3xl font-black text-dalle-charcoal">Catalogue disponible</h2></div><div className="flex gap-2 overflow-x-auto pb-2">{categories.map((category) => <Badge key={category} variant="soft" className="shrink-0">{category}</Badge>)}</div></div><div className="mt-5 grid gap-4 md:grid-cols-2">{items.map((item, index) => <MenuItemCard key={item.id} item={item} popular={index < 2} restaurantName={restaurant.name} />)}</div></section>
      </div>
      <ButtonLink href="/app/cart" className="fixed bottom-24 right-4 z-40 shadow-2xl md:hidden" variant="dark"><ShoppingBag size={18} /> Panier</ButtonLink>
    </main>
  );
}
