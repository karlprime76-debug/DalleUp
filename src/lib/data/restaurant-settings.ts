import { prisma } from "@/lib/db/prisma";

export type RestaurantSettings = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  address: string;
  phone: string;
  status: string;
  deliveryFee: number;
  minDelayMin: number;
  maxDelayMin: number;
  isMock?: boolean;
};

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp settings fallback] ${source}`, error);
}

export async function getRestaurantSettings(ownerId?: string): Promise<RestaurantSettings | null> {
  try {
    if (ownerId) {
      const restaurant = await prisma.restaurant.findFirst({ where: { ownerId } });
      if (restaurant) return { id: restaurant.id, name: restaurant.name, slug: restaurant.slug, description: restaurant.description, image: restaurant.image ?? "", address: restaurant.address, phone: restaurant.phone ?? "", status: restaurant.status, deliveryFee: restaurant.deliveryFee, minDelayMin: restaurant.minDelayMin, maxDelayMin: restaurant.maxDelayMin };
    }
  } catch (error) {
    warnFallback("getRestaurantSettings", error);
  }
  return null;
}
