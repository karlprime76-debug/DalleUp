import { ArrowLeft, ShoppingBag, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { MenuItemCard } from "@/components/customer/menu-item-card";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDisplayCategory, productFilters } from "@/lib/catalog/product-types";
import { getMenuItemsByRestaurantId, getRestaurantById } from "@/lib/data/restaurants";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function PublicRestaurantDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await getRestaurantById(slug);
  if (!restaurant) notFound();
  const items = (await getMenuItemsByRestaurantId(slug)).map((item) => ({ ...item, restaurantId: restaurant.id, restaurantName: restaurant.name }));
  const categories = Array.from(new Set(items.map((item) => getDisplayCategory(item.category))));

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-dalle-cream px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <ButtonLink href="/restaurants" variant="ghost" size="sm"><ArrowLeft size={16} /> Retour restaurants</ButtonLink>
          <Card className="mt-5 overflow-hidden">
            <div className="h-56 bg-cover bg-center md:h-80" style={{ backgroundImage: `url(${restaurant.image})` }} />
            <div className="p-5 md:p-7">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap gap-2"><Badge variant="orange">{restaurant.category}</Badge>{restaurant.popular ? <Badge variant="lime">Populaire</Badge> : null}</div>
                  <h1 className="mt-3 text-4xl font-black text-dalle-charcoal md:text-5xl">{restaurant.name}</h1>
                  <p className="mt-3 max-w-2xl text-neutral-600">{restaurant.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center md:min-w-80">
                  <div className="rounded-3xl bg-orange-50 p-3"><p className="flex items-center justify-center gap-1 font-black text-dalle-orange"><Star size={15} fill="currentColor" />{restaurant.rating}</p><p className="text-xs text-neutral-500">Note</p></div>
                  <div className="rounded-3xl bg-neutral-50 p-3"><p className="font-black">{restaurant.delay}</p><p className="text-xs text-neutral-500">Délai</p></div>
                  <div className="rounded-3xl bg-neutral-50 p-3"><p className="font-black">{formatPrice(restaurant.deliveryFee)}</p><p className="text-xs text-neutral-500">Livraison</p></div>
                </div>
              </div>
              <ButtonLink href={`/app/restaurants/${restaurant.id}`} className="mt-6"><ShoppingBag size={18} /> Commander</ButtonLink>
            </div>
          </Card>
          <section className="mt-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="font-black text-dalle-orange">Produits du restaurant</p><h2 className="text-3xl font-black text-dalle-charcoal">Catalogue disponible</h2></div><div className="flex gap-2 overflow-x-auto pb-2">{productFilters.map((filter, index) => <Badge key={filter} variant={index === 0 ? "dark" : "soft"} className="shrink-0">{filter}</Badge>)}</div></div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">{categories.map((category) => <Badge key={category} variant="neutral" className="shrink-0">{category}</Badge>)}</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">{items.map((item, index) => <MenuItemCard key={item.id} item={item} popular={index < 2} restaurantName={restaurant.name} />)}</div>
            {items.length === 0 ? <Card className="mt-5 p-6 text-center font-bold text-neutral-500">Aucun produit disponible pour le moment.</Card> : null}
          </section>
        </div>
      </main>
    </>
  );
}
