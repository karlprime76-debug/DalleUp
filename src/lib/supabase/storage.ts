import { createClient } from "./client";

const BUCKET = "restaurant-assets";

export type UploadResult = { url: string; error?: string };

export async function uploadRestaurantImage(
  file: File,
  path: string
): Promise<UploadResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) return { url: "", error: "Image non envoyée. Vous pourrez l’ajouter plus tard." };
    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(data?.path ?? path);
    return { url: publicUrl.publicUrl };
  } catch {
    return { url: "", error: "Image non envoyée. Vous pourrez l’ajouter plus tard." };
  }
}

export function getRestaurantImageUrl(path: string): string {
  try {
    const supabase = createClient();
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return "";
  }
}

export function restaurantLogoPath(restaurantId: string) {
  return `restaurants/${restaurantId}/logo`;
}

export function restaurantCoverPath(restaurantId: string) {
  return `restaurants/${restaurantId}/cover`;
}

export function restaurantProductPath(restaurantId: string, productId: string) {
  return `restaurants/${restaurantId}/products/${productId}`;
}
