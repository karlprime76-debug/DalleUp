import { prisma } from "@/lib/db/prisma";
import { mapMenuItem, mapRestaurant, type AppMenuItem, type AppRestaurant } from "@/lib/data/mappers";

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp data fallback] ${source}`, error);
}

export async function getRestaurants(): Promise<AppRestaurant[]> {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { status: "APPROVED", menuItems: { some: { isActive: true } } },
      include: { category: true },
      orderBy: [{ priorityScore: "desc" }, { isPopular: "desc" }, { rating: "desc" }]
    });
    if (!restaurants.length) return [];
    return restaurants.map(mapRestaurant);
  } catch (error) {
    warnFallback("getRestaurants", error);
    return [];
  }
}

export async function getPopularRestaurants(): Promise<AppRestaurant[]> {
  try {
    const restaurants = await prisma.restaurant.findMany({ where: { isPopular: true, status: "APPROVED", menuItems: { some: { isActive: true } } }, include: { category: true }, orderBy: { rating: "desc" }, take: 6 });
    if (!restaurants.length) return [];
    return restaurants.map(mapRestaurant);
  } catch (error) {
    warnFallback("getPopularRestaurants", error);
    return [];
  }
}

export async function getRestaurantById(id: string): Promise<AppRestaurant | null> {
  try {
    const restaurant = await prisma.restaurant.findFirst({ where: { status: "APPROVED", menuItems: { some: { isActive: true } }, OR: [{ id }, { slug: id }] }, include: { category: true } });
    if (restaurant) return mapRestaurant(restaurant);
  } catch (error) {
    warnFallback("getRestaurantById", error);
  }
  return null;
}

export async function getRestaurantsByCategory(category: string): Promise<AppRestaurant[]> {
  const allRestaurants = await getRestaurants();
  return allRestaurants.filter((restaurant) => restaurant.category.toLowerCase() === category.toLowerCase());
}

export async function getRestaurantCategories(): Promise<string[]> {
  try {
    const categories = await prisma.restaurantCategory.findMany({ where: { restaurants: { some: { status: "APPROVED", menuItems: { some: { isActive: true } } } } }, orderBy: { name: "asc" } });
    if (!categories.length) return [];
    return categories.map((category) => category.name);
  } catch (error) {
    warnFallback("getRestaurantCategories", error);
    return [];
  }
}

export async function getMenuItemsByRestaurantId(restaurantId: string): Promise<AppMenuItem[]> {
  try {
    const restaurant = await prisma.restaurant.findFirst({ where: { status: "APPROVED", OR: [{ id: restaurantId }, { slug: restaurantId }] }, select: { id: true, slug: true } });
    const ids = restaurant ? [restaurant.id, restaurant.slug] : [restaurantId];
    const items = await prisma.menuItem.findMany({ where: { restaurantId: { in: ids }, isActive: true }, include: { restaurant: true, category: true }, orderBy: { createdAt: "asc" } });
    if (items.length) return items.map(mapMenuItem);
  } catch (error) {
    warnFallback("getMenuItemsByRestaurantId", error);
  }
  return [];
}

export { getTrendingMenuItems, getFallbackTrendingMenuItems } from "@/lib/catalog/trending";
