import { prisma } from "@/lib/db/prisma";

export type RestaurantMenuItem = {
  id: string;
  dbId?: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isActive: boolean;
};

export type OwnerRestaurant = { id: string; name: string };

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp menu fallback] ${source}`, error);
}

export async function getOwnerRestaurant(ownerId?: string): Promise<OwnerRestaurant | null> {
  try {
    if (!ownerId) return null;
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId }, select: { id: true, name: true } });
    if (restaurant) return restaurant;
  } catch (error) {
    warnFallback("getOwnerRestaurant", error);
  }
  return null;
}

export async function getRestaurantMenuForOwner(ownerId?: string): Promise<{ restaurant: OwnerRestaurant | null; items: RestaurantMenuItem[] }> {
  const restaurant = await getOwnerRestaurant(ownerId);
  try {
    if (ownerId && restaurant) {
      const items = await prisma.menuItem.findMany({ where: { restaurantId: restaurant.id }, include: { category: true }, orderBy: { createdAt: "desc" } });
      return { restaurant, items: items.map((item) => ({ id: item.id, dbId: item.id, restaurantId: item.restaurantId, name: item.name, description: item.description, price: item.price, image: item.image ?? "/placeholder.svg", category: item.category?.name ?? "Menu", isActive: item.isActive })) };
    }
  } catch (error) {
    warnFallback("getRestaurantMenuForOwner", error);
  }
  return { restaurant, items: [] };
}

export async function getRestaurantMenuItemForOwner(ownerId: string | undefined, itemId: string): Promise<RestaurantMenuItem | null> {
  const { items } = await getRestaurantMenuForOwner(ownerId);
  return items.find((item) => item.id === itemId || item.dbId === itemId) ?? null;
}
