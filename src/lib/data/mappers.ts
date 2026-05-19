import type { MenuItem, Restaurant, RestaurantCategory } from "@prisma/client";

export type AppRestaurant = {
  id: string;
  name: string;
  category: string;
  rating: number;
  delay: string;
  deliveryFee: number;
  popular: boolean;
  image: string;
  description: string;
};

export type AppMenuItem = {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  category: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  image: string;
};

type RestaurantWithCategory = Restaurant & { category?: RestaurantCategory | null };
type MenuItemWithRestaurant = MenuItem & { restaurant?: Restaurant | null; category?: { name: string } | null };

const fallbackRestaurantImage = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80";
const fallbackMenuItemImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80";

export function mapRestaurant(restaurant: RestaurantWithCategory): AppRestaurant {
  return {
    id: restaurant.slug || restaurant.id,
    name: restaurant.name,
    category: restaurant.category?.name ?? "Restaurant",
    rating: restaurant.rating,
    delay: `${restaurant.minDelayMin}-${restaurant.maxDelayMin} min`,
    deliveryFee: restaurant.deliveryFee,
    popular: restaurant.isPopular,
    image: restaurant.image ?? fallbackRestaurantImage,
    description: restaurant.description
  };
}

export function mapMenuItem(item: MenuItemWithRestaurant): AppMenuItem {
  return {
    id: item.id,
    restaurantId: item.restaurant?.slug ?? item.restaurantId,
    restaurantName: item.restaurant?.name,
    category: item.category?.name ?? "Menu",
    name: item.name,
    description: item.description,
    price: item.price,
    active: item.isActive,
    image: item.image ?? fallbackMenuItemImage
  };
}
