import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { getRestaurantMenuForOwner } from "@/lib/data/restaurant-menu";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "RESTAURANT") return NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 });
  const data = await getRestaurantMenuForOwner(session.user.id);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "RESTAURANT") return NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 });
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });
    if (!restaurant) return NextResponse.json({ message: "Restaurant Prisma introuvable." }, { status: 404 });
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const price = Number(body.price ?? 0);
    if (!name || !description || !Number.isFinite(price) || price <= 0) return NextResponse.json({ message: "Nom, description et prix requis." }, { status: 400 });
    const categoryName = String(body.category ?? "Menu").trim() || "Menu";
    const category = await prisma.menuCategory.findFirst({ where: { restaurantId: restaurant.id, name: categoryName } }) ?? await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: categoryName } });
    const item = await prisma.menuItem.create({ data: { restaurantId: restaurant.id, categoryId: category.id, name, description, price: Math.round(price), image: String(body.image ?? "") || null, isActive: Boolean(body.isActive ?? true) } });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp menu fallback] POST /api/restaurant/menu", error);
    return NextResponse.json({ message: "Création plat indisponible." }, { status: 503 });
  }
}
