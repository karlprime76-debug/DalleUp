import { RestaurantCard } from "@/components/customer/restaurant-card";
import { SearchInput } from "@/components/ui/input";
import { getRestaurantCategories, getRestaurants, getRestaurantsByCategory } from "@/lib/data/restaurants";

export default async function AppRestaurantsPage({ searchParams }: { searchParams?: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const selectedCategory = params?.category;
  const [categories, restaurants] = await Promise.all([getRestaurantCategories(), selectedCategory ? getRestaurantsByCategory(selectedCategory) : getRestaurants()]);
  return <main className="px-4 py-6"><div className="mx-auto max-w-6xl"><h1 className="text-3xl font-black">Explorer</h1><SearchInput className="mt-5" placeholder="Pizza, burger, riz..." /><div className="mt-5 flex gap-2 overflow-x-auto pb-2">{categories.map((category) => <span key={category} className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black text-dalle-charcoal shadow-sm">{category}</span>)}</div><div className="mt-6 grid gap-5 md:grid-cols-3">{restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div></div></main>;
}
