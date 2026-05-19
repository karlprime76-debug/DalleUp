import { prisma } from "@/lib/db/prisma";
import { categories as mockCategories, menuItems as mockMenuItems, restaurants as mockRestaurants } from "@/lib/mock-data";
import { mapMenuItem, mapRestaurant, type AppMenuItem, type AppRestaurant } from "@/lib/data/mappers";

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp data fallback] ${source}`, error);
}

function enrichMockMenuItems(items = mockMenuItems): AppMenuItem[] {
  return items.map((item) => ({ ...item, restaurantName: mockRestaurants.find((restaurant) => restaurant.id === item.restaurantId)?.name }));
}

export async function getRestaurants(): Promise<AppRestaurant[]> {
  try {
    const restaurants = await prisma.restaurant.findMany({ include: { category: true }, orderBy: [{ isPopular: "desc" }, { rating: "desc" }] });
    if (!restaurants.length) return mockRestaurants;
    return restaurants.map(mapRestaurant);
  } catch (error) {
    warnFallback("getRestaurants", error);
    return mockRestaurants;
  }
}

export async function getPopularRestaurants(): Promise<AppRestaurant[]> {
  try {
    const restaurants = await prisma.restaurant.findMany({ where: { isPopular: true }, include: { category: true }, orderBy: { rating: "desc" }, take: 6 });
    if (!restaurants.length) return mockRestaurants.filter((restaurant) => restaurant.popular);
    return restaurants.map(mapRestaurant);
  } catch (error) {
    warnFallback("getPopularRestaurants", error);
    return mockRestaurants.filter((restaurant) => restaurant.popular);
  }
}

export async function getRestaurantById(id: string): Promise<AppRestaurant | null> {
  try {
    const restaurant = await prisma.restaurant.findFirst({ where: { OR: [{ id }, { slug: id }] }, include: { category: true } });
    if (restaurant) return mapRestaurant(restaurant);
  } catch (error) {
    warnFallback("getRestaurantById", error);
  }
  return mockRestaurants.find((restaurant) => restaurant.id === id) ?? null;
}

export async function getRestaurantsByCategory(category: string): Promise<AppRestaurant[]> {
  const allRestaurants = await getRestaurants();
  return allRestaurants.filter((restaurant) => restaurant.category.toLowerCase() === category.toLowerCase());
}

export async function getRestaurantCategories(): Promise<string[]> {
  try {
    const categories = await prisma.restaurantCategory.findMany({ orderBy: { name: "asc" } });
    if (!categories.length) return mockCategories;
    return categories.map((category) => category.name);
  } catch (error) {
    warnFallback("getRestaurantCategories", error);
    return mockCategories;
  }
}

export async function getMenuItemsByRestaurantId(restaurantId: string): Promise<AppMenuItem[]> {
  try {
    const restaurant = await prisma.restaurant.findFirst({ where: { OR: [{ id: restaurantId }, { slug: restaurantId }] }, select: { id: true, slug: true } });
    const ids = restaurant ? [restaurant.id, restaurant.slug] : [restaurantId];
    const items = await prisma.menuItem.findMany({ where: { restaurantId: { in: ids } }, include: { restaurant: true, category: true }, orderBy: { createdAt: "asc" } });
    if (items.length) return items.map(mapMenuItem);
  } catch (error) {
    warnFallback("getMenuItemsByRestaurantId", error);
  }
  return enrichMockMenuItems(mockMenuItems.filter((item) => item.restaurantId === restaurantId));
}

export async function getTrendingMenuItems(): Promise<AppMenuItem[]> {
  try {
    const items = await prisma.menuItem.findMany({ where: { isActive: true }, include: { restaurant: true, category: true }, orderBy: { createdAt: "desc" }, take: 8 });
    if (!items.length) return enrichMockMenuItems(mockMenuItems.slice(0, 8));
    return items.map(mapMenuItem);
  } catch (error) {
    warnFallback("getTrendingMenuItems", error);
    return enrichMockMenuItems(mockMenuItems.slice(0, 8));
  }
}
