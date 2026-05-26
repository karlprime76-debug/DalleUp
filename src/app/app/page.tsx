import { ShoppingBag } from "lucide-react";
import { CategoryPill } from "@/components/customer/category-pill";
import { PromoBanner } from "@/components/customer/promo-banner";
import { RestaurantCard } from "@/components/customer/restaurant-card";
import { TrendingDishCard } from "@/components/customer/trending-dish-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import { getPopularRestaurants, getRestaurantCategories, getTrendingMenuItems } from "@/lib/data/restaurants";

export default async function CustomerHomePage() {
  const [categories, restaurants, trendingItems] = await Promise.all([getRestaurantCategories(), getPopularRestaurants(), getTrendingMenuItems()]);

  return (
    <>
      <main className="px-4 py-5">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-black text-dalle-orange">Salut 👋</p>
              <h1 className="text-3xl font-black leading-tight text-dalle-charcoal">Qu’est-ce qu’on mange aujourd’hui ?</h1>
            </div>
            <Badge variant="lime" className="hidden sm:inline-flex">Ouvert</Badge>
          </div>

          <SearchInput className="mt-5" placeholder="Rechercher pizza, burger, riz..." />
          <div className="mt-5"><PromoBanner /></div>

          <section className="mt-6"><div className="flex gap-2 overflow-x-auto pb-2">{categories.map((category, index) => <CategoryPill key={category} href={`/app/restaurants?category=${category}`} label={category} active={index === 0} />)}</div></section>
          <section className="mt-7"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Restaurants populaires</h2><ButtonLink href="/app/restaurants" variant="outline" size="sm">Voir tout</ButtonLink></div><div className="mt-4 grid gap-5 md:grid-cols-3">{restaurants.slice(0, 3).map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div></section>
          <section className="mt-8"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Plats tendances</h2><Badge variant="soft">Hot</Badge></div><div className="mt-4 grid gap-4 md:grid-cols-2">{trendingItems.slice(0, 6).map((item, index) => <TrendingDishCard key={item.id} item={item} rank={index} />)}</div></section>
        </div>
      </main>
      <ButtonLink href="/app/cart" className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-50 shadow-2xl md:hidden" variant="dark"><ShoppingBag size={18} /> Panier</ButtonLink>
    </>
  );
}
