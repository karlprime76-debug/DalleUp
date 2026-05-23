import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
    if (session.user.role !== "RESTAURANT") return NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 });

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const address = String(body.address ?? "").trim();

    if (!name || name.length < 2) return NextResponse.json({ message: "Le nom du restaurant doit contenir au moins 2 caractères." }, { status: 400 });
    if (!description) return NextResponse.json({ message: "La description est requise." }, { status: 400 });
    if (!address) return NextResponse.json({ message: "L'adresse est requise." }, { status: 400 });

    const slug = slugify(name) + "-" + Date.now().toString(36);

    const existing = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });
    if (existing) return NextResponse.json({ message: "Vous avez déjà un restaurant." }, { status: 409 });

    const restaurant = await prisma.restaurant.create({
      data: {
        ownerId: session.user.id,
        name,
        slug,
        description,
        address,
        phone: String(body.phone ?? "").trim() || null,
        image: String(body.image ?? "").trim() || null,
        deliveryFee: Math.max(0, Math.round(Number(body.deliveryFee ?? 1200))),
        minDelayMin: Math.max(1, Math.round(Number(body.minDelayMin ?? 20))),
        maxDelayMin: Math.max(1, Math.round(Number(body.maxDelayMin ?? 40))),
        status: "PENDING",
      }
    });

    // Create default menu categories
    const defaultCategories = ["Plats", "Boissons", "Jus", "Desserts", "Accompagnements", "Sauces", "Suppléments", "Menus combo", "Autres"];
    await prisma.menuCategory.createMany({
      data: defaultCategories.map((catName, index) => ({ restaurantId: restaurant.id, name: catName, sortOrder: index })),
      skipDuplicates: true,
    });

    return NextResponse.json({ restaurant });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp onboarding]", error);
    return NextResponse.json({ message: "Création impossible pour le moment." }, { status: 503 });
  }
}
