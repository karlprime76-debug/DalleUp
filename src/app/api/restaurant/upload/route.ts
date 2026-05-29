import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

const BUCKET = "restaurant-assets";
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function safeError(error: unknown) {
  const e = error instanceof Error ? error : new Error(String(error));
  return { name: e.name, message: e.message, code: (error as { code?: string }).code ?? null };
}

async function getUserFromRequest(request: Request) {
  // 1. getServerSession standard
  const session = await getServerSession(authOptions);
  if (session?.user) return { id: session.user.id, role: session.user.role };

  // 2. Fallback JWT token (NextAuth v4 + App Router edge cases)
  try {
    const token = await getToken({ req: request as unknown as Parameters<typeof getToken>[0]["req"], secret: process.env.NEXTAUTH_SECRET });
    if (token?.sub && token.role) return { id: token.sub, role: token.role as string };
  } catch {
    // ignore fallback failure
  }
  return null;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  let userId = "unknown";
  let uploadType = "unknown";
  let restaurantId: string | null = null;

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      console.error("[DalleUp upload] auth failed — no session and no JWT token");
      return NextResponse.json({ ok: false, error: "Authentification requise." }, { status: 401 });
    }
    userId = user.id;
    if (user.role !== "RESTAURANT") {
      console.error("[DalleUp upload] auth failed — wrong role", { userId, role: user.role });
      return NextResponse.json({ ok: false, error: "Accès restaurant requis." }, { status: 403 });
    }

    let restaurant = await prisma.restaurant.findFirst({ where: { ownerId: user.id } });
    if (!restaurant) {
      const slug = `draft-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
      restaurant = await prisma.restaurant.create({
        data: {
          ownerId: user.id,
          name: "Mon restaurant",
          slug,
          description: "En attente de configuration",
          address: "Non renseigné",
          status: "PENDING",
          image: null,
          deliveryFee: 1200,
          minDelayMin: 20,
          maxDelayMin: 40,
        },
      });
      console.log("[DalleUp upload] created draft restaurant", { restaurantId: restaurant.id, userId });
    }
    restaurantId = restaurant.id;

    const formData = await request.formData();
    const file = formData.get("file");
    const type = String(formData.get("type") ?? "");
    const productId = String(formData.get("productId") ?? "");
    uploadType = type;

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    console.log("[DalleUp upload] env check", {
      supabaseUrlHost: rawUrl ? new URL(rawUrl).hostname : "missing",
      hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    });

    console.log("[DalleUp upload] start", {
      userId,
      role: user.role,
      uploadType: type,
      restaurantId: restaurant.id,
      fileName: file instanceof File ? file.name : "N/A",
      fileType: file instanceof File ? file.type : "N/A",
      fileSize: file instanceof File ? file.size : 0,
    });

    if (!(file instanceof File)) {
      console.warn("[DalleUp upload] no file", { userId });
      return NextResponse.json({ ok: false, error: "Aucun fichier envoyé." }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.warn("[DalleUp upload] invalid mime", { userId, mime: file.type });
      return NextResponse.json({ ok: false, error: "Type de fichier non supporté. Utilisez JPG, PNG ou WEBP." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      console.warn("[DalleUp upload] file too large", { userId, size: file.size });
      return NextResponse.json({ ok: false, error: "Fichier trop volumineux. Limite : 5 Mo." }, { status: 413 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4) || "jpg";
    const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const safeRestaurantId = restaurant.id.replace(/[^a-zA-Z0-9-_]/g, "");
    let path = "";
    if (type === "logo") path = `restaurants/${safeRestaurantId}/logo.${safeExt}`;
    else if (type === "cover") path = `restaurants/${safeRestaurantId}/cover.${safeExt}`;
    else if (type === "product" && productId) path = `restaurants/${safeRestaurantId}/products/${productId}.${safeExt}`;
    else if (type === "product") path = `restaurants/${safeRestaurantId}/products/${unique}.${safeExt}`;
    else path = `restaurants/${safeRestaurantId}/misc/${unique}.${safeExt}`;

    const supabase = createServerClient();

    console.log("[DalleUp upload] path ready", { bucket: BUCKET, path });
    const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError || !uploadData) {
      const { name, message, code } = safeError(uploadError ?? new Error("Supabase upload returned no data"));
      const isBucketMissing = /bucket|not found|does not exist|n'existe pas/i.test(message);
      const isInvalidPath = /invalid path/i.test(message);
      console.error("[DalleUp upload] failed", {
        step: "supabase-upload",
        userId,
        restaurantId: restaurant.id,
        bucket: BUCKET,
        path,
        isBucketMissing,
        isInvalidPath,
        errorName: name,
        errorMessage: message,
        prismaCode: code,
        storageError: message,
      });
      if (isBucketMissing) {
        return NextResponse.json({ ok: false, error: `Le bucket "${BUCKET}" n'existe pas dans Supabase Storage. Créez-le dans Supabase Dashboard > Storage et rendez-le public.` }, { status: 500 });
      }
      if (isInvalidPath) {
        return NextResponse.json({ ok: false, error: `Chemin de fichier invalide. Vérifiez que le bucket "${BUCKET}" existe et que le nom du fichier ne contient pas de caractères spéciaux.` }, { status: 500 });
      }
      return NextResponse.json({ ok: false, error: `Stockage impossible : ${message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
    const url = publicUrlData.publicUrl;
    console.log("[DalleUp upload] storage success", { bucket: BUCKET, path: uploadData.path, publicUrl: url });

    // Mettre à jour le restaurant immédiatement pour couverture/logo
    if (type === "cover" || type === "logo") {
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { image: url },
      });
      console.log("[DalleUp upload] db update success", { restaurantId: restaurant.id, fieldUpdated: "image", savedUrl: url });
      revalidatePath("/restaurant/dashboard");
      revalidatePath("/restaurant/onboarding");
      revalidatePath("/restaurant/settings");
      revalidatePath(`/restaurants/${restaurant.slug}`);
    }

    // Mettre à jour le produit immédiatement si productId fourni
    if (type === "product" && productId) {
      const existingItem = await prisma.menuItem.findFirst({
        where: { id: productId, restaurantId: restaurant.id },
      });
      if (existingItem) {
        await prisma.menuItem.update({
          where: { id: existingItem.id },
          data: { image: url },
        });
        console.log("[DalleUp upload] db update success", { restaurantId: restaurant.id, productId, fieldUpdated: "MenuItem.image", savedUrl: url });
        revalidatePath("/restaurant/menu");
        revalidatePath(`/restaurants/${restaurant.slug}`);
      } else {
        console.warn("[DalleUp upload] product not found for image update", { restaurantId: restaurant.id, productId });
      }
    }

    console.log("[DalleUp upload] completed", {
      userId,
      restaurantId: restaurant.id,
      type,
      path,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ ok: true, url, path, fieldUpdated: type === "product" ? "MenuItem.image" : "Restaurant.image", message: "Image ajoutée avec succès." });
  } catch (error) {
    const { name, message, code } = safeError(error);
    console.error("[DalleUp upload] failed", {
      userId,
      restaurantId,
      uploadType,
      step: "unexpected",
      errorName: name,
      errorMessage: message,
      prismaCode: code,
      storageError: message,
    });
    return NextResponse.json({ ok: false, error: "Upload impossible. Veuillez réessayer." }, { status: 503 });
  }
}
