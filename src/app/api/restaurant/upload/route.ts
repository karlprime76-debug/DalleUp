import { NextResponse } from "next/server";
import { requireRestaurantApiBasic } from "@/lib/auth/guards";
import { createServerClient } from "@/lib/supabase/server";

const BUCKET = "restaurant-assets";
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const result = await requireRestaurantApiBasic();
    if ("response" in result) return result.response;

    const { restaurant } = result;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const productId = formData.get("productId") as string | null;

    if (!file) return NextResponse.json({ message: "Aucun fichier envoyé." }, { status: 400 });
    if (!ALLOWED_MIME_TYPES.includes(file.type)) return NextResponse.json({ message: "Type de fichier non supporté. Utilisez JPG, PNG ou WEBP." }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ message: "Fichier trop volumineux. Limite : 5 Mo." }, { status: 413 });

    const ext = file.name.split(".").pop() ?? "jpg";
    const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4) || "jpg";
    const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let path = "";
    if (type === "logo") path = `restaurants/${restaurant.id}/logo.${safeExt}`;
    else if (type === "cover") path = `restaurants/${restaurant.id}/cover.${safeExt}`;
    else if (type === "product" && productId) path = `restaurants/${restaurant.id}/products/${productId}.${safeExt}`;
    else if (type === "product") path = `restaurants/${restaurant.id}/products/${unique}.${safeExt}`;
    else path = `restaurants/${restaurant.id}/misc/${unique}.${safeExt}`;

    const supabase = createServerClient();
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(data?.path ?? path);
    return NextResponse.json({ url: publicUrl.publicUrl, path });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp upload]", error);
    return NextResponse.json({ message: "Upload impossible." }, { status: 503 });
  }
}
