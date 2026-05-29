import { RestaurantCard } from "@/components/customer/restaurant-card";
import { SiteHeader } from "@/components/layout/site-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getRestaurantCategories, getRestaurants } from "@/lib/data/restaurants";

export default async function RestaurantsPage() {
  const [categories, restaurants] = await Promise.all([getRestaurantCategories(), getRestaurants()]);
  return (
    <><SiteHeader /><main className="min-h-screen bg-dalle-cream px-4 py-10"><div className="mx-auto max-w-7xl"><h1 className="text-4xl font-black">Restaurants</h1>{categories.length ? <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{categories.map((category) => <span key={category} className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black text-dalle-charcoal shadow-sm">{category}</span>)}</div> : null}{restaurants.length ? <div className="mt-8 grid gap-5 md:grid-cols-3">{restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} hrefPrefix="/restaurants" />)}</div> : <div className="mt-8"><EmptyState title="Aucun restaurant disponible pour le moment" description="Reviens bientot, les restaurants valides apparaitront ici." /></div>}</div></main></>
  );
}
