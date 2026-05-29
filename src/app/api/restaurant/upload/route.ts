import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

const BUCKET = "restaurant-assets";
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function safeLogError(source: string, error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const safe = raw.replace(/postgresql:\/\/\S+/gi, "[redacted]").replace(/postgres:\/\/\S+/gi, "[redacted]").split("\n")[0];
  if (process.env.NODE_ENV !== "production") console.error(`[upload] ${source}`, safe);
}

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: "Authentification requise." }, { status: 401 });
    }
    if (session.user.role !== "RESTAURANT") {
      return NextResponse.json({ ok: false, error: "Accès restaurant requis." }, { status: 403 });
    }

    let restaurant = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });
    if (!restaurant) {
      const slug = `draft-${session.user.id.slice(0, 8)}-${Date.now().toString(36)}`;
      restaurant = await prisma.restaurant.create({
        data: {
          ownerId: session.user.id,
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
      if (process.env.NODE_ENV !== "production") {
        console.log("[upload] created draft restaurant", { restaurantId: restaurant.id, userId: session.user.id });
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const productId = formData.get("productId") as string | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "Aucun fichier envoyé." }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ ok: false, error: "Type de fichier non supporté. Utilisez JPG, PNG ou WEBP." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ ok: false, error: "Fichier trop volumineux. Limite : 5 Mo." }, { status: 413 });
    }

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
    const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      safeLogError("supabase upload failed", uploadError);
      return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData?.path ?? path);
    const url = publicUrlData.publicUrl;

    // Mettre à jour le restaurant immédiatement pour couverture/logo
    if ((type === "cover" || type === "logo") && restaurant) {
      try {
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { image: url },
        });
      } catch (dbError) {
        safeLogError("db update image failed", dbError);
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[upload] success", {
        userId: session.user.id,
        restaurantId: restaurant.id,
        type,
        path,
        mime: file.type,
        size: file.size,
        durationMs: Date.now() - startTime,
      });
    }

    return NextResponse.json({ ok: true, url, path, message: "Image ajoutée avec succès." });
  } catch (error) {
    safeLogError("unexpected error", error);
    return NextResponse.json({ ok: false, error: "Upload impossible. Veuillez réessayer." }, { status: 503 });
  }
}
