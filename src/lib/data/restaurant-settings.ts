import { prisma } from "@/lib/db/prisma";
import { restaurants as mockRestaurants } from "@/lib/mock-data";

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

function parseDelay(delay: string) {
  const matches = delay.match(/(\d+)/g)?.map(Number) ?? [];
  return { minDelayMin: matches[0] ?? 20, maxDelayMin: matches[1] ?? 40 };
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
  const mock = mockRestaurants[0];
  if (!mock) return null;
  const delay = parseDelay(mock.delay);
  return { id: mock.id, name: mock.name, slug: mock.id, description: mock.description, image: mock.image, address: "Cadjèhoun, Cotonou", phone: "+229 01 00 00 00 00", status: "APPROVED", deliveryFee: mock.deliveryFee, minDelayMin: delay.minDelayMin, maxDelayMin: delay.maxDelayMin, isMock: true };
}
