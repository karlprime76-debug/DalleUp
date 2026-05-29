import type { MenuItem, Restaurant, RestaurantCategory } from "@prisma/client";
import { getProductTypeFromCategory, isAlcoholCategory } from "@/lib/catalog/product-types";

export type AppRestaurant = {
  id: string;
  name: string;
  category: string;
  status: string;
  isOpen: boolean;
  rating: number;
  delay: string;
  deliveryFee: number;
  popular: boolean;
  image: string;
  description: string;
  currentPlanCode?: string | null;
  isSponsored?: boolean;
  isFeatured?: boolean;
  priorityScore?: number;
};

export type AppMenuItem = {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  category: string;
  productType?: string;
  isAlcohol?: boolean;
  name: string;
  description: string;
  price: number;
  active: boolean;
  image: string;
};

type RestaurantWithCategory = Restaurant & { category?: RestaurantCategory | null };
type MenuItemWithRestaurant = MenuItem & { restaurant?: Restaurant | null; category?: { name: string } | null };

const fallbackRestaurantImage = "";
const fallbackMenuItemImage = "";

export function mapRestaurant(restaurant: RestaurantWithCategory): AppRestaurant {
  return {
    id: restaurant.slug || restaurant.id,
    name: restaurant.name,
    category: restaurant.category?.name ?? "Restaurant",
    status: restaurant.status,
    isOpen: restaurant.status === "APPROVED",
    rating: restaurant.rating,
    delay: `${restaurant.minDelayMin}-${restaurant.maxDelayMin} min`,
    deliveryFee: restaurant.deliveryFee,
    popular: restaurant.isPopular,
    image: restaurant.image || fallbackRestaurantImage,
    description: restaurant.description,
    currentPlanCode: restaurant.currentPlanCode,
    isSponsored: restaurant.isSponsored,
    isFeatured: restaurant.isFeatured,
    priorityScore: restaurant.priorityScore,
  };
}

export function mapMenuItem(item: MenuItemWithRestaurant): AppMenuItem {
  return {
    id: item.id,
    restaurantId: item.restaurant?.slug ?? item.restaurantId,
    restaurantName: item.restaurant?.name,
    category: item.category?.name ?? "Menu",
    productType: getProductTypeFromCategory(item.category?.name),
    isAlcohol: isAlcoholCategory(item.category?.name),
    name: item.name,
    description: item.description,
    price: item.price,
    active: item.isActive,
    image: item.image || fallbackMenuItemImage
  };
}
