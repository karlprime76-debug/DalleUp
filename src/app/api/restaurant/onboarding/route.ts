import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

function slugify(name: string) {
  return name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "restaurant";
}

function positiveNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : fallback;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
    if (session.user.role !== "RESTAURANT") return NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 });
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });
    return NextResponse.json({ restaurant });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp onboarding GET]", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
    if (session.user.role !== "RESTAURANT") return NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 });

    const body = await request.json();
    if (process.env.NODE_ENV !== "production") {
      console.log("[DalleUp onboarding] body", JSON.stringify(body));
    }
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const address = String(body.address ?? "").trim();
    const phone = String(body.phone ?? "").trim() || null;
    const image = String(body.image ?? "").trim() || null;
    const deliveryFee = positiveNumber(body.deliveryFee, 1200);
    const minDelayMin = Math.max(1, positiveNumber(body.minDelayMin, 20));
    const maxDelayMin = Math.max(minDelayMin, positiveNumber(body.maxDelayMin, 40));

    if (!name || name.length < 2) return NextResponse.json({ message: "Le nom du restaurant doit contenir au moins 2 caractères." }, { status: 400 });
    if (!description) return NextResponse.json({ message: "La description est requise." }, { status: 400 });
    if (!address) return NextResponse.json({ message: "L'adresse est requise." }, { status: 400 });

    const slug = slugify(name) + "-" + Date.now().toString(36);

    const existing = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });

    let restaurant;
    if (existing) {
      restaurant = await prisma.restaurant.update({
        where: { id: existing.id },
        data: {
          name,
          slug,
          description,
          address,
          phone,
          image,
          deliveryFee,
          minDelayMin,
          maxDelayMin,
          status: "PENDING",
        }
      });
    } else {
      restaurant = await prisma.restaurant.create({
        data: {
          ownerId: session.user.id,
          name,
          slug,
          description,
          address,
          phone,
          image,
          deliveryFee,
          minDelayMin,
          maxDelayMin,
          status: "PENDING",
        }
      });
    }

    const defaultCategories = ["Plats", "Boissons", "Jus", "Desserts", "Accompagnements", "Sauces", "Suppléments", "Menus combo", "Autres"];
    try {
      await prisma.menuCategory.createMany({
        data: defaultCategories.map((catName, index) => ({ restaurantId: restaurant.id, name: catName, sortOrder: index })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.error("[DalleUp onboarding] default categories skipped", {
        restaurantId: restaurant.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json({ restaurant });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string }).code ?? "UNKNOWN";
    console.error("[DalleUp onboarding] FAILED", { message: errorMessage, code: errorCode, env: process.env.NODE_ENV });
    return NextResponse.json({
      message: "Création impossible pour le moment. Vérifiez les champs puis réessayez.",
      error: process.env.NODE_ENV !== "production" ? errorMessage : undefined,
      code: process.env.NODE_ENV !== "production" ? errorCode : undefined,
    }, { status: 503 });
  }
}
